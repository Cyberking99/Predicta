import { 
    useReadContract,
    useWriteContract,
    useWaitForTransactionReceipt
  } from 'wagmi';
  import StakeABI from '../../src/deployedContract/abi/StakeABI.json';
  
  // Contract address for the PVP stake contract
  export const STAKING = import.meta.env.VITE_STAKING_ADDRESS;
  
  // Hook for creating a new event
  export const useCreateEvent = () => {
    const { writeContract, data: hash, isPending: isWritePending, error: writeError } = useWriteContract();
    
    const { 
      isLoading: isTxLoading, 
      isSuccess, 
      error: txError 
    } = useWaitForTransactionReceipt({
      hash,
    });
    
    const isLoading = isWritePending || isTxLoading;
    const error = writeError || txError;
    
    const handleCreateEvent = async (
      question,
      description,
      options,
      eventType,
      categoryId,
      eventImage,
      startTime,
      endTime,
      tokenAddress
    ) => {
      try {
        writeContract({
          address: STAKING,
          abi: StakeABI,
          functionName: 'createEvent',
          args: [
            question,
            description,
            options,
            eventType,
            categoryId,
            eventImage,
            startTime,
            endTime,
            tokenAddress
          ]
        });
      } catch (err) {
        console.error("Error creating event:", err);
      }
    };
    
    return { 
      createEvent: handleCreateEvent, 
      isLoading, 
      isSuccess, 
      error, 
      txHash: hash 
    };
  };
  
  // Hook for approving an event (for moderators)
  export const useApproveEvent = () => {
    const { writeContract, data: hash, isPending: isWritePending } = useWriteContract();
    
    const { isLoading: isTxLoading, isSuccess } = useWaitForTransactionReceipt({
      hash,
    });
    
    const approveEvent = (eventAddress) => {
      writeContract({
        address: STAKING,
        abi: StakeABI,
        functionName: 'approveEvent',
        args: [eventAddress]
      });
    };
    
    return { 
      approveEvent, 
      isLoading: isWritePending || isTxLoading, 
      isSuccess,
      txHash: hash 
    };
  };
  
  // Hook for rejecting an event (for moderators)
  export const useRejectEvent = () => {
    const { writeContract, data: hash, isPending: isWritePending } = useWriteContract();
    
    const { isLoading: isTxLoading, isSuccess } = useWaitForTransactionReceipt({
      hash,
    });
    
    const rejectEvent = (eventAddress) => {
      writeContract({
        address: STAKING,
        abi: StakeABI,
        functionName: 'rejectEvent',
        args: [eventAddress]
      });
    };
    
    return { 
      rejectEvent, 
      isLoading: isWritePending || isTxLoading, 
      isSuccess,
      txHash: hash 
    };
  };
  
  // Hook for completing an event
  export const useCompleteEvent = () => {
    const { writeContract, data: hash, isPending: isWritePending } = useWriteContract();
    
    const { isLoading: isTxLoading, isSuccess } = useWaitForTransactionReceipt({
      hash,
    });
    
    const completeEvent = (eventAddress, winningOption) => {
      writeContract({
        address: STAKING,
        abi: StakeABI,
        functionName: 'completeEvent',
        args: [eventAddress, winningOption]
      });
    };
    
    return { 
      completeEvent, 
      isLoading: isWritePending || isTxLoading, 
      isSuccess,
      txHash: hash 
    };
  };
  
  // Hook for completing an event with multiple winners
  export const useCompleteEventWithMultipleWinners = () => {
    const { writeContract, data: hash, isPending: isWritePending } = useWriteContract();
    
    const { isLoading: isTxLoading, isSuccess } = useWaitForTransactionReceipt({
      hash,
    });
    
    const completeEventWithMultipleWinners = (eventAddress, winningOptions) => {
      writeContract({
        address: STAKING,
        abi: StakeABI,
        functionName: 'completeEventWithMultipleWinners',
        args: [eventAddress, winningOptions]
      });
    };
    
    return { 
      completeEventWithMultipleWinners, 
      isLoading: isWritePending || isTxLoading, 
      isSuccess,
      txHash: hash 
    };
  };
  
  // Hook for cancelling an event
  export const useCancelEvent = () => {
    const { writeContract, data: hash, isPending: isWritePending } = useWriteContract();
    
    const { isLoading: isTxLoading, isSuccess } = useWaitForTransactionReceipt({
      hash,
    });
    
    const cancelEvent = (eventAddress) => {
      writeContract({
        address: STAKING,
        abi: StakeABI,
        functionName: 'cancelEvent',
        args: [eventAddress]
      });
    };
    
    return { 
      cancelEvent, 
      isLoading: isWritePending || isTxLoading, 
      isSuccess,
      txHash: hash 
    };
  };
  
  // Hook for cancelling an event with stakes
  export const useCancelEventWithStakes = () => {
    const { writeContract, data: hash, isPending: isWritePending } = useWriteContract();
    
    const { isLoading: isTxLoading, isSuccess } = useWaitForTransactionReceipt({
      hash,
    });
    
    const cancelEventWithStakes = (eventAddress) => {
      writeContract({
        address: STAKING,
        abi: StakeABI,
        functionName: 'cancelEventWithStakes',
        args: [eventAddress]
      });
    };
    
    return { 
      cancelEventWithStakes, 
      isLoading: isWritePending || isTxLoading, 
      isSuccess,
      txHash: hash 
    };
  };
  
  // Hook for activating multiple events
  export const useActivateEvents = () => {
    const { writeContract, data: hash, isPending: isWritePending } = useWriteContract();
    
    const { isLoading: isTxLoading, isSuccess } = useWaitForTransactionReceipt({
      hash,
    });
    
    const activateEvents = (eventAddresses) => {
      writeContract({
        address: STAKING,
        abi: StakeABI,
        functionName: 'activateEvents',
        args: [eventAddresses]
      });
    };
    
    return { 
      activateEvents, 
      isLoading: isWritePending || isTxLoading, 
      isSuccess,
      txHash: hash 
    };
  };
  
  // Hook for getting all events
  export const useGetAllEvents = () => {
    const { data, error, isPending, refetch } = useReadContract({
      address: STAKING,
      abi: StakeABI,
      functionName: 'getAllEvents',
    });
    
    return {
      events: data,
      isLoading: isPending,
      isError: !!error,
      refetch
    };
  };
  
  // Hook for getting events by category
  export const useGetEventsByCategory = (categoryId) => {
    const { data, error, isPending, refetch } = useReadContract({
      address: STAKING,
      abi: StakeABI,
      functionName: 'getEventsByCategory',
      args: [categoryId],
      watch: true,
    });
    
    return {
      events: data,
      isLoading: isPending,
      isError: !!error,
      refetch
    };
  };
  
  // Hook for getting events by creator
  export const useGetEventsByCreator = (creatorAddress) => {
    const { data, error, isPending, refetch } = useReadContract({
      address: STAKING,
      abi: StakeABI,
      functionName: 'getEventsByCreator',
      args: [creatorAddress],
      watch: true,
    });
    
    return {
      events: data,
      isLoading: isPending,
      isError: !!error,
      refetch
    };
  };
  
  // Hook for getting events by status
  export const useGetEventsByStatus = (status) => {
    const { data, error, isPending, refetch } = useReadContract({
      address: STAKING,
      abi: StakeABI,
      functionName: 'getEventsByStatus',
      args: [status],
      watch: true,
    });
    
    return {
      events: data,
      isLoading: isPending,
      isError: !!error,
      refetch
    };
  };
  
  // Hook for getting events count
  export const useGetEventsCount = () => {
    const { data, error, isPending } = useReadContract({
      address: STAKING,
      abi: StakeABI,
      functionName: 'getEventsCount',
      watch: true,
    });
    
    return {
      count: data,
      isLoading: isPending,
      isError: !!error
    };
  };