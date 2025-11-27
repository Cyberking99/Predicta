"use client"

import { useState, useEffect } from "react"
import { useReadContract } from "wagmi"

// Event Contract ABI for checking user stake
const EVENT_CONTRACT_ABI = [
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
]

const PreviousStakeCheck = ({ eventAddress, userAddress, onStakeFound }) => {
  const [hasStaked, setHasStaked] = useState(false)
  const [stakeDetails, setStakeDetails] = useState(null)
  const [loading, setLoading] = useState(true)

  const {
    data: userStakeData,
    isError,
    isLoading,
  } = useReadContract({
    address: eventAddress,
    abi: EVENT_CONTRACT_ABI,
    functionName: "getUserStake",
    args: [userAddress],
    enabled: !!eventAddress && !!userAddress,
  })

  useEffect(() => {
    if (!isLoading) {
      setLoading(false)

      if (userStakeData) {
        const [selectedOption, amount, claimed] = userStakeData

        // Check if user has already staked (amount > 0)
        const hasExistingStake = amount > 0n
        setHasStaked(hasExistingStake)

        if (hasExistingStake) {
          const stakeInfo = {
            selectedOption: Number(selectedOption),
            amount,
            claimed: Boolean(claimed),
            optionName: selectedOption === 0n ? "Yes" : "No",
          }
          setStakeDetails(stakeInfo)

          // Notify parent component
          if (onStakeFound) {
            onStakeFound(stakeInfo)
          }
        }
      }
    }
  }, [userStakeData, isLoading, onStakeFound])

  if (loading) {
    return (
      <div className="bg-blue-900 bg-opacity-20 p-3 rounded-lg mb-4">
        <div className="flex items-center">
          <div className="w-4 h-4 rounded-full border-2 border-t-blue-400 border-r-transparent border-b-transparent border-l-transparent animate-spin mr-2"></div>
          <p className="text-blue-400 text-sm">Checking for existing stakes...</p>
        </div>
      </div>
    )
  }

  if (isError) {
    return null // Don't show anything on error
  }

  if (hasStaked && stakeDetails) {
    return (
      <div className="bg-yellow-900 bg-opacity-20 p-3 rounded-lg mb-4">
        <h4 className="text-yellow-400 font-medium mb-1">Existing Stake Detected</h4>
        <p className="text-yellow-300 text-sm">
          You have already staked on this event. Your stake: {stakeDetails.optionName}
        </p>
      </div>
    )
  }

  return null
}

export default PreviousStakeCheck
