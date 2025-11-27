"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useContractRead } from "wagmi"
import { createPublicClient, http } from "viem"
import { celoAlfajores } from "viem/chains"

// Contract address from environment
const STAKING = import.meta.env.VITE_STAKING_ADDRESS

// Enhanced Factory ABI
const STIMPVP_ABI = [
  {
    type: "function",
    name: "getAllEvents",
    inputs: [],
    outputs: [{ name: "", type: "address[]", internalType: "address[]" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getAllCategories",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "tuple[]",
        internalType: "struct Preden.Category[]",
        components: [
          { name: "name", type: "string", internalType: "string" },
          { name: "description", type: "string", internalType: "string" },
          { name: "active", type: "bool", internalType: "bool" },
        ],
      },
    ],
    stateMutability: "view",
  },
]

// Enhanced Event Contract ABI
const EVENT_ABI = [
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
    name: "creatorStake",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
]

// Get RPC URL from environment variables with fallback
const getRpcUrl = () => {
  const alchemyKey = import.meta.env.VITE_ALCHEMY_API_KEY
  const infuraKey = import.meta.env.VITE_INFURA_API_KEY

  return "https://rpc.ankr.com/celo_sepolia"

  // Prioritize Alchemy
  if (alchemyKey) {
    console.log('Using Alchemy RPC for Celo network')
    return `https://celo-sepolia.g.alchemy.com/v2/${alchemyKey}`
  }

  // Fallback to Infura
  if (infuraKey) {
    console.log('Using Infura RPC for Celo network')
    return `https://celo-sepolia.infura.io/v3/${infuraKey}`
  }

  // Final fallback to public RPC (not recommended for production)
  console.warn('No API key found! Using public RPC (may experience rate limiting)')
  return "https://forno.celo-sepolia.celo-testnet.org"
}

// Enhanced RPC client with Alchemy/Infura
const createOptimizedClient = () => {
  const rpcUrl = getRpcUrl()

  console.log(rpcUrl);

  return createPublicClient({
    chain: celoAlfajores,
    transport: http(rpcUrl, {
      timeout: 30000, // Increased timeout for better reliability
      retryCount: 3,
      retryDelay: ({ count }) => ~~(1 << count) * 200, // Exponential backoff
    }),
    batch: {
      multicall: {
        batchSize: 50, // Can increase batch size with private RPC
        wait: 50,
      },
    },
    cacheTime: 30_000, // 30 second cache
  })
}

const useEventsData = () => {
  const [eventsData, setEventsData] = useState([])
  const [categoryList, setCategoryList] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState("")
  const [loadingStats, setLoadingStats] = useState({ loaded: 0, total: 0, failed: 0 })

  // Cache and state management
  const clientRef = useRef(null)
  const retryCountRef = useRef(0)
  const maxRetries = 3
  const processingRef = useRef(false)

  // Initialize optimized client
  useEffect(() => {
    if (!clientRef.current) {
      clientRef.current = createOptimizedClient()
    }
  }, [])

  // Fetch event addresses with enhanced error handling
  const {
    data: eventAddresses,
    isError: eventAddressesError,
    refetch: refetchEventAddresses,
    isLoading: eventAddressesLoading,
  } = useContractRead({
    address: STAKING,
    abi: STIMPVP_ABI,
    functionName: "getAllEvents",
    cacheTime: 30_000,
    staleTime: 15_000,
    retry: (failureCount, error) => {
      console.warn(`Event addresses fetch attempt ${failureCount + 1}:`, error)
      return failureCount < 2
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
    onError: (error) => {
      console.error("Error fetching event addresses:", error)
      setErrorMessage("Failed to fetch events from blockchain. Please check your network connection.")
    },
  })

  // Fetch categories with enhanced error handling
  const {
    data: categoriesData,
    isError: categoriesError,
    isLoading: categoriesLoading,
  } = useContractRead({
    address: STAKING,
    abi: STIMPVP_ABI,
    functionName: "getAllCategories",
    cacheTime: 60_000,
    staleTime: 30_000,
    retry: 2,
    onError: (error) => {
      console.error("Error fetching categories:", error)
      setErrorMessage((prev) =>
        prev ? `${prev} Failed to fetch categories.` : "Failed to fetch categories."
      )
    },
  })

  // Process categories data with better error handling
  useEffect(() => {
    if (categoriesData && Array.isArray(categoriesData)) {
      try {
        const formattedCategories = categoriesData
          .filter((cat) => {
            return cat && typeof cat === "object" && cat.active === true
          })
          .map((cat, index) => ({
            id: index.toString(),
            label: cat.name || "Unknown Category",
            description: cat.description || "",
            active: Boolean(cat.active),
          }))

        setCategoryList([{ id: "all", label: "All Categories" }, ...formattedCategories])
      } catch (error) {
        console.error("Error processing categories:", error)
        setCategoryList([{ id: "all", label: "All Categories" }])
      }
    } else if (categoriesData === null || categoriesError) {
      setCategoryList([{ id: "all", label: "All Categories" }])
    }
  }, [categoriesData, categoriesError])

  // Enhanced contract read with better error handling
  const safeReadContract = useCallback(async (client, address, functionName, abi = EVENT_ABI) => {
    const maxRetries = 2
    let lastError = null

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        if (!address || address === "0x0" || address === "0x0000000000000000000000000000000000000000") {
          throw new Error("Invalid contract address")
        }

        // Minimal delay only on retry
        if (attempt > 0) {
          await new Promise(resolve => setTimeout(resolve, 300 * attempt))
        }

        const result = await client.readContract({
          address,
          abi,
          functionName,
        })

        return { success: true, data: result }
      } catch (error) {
        lastError = error
        const isRateLimit = error.message?.includes('429') ||
          error.message?.includes('rate limit') ||
          error.message?.includes('too many requests')

        if (isRateLimit && attempt < maxRetries - 1) {
          console.warn(`Rate limited on ${functionName} for ${address}, retrying...`)
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)))
          continue
        }

        console.warn(`Failed to read ${functionName} from ${address} (attempt ${attempt + 1}):`, error.message)
      }
    }

    return { success: false, error: lastError }
  }, [])

  // Safe conversion helpers
  const safeNumber = useCallback((value, defaultValue = 0) => {
    if (value === null || value === undefined) return defaultValue
    if (typeof value === "number") return value
    if (typeof value === "string") {
      const parsed = Number.parseInt(value, 10)
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

  // Optimized batch processing with private RPC
  const processEventsBatch = useCallback(async (eventAddresses, batchSize = 10) => {
    if (!clientRef.current || !eventAddresses?.length) return []

    const results = []
    setLoadingStats({ loaded: 0, total: eventAddresses.length, failed: 0 })

    // Process in larger batches since we have private RPC
    for (let i = 0; i < eventAddresses.length; i += batchSize) {
      const batch = eventAddresses.slice(i, i + batchSize)

      // Minimal delay between batches with private RPC
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      const batchPromises = batch.map(async (eventAddress, batchIndex) => {
        try {
          const eventIndex = i + batchIndex

          // Validate address first
          if (!eventAddress || typeof eventAddress !== "string") {
            console.warn(`Invalid event address at index ${eventIndex}:`, eventAddress)
            return null
          }

          // Try getEventDetails first
          const eventDetailsResult = await safeReadContract(
            clientRef.current,
            eventAddress,
            "getEventDetails"
          )

          let eventData = null

          if (eventDetailsResult.success && eventDetailsResult.data) {
            const details = eventDetailsResult.data

            // Fetch creatorStake separately since it's not in getEventDetails
            const creatorStakeResult = await safeReadContract(
              clientRef.current,
              eventAddress,
              "creatorStake"
            )
            const creatorStake = creatorStakeResult.success ? safeNumber(creatorStakeResult.data, 0) : 0

            eventData = {
              question: safeString(details[0], "Unknown Question"),
              description: safeString(details[1], "No description available"),
              options: Array.isArray(details[2]) && details[2].length > 0 ? details[2] : ["Yes", "No"],
              eventType: safeString(details[3], "binary"),
              category: safeString(details[4], "general"),
              eventImage: safeString(details[5], ""),
              status: safeNumber(details[6], 0),
              endTime: safeNumber(details[7], Math.floor(Date.now() / 1000)),
              winningOption: safeNumber(details[8], 0),
              creator: safeString(details[9], "0x0"),
              tokenAddress: safeString(details[10], "0x0"),
              totalStaked: safeNumber(details[11], 0),
              creatorFeePercentage: safeNumber(details[12], 0),
              creatorRewardClaimed: Boolean(details[13]),
              creatorStake: creatorStake,
            }
          } else {
            console.warn(`Could not fetch getEventDetails for ${eventAddress}, skipping event`)
            return null
          }

          if (!eventData) {
            console.warn(`Could not fetch data for event ${eventAddress}`)
            return null
          }

          // Get option totals
          const optionTotalsResult = await safeReadContract(
            clientRef.current,
            eventAddress,
            "getOptionTotals"
          )

          let optionTotals = [0, 0]
          if (optionTotalsResult.success && Array.isArray(optionTotalsResult.data)) {
            optionTotals = optionTotalsResult.data.map((total) => safeNumber(total, 0))
          }

          // Ensure we have at least 2 option totals
          while (optionTotals.length < 2) {
            optionTotals.push(0)
          }

          // Find matching category
          const matchingCategory = categoryList.find(
            (cat) =>
              cat && cat.label && eventData.category &&
              cat.label.toLowerCase() === eventData.category.toLowerCase()
          ) || {
            id: "0",
            label: eventData.category || "Unknown",
            description: "",
            active: true,
          }

          // Update loading stats
          setLoadingStats(prev => ({
            ...prev,
            loaded: prev.loaded + 1
          }))

          return {
            address: eventAddress,
            question: eventData.question,
            description: eventData.description,
            options: {
              A: (eventData.options && eventData.options[0]) || "Yes",
              B: (eventData.options && eventData.options[1]) || "No",
            },
            category: matchingCategory,
            end_time: new Date(eventData.endTime * 1000).toISOString(),
            tokenAddress: eventData.tokenAddress,
            yes_votes: optionTotals[0],
            no_votes: optionTotals[1],
            totalStaked: eventData.totalStaked,
            status: eventData.status,
            creator: eventData.creator,
            eventType: eventData.eventType,
            creatorStake: eventData.creatorStake,
            creatorFeePercentage: eventData.creatorFeePercentage,
            creatorRewardClaimed: eventData.creatorRewardClaimed,
          }
        } catch (error) {
          console.error(`Error processing event ${eventAddress}:`, error)
          setLoadingStats(prev => ({
            ...prev,
            failed: prev.failed + 1
          }))
          return null
        }
      })

      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults.filter(result => result !== null))
    }

    return results
  }, [categoryList, safeReadContract, safeNumber, safeString])

  // Main fetch function
  const fetchEventDetails = useCallback(async () => {
    if (!eventAddresses || !Array.isArray(eventAddresses) || eventAddresses.length === 0) {
      setIsLoading(false)
      setEventsData([])
      return
    }

    if (processingRef.current) {
      console.log("Already processing events, skipping...")
      return
    }

    processingRef.current = true
    setIsLoading(true)
    setErrorMessage("")
    retryCountRef.current = 0

    try {
      const events = await processEventsBatch(eventAddresses, 10)

      setEventsData(events)

      if (events.length === 0 && eventAddresses.length > 0) {
        setErrorMessage("No valid events could be loaded. Please check network connection and try again.")
      } else if (events.length < eventAddresses.length) {
        const failedCount = eventAddresses.length - events.length
        console.warn(`Loaded ${events.length}/${eventAddresses.length} events (${failedCount} failed)`)
      }
    } catch (error) {
      console.error("Error in bulk fetch:", error)

      if (retryCountRef.current < maxRetries) {
        retryCountRef.current++
        console.log(`Retrying fetch (attempt ${retryCountRef.current}/${maxRetries})...`)
        setTimeout(() => {
          processingRef.current = false
          fetchEventDetails()
        }, 2000 * retryCountRef.current)
        return
      }

      setErrorMessage("Failed to load events after multiple attempts. Please refresh the page.")
      setEventsData([])
    } finally {
      setIsLoading(false)
      processingRef.current = false
    }
  }, [eventAddresses, processEventsBatch])

  // Trigger fetch when dependencies are ready
  useEffect(() => {
    if (eventAddresses && categoryList.length > 0 && !processingRef.current) {
      fetchEventDetails()
    } else if (eventAddressesError || categoriesError) {
      setIsLoading(false)
    }
  }, [eventAddresses, categoryList, fetchEventDetails, eventAddressesError, categoriesError])

  // Loading state management
  useEffect(() => {
    const shouldBeLoading =
      eventAddressesLoading ||
      categoriesLoading ||
      (eventAddresses && eventAddresses.length > 0 && categoryList.length === 0) ||
      processingRef.current

    setIsLoading(shouldBeLoading)
  }, [eventAddressesLoading, categoriesLoading, eventAddresses, categoryList])

  // Enhanced refetch with cleanup
  const refetch = useCallback(() => {
    processingRef.current = false
    retryCountRef.current = 0
    setIsLoading(true)
    setErrorMessage("")
    setEventsData([])
    setLoadingStats({ loaded: 0, total: 0, failed: 0 })

    // Recreate client to reset any connection issues
    clientRef.current = createOptimizedClient()

    refetchEventAddresses()
  }, [refetchEventAddresses])

  // Enhanced filter function
  const getFilteredEvents = useCallback(
    (searchQuery = "", selectedCategory = "all") => {
      if (!eventsData || !Array.isArray(eventsData)) return []

      return eventsData.filter((event) => {
        if (!event) return false

        const matchesSearch =
          !searchQuery ||
          (event.question && event.question.toLowerCase().includes(searchQuery.toLowerCase()))

        const matchesCategory =
          selectedCategory === "all" ||
          (event.category && event.category.id === selectedCategory)

        return matchesSearch && matchesCategory
      })
    },
    [eventsData]
  )

  return {
    eventsData,
    categoryList,
    isLoading,
    errorMessage,
    loadingStats,
    refetch,
    getFilteredEvents,
  }
}

export default useEventsData