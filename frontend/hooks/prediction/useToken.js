import { useState, useEffect } from 'react';
import { useAccount, useContractRead, useContractWrite, usePrepareContractWrite } from 'wagmi';
import { ethers } from 'ethers';
import { ERC20_ABI } from '../../src/deployedContract/abi/ERC20_ABI';

export const useToken = (tokenAddress) => {
  const { address } = useAccount();
  const [allowance, setAllowance] = useState('0');
  const [balance, setBalance] = useState('0');
  const [isApproved, setIsApproved] = useState(false);

  const pvpContractAddress = process.env.REACT_APP_PVP_CONTRACT_ADDRESS;

  // Read token balance
  const { refetch: refetchBalance } = useContractRead({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [address],
    enabled: !!address && !!tokenAddress,
    onSuccess: (data) => {
      setBalance(data.toString());
    },
  });

  // Read token allowance
  const { refetch: refetchAllowance } = useContractRead({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [address, pvpContractAddress], 
    enabled: !!address && !!tokenAddress && !!pvpContractAddress,
    onSuccess: (data) => {
      const allowanceAmount = data.toString();
      setAllowance(allowanceAmount);
      // Check if allowance is greater than 0 (approved)
      setIsApproved(ethers.BigNumber.from(allowanceAmount).gt(0));
    },
  });

  // Prepare approval transaction
  const { config: approveConfig } = usePrepareContractWrite({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'approve',
    args: [pvpContractAddress, ethers.constants.MaxUint256], // Approve max amount
    enabled: !!tokenAddress && !!pvpContractAddress,
  });

  // Execute approval transaction
  const { write: approve, isLoading: isApproving } = useContractWrite({
    ...approveConfig,
    onSuccess: () => {
      // Refetch allowance after approval
      setTimeout(() => refetchAllowance(), 3000); // Wait for blockchain confirmation
    },
  });

  // Format token amount with decimals
  const formatTokenAmount = (amount, decimals = 18) => {
    if (!amount) return '0';
    try {
      return ethers.utils.formatUnits(amount, decimals);
    } catch (error) {
      console.error('Error formatting token amount:', error);
      return '0';
    }
  };

  // Refresh token data
  const refreshTokenData = () => {
    refetchBalance();
    refetchAllowance();
  };

  useEffect(() => {
    if (address && tokenAddress) {
      refreshTokenData();
    }
  }, [address, tokenAddress]);

  return {
    balance,
    allowance,
    isApproved,
    approve,
    isApproving,
    formatTokenAmount,
    refreshTokenData,
  };
};