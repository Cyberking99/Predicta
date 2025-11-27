import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { STAKING } from '../../src/deployedContract/constants';
import STAKING_ABI from '../../src/deployedContract/abi/StakeABI.json';

export const useStakingContract = (chainId) => {
  // Read contract functions
  const useStimTokenAddress = () => useReadContract({
    address: STAKING,
    abi: STAKING_ABI,
    functionName: 'stimToken',
    chainId,
  });

  const useCreatorStakeAmount = () => useReadContract({
    address: STAKING,
    abi: STAKING_ABI,
    functionName: 'creatorStakeAmount',
    chainId,
  });

  const useAllCategories = () => useReadContract({
    address: STAKING,
    abi: STAKING_ABI,
    functionName: 'getAllCategories',
    chainId,
  });

  // Write contract functions
  const {
    writeContract,
    writeContractAsync,
    isPending: isWritePending,
    error: writeError,
    data: hash
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
    chainId,
  });

  // Modified createEvent function with explicit error handling
  const createEvent = async (eventData) => {
    try {
      console.log("Creating event with chainId:", chainId);
      console.log("Event data:", eventData);
      
      if (!chainId) {
        throw new Error("ChainID is undefined. Please ensure you're connected to a supported network.");
      }
      
      const args = [
        eventData.question,
        eventData.description,
        eventData.options,
        eventData.eventType,
        BigInt(eventData.categoryId),
        eventData.eventImage || "",
        BigInt(eventData.startTimestamp),
        BigInt(eventData.endTimestamp),
        eventData.tokenAddress
      ];
      
      console.log("Contract args:", args);
      
      return await writeContractAsync({
        address: STAKING,
        abi: STAKING_ABI,
        functionName: 'createEvent',
        chainId,
        args
      });
    } catch (error) {
      console.error("Error in createEvent:", error);
      
     
      if (error.message && error.message.includes("network changed")) {
        throw new Error("Network connection changed during transaction. Please try again.");
      }
      
    
      throw error;
    }
  };

  return {
    useStimTokenAddress,
    useCreatorStakeAmount,
    useAllCategories,
    createEvent,
    isWritePending,
    writeError,
    isConfirming,
    isConfirmed
  };
};