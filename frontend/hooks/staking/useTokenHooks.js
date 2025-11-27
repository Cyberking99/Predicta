import { 
 
    usePrepareContractWrite,
    useReadContract,
    useWaitForTransaction,
    useWriteContract
  } from 'wagmi';
  import StakeABI  from '../../src/deployedContract/abi/StakeABI.json';
  
  // Contract address for the PVP stake contract
  export const STAKING = import.meta.env.VITE_STAKING_ADDRESS;
  
  // Hook for adding a token
  export const useAddToken = () => {
    const { config } = usePrepareContractWrite({
      address: STAKING,
      abi: StakeABI,
      functionName: 'addToken',
    });
    
    const { 
      data: tx, 
      write: add, 
      isLoading: isWriteLoading 
    } = useWriteContract(config);
    
    const { isLoading: isTxLoading, isSuccess } = useWaitForTransaction({
      hash: tx?.hash,
    });
    
    const addToken = (tokenAddress) => {
      if (!add) return;
      add({ args: [tokenAddress] });
    };
    
    return { 
      addToken, 
      isLoading: isWriteLoading || isTxLoading, 
      isSuccess,
      txHash: tx?.hash 
    };
  };
  
  // Hook for removing a token
  export const useRemoveToken = () => {
    const { config } = usePrepareContractWrite({
      address: STAKING,
      abi: StakeABI,
      functionName: 'removeToken',
    });
    
    const { 
      data: tx, 
      write: remove, 
      isLoading: isWriteLoading 
    } = useWriteContract(config);
    
    const { isLoading: isTxLoading, isSuccess } = useWaitForTransaction({
      hash: tx?.hash,
    });
    
    const removeToken = (tokenAddress) => {
      if (!remove) return;
      remove({ args: [tokenAddress] });
    };
    
    return { 
      removeToken, 
      isLoading: isWriteLoading || isTxLoading, 
      isSuccess,
      txHash: tx?.hash 
    };
  };
  
  // Hook to check if a token is allowed
  export const useIsTokenAllowed = (tokenAddress) => {
    const { data, isError, isLoading } = useReadContract({
      address: STAKING,
      abi: StakeABI,
      functionName: 'isTokenAllowed',
      args: [tokenAddress],
      watch: true,
    });
    
    return {
      isAllowed: data,
      isLoading,
      isError
    };
  };
  
  // Hook to get a specific allowed token by index
  export const useGetAllowedToken = (index) => {
    const { data, isError, isLoading } = useReadContract({
      address: STAKING,
      abi: StakeABI,
      functionName: 'allowedTokens',
      args: [index],
      watch: true,
    });
    
    return {
      tokenAddress: data,
      isLoading,
      isError
    };
  };
  
  // Hook to get the count of allowed tokens
  export const useGetAllowedTokensCount = () => {
    const { data, isError, isLoading } = useReadContract({
      address: STAKING,
      abi: StakeABI,
      functionName: 'getAllowedTokensCount',
      watch: true,
    });
    
    return {
      count: data,
      isLoading,
      isError
    };
  };
  
  // Hook to get the STIM token address
  export const useGetStimToken = () => {
    const { data, isError, isLoading } = useReadContract({
      address: STAKING,
      abi: ABI,
      functionName: 'stimToken',
    });
    
    return {
      stimToken: data,
      isLoading,
      isError
    };
  };