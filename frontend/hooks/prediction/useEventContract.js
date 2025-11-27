import { useState, useEffect } from 'react';
import { useAccount, useContractRead, useContractWrite, usePrepareContractWrite } from 'wagmi';
import { ethers } from 'ethers';
import PVP_ABI from '../../src/deployedContract/abi/PVP_ABI.json';
import { useToken } from './useToken';

export const useEventContract = (eventAddress, tokenAddress, initialEventData) => {
  const { address } = useAccount();
  const pvpContractAddress = process.env.REACT_APP_PVP_CONTRACT_ADDRESS;
  
  const [eventData, setEventData] = useState(initialEventData || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pendingApproval, setPendingApproval] = useState(false);
  const [pendingStake, setPendingStake] = useState(false);

  // Token interactions using the updated useToken hook
  const { 
    balance: userBalance, 
    isApproved, 
    approve, 
    isApproving, 
    formatTokenAmount,
    refreshTokenData 
  } = useToken(tokenAddress);

  // Get event details directly from the event contract address
  // You'll need the Event Contract ABI for this
  const { data: rawEventData, refetch: refetchEventData } = useContractRead({
    address: eventAddress, // Use the event contract address directly
    abi: EVENT_CONTRACT_ABI, // You'll need to import the Event Contract ABI
    functionName: 'getEventDetails', // Or whatever function returns event details
    enabled: !!eventAddress,
    onSuccess: (data) => {
      if (data) {
        setEventData({
          address: eventAddress,
          question: data.question,
          description: data.description, 
          options: data.options || ["Yes", "No"],
          category: data.category,
          status: data.status,
          endTime: data.endTime,
          totalStaked: data.totalStaked,
          optionTotals: data.optionTotals || [ethers.BigNumber.from(0), ethers.BigNumber.from(0)],
          creatorFeePercentage: data.creatorFeePercentage || 0,
          statusMessage: getStatusMessage(data.status),
        });
      }
      setLoading(false);
    },
    onError: (err) => {
      setError(`Failed to load event data: ${err.message}`);
      setLoading(false);
    },
  });

  // If you don't have Event Contract ABI, you can try to get basic info from PVP contract
  // But this approach is limited since PVP contract only stores event addresses
  const { data: allEvents } = useContractRead({
    address: pvpContractAddress,
    abi: PVP_ABI,
    functionName: 'getAllEvents',
    enabled: !!pvpContractAddress && !eventAddress, // Only if no specific event address
  });

  // Get status message
  const getStatusMessage = (status) => {
    switch (status) {
      case 0: return 'Open';
      case 1: return 'Closed';
      case 2: return 'Completed';
      case 3: return 'Cancelled';
      default: return 'Unknown';
    }
  };

  // Calculate percentages
  const calculatePercentages = () => {
    if (!eventData?.optionTotals || eventData.optionTotals.length < 2) {
      return { yesPercentage: 50, noPercentage: 50 };
    }
    
    const yesTotal = parseFloat(formatTokenAmount(eventData.optionTotals[0]));
    const noTotal = parseFloat(formatTokenAmount(eventData.optionTotals[1]));
    const total = yesTotal + noTotal;
    
    if (total === 0) return { yesPercentage: 50, noPercentage: 50 };
    
    const yesPercentage = Math.round((yesTotal / total) * 100);
    const noPercentage = 100 - yesPercentage;
    
    return { yesPercentage, noPercentage };
  };

  // Calculate potential winnings
  const calculatePotentialWinnings = (selectedOption) => {
    if (!eventData?.optionTotals || eventData.optionTotals.length < 2) return 0;
    
    const { yesPercentage, noPercentage } = calculatePercentages();
    const creatorFee = (eventData.creatorFeePercentage || 0) / 100;
    
    if (selectedOption === 'yes') {
      return Math.round((noPercentage / (yesPercentage || 1)) * (1 - creatorFee) * 100);
    } else {
      return Math.round((yesPercentage / (noPercentage || 1)) * (1 - creatorFee) * 100);
    }
  };

  // Calculate total votes
  const calculateTotalVotes = (selectedOption) => {
    if (!eventData?.optionTotals || eventData.optionTotals.length < 2) return '0';
    const optionIndex = selectedOption === 'yes' ? 0 : 1;
    return formatTokenAmount(eventData.optionTotals[optionIndex]);
  };

  // Get time left
  const getTimeLeft = () => {
    if (!eventData?.endTime) return 'N/A';
    
    const endTime = new Date(eventData.endTime * 1000);  
    const now = new Date();
    const diff = endTime - now;
    
    if (diff <= 0) return 'Event ended';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${days}d ${hours}h ${minutes}m`;
  };

  // Check if event is still open for staking
  const isEventOpen = () => {
    return eventData?.status === 0 && new Date() < new Date(eventData.endTime * 1000);
  };

  // Combined approve and stake function
  const approveAndStake = async (option, amount) => {
    try {
      // Check if event is still open
      if (!isEventOpen()) {
        return { 
          success: false, 
          eventClosed: true,
          message: `Event is ${eventData?.statusMessage?.toLowerCase() || 'closed'}. Staking is no longer available.`
        };
      }

      const amountInWei = ethers.utils.parseUnits(amount.toString(), 18);
      
      // If not approved, approve first
      if (!isApproved) {
        setPendingApproval(true);
        await approve?.();
        
        return { 
          success: false, 
          needsConfirmation: true,
          message: "Approval transaction sent. Please wait for confirmation."
        };
      }
      
      // If approved, proceed with staking
      setPendingStake(true);
      
      // You'll need to call the stake function on the event contract, not PVP contract
      // This depends on your Event Contract ABI
      
      return { 
        success: false, 
        needsConfirmation: true,
        message: "Stake transaction sent"
      };
      
    } catch (err) {
      setPendingApproval(false);
      setPendingStake(false);
      setError(err.message);
      return { 
        success: false, 
        message: err.message || "Transaction failed"
      };
    }
  };

  // Clear error
  const clearError = () => setError(null);

  // Debug state
  const getDebugState = () => ({
    pvpContractAddress,
    eventAddress,
    tokenAddress,
    eventData,
    userBalance,
    isApproved,
    isApproving,
    pendingApproval,
    pendingStake,
    error,
    isEventOpen: isEventOpen(),
  });

  // Handle approval success
  useEffect(() => {
    if (pendingApproval && isApproved) {
      setPendingApproval(false);
    }
  }, [isApproved, pendingApproval]);

  // Initial data load
  useEffect(() => {
    if (eventAddress) {
      setLoading(true);
      refetchEventData();
    }
  }, [eventAddress]);

  return {
    eventData,
    userBalance,
    loading,
    error,
    isApproved,
    pendingApproval,
    pendingStake,
    isApprovalPending: isApproving,
    isApprovalSuccess: isApproved && !isApproving,
    approveAndStake,
    formatTokenAmount,
    getTimeLeft,
    calculatePercentages,
    calculatePotentialWinnings,
    calculateTotalVotes,
    clearError,
    getDebugState,
    isEventOpen,
  };
};

export default useEventContract;