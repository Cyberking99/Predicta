import { useState, useEffect } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, useAccount, useReadContract } from 'wagmi';
import { toast } from 'react-toastify';

const CUSD_ADDRESS = import.meta.env.VITE_CUSD_ADDRESS;
const USDC_ADDRESS = import.meta.env.VITE_USDC_ADDRESS;

const StimEventContractABI = [
  {
    "type": "function",
    "name": "claimReward",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "claimNullificationRefund",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "claimCreatorStakeRefund",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "getUserStake",
    "inputs": [{ "name": "_user", "type": "address", "internalType": "address" }],
    "outputs": [
      { "name": "selectedOption", "type": "uint8", "internalType": "uint8" },
      { "name": "amount", "type": "uint256", "internalType": "uint256" },
      { "name": "claimed", "type": "bool", "internalType": "bool" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getEventDetails",
    "inputs": [],
    "outputs": [
      { "name": "question", "type": "string", "internalType": "string" },
      { "name": "description", "type": "string", "internalType": "string" },
      { "name": "options", "type": "string[]", "internalType": "string[]" },
      { "name": "eventType", "type": "string", "internalType": "string" },
      { "name": "category", "type": "string", "internalType": "string" },
      { "name": "eventImage", "type": "string", "internalType": "string" },
      { "name": "status", "type": "uint8", "internalType": "enum EventContract.EventStatus" },
      { "name": "endTime", "type": "uint256", "internalType": "uint256" },
      { "name": "winningOption", "type": "uint8", "internalType": "uint8" },
      { "name": "creator", "type": "address", "internalType": "address" },
      { "name": "tokenAddress", "type": "address", "internalType": "address" },
      { "name": "creatorStake", "type": "uint256", "internalType": "uint256" },
      { "name": "totalStaked", "type": "uint256", "internalType": "uint256" },
      { "name": "creatorFeePercentage", "type": "uint256", "internalType": "uint256" },
      { "name": "creatorRewardClaimed", "type": "bool", "internalType": "bool" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "eventDetails",
    "inputs": [],
    "outputs": [
      { "name": "question", "type": "string", "internalType": "string" },
      { "name": "description", "type": "string", "internalType": "string" },
      { "name": "eventType", "type": "string", "internalType": "string" },
      { "name": "category", "type": "string", "internalType": "string" },
      { "name": "eventImage", "type": "string", "internalType": "string" },
      { "name": "status", "type": "uint8", "internalType": "enum EventContract.EventStatus" },
      { "name": "endTime", "type": "uint256", "internalType": "uint256" },
      { "name": "winningOption", "type": "uint8", "internalType": "uint8" },
      { "name": "creator", "type": "address", "internalType": "address" },
      { "name": "tokenAddress", "type": "address", "internalType": "address" },
      { "name": "creatorStake", "type": "uint256", "internalType": "uint256" },
      { "name": "totalStaked", "type": "uint256", "internalType": "uint256" },
      { "name": "creatorFeePercentage", "type": "uint256", "internalType": "uint256" },
      { "name": "creatorRewardClaimed", "type": "bool", "internalType": "bool" },
      { "name": "nullificationReason", "type": "string", "internalType": "string" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getNullificationReason",
    "inputs": [],
    "outputs": [
      { "name": "", "type": "string", "internalType": "string" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getOptionTotals",
    "inputs": [],
    "outputs": [
      { "name": "", "type": "uint256[]", "internalType": "uint256[]" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "checkNullificationConditions",
    "inputs": [],
    "outputs": [
      { "name": "shouldNullify", "type": "bool", "internalType": "bool" },
      { "name": "reason", "type": "string", "internalType": "string" }
    ],
    "stateMutability": "view"
  }
];

export const useClaimReward = ({ eventAddress, onSuccess }) => {
  const { isConnected, address } = useAccount();
  const [isClaiming, setIsClaiming] = useState(false);
  const [isClaimingRefund, setIsClaimingRefund] = useState(false);
  const [isClaimingCreatorRefund, setIsClaimingCreatorRefund] = useState(false);
  const [validationError, setValidationError] = useState(null);
  const [claimType, setClaimType] = useState(null);
  const [processedEventDetails, setProcessedEventDetails] = useState(null);
  const [processedUserStakeData, setProcessedUserStakeData] = useState(null);

  const { data: fullEventDetails, refetch: refetchFullEventDetails } = useReadContract({
    abi: StimEventContractABI,
    address: eventAddress,
    functionName: 'getEventDetails',
    enabled: !!eventAddress,
  });

  const { data: rawEventDetails, refetch: refetchEventDetails } = useReadContract({
    abi: StimEventContractABI,
    address: eventAddress,
    functionName: 'eventDetails',
    enabled: !!eventAddress,
  });

  const { data: userStakeData, refetch: refetchUserStake } = useReadContract({
    abi: StimEventContractABI,
    address: eventAddress,
    functionName: 'getUserStake',
    args: [address],
    enabled: !!eventAddress && !!address,
  });

  const { data: nullificationReason, refetch: refetchNullificationReason } = useReadContract({
    abi: StimEventContractABI,
    address: eventAddress,
    functionName: 'getNullificationReason',
    enabled: !!eventAddress,
  });

  const { data: optionTotals, refetch: refetchOptionTotals } = useReadContract({
    abi: StimEventContractABI,
    address: eventAddress,
    functionName: 'getOptionTotals',
    enabled: !!eventAddress,
  });

  const { data: nullificationCheck, refetch: refetchNullificationCheck } = useReadContract({
    abi: StimEventContractABI,
    address: eventAddress,
    functionName: 'checkNullificationConditions',
    enabled: !!eventAddress,
  });

  const {
    data: hash,
    error,
    isPending,
    writeContract
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed
  } = useWaitForTransactionReceipt({
    hash,
  });

  // FIX: Enhanced formatAmount function that handles both CUSD and USDC
  const formatAmount = (amount, tokenAddress = null) => {
    console.log("🔍 formatAmount called with:", { amount, tokenAddress, type: typeof amount });

    if (!amount) return "0.00";

    try {
      let amountValue;
      if (typeof amount === 'bigint') {
        amountValue = amount;
      } else {
        amountValue = BigInt(amount.toString());
      }

      console.log("🔍 amountValue after conversion:", amountValue.toString());

      // FIX: Determine decimals based on token - UPDATED TO USE MAINNET ADDRESSES
      let decimals = 18; // Default for CUSD

      if (tokenAddress) {
        const tokenAddr = tokenAddress.toLowerCase();
        if (tokenAddr === USDC_ADDRESS.toLowerCase()) {
          decimals = 6; // USDC has 6 decimals
        }
      }

      console.log("🔍 Using decimals:", decimals);

      const divisor = BigInt(10 ** decimals);
      const wholePart = amountValue / divisor;
      const fractionalPart = amountValue % divisor;

      const fractionalStr = fractionalPart.toString().padStart(decimals, '0');
      const decimal = parseFloat(`${wholePart}.${fractionalStr}`);

      console.log("🔍 Final formatted amount:", decimal);

      return decimal.toFixed(2); // Always show 2 decimal places for display

    } catch (error) {
      console.error("❌ Error formatting amount:", error, "Amount:", amount);
      return "0.00";
    }
  };

  // FIX: Process event details with proper priority
  useEffect(() => {
    if (fullEventDetails || rawEventDetails) {
      console.log("🔍 Processing event details:", { fullEventDetails, rawEventDetails });

      let processedData = null;

      if (fullEventDetails && Array.isArray(fullEventDetails)) {
        console.log("✅ Using fullEventDetails (with options)");
        const [question, description, options, eventType, category, eventImage,
          status, endTime, winningOption, creator, tokenAddress,
          creatorStake, totalStaked, creatorFeePercentage, creatorRewardClaimed] = fullEventDetails;

        processedData = {
          question,
          description,
          options,
          eventType,
          category,
          eventImage,
          status,
          endTime,
          winningOption,
          creator,
          tokenAddress,
          creatorStake,
          totalStaked,
          creatorFeePercentage,
          creatorRewardClaimed,
          nullificationReason: nullificationReason || ""
        };
      }
      else if (rawEventDetails && Array.isArray(rawEventDetails)) {
        console.log("⚠️ Using rawEventDetails (fallback, no options)");
        const [question, description, eventType, category, eventImage,
          status, endTime, winningOption, creator, tokenAddress,
          creatorStake, totalStaked, creatorFeePercentage, creatorRewardClaimed, nullificationReason] = rawEventDetails;

        processedData = {
          question,
          description,
          eventType,
          category,
          eventImage,
          status,
          endTime,
          winningOption,
          creator,
          tokenAddress,
          creatorStake,
          totalStaked,
          creatorFeePercentage,
          creatorRewardClaimed,
          nullificationReason,
          options: ['Yes', 'No'] // Default fallback
        };
      } else if (fullEventDetails && typeof fullEventDetails === 'object') {
        processedData = fullEventDetails;
      } else if (rawEventDetails && typeof rawEventDetails === 'object') {
        processedData = rawEventDetails;
      }

      if (processedData) {
        console.log("✅ Processed event details:", processedData);
        setProcessedEventDetails(processedData);
      }
    }
  }, [fullEventDetails, rawEventDetails, nullificationReason]);

  // FIX: Process user stake data into object format
  useEffect(() => {
    if (userStakeData && Array.isArray(userStakeData)) {
      console.log("🔍 Processing user stake data:", userStakeData);
      const [selectedOption, amount, claimed] = userStakeData;

      const processedStakeData = {
        selectedOption: Number(selectedOption),
        amount: amount,
        claimed: claimed
      };

      console.log("✅ Processed user stake data:", processedStakeData);
      setProcessedUserStakeData(processedStakeData);
    }
  }, [userStakeData]);

  const eventDetails = processedEventDetails;

  const getEventStatusInfo = (status) => {
    const statusMap = {
      0: { name: "Pending Approval", canClaim: false, canRefund: false },
      1: { name: "Ongoing (Open for betting)", canClaim: false, canRefund: false },
      2: { name: "Completed", canClaim: true, canRefund: false },
      3: { name: "Cancelled", canClaim: false, canRefund: true },
      4: { name: "Rejected", canClaim: false, canRefund: true },
      5: { name: "Nullified", canClaim: false, canRefund: true }
    };

    return statusMap[Number(status)] || { name: "Unknown", canClaim: false, canRefund: false };
  };

  // FIX: Enhanced token symbol detection - UPDATED TO USE MAINNET ADDRESSES
  const getTokenSymbol = () => {
    if (!eventDetails?.tokenAddress) {
      console.log("⚠️ No token address found, defaulting to CUSD");
      return 'CUSD';
    }

    const tokenAddress = eventDetails.tokenAddress.toLowerCase();
    console.log("🔍 Checking token address:", tokenAddress);

    if (tokenAddress === USDC_ADDRESS.toLowerCase()) {
      console.log("✅ Token is USDC");
      return 'USDC';
    } else if (tokenAddress === CUSD_ADDRESS.toLowerCase()) {
      console.log("✅ Token is CUSD");
      return 'CUSD';
    }

    console.log("⚠️ Unknown token, defaulting to CUSD");
    return 'CUSD';
  };

  const validateRewardClaimEligibility = () => {
    if (!isConnected) {
      return { canClaim: false, reason: "Please connect your wallet first" };
    }

    if (!eventAddress) {
      return { canClaim: false, reason: "Event address not found" };
    }

    if (!processedUserStakeData) {
      return { canClaim: false, reason: "Loading user stake data..." };
    }

    if (!eventDetails) {
      return { canClaim: false, reason: "Loading event details..." };
    }

    const { selectedOption, amount, claimed } = processedUserStakeData;
    const statusInfo = getEventStatusInfo(eventDetails.status);

    if (!amount || amount === 0n) {
      return { canClaim: false, reason: "You haven't placed a stake on this event" };
    }

    if (claimed) {
      return { canClaim: false, reason: "Reward already claimed" };
    }

    if (!statusInfo.canClaim) {
      return {
        canClaim: false,
        reason: `Cannot claim rewards. Event status: ${statusInfo.name}`
      };
    }

    if (Number(selectedOption) !== Number(eventDetails.winningOption)) {
      return {
        canClaim: false,
        reason: `You didn't win. Your bet: Option ${selectedOption}, Winning option: ${eventDetails.winningOption}`
      };
    }

    if (optionTotals && optionTotals.length > 0) {
      const winningOptionTotal = optionTotals[Number(eventDetails.winningOption)];
      if (!winningOptionTotal || winningOptionTotal === 0n) {
        return {
          canClaim: false,
          reason: "No valid winning stakes found for this option"
        };
      }
    }

    return { canClaim: true, reason: null };
  };

  const validateRefundEligibility = () => {
    if (!isConnected) {
      return { canRefund: false, reason: "Please connect your wallet first" };
    }

    if (!eventAddress) {
      return { canRefund: false, reason: "Event address not found" };
    }

    if (!processedUserStakeData) {
      return { canRefund: false, reason: "Loading user stake data..." };
    }

    if (!eventDetails) {
      return { canRefund: false, reason: "Loading event details..." };
    }

    const { selectedOption, amount, claimed } = processedUserStakeData;
    const statusInfo = getEventStatusInfo(eventDetails.status);

    if (!amount || amount === 0n) {
      return { canRefund: false, reason: "You haven't placed a stake on this event" };
    }

    if (claimed) {
      return { canRefund: false, reason: "Refund already claimed" };
    }

    if (!statusInfo.canRefund) {
      return {
        canRefund: false,
        reason: `Cannot claim refund. Event status: ${statusInfo.name}`
      };
    }

    return { canRefund: true, reason: null };
  };

  const validateCreatorRefundEligibility = () => {
    if (!isConnected) {
      return { canRefund: false, reason: "Please connect your wallet first" };
    }

    if (!address) {
      return { canRefund: false, reason: "Wallet address not available" };
    }

    if (!eventDetails) {
      return { canRefund: false, reason: "Loading event details..." };
    }

    if (!eventDetails.creator) {
      console.warn("⚠️ Event creator is undefined:", eventDetails);
      return { canRefund: false, reason: "Event creator information not available" };
    }

    const statusInfo = getEventStatusInfo(eventDetails.status);

    let isCreator = false;
    try {
      isCreator = address.toLowerCase() === eventDetails.creator.toLowerCase();
    } catch (error) {
      console.error("❌ Error comparing creator addresses:", error);
      return { canRefund: false, reason: "Error validating creator status" };
    }

    if (!isCreator) {
      return { canRefund: false, reason: "Only the event creator can claim creator refund" };
    }

    if (!statusInfo.canRefund) {
      return { canRefund: false, reason: `Creator refund not available. Event status: ${statusInfo.name}` };
    }

    if (eventDetails.creatorRewardClaimed) {
      return { canRefund: false, reason: "Creator refund already claimed" };
    }

    return { canRefund: true, reason: null };
  };

  // FIX: Enhanced winnings calculation with proper token handling
  const calculateExpectedWinnings = () => {
    if (!processedUserStakeData || !eventDetails || !optionTotals) {
      console.log("❌ Missing data for winnings calculation");
      return "0.00";
    }

    const { selectedOption, amount, claimed } = processedUserStakeData;

    console.log("🔍 Calculating winnings:", {
      selectedOption,
      amount: amount?.toString(),
      winningOption: eventDetails.winningOption,
      eventStatus: eventDetails.status,
      tokenAddress: eventDetails.tokenAddress
    });

    // For nullified events, return full stake
    if (Number(eventDetails.status) === 5) {
      const refundAmount = formatAmount(amount, eventDetails.tokenAddress);
      console.log("💰 Nullified event refund:", refundAmount);
      return refundAmount;
    }

    // Only calculate winnings if user won and event is completed
    if (Number(eventDetails.status) !== 2 || Number(selectedOption) !== Number(eventDetails.winningOption)) {
      console.log("❌ User didn't win or event not completed");
      return "0.00";
    }

    const userStakeAmount = amount;
    const winningOptionTotal = optionTotals[Number(eventDetails.winningOption)];

    if (!winningOptionTotal || winningOptionTotal === 0n) {
      console.log("❌ No winning option total found");
      return "0.00";
    }

    console.log("🔍 Winnings calculation data:", {
      userStakeAmount: userStakeAmount.toString(),
      winningOptionTotal: winningOptionTotal.toString(),
      totalStaked: eventDetails.totalStaked.toString(),
      creatorFeePercentage: eventDetails.creatorFeePercentage
    });

    // Calculate the net pool after creator fee
    const creatorFee = (eventDetails.totalStaked * BigInt(eventDetails.creatorFeePercentage)) / 10000n;
    const netPool = eventDetails.totalStaked - creatorFee;

    // Calculate user's share of the winning pool
    const userWinnings = (userStakeAmount * netPool) / winningOptionTotal;

    console.log("💰 Calculated winnings:", {
      creatorFee: creatorFee.toString(),
      netPool: netPool.toString(),
      userWinnings: userWinnings.toString()
    });

    // FIX: Use token address for proper formatting
    const formattedWinnings = formatAmount(userWinnings, eventDetails.tokenAddress);
    console.log("✅ Final formatted winnings:", formattedWinnings);

    return formattedWinnings;
  };

  // FIX: Enhanced refund calculation with token handling
  const calculateRefundAmount = () => {
    if (!processedUserStakeData) return "0.00";

    const { amount } = processedUserStakeData;
    const refundAmount = formatAmount(amount, eventDetails?.tokenAddress);

    console.log("💰 Calculated refund amount:", refundAmount);
    return refundAmount;
  };

  // FIX: Enhanced creator refund calculation with token handling
  const calculateCreatorRefundAmount = () => {
    if (!eventDetails) return "0.00";

    const creatorRefundAmount = formatAmount(eventDetails.creatorStake, eventDetails.tokenAddress);
    console.log("👑 Calculated creator refund amount:", creatorRefundAmount);

    return creatorRefundAmount;
  };

  const refreshAllData = async () => {
    await Promise.all([
      refetchUserStake?.(),
      refetchEventDetails?.(),
      refetchFullEventDetails?.(),
      refetchOptionTotals?.(),
      refetchNullificationReason?.(),
      refetchNullificationCheck?.()
    ]);
  };

  const handleTransactionError = (error) => {
    let errorMessage = "Transaction failed. Please try again.";

    if (error?.message?.includes("User rejected")) {
      errorMessage = "Transaction was rejected by user";
    } else if (error?.message?.includes("insufficient funds")) {
      errorMessage = "Insufficient ETH for gas fee";
    } else if (error?.message?.includes("execution reverted")) {
      errorMessage = "Transaction reverted by smart contract";

      const revertReason = error.message.toLowerCase();
      if (revertReason.includes("already claimed")) {
        errorMessage += " - Already claimed";
      } else if (revertReason.includes("not winner") || revertReason.includes("did not win")) {
        errorMessage += " - You did not win this event";
      } else if (revertReason.includes("not completed")) {
        errorMessage += " - Event not completed yet";
      } else if (revertReason.includes("no stake")) {
        errorMessage += " - No stake found for this user";
      } else if (revertReason.includes("not nullified")) {
        errorMessage += " - Event is not nullified";
      } else if (revertReason.includes("not creator")) {
        errorMessage += " - Only creator can claim this refund";
      }
    } else if (error?.shortMessage) {
      errorMessage = error.shortMessage;
    }

    toast.error(errorMessage);
    setValidationError(errorMessage);
  };

  const claimReward = async () => {
    try {
      console.log("🏆 Starting claim reward process...");

      await refreshAllData();
      await new Promise(resolve => setTimeout(resolve, 1000));

      const validation = validateRewardClaimEligibility();

      if (!validation.canClaim) {
        console.log("❌ Reward claim validation failed:", validation.reason);
        toast.error(validation.reason);
        setValidationError(validation.reason);
        return;
      }

      console.log("✅ Reward claim validation passed");
      setValidationError(null);
      setIsClaiming(true);
      setClaimType('reward');

      const expectedWinnings = calculateExpectedWinnings();
      const tokenSymbol = getTokenSymbol();
      toast.info(`Claiming ${expectedWinnings} ${tokenSymbol} tokens...`);

      console.log("📞 Calling claimReward on contract:", eventAddress);

      await writeContract({
        abi: StimEventContractABI,
        address: eventAddress,
        functionName: 'claimReward',
      });

      console.log("✅ Reward claim transaction submitted");

    } catch (error) {
      console.error("❌ Error claiming reward:", error);
      handleTransactionError(error);
      setIsClaiming(false);
      setClaimType(null);
    }
  };

  const claimRefund = async () => {
    try {
      console.log("💰 Starting claim refund process...");

      await refreshAllData();
      await new Promise(resolve => setTimeout(resolve, 1000));

      const validation = validateRefundEligibility();

      if (!validation.canRefund) {
        console.log("❌ Refund claim validation failed:", validation.reason);
        toast.error(validation.reason);
        setValidationError(validation.reason);
        return;
      }

      console.log("✅ Refund claim validation passed");
      setValidationError(null);
      setIsClaimingRefund(true);
      setClaimType('refund');

      const refundAmount = calculateRefundAmount();
      const tokenSymbol = getTokenSymbol();
      toast.info(`Claiming refund of ${refundAmount} ${tokenSymbol} tokens...`);

      console.log("📞 Calling claimNullificationRefund on contract:", eventAddress);

      await writeContract({
        abi: StimEventContractABI,
        address: eventAddress,
        functionName: 'claimNullificationRefund',
      });

      console.log("✅ Refund claim transaction submitted");

    } catch (error) {
      console.error("❌ Error claiming refund:", error);
      handleTransactionError(error);
      setIsClaimingRefund(false);
      setClaimType(null);
    }
  };

  const claimCreatorRefund = async () => {
    try {
      console.log("👑 Starting claim creator refund process...");

      await refreshAllData();
      await new Promise(resolve => setTimeout(resolve, 1000));

      const validation = validateCreatorRefundEligibility();

      if (!validation.canRefund) {
        console.log("❌ Creator refund claim validation failed:", validation.reason);
        toast.error(validation.reason);
        setValidationError(validation.reason);
        return;
      }

      console.log("✅ Creator refund claim validation passed");
      setValidationError(null);
      setIsClaimingCreatorRefund(true);
      setClaimType('creator-refund');

      const creatorRefundAmount = calculateCreatorRefundAmount();
      const tokenSymbol = getTokenSymbol();
      toast.info(`Claiming creator refund of ${creatorRefundAmount} ${tokenSymbol} tokens...`);

      console.log("📞 Calling claimCreatorStakeRefund on contract:", eventAddress);

      await writeContract({
        abi: StimEventContractABI,
        address: eventAddress,
        functionName: 'claimCreatorStakeRefund',
      });

      console.log("✅ Creator refund claim transaction submitted");

    } catch (error) {
      console.error("❌ Error claiming creator refund:", error);
      handleTransactionError(error);
      setIsClaimingCreatorRefund(false);
      setClaimType(null);
    }
  };

  useEffect(() => {
    if (isConfirming && (isClaiming || isClaimingRefund || isClaimingCreatorRefund)) {
      console.log("⏳ Transaction is being confirmed...");
      toast.info("Transaction is being confirmed...");
    }

    if (isConfirmed && (isClaiming || isClaimingRefund || isClaimingCreatorRefund)) {
      console.log("🎉 Transaction completed successfully!");

      let successMessage = "";
      let amount = "";
      const tokenSymbol = getTokenSymbol();

      if (claimType === 'reward') {
        amount = calculateExpectedWinnings();
        successMessage = `Successfully claimed ${amount} ${tokenSymbol} tokens!`;
      } else if (claimType === 'refund') {
        amount = calculateRefundAmount();
        successMessage = `Successfully claimed refund of ${amount} ${tokenSymbol} tokens!`;
      } else if (claimType === 'creator-refund') {
        amount = calculateCreatorRefundAmount();
        successMessage = `Successfully claimed creator refund of ${amount} ${tokenSymbol} tokens!`;
      }

      toast.success(successMessage);

      setIsClaiming(false);
      setIsClaimingRefund(false);
      setIsClaimingCreatorRefund(false);
      setClaimType(null);
      setValidationError(null);

      // Trigger balance refresh
      setTimeout(() => {
        console.log("🔄 Triggering balance refresh after successful claim");
        refreshAllData();

        window.dispatchEvent(new Event('refreshWalletBalance'));
        window.dispatchEvent(new Event('refreshBalance'));
        window.dispatchEvent(new Event('forceBalanceRefetch'));
        window.dispatchEvent(new Event('stakeSuccess'));

        localStorage.setItem('balanceNeedsRefresh', 'true');

        toast.info("Wallet balance will be updated shortly...", {
          position: "bottom-center",
          autoClose: 3000
        });
      }, 2000);

      if (onSuccess) onSuccess();
    }

    if (error && (isClaiming || isClaimingRefund || isClaimingCreatorRefund)) {
      console.error("❌ Transaction failed:", error);
      handleTransactionError(error);
      setIsClaiming(false);
      setIsClaimingRefund(false);
      setIsClaimingCreatorRefund(false);
      setClaimType(null);
    }
  }, [isConfirming, isConfirmed, error, isClaiming, isClaimingRefund, isClaimingCreatorRefund, claimType, onSuccess]);

  // Run validation when data changes
  useEffect(() => {
    if (processedUserStakeData && eventDetails) {
      const rewardValidation = validateRewardClaimEligibility();
      const refundValidation = validateRefundEligibility();
      const creatorRefundValidation = validateCreatorRefundEligibility();

      // Set validation error only if no option is available
      if (!rewardValidation.canClaim && !refundValidation.canRefund && !creatorRefundValidation.canRefund) {
        setValidationError(rewardValidation.reason || refundValidation.reason || creatorRefundValidation.reason);
      } else {
        setValidationError(null);
      }
    }
  }, [processedUserStakeData, eventDetails, optionTotals, nullificationReason, address]);

  return {
    // Main functions
    claimReward,
    claimRefund,
    claimCreatorRefund,

    // State indicators
    isClaiming: isClaiming || (isPending && claimType === 'reward') || (isConfirming && claimType === 'reward'),
    isClaimingRefund: isClaimingRefund || (isPending && claimType === 'refund') || (isConfirming && claimType === 'refund'),
    isClaimingCreatorRefund: isClaimingCreatorRefund || (isPending && claimType === 'creator-refund') || (isConfirming && claimType === 'creator-refund'),

    isSuccess: isConfirmed,
    error: error,
    validationError,
    claimType,

    // Validation results
    canClaimReward: validateRewardClaimEligibility().canClaim,
    canClaimRefund: validateRefundEligibility().canRefund,
    canClaimCreatorRefund: validateCreatorRefundEligibility().canRefund,

    // Return processed data instead of raw data
    userStakeData: processedUserStakeData,
    eventDetails: eventDetails,
    optionTotals,
    nullificationReason,
    nullificationCheck,

    // Calculated amounts
    expectedWinnings: calculateExpectedWinnings(),
    refundAmount: calculateRefundAmount(),
    creatorRefundAmount: calculateCreatorRefundAmount(),

    // Helper functions
    getEventStatusInfo: (status) => getEventStatusInfo(status),
    getTokenSymbol,
    refreshAllData,
    formatAmount, // Export the enhanced formatAmount function
  };
};