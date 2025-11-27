import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt
} from 'wagmi';
import StakeABI from '../../src/deployedContract/abi/StakeABI.json';

// Contract address for the PVP stake contract
export const STAKING = import.meta.env.VITE_STAKING_ADDRESS;

// Category Management Hooks

export const useAddCategory = () => {
  const { writeContract, data: hash, isPending: isWritePending } = useWriteContract();

  const { isLoading: isTxLoading, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const addCategory = (name, description) => {
    writeContract({
      address: STAKING,
      abi: StakeABI,
      functionName: 'addCategory',
      args: [name, description]
    });
  };

  return {
    addCategory,
    isLoading: isWritePending || isTxLoading,
    isSuccess,
    txHash: hash
  };
};

export const useUpdateCategory = () => {
  const { writeContract, data: hash, isPending: isWritePending } = useWriteContract();

  const { isLoading: isTxLoading, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const updateCategory = (categoryId, name, description, active) => {
    writeContract({
      address: STAKING,
      abi: StakeABI,
      functionName: 'updateCategory',
      args: [categoryId, name, description, active]
    });
  };

  return {
    updateCategory,
    isLoading: isWritePending || isTxLoading,
    isSuccess,
    txHash: hash
  };
};

export const useGetAllCategories = () => {
  const { data, error, isPending, refetch } = useReadContract({
    address: STAKING,
    abi: StakeABI,
    functionName: 'getAllCategories',
    watch: true,
  });

  return {
    categories: data,
    isLoading: isPending,
    isError: !!error,
    refetch
  };
};

export const useGetCategory = (categoryId) => {
  const { data, error, isPending } = useReadContract({
    address: STAKING,
    abi: StakeABI,
    functionName: 'categories',
    args: [categoryId],
    watch: true,
  });

  return {
    category: data,
    isLoading: isPending,
    isError: !!error
  };
};

export const useGetCategoriesCount = () => {
  const { data, error, isPending } = useReadContract({
    address: STAKING,
    abi: StakeABI,
    functionName: 'getCategoriesCount',
    watch: true,
  });

  return {
    count: data,
    isLoading: isPending,
    isError: !!error
  };
};

// Event Management Hooks

export const useCreateEvent = () => {
  const { writeContract, data: hash, isPending: isWritePending } = useWriteContract();

  const { isLoading: isTxLoading, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const createEvent = (question, description, options, eventType, categoryId, eventImage, startTime, endTime, tokenAddress) => {
    writeContract({
      address: STAKING,
      abi: StakeABI,
      functionName: 'createEvent',
      args: [question, description, options, eventType, categoryId, eventImage, startTime, endTime, tokenAddress]
    });
  };

  return {
    createEvent,
    isLoading: isWritePending || isTxLoading,
    isSuccess,
    txHash: hash
  };
};

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

// Event Query Hooks

export const useGetAllEvents = () => {
  const { data, error, isPending, refetch } = useReadContract({
    address: STAKING,
    abi: StakeABI,
    functionName: 'getAllEvents',
    watch: true,
  });

  return {
    events: data,
    isLoading: isPending,
    isError: !!error,
    refetch
  };
};

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

// Token Management Hooks

export const useAddToken = () => {
  const { writeContract, data: hash, isPending: isWritePending } = useWriteContract();

  const { isLoading: isTxLoading, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const addToken = (tokenAddress) => {
    writeContract({
      address: STAKING,
      abi: StakeABI,
      functionName: 'addToken',
      args: [tokenAddress]
    });
  };

  return {
    addToken,
    isLoading: isWritePending || isTxLoading,
    isSuccess,
    txHash: hash
  };
};

export const useRemoveToken = () => {
  const { writeContract, data: hash, isPending: isWritePending } = useWriteContract();

  const { isLoading: isTxLoading, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const removeToken = (tokenAddress) => {
    writeContract({
      address: STAKING,
      abi: StakeABI,
      functionName: 'removeToken',
      args: [tokenAddress]
    });
  };

  return {
    removeToken,
    isLoading: isWritePending || isTxLoading,
    isSuccess,
    txHash: hash
  };
};

export const useIsTokenAllowed = (tokenAddress) => {
  const { data, error, isPending } = useReadContract({
    address: STAKING,
    abi: StakeABI,
    functionName: 'isTokenAllowed',
    args: [tokenAddress],
    watch: true,
  });

  return {
    isAllowed: data,
    isLoading: isPending,
    isError: !!error
  };
};

export const useGetAllowedTokensCount = () => {
  const { data, error, isPending } = useReadContract({
    address: STAKING,
    abi: StakeABI,
    functionName: 'getAllowedTokensCount',
    watch: true,
  });

  return {
    count: data,
    isLoading: isPending,
    isError: !!error
  };
};

// Configuration Hooks

export const useGetCreatorStakeAmount = () => {
  const { data, error, isPending } = useReadContract({
    address: STAKING,
    abi: StakeABI,
    functionName: 'creatorStakeAmount',
    watch: true,
  });

  return {
    amount: data,
    isLoading: isPending,
    isError: !!error
  };
};

export const useUpdateCreatorStakeAmount = () => {
  const { writeContract, data: hash, isPending: isWritePending } = useWriteContract();

  const { isLoading: isTxLoading, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const updateCreatorStakeAmount = (amount) => {
    writeContract({
      address: STAKING,
      abi: StakeABI,
      functionName: 'updateCreatorStakeAmount',
      args: [amount]
    });
  };

  return {
    updateCreatorStakeAmount,
    isLoading: isWritePending || isTxLoading,
    isSuccess,
    txHash: hash
  };
};

export const useGetDefaultCreatorFeePercentage = () => {
  const { data, error, isPending } = useReadContract({
    address: STAKING,
    abi: StakeABI,
    functionName: 'defaultCreatorFeePercentage',
    watch: true,
  });

  return {
    percentage: data,
    isLoading: isPending,
    isError: !!error
  };
};

export const useUpdateDefaultCreatorFee = () => {
  const { writeContract, data: hash, isPending: isWritePending } = useWriteContract();

  const { isLoading: isTxLoading, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const updateDefaultCreatorFee = (percentage) => {
    writeContract({
      address: STAKING,
      abi: StakeABI,
      functionName: 'updateDefaultCreatorFee',
      args: [percentage]
    });
  };

  return {
    updateDefaultCreatorFee,
    isLoading: isWritePending || isTxLoading,
    isSuccess,
    txHash: hash
  };
};

// Role Management Hooks

export const useHasRole = (role, account) => {
  const { data, error, isPending } = useReadContract({
    address: STAKING,
    abi: StakeABI,
    functionName: 'hasRole',
    args: [role, account],
    watch: true,
  });

  return {
    hasRole: data,
    isLoading: isPending,
    isError: !!error
  };
};

export const useGrantRole = () => {
  const { writeContract, data: hash, isPending: isWritePending } = useWriteContract();

  const { isLoading: isTxLoading, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const grantRole = (role, account) => {
    writeContract({
      address: STAKING,
      abi: StakeABI,
      functionName: 'grantRole',
      args: [role, account]
    });
  };

  return {
    grantRole,
    isLoading: isWritePending || isTxLoading,
    isSuccess,
    txHash: hash
  };
};

export const useRevokeRole = () => {
  const { writeContract, data: hash, isPending: isWritePending } = useWriteContract();

  const { isLoading: isTxLoading, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const revokeRole = (role, account) => {
    writeContract({
      address: STAKING,
      abi: StakeABI,
      functionName: 'revokeRole',
      args: [role, account]
    });
  };

  return {
    revokeRole,
    isLoading: isWritePending || isTxLoading,
    isSuccess,
    txHash: hash
  };
};

// Role constants
export const useRoleConstants = () => {
  const { data: adminRole } = useReadContract({
    address: STAKING,
    abi: StakeABI,
    functionName: 'ADMIN_ROLE',
  });

  const { data: defaultAdminRole } = useReadContract({
    address: STAKING,
    abi: StakeABI,
    functionName: 'DEFAULT_ADMIN_ROLE',
  });

  const { data: moderatorRole } = useReadContract({
    address: STAKING,
    abi: StakeABI,
    functionName: 'MODERATOR_ROLE',
  });

  return {
    ADMIN_ROLE: adminRole,
    DEFAULT_ADMIN_ROLE: defaultAdminRole,
    MODERATOR_ROLE: moderatorRole
  };
};