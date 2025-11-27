"use client"

import { useState, useCallback } from "react"
import { useAccount, useWatchContractEvent, usePublicClient } from "wagmi"
import { formatEther } from "viem"
import STIMPVPABI from "../../src/deployedContract/abi/STIMPVP.json"
import StimEventContractABI from "../../src/deployedContract/abi/StimEventContract.json"

const STIMPVP_ADDRESS = import.meta.env.VITE_STAKING_ADDRESS;

export function useContractEvents() {
  const { address } = useAccount()
  const publicClient = usePublicClient()
  const [notifications, setNotifications] = useState([])

  // Watch for EventCompleted events from the factory contract
  useWatchContractEvent({
    address: STIMPVP_ADDRESS,
    abi: STIMPVPABI,
    eventName: "EventCompleted",
    onLogs: useCallback(
      async (logs) => {
        if (!address || !publicClient) return

        for (const log of logs) {
          try {
            const { eventAddress, winningOption } = log.args

            console.log("Event completed:", eventAddress, "Winning option:", winningOption)

            // Check if user participated in this event
            await processEventCompletion(eventAddress, winningOption, address, publicClient)
          } catch (error) {
            console.error("Error processing event completion:", error)
          }
        }
      },
      [address, publicClient],
    ),
    enabled: !!address,
  })

  const processEventCompletion = async (eventAddress, winningOption, userAddress, client) => {
    try {
      // Get user stake data directly from contract
      const userStakeData = await client.readContract({
        address: eventAddress,
        abi: StimEventContractABI,
        functionName: "getUserStake",
        args: [userAddress],
      })

      const [selectedOption, amount, claimed] = userStakeData

      // If user didn't stake or amount is 0, skip
      if (!amount || amount === 0n) return

      // Get event details directly from contract
      const [eventDetails, optionTotals] = await Promise.all([
        client.readContract({
          address: eventAddress,
          abi: StimEventContractABI,
          functionName: "getEventDetails",
        }),
        client.readContract({
          address: eventAddress,
          abi: StimEventContractABI,
          functionName: "getOptionTotals",
        }),
      ])

      const [
        question,
        description,
        options,
        eventType,
        category,
        eventImage,
        status,
        endTime,
        ,
        creator,
        tokenAddress,
        creatorStake,
        totalStaked,
        creatorFeePercentage,
        creatorRewardClaimed,
      ] = eventDetails

      // Calculate if user won
      const userWon = selectedOption === winningOption

      // Calculate winnings using the same logic from your event details page
      const winnings = userWon
        ? calculateWinnings(amount, totalStaked, optionTotals[winningOption], creatorFeePercentage)
        : 0n

      // Create notification with all necessary data
      const notification = {
        id: `${eventAddress}-${Date.now()}`,
        eventAddress,
        userWon,
        winningOption,
        userStake: formatEther(amount),
        potentialWinnings: formatEther(winnings),
        claimed,
        eventDetails: {
          question,
          description,
          options,
          userBetOption: selectedOption,
          result: options[winningOption],
          eventImage,
          totalStaked: formatEther(totalStaked),
          creatorFeePercentage: Number(creatorFeePercentage),
        },
        timestamp: Date.now(),
      }

      // Add notification
      setNotifications((prev) => [notification, ...prev])

      console.log("Notification created:", notification)
    } catch (error) {
      console.error("Error processing event completion:", error)
    }
  }

  // Winnings calculation logic from your event details page
  const calculateWinnings = (userStake, totalStaked, winningOptionTotal, creatorFeePercentage) => {
    try {
      const userStakeBN = BigInt(userStake)
      const totalStakedBN = BigInt(totalStaked)
      const winningOptionTotalBN = BigInt(winningOptionTotal)
      const creatorFeeBN = BigInt(creatorFeePercentage)

      // Calculate total pool after creator fee (same logic as your event details page)
      const feeAmount = (totalStakedBN * creatorFeeBN) / 10000n
      const prizePool = totalStakedBN - feeAmount

      // Calculate user's share of the winning pool
      const userShare = (userStakeBN * prizePool) / winningOptionTotalBN

      return userShare
    } catch (error) {
      console.error("Error calculating winnings:", error)
      return 0n
    }
  }

  const clearNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  const clearAllNotifications = () => {
    setNotifications([])
  }

  return {
    notifications,
    clearNotification,
    clearAllNotifications,
  }
}
