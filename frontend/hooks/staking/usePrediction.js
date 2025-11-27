"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useAccount, useReadContract } from "wagmi"
import { formatUnits, parseUnits } from "viem"
import useTokenApproval from "./useTokenApproval"
import useStaking from "./useStaking"

// Event Contract ABI for data fetching
const EVENT_CONTRACT_ABI = [
  {
    type: "function",
    name: "getEventDetails",
    inputs: [],
    outputs: [
      { name: "question", type: "string", internalType: "string" },
      { name: "description", type: "string", internalType: "string" },
      { name: "options", type: "string[]", internalType: "string[]" },
      { name: "eventType", type: "string", internalType: "string" },
      { name: "category", type: "string", internalType: "string" },
      { name: "eventImage", type: "string", internalType: "string" },
      { name: "status", type: "uint8", internalType: "enum EventContract.EventStatus" },
      { name: "endTime", type: "uint256", internalType: "uint256" },
      { name: "winningOption", type: "uint8", internalType: "uint8" },
      { name: "creator", type: "address", internalType: "address" },
      { name: "tokenAddress", type: "address", internalType: "address" },
      { name: "creatorStake", type: "uint256", internalType: "uint256" },
      { name: "totalStaked", type: "uint256", internalType: "uint256" },
      { name: "creatorFeePercentage", type: "uint256", internalType: "uint256" },
      { name: "creatorRewardClaimed", type: "bool", internalType: "bool" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getOptionTotals",
    inputs: [],
    outputs: [{ name: "", type: "uint256[]", internalType: "uint256[]" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getUserStake",
    inputs: [{ name: "_user", type: "address", internalType: "address" }],
    outputs: [
      { name: "selectedOption", type: "uint8", internalType: "uint8" },
      { name: "amount", type: "uint256", internalType: "uint256" },
      { name: "claimed", type: "bool", internalType: "bool" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getStakersCount",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "stake",
    inputs: [
      { name: "_option", type: "uint8", internalType: "uint8" },
      { name: "_amount", type: "uint256", internalType: "uint256" }
    ],
    outputs: [],
    stateMutability: "nonpayable",
  }
]

// Event Status Constants  
const EVENT_STATUS = {
  PENDING: 0,
  APPROVED: 1,
  CLOSED: 2,
  COMPLETED: 3,
  CANCELLED: 4,
  REJECTED: 5,
  NULLIFIED: 5,
}

const EVENT_STATUS_MESSAGES = {
  [EVENT_STATUS.PENDING]: "Pending approval",
  [EVENT_STATUS.APPROVED]: "Open for betting",
  [EVENT_STATUS.CLOSED]: "Closed for betting",
  [EVENT_STATUS.COMPLETED]: "Completed",
  [EVENT_STATUS.CANCELLED]: "Cancelled",
  [EVENT_STATUS.REJECTED]: "Rejected",
  [EVENT_STATUS.NULLIFIED]: "Nullified",
}

// Token configurations with normalized addresses
const TOKEN_CONFIG = {
  [import.meta.env.VITE_CUSD_ADDRESS?.toLowerCase()]: {
    name: "cUSD",
    symbol: "cUSD",
    decimals: 18,
    icon: "cUSD.png"
  },
  [import.meta.env.VITE_USDC_ADDRESS?.toLowerCase()]: {
    name: "USDC",
    symbol: "USDC",
    decimals: 6,
    icon: "USDC.svg"
  },
  [import.meta.env.VITE_USDT_ADDRESS?.toLowerCase()]: {
    name: "USDT",
    symbol: "USDT",
    decimals: 18,
    icon: "usdt.png"
  }
}

const usePrediction = (eventAddress, defaultTokenAddress, initialEventData) => {
  const { address } = useAccount()
  const [eventData, setEventData] = useState(initialEventData || null)
  const [optionTotals, setOptionTotals] = useState([])
  const [tokenAddress, setTokenAddress] = useState(defaultTokenAddress)
  const [tokenConfig, setTokenConfig] = useState(() => {
    const normalizedAddr = defaultTokenAddress?.toLowerCase() || import.meta.env.VITE_CUSD_ADDRESS?.toLowerCase()
    return TOKEN_CONFIG[normalizedAddr] || TOKEN_CONFIG[import.meta.env.VITE_CUSD_ADDRESS?.toLowerCase()]
  })
  const [userStake, setUserStake] = useState(null)
  const [hasUserStaked, setHasUserStaked] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [transactionComplete, setTransactionComplete] = useState(false)
  const [navigationReady, setNavigationReady] = useState(false)
  const [transactionError, setTransactionError] = useState(null)
  const [stakingError, setStakingError] = useState(null)
  const [lastStakeAmount, setLastStakeAmount] = useState(null)
  const [lastBetOption, setLastBetOption] = useState(null)
  const [stakingInProgress, setStakingInProgress] = useState(false)

  // Balance refresh tracking
  const lastRefreshTime = useRef(0)
  const isProcessingRef = useRef(false)

  // Use the separated hooks with dynamic token configuration
  const tokenApproval = useTokenApproval(tokenAddress, eventAddress, address, tokenConfig.decimals)
  const staking = useStaking(eventAddress, address, tokenConfig.decimals)

  // Safe conversion utilities
  const safeNumber = useCallback((value, defaultValue = 0) => {
    if (value === null || value === undefined) return defaultValue
    if (typeof value === "number" && !isNaN(value)) return value
    if (typeof value === "string") {
      const parsed = Number.parseFloat(value)
      return isNaN(parsed) ? defaultValue : parsed
    }
    if (typeof value === "bigint") return Number(value)
    return defaultValue
  }, [])

  const safeString = useCallback((value, defaultValue = "") => {
    if (value === null || value === undefined) return defaultValue
    if (typeof value === "string") return value
    return String(value)
  }, [])

  const ensureValidTokenAddress = useCallback(
    (addr) => {
      if (!addr || addr === "0x0" || addr === "0x0000000000000000000000000000000000000000") {
        return defaultTokenAddress
      }
      return addr
    },
    [defaultTokenAddress],
  )

  // Read event details with better error handling
  const {
    data: eventDetails,
    isError: eventError,
    isLoading: eventLoading,
    refetch: refetchEventDetails,
  } = useReadContract({
    address: eventAddress,
    abi: EVENT_CONTRACT_ABI,
    functionName: "getEventDetails",
    enabled: !!eventAddress,
    retry: 3,
    retryDelay: 1000,
  })

  // Read option totals
  const {
    data: totals,
    isError: totalsError,
    isLoading: totalsLoading,
    refetch: refetchTotals,
  } = useReadContract({
    address: eventAddress,
    abi: EVENT_CONTRACT_ABI,
    functionName: "getOptionTotals",
    enabled: !!eventAddress,
    retry: 3,
    retryDelay: 1000,
  })

  // Read user stake
  const {
    data: userStakeData,
    isError: userStakeError,
    refetch: refetchUserStake,
  } = useReadContract({
    address: eventAddress,
    abi: EVENT_CONTRACT_ABI,
    functionName: "getUserStake",
    args: [address],
    enabled: !!eventAddress && !!address,
  })

  // Read stakers count
  const {
    data: stakersCount,
    refetch: refetchStakersCount,
  } = useReadContract({
    address: eventAddress,
    abi: EVENT_CONTRACT_ABI,
    functionName: "getStakersCount",
    enabled: !!eventAddress,
  })

  // Balance refresh utility
  const forceBalanceRefresh = useCallback(() => {
    const now = Date.now()
    if (now - lastRefreshTime.current < 2000) {
      return
    }

    lastRefreshTime.current = now

    const refreshEvents = [
      'refreshBalance',
      'refreshWalletBalance',
      'forceBalanceRefetch'
    ]

    refreshEvents.forEach(eventName => {
      window.dispatchEvent(new CustomEvent(eventName, {
        detail: { source: 'usePrediction', timestamp: now }
      }))
    })

    localStorage.setItem('balanceNeedsRefresh', 'true')
    localStorage.setItem('refreshReason', 'stake_success')
    localStorage.setItem('refreshTimestamp', now.toString())

    if (tokenApproval.refetchBalance) {
      tokenApproval.refetchBalance()
    }
  }, [tokenApproval])

  // Refresh event data
  const refreshEventData = useCallback(() => {
    if (eventAddress) {
      refetchEventDetails()
      refetchTotals()
      refetchUserStake()
      refetchStakersCount()
      tokenApproval.refetchAllowance()
      tokenApproval.refetchBalance()
    }
  }, [eventAddress, refetchEventDetails, refetchTotals, refetchUserStake, refetchStakersCount, tokenApproval])

  // Add refreshUserBalance function
  const refreshUserBalance = useCallback(async () => {
    try {
      if (tokenApproval.refetchBalance) {
        await tokenApproval.refetchBalance()
      }

      if (tokenApproval.refetchAllowance) {
        await tokenApproval.refetchAllowance()
      }

      forceBalanceRefresh()
    } catch (error) {
      console.error("Error refreshing balance:", error)
    }
  }, [tokenApproval, forceBalanceRefresh])

  // Monitor transaction completion with balance refresh
  useEffect(() => {
    if (staking.isStakeSuccess && stakingInProgress && !transactionComplete) {
      setTransactionComplete(true)
      setTransactionError(null)
      setStakingError(null)
      setStakingInProgress(false)

      refreshEventData()
      forceBalanceRefresh()

      setTimeout(() => {
        forceBalanceRefresh()
        refreshUserBalance()
      }, 3000)

      setTimeout(() => {
        forceBalanceRefresh()
        refreshUserBalance()
      }, 6000)

      window.dispatchEvent(new CustomEvent('stakeSuccess', {
        detail: {
          amount: lastStakeAmount,
          option: lastBetOption,
          eventAddress,
          timestamp: Date.now()
        }
      }))

      setTimeout(() => {
        setNavigationReady(true)
      }, 2000)
    }

    if ((staking.error || tokenApproval.error) && stakingInProgress && !transactionComplete) {
      const errorMessage = staking.error || tokenApproval.error
      setTransactionError(errorMessage)
      setStakingError(staking.error)
      setTransactionComplete(true)
      setStakingInProgress(false)

      setTimeout(() => {
        setNavigationReady(true)
      }, 500)
    }
  }, [
    staking.isStakeSuccess,
    staking.error,
    tokenApproval.error,
    transactionComplete,
    stakingInProgress,
    refreshEventData,
    forceBalanceRefresh,
    refreshUserBalance,
    lastStakeAmount,
    lastBetOption,
    eventAddress
  ])

  // Update token configuration when token address changes
  useEffect(() => {
    if (tokenAddress) {
      const normalizedAddr = tokenAddress.toLowerCase()
      const config = TOKEN_CONFIG[normalizedAddr]
      if (config) {
        setTokenConfig(config)
        console.log(`🪙 Token configuration updated:`, {
          address: tokenAddress,
          name: config.name,
          symbol: config.symbol,
          decimals: config.decimals
        })
      } else {
        console.warn(`⚠️ Unknown token address: ${tokenAddress}`)
        setTokenConfig(TOKEN_CONFIG[import.meta.env.VITE_CUSD_ADDRESS?.toLowerCase()]) // Default to CUSD
      }
    }
  }, [tokenAddress])

  // Process user stake data and check if user has already staked
  useEffect(() => {
    if (userStakeData && address) {
      const [selectedOption, amount, claimed] = userStakeData
      const stakeAmount = safeNumber(amount, 0)

      setUserStake({
        selectedOption: safeNumber(selectedOption, 0),
        amount: stakeAmount,
        claimed: Boolean(claimed),
      })

      // Check if user has already placed a stake (amount > 0)
      setHasUserStaked(stakeAmount > 0)

      console.log(`👤 User stake status:`, {
        hasStaked: stakeAmount > 0,
        selectedOption: safeNumber(selectedOption, 0),
        amount: stakeAmount,
        claimed: Boolean(claimed)
      })
    } else {
      setHasUserStaked(false)
      setUserStake(null)
    }
  }, [userStakeData, address, safeNumber])

  // Enhanced event data processing
  useEffect(() => {
    if (!eventAddress) {
      setError("No event address provided")
      setLoading(false)
      return
    }

    if (initialEventData && (eventLoading || totalsLoading || !eventDetails)) {
      console.log("Using initial event data while blockchain loads...")

      const tokenAddr = ensureValidTokenAddress(initialEventData.tokenAddress)
      setTokenAddress(tokenAddr)

      const normalizedAddr = tokenAddr.toLowerCase()
      if (!TOKEN_CONFIG[normalizedAddr]) {
        console.warn(`Unsupported token address in initial data: ${tokenAddr}`)
        setTokenAddress(defaultTokenAddress)
      }

      const formattedInitialData = {
        ...initialEventData,
        tokenAddress: tokenAddr,
        isOpenForBetting: true,
        statusMessage: "Loading from blockchain...",
        isPending: false,
        isApproved: true,
        isClosed: false,
        isCompleted: false,
        isCancelled: false,
        isRejected: false,
        isNullified: false,
        hasEnded: false,
      }

      setEventData(formattedInitialData)
      setLoading(false)
      return
    }

    if (!eventLoading && !totalsLoading && eventDetails && totals) {
      try {
        const question = safeString(eventDetails[0], "Unknown Question")
        const description = safeString(eventDetails[1], "No description available")
        const options = Array.isArray(eventDetails[2]) ? eventDetails[2] : ["Yes", "No"]
        const eventType = safeString(eventDetails[3], "binary")
        const category = safeString(eventDetails[4], "general")
        const eventImage = safeString(eventDetails[5], "")
        const status = safeNumber(eventDetails[6], 0)
        const endTime = safeNumber(eventDetails[7], Math.floor(Date.now() / 1000))
        const winningOption = safeNumber(eventDetails[8], 0)
        const creator = safeString(eventDetails[9], "0x0")
        const eventTokenAddress = safeString(eventDetails[10], defaultTokenAddress)
        const creatorStake = safeNumber(eventDetails[11], 0)
        const totalStaked = safeNumber(eventDetails[12], 0)
        const creatorFeePercentage = safeNumber(eventDetails[13], 0)
        const creatorRewardClaimed = Boolean(eventDetails[14])

        const safeTokenAddr = ensureValidTokenAddress(eventTokenAddress)
        setTokenAddress(safeTokenAddr)

        const normalizedAddr = safeTokenAddr.toLowerCase()
        if (!TOKEN_CONFIG[normalizedAddr]) {
          setError(`Unsupported token address: ${safeTokenAddr}. Only STIM and USDC are supported.`)
          setLoading(false)
          return
        }

        const parsedTotals = Array.isArray(totals) ? totals.map((total) => safeNumber(total, 0)) : [0, 0]
        setOptionTotals(parsedTotals)

        const endTimeDate = new Date(endTime * 1000)
        const currentTime = new Date()
        const hasEnded = currentTime >= endTimeDate

        const formattedEventData = {
          question,
          description,
          options: {
            A: options[0] || "Yes",
            B: options[1] || "No",
          },
          category:
            typeof initialEventData?.category === "object" ? initialEventData.category : { label: category, id: "0" },
          status,
          statusMessage: EVENT_STATUS_MESSAGES[status] || "Unknown status",
          end_time: endTimeDate,
          winningOption,
          creator,
          tokenAddress: safeTokenAddr,
          totalStaked,
          yes_votes: parsedTotals[0] || 0,
          no_votes: parsedTotals[1] || 0,
          stakersCount: safeNumber(stakersCount, 0),
          creatorStake,
          creatorFeePercentage,
          creatorRewardClaimed,
          eventType,
          eventImage,

          isPending: status === EVENT_STATUS.PENDING,
          isApproved: status === EVENT_STATUS.APPROVED,
          isOpenForBetting: status === EVENT_STATUS.APPROVED && !hasEnded,
          isClosed: status === EVENT_STATUS.CLOSED,
          isCompleted: status === EVENT_STATUS.COMPLETED,
          isCancelled: status === EVENT_STATUS.CANCELLED,
          isRejected: status === EVENT_STATUS.REJECTED,
          isNullified: status === EVENT_STATUS.NULLIFIED,
          hasEnded: hasEnded,
        }

        console.log(`📊 Event data processed from blockchain:`, {
          tokenAddress: safeTokenAddr,
          tokenConfig: TOKEN_CONFIG[normalizedAddr],
          totalStaked,
          status: formattedEventData.statusMessage,
          isOpenForBetting: formattedEventData.isOpenForBetting,
          endTime: endTimeDate,
          hasEnded
        })

        setEventData(formattedEventData)
        setLoading(false)
        setError(null)
      } catch (err) {
        console.error("Error processing event data:", err)
        setError("Error processing event data: " + err.message)
        setLoading(false)
      }
    }

    if ((!eventLoading && eventError) || (!totalsLoading && totalsError)) {
      console.error("Error loading event data", { eventError, totalsError })

      if (initialEventData) {
        console.log("Using initial event data due to blockchain error")
        const tokenAddr = ensureValidTokenAddress(initialEventData.tokenAddress)
        setTokenAddress(tokenAddr)

        const formattedFallbackData = {
          ...initialEventData,
          tokenAddress: tokenAddr,
          statusMessage: "Unable to verify on blockchain",
          isOpenForBetting: true,
        }

        setEventData(formattedFallbackData)
        setError("Unable to verify event status on blockchain, but you can still attempt to stake")
      } else {
        setError("Failed to load event data from the blockchain")
      }
      setLoading(false)
    }
  }, [
    eventDetails,
    totals,
    stakersCount,
    eventLoading,
    totalsLoading,
    eventError,
    totalsError,
    eventAddress,
    ensureValidTokenAddress,
    defaultTokenAddress,
    initialEventData,
    safeNumber,
    safeString,
  ])

  // Format token amount with correct decimals and proper Wei conversion per token type
  const formatTokenAmount = (amount) => {
    if (!amount) return "0"
    try {
      // Handle both BigInt and regular numbers
      const amountBigInt = typeof amount === 'bigint' ? amount : BigInt(amount.toString())
      const result = formatUnits(amountBigInt, tokenConfig.decimals)

      console.log("formatTokenAmount debug:", {
        input: amount.toString(),
        tokenDecimals: tokenConfig.decimals,
        tokenSymbol: tokenConfig.symbol,
        formatUnitsResult: result
      })

      // Convert to number for better formatting
      const num = parseFloat(result)

      // For very small amounts, show more decimal places
      if (num < 1 && num > 0) {
        return parseFloat(num.toFixed(8)).toString()
      }

      // For larger amounts, show 2 decimal places
      return num.toFixed(2)
    } catch (err) {
      // Fallback: try manual conversion
      try {
        const amountStr = amount.toString()
        let actualAmount

        if (amountStr.includes('.')) {
          actualAmount = parseFloat(amountStr)
        } else {
          const amountNumber = Number(amountStr)
          // Use the correct decimals for this token
          actualAmount = amountNumber / Math.pow(10, tokenConfig.decimals)

          console.log("Manual conversion fallback:", {
            input: amountNumber,
            decimals: tokenConfig.decimals,
            result: actualAmount
          })
        }

        if (actualAmount < 1 && actualAmount > 0) {
          return parseFloat(actualAmount.toFixed(8)).toString()
        }
        return actualAmount.toFixed(2)
      } catch (fallbackErr) {
        console.warn("Error formatting token amount:", err, "Amount:", amount)
        return "0"
      }
    }
  }

  // Get time left - FIXED to match home page format
  const getTimeLeft = () => {
    if (!eventData?.end_time) return "0 hrs 0 mins left"

    try {
      const now = new Date()
      let endTime

      // Handle different date formats
      if (eventData.end_time instanceof Date) {
        endTime = eventData.end_time
      } else if (typeof eventData.end_time === 'string') {
        endTime = new Date(eventData.end_time)
      } else if (typeof eventData.end_time === 'number') {
        // If it's a timestamp in seconds, convert to milliseconds
        endTime = new Date(eventData.end_time * 1000)
      } else {
        console.warn("Invalid end_time format:", eventData.end_time)
        return "Invalid time"
      }

      const timeLeft = endTime - now

      // Debug logging to understand the time calculation
      console.log("Time calculation in prediction:", {
        now: now.toISOString(),
        endTime: endTime.toISOString(),
        timeLeft: timeLeft,
        timeLeftInMinutes: timeLeft / (1000 * 60),
        timeLeftInHours: timeLeft / (1000 * 60 * 60),
        timeLeftInDays: timeLeft / (1000 * 60 * 60 * 24)
      })

      if (timeLeft <= 0) return "Ended"

      const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24))
      const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60))

      if (days > 0) {
        return `${days}d ${hours}h left`
      } else if (hours > 0) {
        return `${hours}h ${minutes}m left`
      } else if (minutes > 0) {
        return `${minutes}m left`
      } else {
        return "< 1m left"
      }
    } catch (error) {
      console.error("Error calculating time left:", error)
      return "Invalid time"
    }
  }

  // Calculate percentages using properly formatted amounts
  const calculatePercentages = (betOption, includeStake = false) => {
    if (!eventData) return { yesPercentage: 0, noPercentage: 0 }

    let yesVotes = parseFloat(formatUnits(BigInt(eventData.yes_votes || 0), tokenConfig.decimals))
    let noVotes = parseFloat(formatUnits(BigInt(eventData.no_votes || 0), tokenConfig.decimals))

    if (includeStake && lastStakeAmount) {
      const stakeAmount = parseFloat(lastStakeAmount)
      if (betOption === "optionA") {
        yesVotes += stakeAmount
      } else if (betOption === "optionB") {
        noVotes += stakeAmount
      }
    }

    const totalVotes = yesVotes + noVotes

    if (totalVotes === 0) {
      return { yesPercentage: 50, noPercentage: 50 }
    }

    return {
      yesPercentage: Math.round((yesVotes / totalVotes) * 100),
      noPercentage: Math.round((noVotes / totalVotes) * 100),
    }
  }

  // Calculate potential winnings
  const calculatePotentialWinnings = (betOption) => {
    const { yesPercentage, noPercentage } = calculatePercentages(betOption, true)
    const selectedPercentage = betOption === "optionA" ? yesPercentage : noPercentage
    const winningMultiplier = selectedPercentage === 0 ? 2 : 100 / selectedPercentage
    const potentialWinnings = Math.round((winningMultiplier - 1) * 100)
    return Math.max(potentialWinnings, 0)
  }

  // Calculate total votes (number of participants, not stake amount)
  const calculateTotalVotes = (betOption) => {
    if (!eventData) return 0
    const currentTotalVotes = eventData.stakersCount || 0
    return currentTotalVotes + (betOption ? 1 : 0)
  }

  // Combined error handling
  useEffect(() => {
    const newError = error || tokenApproval.error || staking.error
    if (newError) {
      setError(newError)
    }
  }, [error, tokenApproval.error, staking.error])

  // Reset transaction state method
  const resetTransactionState = useCallback(() => {
    setTransactionComplete(false)
    setNavigationReady(false)
    setTransactionError(null)
    setStakingError(null)
    setStakingInProgress(false)
    setLastStakeAmount(null)
    setLastBetOption(null)
    isProcessingRef.current = false

    if (staking.clearTransactionState) {
      staking.clearTransactionState()
    }
    if (tokenApproval.clearError) {
      tokenApproval.clearError()
    }
  }, [staking, tokenApproval])

  // ENHANCED approveAndStake with smart approval amounts and support for additional stakes
  const approveAndStake = async (optionValue, amount, customApprovalAmount = null) => {
    try {
      if (isProcessingRef.current) {
        return { success: false, message: "Transaction already in progress" }
      }

      isProcessingRef.current = true
      resetTransactionState()

      if (!amount || Number.parseFloat(amount) <= 0) {
        isProcessingRef.current = false
        return { success: false, message: "Invalid stake amount" }
      }

      if (!eventData) {
        isProcessingRef.current = false
        return { success: false, message: "Event data not loaded" }
      }

      // Check if user is trying to stake on opposing choice (only prevent opposing stakes)
      if (hasUserStaked && userStake) {
        const userPreviousOption = userStake.selectedOption
        if (userPreviousOption !== optionValue) {
          isProcessingRef.current = false
          return {
            success: false,
            message: `You cannot change your prediction. You previously staked ${formatTokenAmount(userStake.amount)} ${tokenConfig.symbol} on ${eventData.options.A === "Yes" ? (userStake.selectedOption === 0 ? "Yes" : "No") : (userStake.selectedOption === 0 ? eventData.options.A : eventData.options.B)}. You can only add more to the same option.`,
            opposingChoice: true
          }
        }
        // If same option, allow additional stake - continue with the function
        console.log(`👍 User adding to existing ${userStake.selectedOption === 0 ? 'Yes' : 'No'} stake`)
      }

      setLastStakeAmount(amount)
      setLastBetOption(optionValue === 0 ? "optionA" : "optionB")

      const amountInWei = parseUnits(amount.toString(), tokenConfig.decimals)

      // Check if event is open for betting
      if (!eventData.isOpenForBetting) {
        let message = "Event is not accepting stakes"
        if (eventData.isPending) {
          message = "Event is still pending approval. Please wait for moderator approval."
        } else if (eventData.isClosed || eventData.isCompleted) {
          message = "This event is closed for betting. Staking is no longer available."
        } else if (eventData.isCancelled) {
          message = "This event has been cancelled."
        } else if (eventData.isRejected) {
          message = "This event has been rejected."
        } else if (eventData.isNullified) {
          message = "This event has been nullified."
        } else if (eventData.hasEnded) {
          message = "Event has already ended. Staking is no longer available."
        }
        isProcessingRef.current = false
        return { success: false, message, eventClosed: true }
      }

      // Check if token is approved
      await tokenApproval.refetchAllowance()
      const currentlyApproved = tokenApproval.checkIfApproved(amount)

      if (!currentlyApproved) {
        // Enhanced approval strategy based on token type
        let approvalAmount
        const isUSDC = tokenConfig.symbol === "USDC"

        if (customApprovalAmount) {
          approvalAmount = customApprovalAmount
        } else if (isUSDC) {
          // For USDC: Use exact amount to avoid over-approval issues
          // USDC contracts sometimes have stricter approval requirements
          approvalAmount = amount
        } else {
          // For STIM and other tokens: Use larger amount to reduce future approvals
          approvalAmount = Math.max(Number.parseFloat(amount) * 10, 1000).toString()
        }

        console.log(`🔐 Token approval strategy:`, {
          tokenSymbol: tokenConfig.symbol,
          isUSDC,
          requestedAmount: amount,
          approvalAmount,
          strategy: isUSDC ? "exact amount" : "bulk approval",
          isAdditionalStake: hasUserStaked
        })

        const approvalResult = await tokenApproval.approveToken(approvalAmount)
        if (!approvalResult.success) {
          isProcessingRef.current = false
          return { success: false, message: approvalResult.error || "Token approval failed" }
        }

        // Don't proceed to stake immediately - let the UI handle the flow
        isProcessingRef.current = false
        return { success: true, needsConfirmation: true, message: "Approval submitted, waiting for confirmation..." }
      }

      setStakingInProgress(true)

      const stakeResult = await staking.placeStake(
        optionValue,
        amount,
        eventData,
        tokenApproval.userBalance,
        tokenApproval.allowance,
        tokenAddress,
        amountInWei
      )

      if (!stakeResult.success) {
        setStakingInProgress(false)
        isProcessingRef.current = false
        return {
          success: false,
          message: stakeResult.error || "Staking transaction failed",
        }
      }

      return {
        success: true,
        needsConfirmation: true,
        message: hasUserStaked ? "Additional stake transaction submitted!" : "Stake transaction submitted!",
      }
    } catch (err) {
      console.error("Approve and stake error:", err)
      setStakingInProgress(false)
      isProcessingRef.current = false
      return { success: false, message: err.message || "Transaction failed" }
    }
  }

  // Enhanced check if amount is approved with better error handling
  const checkIfApproved = useCallback((amount) => {
    if (!amount || !tokenApproval.allowance) return false

    try {
      const amountInWei = parseUnits(amount.toString(), tokenConfig.decimals)
      const isApproved = tokenApproval.allowance >= amountInWei

      console.log(`🔍 Approval check:`, {
        amount,
        amountInWei: amountInWei.toString(),
        currentAllowance: tokenApproval.allowance.toString(),
        isApproved,
        tokenSymbol: tokenConfig.symbol
      })

      return isApproved
    } catch (error) {
      console.error("Error checking approval:", error)
      return false
    }
  }, [tokenApproval.allowance, tokenConfig.decimals, tokenConfig.symbol])

  return {
    // State
    eventData,
    optionTotals,
    tokenAddress,
    tokenConfig,
    userStake,
    hasUserStaked,
    loading,
    error,
    isApproved: tokenApproval.isApproved,
    userBalance: tokenApproval.userBalance,
    allowance: tokenApproval.allowance,
    pendingApproval: tokenApproval.pendingApproval,
    pendingStake: staking.pendingStake,
    isApprovalPending: tokenApproval.isApprovalPending,
    isApprovalSuccess: tokenApproval.isApprovalSuccess,
    isStakePending: staking.isStakePending,
    isStakeSuccess: staking.isStakeSuccess,
    transactionComplete,
    navigationReady,
    transactionError,
    stakingError,
    stakingInProgress,
    lastStakeAmount,
    lastBetOption,

    // Actions
    approveToken: tokenApproval.approveToken,
    placeStake: (optionValue, amount) =>
      staking.placeStake(
        optionValue,
        amount,
        eventData,
        tokenApproval.userBalance,
        tokenApproval.allowance,
        tokenAddress,
        parseUnits(amount.toString(), tokenConfig.decimals)
      ),
    refreshEventData,
    refreshUserBalance,
    checkIfApproved, // Enhanced version
    approveAndStake, // Enhanced version with improved USDC handling
    resetTransactionState,

    // Helper functions
    formatTokenAmount,
    getTimeLeft,
    calculatePercentages,
    calculatePotentialWinnings,
    calculateTotalVotes,

    // Clear error
    clearError: () => {
      setError(null)
      setTransactionError(null)
      setStakingError(null)
      tokenApproval.clearError()
      staking.clearError()
    },
  }
}

export default usePrediction