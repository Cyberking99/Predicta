import {
  usePrepareContractWrite,
  useReadContract,
  useWaitForTransaction,
  useWriteContract
} from 'wagmi';
import StakeABI from '../../src/deployedContract/abi/StakeABI.json';

// Contract address for the PVP stake contract
export const STAKING = import.meta.env.VITE_STAKING_ADDRESS;

// ==================== ROLE MANAGEMENT HOOKS ====================

// Hook for checking if an account has a role
export const useHasRole = (role, account) => {
  const { data, isError, isLoading } = useReadContract({
    address: STAKING,
    abi: StakeABI,
    functionName: 'hasRole',
    args: [role, account],
    watch: true,
  });

  return {
    hasRole: data,
    isLoading,
    isError
  };
};

// Hook for getting role constants
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

// Hook for granting a role
export const useGrantRole = () => {
  const { config } = usePrepareContractWrite({
    address: STAKING,
    abi: StakeABI,
    functionName: 'grantRole',
  });

  const {
    data: tx,
    write: grant,
    isLoading: isWriteLoading
  } = useWriteContract(config);

  const { isLoading: isTxLoading, isSuccess } = useWaitForTransaction({
    hash: tx?.hash,
  });

  const grantRole = (role, account) => {
    if (!grant) return;
    grant({ args: [role, account] });
  };

  return {
    grantRole,
    isLoading: isWriteLoading || isTxLoading,
    isSuccess,
    txHash: tx?.hash
  };
};

// Hook for revoking a role
export const useRevokeRole = () => {
  const { config } = usePrepareContractWrite({
    address: STAKING,
    abi: StakeABI,
    functionName: 'revokeRole',
  });

  const {
    data: tx,
    write: revoke,
    isLoading: isWriteLoading
  } = useWriteContract(config);

  const { isLoading: isTxLoading, isSuccess } = useWaitForTransaction({
    hash: tx?.hash,
  });

  const revokeRole = (role, account) => {
    if (!revoke) return;
    revoke({ args: [role, account] });
  };

  return {
    revokeRole,
    isLoading: isWriteLoading || isTxLoading,
    isSuccess,
    txHash: tx?.hash
  };
};

// Hook for renouncing a role
export const useRenounceRole = () => {
  const { config } = usePrepareContractWrite({
    address: STAKING,
    abi: StakeABI,
    functionName: 'renounceRole',
  });

  const {
    data: tx,
    write: renounce,
    isLoading: isWriteLoading
  } = useWriteContract(config);

  const { isLoading: isTxLoading, isSuccess } = useWaitForTransaction({
    hash: tx?.hash,
  });

  const renounceRole = (role, callerConfirmation) => {
    if (!renounce) return;
    renounce({ args: [role, callerConfirmation] });
  };

  return {
    renounceRole,
    isLoading: isWriteLoading || isTxLoading,
    isSuccess,
    txHash: tx?.hash
  };
};

// ==================== CONFIGURATION HOOKS ====================

// Hook for updating creator stake amount
export const useUpdateCreatorStakeAmount = () => {
  const { config } = usePrepareContractWrite({
    address: STAKING,
    abi: StakeABI,
    functionName: 'updateCreatorStakeAmount',
  });

  const {
    data: tx,
    write: update,
    isLoading: isWriteLoading
  } = useWriteContract(config);

  const { isLoading: isTxLoading, isSuccess } = useWaitForTransaction({
    hash: tx?.hash,
  });

  const updateStakeAmount = (amount) => {
    if (!update) return;
    update({ args: [amount] });
  };

  return {
    updateStakeAmount,
    isLoading: isWriteLoading || isTxLoading,
    isSuccess,
    txHash: tx?.hash
  };
};

// Hook for updating default creator fee
export const useUpdateDefaultCreatorFee = () => {
  const { config } = usePrepareContractWrite({
    address: STAKING,
    abi: StakeABI,
    functionName: 'updateDefaultCreatorFee',
  });

  const {
    data: tx,
    write: update,
    isLoading: isWriteLoading
  } = useWriteContract(config);

  const { isLoading: isTxLoading, isSuccess } = useWaitForTransaction({
    hash: tx?.hash,
  });

  const updateFee = (percentage) => {
    if (!update) return;
    update({ args: [percentage] });
  };

  return {
    updateFee,
    isLoading: isWriteLoading || isTxLoading,
    isSuccess,
    txHash: tx?.hash
  };
};

// Hook to get current creator stake amount
export const useCreatorStakeAmount = () => {
  const { data, isError, isLoading } = useReadContract({
    address: STAKING,
    abi: StakeABI,
    functionName: 'creatorStakeAmount',
    watch: true,
  });

  return {
    stakeAmount: data,
    isLoading,
    isError
  };
};

// Hook to get default creator fee percentage
export const useDefaultCreatorFeePercentage = () => {
  const { data, isError, isLoading } = useReadContract({
    address: STAKING,
    abi: StakeABI,
    functionName: 'defaultCreatorFeePercentage',
    watch: true,
  });

  return {
    feePercentage: data,
    isLoading,
    isError
  };
};

// Hook to get the event implementation address
export const useEventImplementation = () => {
  const { data, isError, isLoading } = useReadContract({
    address: STAKING,
    abi: StakeABI,
    functionName: 'eventImplementation',
  });

  return {
    implementationAddress: data,
    isLoading,
    isError
  };
};