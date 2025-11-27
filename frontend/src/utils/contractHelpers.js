import { STAKING } from "../deployedContract/constants"

// ABI for contract interactions
const CONTRACT_ABI = [
  {
    type: "function",
    name: "getUserStakes",
    inputs: [
      { name: "eventAddress", type: "address" },
      { name: "userAddress", type: "address" },
    ],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "stakeAmount", type: "uint256" },
          { name: "betOption", type: "uint8" },
          { name: "potentialWinnings", type: "uint256" },
          { name: "eventQuestion", type: "string" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "claimWinnings",
    inputs: [{ name: "eventAddress", type: "address" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
]

// Function to claim winnings from the contract
export const claimWinnings = async (eventAddress, publicClient, walletClient) => {
  try {
    console.log("Claiming winnings for event:", eventAddress)

    // This would be your actual contract interaction
    const { request } = await publicClient.simulateContract({
      address: STAKING,
      abi: CONTRACT_ABI,
      functionName: "claimWinnings",
      args: [eventAddress],
    })

    const hash = await walletClient.writeContract(request)

    console.log("Transaction hash:", hash)
    return { success: true, txHash: hash }
  } catch (error) {
    console.error("Error claiming winnings:", error)
    throw error
  }
}

// Function to get user stakes for a specific event
export const getUserStakes = async (eventAddress, userAddress, publicClient) => {
  try {
    console.log("Getting user stakes for event:", eventAddress)
    console.log("User address:", userAddress)

    // This would be your actual contract call
    // Uncomment when ready to use real data
    /*
    const stakes = await publicClient.readContract({
      address: STAKING,
      abi: CONTRACT_ABI,
      functionName: 'getUserStakes',
      args: [eventAddress, userAddress]
    });
    
    return {
      stakeAmount: stakes[0],
      betOption: stakes[1],
      potentialWinnings: stakes[2],
      eventQuestion: stakes[3]
    };
    */

    // For now, return mock data
    return {
      stakeAmount: 1,
      betOption: 1,
      potentialWinnings: 12,
      eventQuestion: "Will United States Win The Final World Cup?",
    }
  } catch (error) {
    console.error("Error getting user stakes:", error)
    throw error
  }
}

// Function to check if user has stakes in an event
export const hasUserStaked = async (eventAddress, userAddress, publicClient) => {
  try {
    // Uncomment when ready to use real data
    /*
    const stakes = await getUserStakes(eventAddress, userAddress, publicClient);
    return stakes && stakes.stakeAmount > 0;
    */

    // For testing, return true
    return true
  } catch (error) {
    console.error("Error checking user stakes:", error)
    return false
  }
}
