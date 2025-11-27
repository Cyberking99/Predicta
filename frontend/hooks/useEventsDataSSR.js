// hooks/useEventsDataSSR.js
"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useContractRead } from "wagmi"
import { createPublicClient, http } from "viem"
import { base } from "viem/chains"

const STAKING = import.meta.env.VITE_STAKING_ADDRESS || "0x00a971e86D76C7a7374e42C952e31a1E6186A603"

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
        internalType: "struct STIMPVP.Category[]",
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

const useEventsDataSSR = () => {
  const [eventsData, setEventsData] = useState([])
  const [categoryList, setCategoryList] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState("")
  const [isInitialized, setIsInitialized] = useState(false)
  
  const clientRef = useRef(null)
  const processingRef = useRef(false)

  // Initialize with SSR data if available
  useEffect(() => {
    if (typeof window !== 'undefined' && window.__INITIAL_DATA__ && !isInitialized) {
      console.log('Loading SSR data:', window.__INITIAL_DATA__)
      const { events, categories } = window.__INITIAL_DATA__
      
      setEventsData(events || [])
      setCategoryList(categories || [{ id: "all", label: "All Categories" }])
      setIsLoading(false)
      setIsInitialized(true)
      
      // Clean up the global variable
      delete window.__INITIAL_DATA__
    }
  }, [isInitialized])

  // Initialize client for live updates
  useEffect(() => {
    if (!clientRef.current) {
      clientRef.current = createPublicClient({
        chain: base,
        transport: http("https://mainnet.base.org", {
          timeout: 15000,
          retryCount: 3,
          retryDelay: ({ count }) => ~~(1 << count) * 200,
        }),
        batch: {
          multicall: {
            batchSize: 32,
            wait: 50,
          },
        },
        cacheTime: 30_000,
      })
    }
  }, [])

  // Fallback data fetching using wagmi (for when SSR data is not available)
  const {
    data: eventAddresses,
    isError: eventAddressesError,
    refetch: refetchEventAddresses,
    isLoading: eventAddressesLoading,
  } = useContractRead({
    address: STAKING,
    abi: STIMPVP_ABI,
    functionName: "getAllEvents",
    enabled: !isInitialized, // Only fetch if SSR data wasn't available
    cacheTime: 30_000,
    staleTime: 15_000,
    retry: 2,
    onError: (error) => {
      console.error("Error fetching event addresses:", error)
      setErrorMessage("Failed to fetch events from blockchain.")
    },
  })

  const {
    data: categoriesData,
    isError: categoriesError,
    isLoading: categoriesLoading,
  } = useContractRead({
    address: STAKING,
    abi: STIMPVP_ABI,
    functionName: "getAllCategories",
    enabled: !isInitialized, // Only fetch if SSR data wasn't available
    cacheTime: 60_000,
    staleTime: 30_000,
    retry: 2,
    onError: (error) => {
      console.error("Error fetching categories:", error)
    },
  })

  // Fallback API fetch function
  const fetchFromAPI = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/events')
      if (!response.ok) throw new Error('API request failed')
      
      const data = await response.json()
      setEventsData(data.events || [])
      setCategoryList(data.categories || [{ id: "all", label: "All Categories" }])
      setErrorMessage("")
    } catch (error) {
      console.error('Error fetching from API:', error)
      setErrorMessage("Failed to fetch events. Please try refreshing.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  // If SSR data is not available and wagmi is taking too long, use API fallback
  useEffect(() => {
    if (!isInitialized && (eventAddressesError || categoriesError)) {
      console.log('Falling back to API due to wagmi errors')
      fetchFromAPI()
    }
  }, [eventAddressesError, categoriesError, isInitialized, fetchFromAPI])

  // Enhanced refetch function that can use both API and blockchain
  const refetch = useCallback(async (useAPI = false) => {
    processingRef.current = false
    setErrorMessage("")
    
    if (useAPI) {
      await fetchFromAPI()
    } else {
      setIsLoading(true)
      setEventsData([])
      
      // Recreate client and refetch from blockchain
      clientRef.current = createPublicClient({
        chain: base,
        transport: http("https://mainnet.base.org", {
          timeout: 15000,
          retryCount: 3,
          retryDelay: ({ count }) => ~~(1 << count) * 200,
        }),
      })
      
      refetchEventAddresses()
    }
  }, [refetchEventAddresses, fetchFromAPI])

  // Filter function
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

  // Auto-refresh every 30 seconds using API (lighter than blockchain calls)
  useEffect(() => {
    if (!isInitialized) return

    const interval = setInterval(() => {
      if (!processingRef.current) {
        console.log('Auto-refreshing events via API...')
        fetchFromAPI()
      }
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [isInitialized, fetchFromAPI])

  return {
    eventsData,
    categoryList,
    isLoading: isLoading && !isInitialized,
    errorMessage,
    refetch,
    getFilteredEvents,
    isInitialized,
    refreshFromAPI: fetchFromAPI,
  }
}

export default useEventsDataSSR