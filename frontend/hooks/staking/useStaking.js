"use client"

import { useState, useEffect } from "react"
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { parseUnits } from "viem"

// Event Status Constants
const EVENT_STATUS = {
  PENDING: 0,
  APPROVED: 1,
  CLOSED: 2,
  COMPLETED: 3,
  CANCELLED: 4,
  REJECTED: 5,
}

// Event Contract ABI for staking
const EVENT_CONTRACT_ABI = [
  {
    type: "function",
    name: "stake",
    inputs: [
      { name: "_option", type: "uint8", internalType: "uint8" },
      { name: "_amount", type: "uint256", internalType: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
]

/**
 * FIXED: Enhanced hook for handling staking operations with proper state management
 */
const useStaking = (eventAddress, userAddress, tokenDecimals = 18) => { 
  const [pendingStake, setPendingStake] = useState(false)
  const [stakeHash, setStakeHash] = useState(null)
  const [error, setError] = useState(null)
  const [debugInfo, setDebugInfo] = useState(null)
  const [transactionCompleted, setTransactionCompleted] = useState(false)

  const { 
    writeContractAsync, 
    error: writeError, 
    isPending: isWritePending 
  } = useWriteContract()

  // Transaction receipt hook
  const { 
    isLoading: isStakePending, 
    isSuccess: isStakeSuccess,
    error: receiptError 
  } = useWaitForTransactionReceipt({
    hash: stakeHash,
    enabled: !!stakeHash,
  })

  // Handle transaction completion
  useEffect(() => {
    if (isStakeSuccess && stakeHash && !transactionCompleted) {
      console.log("✅ Stake transaction confirmed:", stakeHash)
      setTransactionCompleted(true)
      setPendingStake(false)
      setError(null) // Clear any previous errors
    }
  }, [isStakeSuccess, stakeHash, transactionCompleted])

  // Handle transaction errors
  useEffect(() => {
    if (writeError || receiptError) {
      console.error("❌ Transaction error:", writeError || receiptError)
      setPendingStake(false)
      setError(writeError?.message || receiptError?.message || "Transaction failed")
    }
  }, [writeError, receiptError])

  // FIXED: Enhanced place stake with proper parameter handling
  const placeStake = async (optionValue, amount, eventData, userBalance, allowance, tokenAddress, amountInWei = null) => {
    try {
      console.log("=== 🚀 STARTING ENHANCED STAKE TRANSACTION ===")
      console.log("📝 Input parameters:", { 
        optionValue, 
        amount, 
        eventAddress, 
        userAddress,
        tokenDecimals,
        amountInWei: amountInWei?.toString(),
      })

      // Reset states
      setError(null)
      setDebugInfo(null)
      setTransactionCompleted(false)

      // FIXED: Basic validation without external dependencies
      if (!eventAddress || !userAddress) {
        throw new Error("Missing required addresses")
      }

      if (!amount || Number.parseFloat(amount) <= 0) {
        throw new Error("Invalid stake amount")
      }

      if (optionValue !== 0 && optionValue !== 1) {
        throw new Error("Invalid option value (must be 0 or 1)")
      }

      // FIXED: Check event status properly
      if (eventData) {
        console.log("🔍 Event validation:", {
          status: eventData.status,
          isOpenForBetting: eventData.isOpenForBetting,
          hasEnded: eventData.hasEnded,
        })

        if (!eventData.isOpenForBetting) {
          let message = "Event is not accepting stakes"
          if (eventData.isPending) {
            message = "Event is still pending approval"
          } else if (eventData.isClosed || eventData.isCompleted) {
            message = "Event is closed for betting"
          } else if (eventData.hasEnded) {
            message = "Event has already ended"
          }
          throw new Error(message)
        }
      }

      // FIXED: Convert amount to Wei if not provided
      const finalAmountInWei = amountInWei || parseUnits(amount.toString(), tokenDecimals)
      
      console.log("💰 Amount conversion:", {
        originalAmount: amount,
        decimals: tokenDecimals,
        amountInWei: finalAmountInWei.toString(),
      })

      // FIXED: Basic balance check (if available)
      if (userBalance) {
        const userBalanceFormatted = Number(userBalance) / Math.pow(10, tokenDecimals)
        const stakeAmount = Number.parseFloat(amount)
        
        console.log("💼 Balance check:", {
          userBalance: userBalanceFormatted,
          stakeAmount: stakeAmount,
          hasEnoughBalance: userBalanceFormatted >= stakeAmount,
        })

        if (userBalanceFormatted < stakeAmount) {
          throw new Error(`Insufficient balance. You have ${userBalanceFormatted.toFixed(4)} but need ${stakeAmount}`)
        }
      }

      // FIXED: Basic allowance check (if available)
      if (allowance) {
        const allowanceFormatted = Number(allowance) / Math.pow(10, tokenDecimals)
        const stakeAmount = Number.parseFloat(amount)
        
        console.log("🔓 Allowance check:", {
          allowance: allowanceFormatted,
          stakeAmount: stakeAmount,
          hasEnoughAllowance: allowanceFormatted >= stakeAmount,
        })

        if (allowanceFormatted < stakeAmount) {
          throw new Error(`Insufficient allowance. Approved: ${allowanceFormatted.toFixed(4)}, needed: ${stakeAmount}`)
        }
      }

      console.log("✅ All validations passed. Proceeding with stake transaction...")

      setPendingStake(true)

      // FIXED: Ensure optionValue is properly typed
      const optionValueUint8 = Number(optionValue)
      
      console.log("📞 Calling stake function:", {
        contract: eventAddress,
        function: "stake",
        args: [optionValueUint8, finalAmountInWei.toString()],
      })

      const txHash = await writeContractAsync({
        address: eventAddress,
        abi: EVENT_CONTRACT_ABI,
        functionName: "stake",
        args: [optionValueUint8, finalAmountInWei],
      })

      console.log("✅ Stake transaction submitted:", txHash)
      setStakeHash(txHash)
      
      return { 
        success: true, 
        hash: txHash, 
        debugInfo: {
          optionValue: optionValueUint8,
          amount: finalAmountInWei.toString(),
          eventAddress,
          userAddress,
        }
      }
    } catch (err) {
      console.error("=== ❌ STAKING ERROR ===", err)
      setPendingStake(false)
      setTransactionCompleted(false)

      let errorMessage = "Staking failed"

      // FIXED: Enhanced error parsing
      if (err.message?.includes("User rejected") || err.message?.includes("user rejected")) {
        errorMessage = "Transaction was rejected by user"
      } else if (err.message?.includes("insufficient funds")) {
        errorMessage = "Insufficient ETH for gas fee"
      } else if (err.message?.includes("execution reverted") || err.message?.includes("reverted")) {
        errorMessage = "Transaction reverted by smart contract"

        // FIXED: Check for specific revert reasons
        const revertReason = err.message.toLowerCase()
        if (revertReason.includes("event not open") || revertReason.includes("not approved")) {
          errorMessage += " - Event is not open for betting"
        } else if (revertReason.includes("insufficient allowance") || revertReason.includes("allowance")) {
          errorMessage += " - Token allowance insufficient"
        } else if (revertReason.includes("insufficient balance") || revertReason.includes("balance")) {
          errorMessage += " - Token balance insufficient"
        } else if (revertReason.includes("invalid option")) {
          errorMessage += " - Invalid betting option"
        } else if (revertReason.includes("already staked") || revertReason.includes("already placed")) {
          errorMessage += " - User has already placed a stake"
        } else if (revertReason.includes("amount")) {
          errorMessage += " - Invalid stake amount"
        } else {
          errorMessage += " - Check event status and your balance"
        }
      } else if (err.message?.includes("network")) {
        errorMessage = "Network error - please try again"
      } else if (err.message?.includes("chainId") || err.message?.includes("chain")) {
        errorMessage = "Wrong network - please switch to Base Sepolia"
      } else if (err.message) {
        errorMessage = err.message
      }

      setError(errorMessage)
      return {
        success: false,
        error: errorMessage,
        debugInfo: {
          originalError: err.message,
          stack: err.stack,
        },
      }
    }
  }

  // FIXED: Simplified debug helper function
  const runDebugCheck = async (optionValue, amount, eventData, userBalance, allowance, tokenAddress, amountInWei = null) => {
    try {
      console.log("🔍 Running debug check...")
      
      const finalAmountInWei = amountInWei || parseUnits(amount.toString(), tokenDecimals)
      
      const debugResult = {
        inputs: {
          optionValue,
          amount,
          amountInWei: finalAmountInWei.toString(),
          eventAddress,
          userAddress,
          tokenAddress,
          tokenDecimals,
        },
        validation: {
          hasValidAddress: !!eventAddress && !!userAddress,
          hasValidAmount: amount && Number.parseFloat(amount) > 0,
          hasValidOption: optionValue === 0 || optionValue === 1,
          eventIsOpen: eventData?.isOpenForBetting || false,
          hasBalance: userBalance ? (Number(userBalance) / Math.pow(10, tokenDecimals)) >= Number.parseFloat(amount) : "unknown",
          hasAllowance: allowance ? (Number(allowance) / Math.pow(10, tokenDecimals)) >= Number.parseFloat(amount) : "unknown",
        },
        summary: {
          canStake: true,
          mainBlocker: null,
        }
      }

      // Check for blockers
      if (!debugResult.validation.hasValidAddress) {
        debugResult.summary.canStake = false
        debugResult.summary.mainBlocker = "Missing required addresses"
      } else if (!debugResult.validation.hasValidAmount) {
        debugResult.summary.canStake = false
        debugResult.summary.mainBlocker = "Invalid stake amount"
      } else if (!debugResult.validation.hasValidOption) {
        debugResult.summary.canStake = false
        debugResult.summary.mainBlocker = "Invalid option value"
      } else if (!debugResult.validation.eventIsOpen) {
        debugResult.summary.canStake = false
        debugResult.summary.mainBlocker = "Event is not open for betting"
      } else if (debugResult.validation.hasBalance === false) {
        debugResult.summary.canStake = false
        debugResult.summary.mainBlocker = "Insufficient balance"
      } else if (debugResult.validation.hasAllowance === false) {
        debugResult.summary.canStake = false
        debugResult.summary.mainBlocker = "Insufficient allowance"
      }

      console.log("🔍 Debug result:", debugResult)
      setDebugInfo(debugResult)
      return debugResult
    } catch (err) {
      console.error("❌ Debug check failed:", err)
      return {
        error: err.message,
        inputs: { optionValue, amount, eventAddress, userAddress, tokenAddress },
        summary: { canStake: false, mainBlocker: "Debug check failed" }
      }
    }
  }

  // Clear transaction state method
  const clearTransactionState = () => {
    console.log("🔄 Clearing staking transaction state")
    setStakeHash(null)
    setPendingStake(false)
    setTransactionCompleted(false)
    setError(null)
    setDebugInfo(null)
  }

  return {
    // States
    pendingStake,
    isStakePending: isStakePending || isWritePending,
    isStakeSuccess: isStakeSuccess && transactionCompleted,
    error,
    debugInfo,
    transactionCompleted,
    stakeHash,

    // Actions
    placeStake,
    runDebugCheck,
    clearTransactionState,
    setError,
    clearError: () => {
      setError(null)
      setDebugInfo(null)
    },
  }
}

export default useStaking