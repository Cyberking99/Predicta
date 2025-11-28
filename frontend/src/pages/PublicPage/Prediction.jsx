import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { celoSepolia } from "../../wagmi/config";
import { toast } from "react-toastify";
import USDT from "../../assets/images/pngs/usdt.png";
import USDC from "../../assets/images/svgs/USDC.svg";
import STIM from "../../assets/images/pngs/stim-coin.png";
import Close from "../../assets/images/svgs/x-close.svg";
import star from "../../assets/images/svgs/star.svg";
import PredictionCard from "../../components/ui/PredictionCard";
import usePrediction from "../../../hooks/staking/usePrediction";
import { CategoryIcon } from "../../utils/categoryIcons";

// Default token address
const DEFAULT_TOKEN_ADDRESS = import.meta.env.VITE_USDT_ADDRESS;

// Token configuration mapping
const TOKEN_CONFIG = {
  [import.meta.env.VITE_USDT_ADDRESS?.toLowerCase()]: {
    name: "USDT",
    symbol: "USDT",
    decimals: 18,
    icon: USDT,
  },
  [import.meta.env.VITE_USDC_ADDRESS?.toLowerCase()]: {
    name: "USDC",
    symbol: "USDC",
    decimals: 6,
    icon: USDC,
  },
};

const Prediction = () => {
  const [stake, setStake] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [error, setError] = useState(null);
  const [hasNavigated, setHasNavigated] = useState(false);

  // Ref for auto-scroll functionality
  const modalRef = useRef(null);
  const contentRef = useRef(null);

  const navigate = useNavigate();
  const { state } = useLocation();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  // Auto-switch to Celo Sepolia and enforce it
  useEffect(() => {
    const enforceNetwork = async () => {
      if (isConnected && chainId && chainId !== celoSepolia.id) {
        try {
          console.log("Wrong network detected. Requesting switch to Celo Sepolia...");
          await switchChain({ chainId: celoSepolia.id });
        } catch (error) {
          console.error("Failed to switch network:", error);
          toast.error("Please switch your wallet to Celo Sepolia to continue.");
        }
      }
    };

    enforceNetwork();
  }, [isConnected, chainId, switchChain]);



  // Extract data from location state with fallbacks
  const {
    betOption = "optionA",
    predictionId,
    eventAddress,
    eventData: initialEventData,
    question,
    options,
  } = state || {};

  // Calculate option value (0 for optionA, 1 for optionB)
  const optionValue = betOption === "optionA" ? 0 : 1;

  // ALWAYS call the usePrediction hook, even if eventAddress is missing
  const {
    eventData,
    userBalance,
    loading,
    error: contractError,
    isApproved,
    pendingApproval,
    pendingStake,
    isApprovalPending,
    isStakePending,
    isStakeSuccess,
    isApprovalSuccess,
    approveAndStake,
    formatTokenAmount,
    getTimeLeft,
    calculatePercentages,
    calculatePotentialWinnings,
    calculateTotalVotes,
    clearError,
    transactionComplete,
    navigationReady,
    resetTransactionState,
    transactionError,
    stakingError,
    stakingInProgress,
    lastStakeAmount,
    lastBetOption,
    refreshUserBalance,
    hasUserStaked,
    userStake,
    tokenConfig,
    checkIfApproved,
  } = usePrediction(
    eventAddress || "0x0000000000000000000000000000000000000000",
    DEFAULT_TOKEN_ADDRESS,
    initialEventData
  );

  // Auto-scroll functionality for mobile devices
  const scrollToBottom = useCallback(() => {
    if (modalRef.current) {
      const modal = modalRef.current;
      const scrollHeight = modal.scrollHeight;
      const clientHeight = modal.clientHeight;

      if (scrollHeight > clientHeight) {
        modal.scrollTo({
          top: scrollHeight - clientHeight,
          behavior: "smooth",
        });
      }
    }
  }, []);

  // Auto-scroll when status changes or content updates
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      scrollToBottom();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [statusMessage, error, stake, scrollToBottom]);

  // Auto-scroll when modal opens
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      scrollToBottom();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [scrollToBottom]);

  // Combine event data from hook with initial data if needed
  const displayEventData = useMemo(() => {
    const baseData = eventData ||
      initialEventData || {
      question: question || "Loading question...",
      options: options || { A: "Option A", B: "Option B" },
      category: { label: "Unknown", id: "0" },
      totalStaked: "0",
      end_time: new Date().toISOString(),
      status: 1,
      statusMessage: "Loading...",
    };

    // Ensure we always have proper options from the state or initial data
    if (options && typeof options === "object") {
      baseData.options = options;
    }

    console.log("Display Event Data:", baseData);
    return baseData;
  }, [eventData, initialEventData, question, options]);

  // Check if we have valid event address
  const hasValidEventAddress =
    eventAddress &&
    eventAddress !== "0x0000000000000000000000000000000000000000";

  // Check if user is trying to stake on opposing choice
  const isOpposingChoice = useCallback(() => {
    if (!hasUserStaked || !userStake) return false;

    const userPreviousOption = userStake.selectedOption;
    const currentOption = optionValue;

    return userPreviousOption !== currentOption;
  }, [hasUserStaked, userStake, optionValue]);

  // Get user's previous choice name for display
  const getUserPreviousChoiceName = useCallback(() => {
    if (!hasUserStaked || !userStake) return "";

    const userPreviousOption = userStake.selectedOption;
    if (userPreviousOption === 0) {
      return displayEventData.options?.A || "Option A";
    } else {
      return displayEventData.options?.B || "Option B";
    }
  }, [hasUserStaked, userStake, displayEventData.options]);

  // Get current choice name for display
  const getCurrentChoiceName = useCallback(() => {
    if (optionValue === 0) {
      return displayEventData.options?.A || "Option A";
    } else {
      return displayEventData.options?.B || "Option B";
    }
  }, [optionValue, displayEventData.options]);

  // Enhanced token amount formatter with DIRECT Wei conversion - Updated to handle event token address
  const formatTokenAmountWithDecimals = useCallback(
    (amount, isStake = false) => {
      if (!amount || amount === "0") return "0";

      try {
        // Get token address from event data passed via state
        const tokenAddress =
          eventData?.tokenAddress ||
          displayEventData?.tokenAddress ||
          DEFAULT_TOKEN_ADDRESS;
        const tokenAddr = tokenAddress.toLowerCase();
        const config = TOKEN_CONFIG[tokenAddr];
        const decimals = config?.decimals || 18;

        let actualAmount;
        const amountStr = amount.toString();

        // If it already contains a decimal point (already formatted)
        if (amountStr.includes(".")) {
          actualAmount = parseFloat(amountStr);
        } else {
          const amountNumber = Number(amountStr);

          // ALWAYS convert from Wei - no conditions
          actualAmount = amountNumber / Math.pow(10, decimals);
        }

        // For stake amounts or amounts less than 1, show more precision
        if (isStake || (actualAmount < 1 && actualAmount > 0)) {
          // Remove trailing zeros, show up to 8 decimal places for very small amounts
          return parseFloat(actualAmount.toFixed(8)).toString();
        }

        // For larger amounts, show 2 decimal places
        return actualAmount.toFixed(2);
      } catch (error) {
        console.error("Error formatting token amount:", error);
        return "0";
      }
    },
    [eventData?.tokenAddress, displayEventData?.tokenAddress]
  );

  // Helper function to properly format BigInt token amounts with correct decimals - Updated
  const formatBigIntBalance = useCallback(
    (balance) => {
      if (!balance) return "0.00";

      try {
        // Get token address from event data passed via state
        const tokenAddress =
          eventData?.tokenAddress ||
          displayEventData?.tokenAddress ||
          DEFAULT_TOKEN_ADDRESS;
        const tokenAddr = tokenAddress.toLowerCase();
        const config = TOKEN_CONFIG[tokenAddr];
        const decimals = config?.decimals || 18;

        const balanceStr = balance.toString();

        // If it already contains a decimal point, just format it
        if (balanceStr.includes(".")) {
          const num = parseFloat(balanceStr);
          return num < 1 && num > 0 ? num.toFixed(6) : num.toFixed(2);
        }

        // Convert BigInt/Wei to proper decimal format
        const actualBalance = Number(balanceStr) / Math.pow(10, decimals);

        // For very small amounts, show more decimal places
        if (actualBalance < 1 && actualBalance > 0) {
          return parseFloat(actualBalance.toFixed(6)).toString();
        }

        return actualBalance.toFixed(2);
      } catch (error) {
        console.error("Error formatting balance:", error);
        return "0.00";
      }
    },
    [eventData?.tokenAddress, displayEventData?.tokenAddress]
  );

  // Helper function to format volume with DIRECT Wei conversion - Updated
  const formatVolume = useCallback(
    (volume) => {
      if (!volume) return "0";

      try {
        // Get token address from event data passed via state
        const tokenAddress =
          eventData?.tokenAddress ||
          displayEventData?.tokenAddress ||
          DEFAULT_TOKEN_ADDRESS;
        const tokenAddr = tokenAddress.toLowerCase();
        const config = TOKEN_CONFIG[tokenAddr];
        const decimals = config?.decimals || 18;

        let actualVolume;
        const volumeStr = volume.toString();

        // If it already contains a decimal point
        if (volumeStr.includes(".")) {
          actualVolume = parseFloat(volumeStr);
        } else {
          const volumeNumber = Number(volumeStr);

          // ALWAYS convert from Wei - no conditions
          actualVolume = volumeNumber / Math.pow(10, decimals);
        }

        // Format with appropriate suffixes
        if (actualVolume >= 1000000) {
          return `${(actualVolume / 1000000).toFixed(1)}M`;
        } else if (actualVolume >= 1000) {
          return `${(actualVolume / 1000).toFixed(1)}K`;
        } else if (actualVolume >= 1) {
          return actualVolume.toFixed(2);
        } else if (actualVolume > 0) {
          // For very small amounts (like 0.0021), show more decimal places
          return parseFloat(actualVolume.toFixed(8)).toString();
        } else {
          return "0";
        }
      } catch (error) {
        console.error("Error formatting volume:", error);
        return "0";
      }
    },
    [eventData?.tokenAddress, displayEventData?.tokenAddress]
  );

  // Helper function to calculate vote count with proper option mapping
  const getVoteCount = useCallback(() => {
    try {
      const totalVotes = calculateTotalVotes && calculateTotalVotes(betOption);

      if (totalVotes > 1000000) {
        return Math.max(1, Math.floor(totalVotes / 1000000));
      }

      return Math.max(1, totalVotes || 1);
    } catch (error) {
      console.error("Error calculating vote count:", error);
      return 1;
    }
  }, [calculateTotalVotes, betOption]);

  // Local percentage calculation that works with optionA/optionB
  const getLocalPercentages = useCallback(() => {
    if (!eventData) return { yesPercentage: 50, noPercentage: 50 };

    try {
      const yesVotes = Number(eventData.yes_votes || 0);
      const noVotes = Number(eventData.no_votes || 0);
      const totalVotes = yesVotes + noVotes;

      if (totalVotes === 0) {
        return { yesPercentage: 50, noPercentage: 50 };
      }

      return {
        yesPercentage: Math.round((yesVotes / totalVotes) * 100),
        noPercentage: Math.round((noVotes / totalVotes) * 100),
      };
    } catch (error) {
      console.error("Error calculating percentages:", error);
      return { yesPercentage: 50, noPercentage: 50 };
    }
  }, [eventData]);

  // Force balance refresh utility
  const forceBalanceRefresh = useCallback(() => {
    const refreshEvents = [
      "refreshBalance",
      "refreshWalletBalance",
      "forceBalanceRefetch",
    ];

    refreshEvents.forEach((eventName) => {
      window.dispatchEvent(new CustomEvent(eventName));
    });

    if (refreshUserBalance) {
      refreshUserBalance();
    }

    localStorage.setItem("balanceNeedsRefresh", "true");
  }, [refreshUserBalance]);

  // SIMPLIFIED APPROVE AND STAKE FUNCTION - Clear two-step process
  const approveAndStakeOptimized = async (optionValue, amount) => {
    console.log("🚀 approveAndStakeOptimized called:", { optionValue, amount });
    try {
      if (!address) {
        setError("Please connect your wallet first");
        toast.error("Please connect your wallet first");
        return { success: false, message: "Please connect your wallet first" };
      }

      if (!amount || Number.parseFloat(amount) <= 0) {
        setError("Please enter a valid stake amount");
        toast.error("Please enter a valid stake amount");
        return { success: false, message: "Invalid stake amount" };
      }

      if (!eventAddress) {
        setError("Event address not found");
        toast.error("Event address not found");
        return { success: false, message: "Event address not found" };
      }

      // Check if user is trying to stake on opposing choice
      if (hasUserStaked && isOpposingChoice()) {
        const userPreviousChoice = getUserPreviousChoiceName();
        const currentChoice = getCurrentChoiceName();
        const errorMsg = `You cannot change your prediction. You previously staked on "${userPreviousChoice}" and cannot switch to "${currentChoice}".`;
        setError(errorMsg);
        toast.error(
          `Cannot switch from "${userPreviousChoice}" to "${currentChoice}"`
        );
        return { success: false, message: errorMsg };
      }

      // Check if event is open for betting
      if (
        !displayEventData.isOpenForBetting &&
        eventData &&
        !eventData.isOpenForBetting
      ) {
        let message = "Event is not accepting stakes";
        if (eventData.isPending) {
          message =
            "Event is still pending approval. Please wait for moderator approval.";
        } else if (eventData.isClosed || eventData.isCompleted) {
          message =
            "This event is closed for betting. Staking is no longer available.";
        } else if (eventData.isCancelled) {
          message = "This event has been cancelled.";
        } else if (eventData.isRejected) {
          message = "This event has been rejected.";
        } else if (eventData.isNullified) {
          message = "This event has been nullified.";
        } else if (eventData.hasEnded) {
          message = "Event has already ended. Staking is no longer available.";
        }
        setError(message);
        toast.error(message);
        return { success: false, message, eventClosed: true };
      }

      // Check balance
      const stakeAmount = Number.parseFloat(amount);
      const userBalanceFormatted = formatBigIntBalance(userBalance);

      if (stakeAmount > Number.parseFloat(userBalanceFormatted)) {
        const errorMsg = `Insufficient balance. You have ${userBalanceFormatted} ${tokenSymbol}`;
        setError(errorMsg);
        toast.error(errorMsg);
        return { success: false, message: errorMsg };
      }

      setError(null);
      setHasNavigated(false);
      resetTransactionState();

      // Check if approval is needed
      const needsApproval = !checkIfApproved(amount);

      if (needsApproval) {
        // Step 1: Handle Approval
        setStatusMessage("Requesting token approval...");

        try {
          // Simple approval - use exact amount to avoid over-approval issues
          const approvalResult = await approveAndStake(
            optionValue,
            amount,
            amount
          );

          if (approvalResult.success || approvalResult.needsConfirmation) {
            setStatusMessage(
              "Approval submitted! Button will update when confirmed."
            );
            toast.success(
              "Approval transaction submitted! Click the button again to stake after confirmation."
            );
            return { success: true, message: "Approval transaction submitted" };
          } else {
            setError(approvalResult.message || "Approval failed");
            toast.error(approvalResult.message || "Approval failed");
            return approvalResult;
          }
        } catch (approvalError) {
          console.error("Approval error:", approvalError);
          setError("Approval failed: " + approvalError.message);
          toast.error("Approval failed: " + approvalError.message);
          return { success: false, message: "Approval failed" };
        }
      } else {
        // Step 2: Handle Staking (approval already done)
        setStatusMessage("Placing your stake...");

        try {
          const result = await approveAndStake(optionValue, amount);

          if (result.success || result.needsConfirmation) {
            const message = hasUserStaked
              ? "Additional stake transaction submitted!"
              : "Stake transaction submitted!";
            toast.success(message);
            setStatusMessage("Stake submitted! Waiting for confirmation...");
          } else {
            setError(result.message || "Transaction failed");
            toast.error(result.message || "Transaction failed");
          }

          return result;
        } catch (stakeError) {
          console.error("Stake error:", stakeError);
          const errorMsg = `Stake failed: ${stakeError.message || "Unknown error"
            }`;
          setError(errorMsg);
          toast.error(errorMsg);
          return { success: false, message: errorMsg };
        }
      }
    } catch (err) {
      console.error("Transaction error:", err);
      const errorMsg = `Transaction failed: ${err.message || "Unknown error"}`;
      setError(errorMsg);
      toast.error(errorMsg);
      return { success: false, message: errorMsg };
    }
  };

  // Update local error from contract error
  useEffect(() => {
    if (contractError) {
      setError(
        contractError.message || "Failed to load event data from the blockchain"
      );
      clearError();
    }
  }, [contractError, clearError]);

  // Set loading timeout
  useEffect(() => {
    const timer = setTimeout(() => setLoadingTimeout(true), 10000);
    return () => clearTimeout(timer);
  }, []);

  // Navigation effect with balance refresh
  useEffect(() => {
    if (hasNavigated) return;

    if (navigationReady && transactionComplete) {
      if (isStakeSuccess && !transactionError && !stakingError) {
        setStatusMessage("Stake placed successfully! Refreshing balance...");
        setHasNavigated(true);

        toast.success("Stake placed successfully!");

        forceBalanceRefresh();

        setTimeout(() => {
          forceBalanceRefresh();
        }, 2000);

        setTimeout(() => {
          forceBalanceRefresh();
        }, 5000);

        setTimeout(() => {
          navigate("/prediction-success", {
            state: {
              betOption,
              stake: lastStakeAmount || stake,
              predictionId,
              question: displayEventData.question,
              timeLeft: getTimeLeft(),
              potentialWinnings: calculatePotentialWinnings(betOption),
              eventAddress,
              eventData: eventData || initialEventData,
              betSuccess: true,
              isAdditionalStake: hasUserStaked,
            },
            replace: true,
          });
        }, 1000);
      } else if (transactionError || stakingError) {
        setStatusMessage("Transaction failed! Please try again.");
        setError(transactionError || stakingError);
        toast.error(transactionError || stakingError || "Transaction failed");
        setHasNavigated(false);
        setTimeout(() => {
          resetTransactionState();
        }, 3000);
      }
    }
  }, [
    navigationReady,
    transactionComplete,
    isStakeSuccess,
    transactionError,
    stakingError,
    hasNavigated,
    navigate,
    betOption,
    stake,
    lastStakeAmount,
    predictionId,
    displayEventData.question,
    eventAddress,
    eventData,
    initialEventData,
    getTimeLeft,
    calculatePotentialWinnings,
    resetTransactionState,
    refreshUserBalance,
    hasUserStaked,
  ]);

  // Simplified status message updates
  useEffect(() => {
    if (hasNavigated) return;

    if (pendingApproval || isApprovalPending) {
      setStatusMessage("Confirming approval...");
    } else if (pendingStake || isStakePending) {
      setStatusMessage("Confirming stake...");
    } else if (isStakeSuccess && !navigationReady) {
      setStatusMessage("Stake successful! Redirecting...");
    } else if (transactionError || stakingError) {
      setStatusMessage("Transaction failed. Please try again.");
    } else if (
      !pendingApproval &&
      !pendingStake &&
      !isApprovalPending &&
      !isStakePending &&
      !isStakeSuccess
    ) {
      if (
        statusMessage &&
        !statusMessage.includes("Success") &&
        !statusMessage.includes("Redirect") &&
        !statusMessage.includes("failed")
      ) {
        setStatusMessage("");
      }
    }
  }, [
    pendingApproval,
    pendingStake,
    isApprovalPending,
    isStakePending,
    isStakeSuccess,
    navigationReady,
    transactionError,
    stakingError,
    statusMessage,
    hasNavigated,
  ]);

  // Handle UI interactions
  const handleClose = useCallback(() => {
    if (stakingInProgress || isStakePending || isApprovalPending) {
      toast.warning("Transaction in progress. Please wait...");
      return;
    }

    if (resetTransactionState) {
      resetTransactionState();
    }
    setHasNavigated(false);
    navigate("/predict");
  }, [
    stakingInProgress,
    isStakePending,
    isApprovalPending,
    resetTransactionState,
    navigate,
  ]);

  const handleStakeChange = useCallback((e) => {
    const value = e.target.value;
    if (/^\d*\.?\d*$/.test(value)) {
      setStake(value);
      setError(null);
    }
  }, []);

  // Enhanced processing state check
  const isProcessing =
    pendingApproval ||
    pendingStake ||
    isApprovalPending ||
    isStakePending ||
    stakingInProgress;
  const isTransactionComplete = transactionComplete && navigationReady;
  const hasTransactionError = transactionError || stakingError;

  // Clear button text logic that shows exactly what will happen when clicked
  const getOptimizedButtonText = () => {
    if (hasUserStaked && isOpposingChoice()) {
      return "Cannot Change Prediction";
    }

    if (hasUserStaked && !isOpposingChoice()) {
      if (isTransactionComplete) {
        if (isStakeSuccess && !hasTransactionError)
          return "Success! Redirecting...";
        if (hasTransactionError) return "Transaction Failed - Retry";
        return "Redirecting...";
      }

      if (isProcessing) {
        if (pendingApproval || isApprovalPending) return "Approving Tokens...";
        if (pendingStake || isStakePending) return "Adding to Stake...";
        return "Processing...";
      }

      if (eventData && !eventData.isOpenForBetting) {
        return "Event Closed";
      }

      // Check if approval is needed for additional stake
      if (stake && !checkIfApproved(stake)) {
        return "Approve Tokens";
      }

      return "Add to Stake";
    }

    // Original logic for users who haven't staked yet
    if (isTransactionComplete) {
      if (isStakeSuccess && !hasTransactionError)
        return "Success! Redirecting...";
      if (hasTransactionError) return "Transaction Failed - Retry";
      return "Redirecting...";
    }

    if (isProcessing) {
      if (pendingApproval || isApprovalPending) return "Approving Tokens...";
      if (pendingStake || isStakePending) return "Placing Stake...";
      return "Processing...";
    }

    if (eventData && !eventData.isOpenForBetting) {
      return "Event Closed";
    }

    // Check if approval is needed for new stake
    if (stake && !checkIfApproved(stake)) {
      return "Approve Tokens";
    }

    return "Place Stake";
  };

  // Enhanced continue button click handler
  const handleContinue = async () => {
    console.log("🖱️ handleContinue clicked");
    if (hasUserStaked && isOpposingChoice()) {
      const userPreviousChoice = getUserPreviousChoiceName();
      const currentChoice = getCurrentChoiceName();
      const errorMsg = `You cannot change your prediction. You previously staked on "${userPreviousChoice}" and cannot switch to "${currentChoice}".`;
      setError(errorMsg);
      toast.error(
        `Cannot switch from "${userPreviousChoice}" to "${currentChoice}"`
      );
      return;
    }

    if (
      isProcessing ||
      (isTransactionComplete && isStakeSuccess && !hasTransactionError)
    )
      return;

    await approveAndStakeOptimized(optionValue, stake);
  };

  // Enhanced button state logic
  const isEventClosed = eventData && !eventData.isOpenForBetting;
  const userBalanceFormatted = formatBigIntBalance(userBalance);
  const hasEnoughBalance =
    Number.parseFloat(stake || "0") <= Number.parseFloat(userBalanceFormatted);
  const isOpposingStake = hasUserStaked && isOpposingChoice();

  const canStake =
    hasValidEventAddress && // Check if we have a valid event address
    !isOpposingStake &&
    !isEventClosed &&
    hasEnoughBalance &&
    stake &&
    Number.parseFloat(stake) > 0 &&
    !isProcessing &&
    !(isTransactionComplete && isStakeSuccess && !hasTransactionError);

  // Get display balance
  const getDisplayBalance = useCallback(() => {
    if (!userBalance) return "0.00";

    if (lastStakeAmount && stakingInProgress) {
      const currentBalance = parseFloat(formatBigIntBalance(userBalance));
      const stakeAmountNum = parseFloat(lastStakeAmount);
      const projectedBalance = Math.max(0, currentBalance - stakeAmountNum);
      return projectedBalance.toFixed(2);
    }

    return formatBigIntBalance(userBalance);
  }, [userBalance, lastStakeAmount, stakingInProgress, formatBigIntBalance]);

  const isBalanceLoading = useCallback(() => {
    return lastStakeAmount && stakingInProgress;
  }, [lastStakeAmount, stakingInProgress]);

  // Get token symbol for display - Updated to properly handle event token address
  const tokenSymbol = useMemo(() => {
    // First try to get token address from event data passed via state
    const tokenAddress =
      eventData?.tokenAddress ||
      displayEventData?.tokenAddress ||
      DEFAULT_TOKEN_ADDRESS;

    if (!tokenAddress) return "USDT";

    const tokenAddr = tokenAddress.toLowerCase();
    const config = TOKEN_CONFIG[tokenAddr];

    return config ? config.symbol : "USDT";
  }, [eventData?.tokenAddress, displayEventData?.tokenAddress]);

  // Get token icon for display - Updated to properly handle event token address
  const getTokenIcon = useCallback(() => {
    // First try to get token address from event data passed via state
    const tokenAddress =
      eventData?.tokenAddress ||
      displayEventData?.tokenAddress ||
      DEFAULT_TOKEN_ADDRESS;

    if (!tokenAddress) return USDT;

    const tokenAddr = tokenAddress.toLowerCase();
    const config = TOKEN_CONFIG[tokenAddr];

    if (config) {
      return config.icon;
    }

    // Fallback for legacy addresses or unknown tokens
    return USDT;
  }, [eventData?.tokenAddress, displayEventData?.tokenAddress]);

  // Early return conditions - check for missing event address
  if (!hasValidEventAddress) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-60">
        <div className="w-full max-w-md bg-[#0B122E] rounded-[20px] border-2 border-[#18DDF7] p-6 text-center">
          <div className="text-red-500">
            <p className="mb-4">Invalid Event Address</p>
            <p className="mb-6 text-sm text-gray-400">
              No event address provided
            </p>
            <button
              className="px-4 py-2 bg-[#18DDF7] text-black rounded-full hover:bg-opacity-90"
              onClick={() => navigate("/predict")}
            >
              Go back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Display loading state
  if (loading && !displayEventData?.question) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-60">
        <div className="w-full max-w-md bg-[#0B122E] rounded-[20px] border-2 border-[#18DDF7] p-6 text-center">
          <div className="text-white">
            <div className="mb-4">
              <div className="w-12 h-12 rounded-full border-4 border-t-[#18DDF7] border-r-transparent border-b-transparent border-l-transparent animate-spin mx-auto mb-4"></div>
              <p>Loading prediction details...</p>
            </div>
            {loadingTimeout && (
              <div className="mt-6">
                <p className="mb-2 text-yellow-400">
                  Taking longer than expected
                </p>
                <button
                  className="px-4 py-2 bg-[#18DDF7] text-black rounded-full hover:bg-opacity-90"
                  onClick={() => navigate("/predict")}
                >
                  Go back
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Display error state if no event data
  if (!displayEventData?.question) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-60">
        <div className="w-full max-w-md bg-[#0B122E] rounded-[20px] border-2 border-[#18DDF7] p-6 text-center">
          <div className="text-red-500">
            <p className="mb-4">Error loading prediction</p>
            <p className="mb-6 text-sm text-gray-400">
              {error || "Event data could not be retrieved"}
            </p>
            <button
              className="px-4 py-2 bg-[#18DDF7] text-black rounded-full hover:bg-opacity-90"
              onClick={() => navigate("/predict")}
            >
              Go back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { yesPercentage, noPercentage } = getLocalPercentages();

  // Debug logging to see what we're getting
  console.log("Prediction Debug:", {
    betOption,
    optionValue,
    displayEventData: displayEventData.options,
    yesPercentage,
    noPercentage,
    tokenAddress: eventData?.tokenAddress || displayEventData?.tokenAddress,
    tokenSymbol: tokenSymbol,
    category: displayEventData.category,
  });

  // If connected but on wrong network, show blocking UI or warning
  if (isConnected && chainId && chainId !== celoSepolia.id) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-white bg-gray-900">
        <div className="p-8 text-center bg-gray-800 rounded-lg shadow-xl">
          <h2 className="mb-4 text-2xl font-bold text-red-500">Wrong Network</h2>
          <p className="mb-6">Please switch to Celo Sepolia to view predictions.</p>
          <button
            onClick={async () => {
              try {
                console.log("Manually switching to Celo Sepolia...", celoSepolia.id);
                await switchChain({ chainId: celoSepolia.id });
              } catch (error) {
                console.error("Manual switch failed:", error);
                toast.error(`Switch failed: ${error.message}`);
              }
            }}
            className="px-6 py-3 font-bold text-black transition-colors rounded-full bg-cyan-400 hover:bg-cyan-300"
          >
            Switch to Celo Sepolia
          </button>
        </div>
      </div>
    );
  }

  // Main UI
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-60">
      <div
        ref={modalRef}
        className="relative w-full max-w-md bg-[#0B122E] rounded-[20px] border-2 border-[#18DDF7] p-6 max-h-[90vh] overflow-y-auto"
      >
        <div ref={contentRef}>
          <div className="flex items-center justify-center mb-6">
            <h1 className="text-2xl font-bold text-white">
              {hasUserStaked && !isOpposingChoice()
                ? "Add to Your Bet"
                : "Place Your Bet"}
            </h1>
            <button
              className="absolute right-4 bg-[#1A1F3F] rounded-full p-2 hover:bg-opacity-80"
              onClick={handleClose}
              disabled={
                stakingInProgress || isStakePending || isApprovalPending
              }
            >
              <img src={Close || "/placeholder.svg"} alt="close" />
            </button>
          </div>

          {/* Show user's existing stake info */}
          {hasUserStaked && (
            <div
              className={`p-3 rounded-lg mb-4 text-center ${isOpposingChoice()
                ? "bg-red-900 bg-opacity-20 text-red-400 border border-red-500/30"
                : "bg-blue-900 bg-opacity-20 text-blue-400 border border-blue-500/30"
                }`}
            >
              <p className="font-medium">
                {isOpposingChoice()
                  ? "⚠️ Cannot change your prediction"
                  : "💰 Your existing stake"}
              </p>
              <p className="mt-1 text-sm">
                You have {formatTokenAmountWithDecimals(userStake.amount, true)}{" "}
                {tokenSymbol} staked on "{getUserPreviousChoiceName()}"
              </p>
              {isOpposingChoice() && (
                <p className="mt-2 text-xs text-red-300">
                  You cannot switch to "{getCurrentChoiceName()}". You can only
                  add more to your "{getUserPreviousChoiceName()}" stake.
                </p>
              )}
              {!isOpposingChoice() && (
                <p className="mt-2 text-xs text-blue-300">
                  You can add more to this stake below
                </p>
              )}
            </div>
          )}

          {isEventClosed && (
            <div className="p-3 mb-4 text-center text-red-400 bg-red-900 rounded-lg bg-opacity-20">
              {eventData.hasEnded
                ? "Event has ended. Staking is no longer available."
                : `This event is ${displayEventData.statusMessage?.toLowerCase() || "closed"
                }.`}
            </div>
          )}

          <PredictionCard
            categoryIcon={
              <div className="w-10 h-10 rounded-sm bg-[#01052D] flex items-center justify-center text-[#18DDF7]">
                <CategoryIcon
                  categoryName={displayEventData.category?.name}
                  categoryLabel={displayEventData.category?.label}
                  className="w-5 h-5"
                />
              </div>
            }
            question={displayEventData.question}
            yesPercentage={yesPercentage}
            noPercentage={noPercentage}
            votes={getVoteCount()}
            timeLeft={getTimeLeft()}
            showBorder={true}
            status={displayEventData.statusMessage}
            optionA={displayEventData.options?.A || "Option A"}
            optionB={displayEventData.options?.B || "Option B"}
          />

          <div className="mt-6 mb-4">
            <div className="flex justify-between">
              <label className="block mb-2 text-sm text-gray-400">
                {hasUserStaked && !isOpposingChoice()
                  ? "Additional Stake"
                  : "Stake"}
              </label>
              <span className="block mb-2 text-sm text-gray-400">
                Balance:{" "}
                <span
                  className={`${hasEnoughBalance ? "text-gray-300" : "text-red-400"
                    } ${isBalanceLoading() ? "text-yellow-400" : ""}`}
                >
                  {getDisplayBalance()} {tokenSymbol}
                  {isBalanceLoading() && " (pending)"}
                </span>
              </span>
            </div>
            <div className="relative">
              <input
                type="text"
                value={stake}
                onChange={handleStakeChange}
                placeholder={
                  isEventClosed
                    ? "Cannot stake"
                    : isOpposingStake
                      ? "Cannot change prediction"
                      : hasUserStaked
                        ? "Enter additional stake amount"
                        : "Enter stake amount"
                }
                className={`w-full p-3 bg-[#1A1F3F] text-white rounded-xl placeholder-gray-500 ${!hasEnoughBalance && stake ? "border border-red-500" : ""
                  } ${isEventClosed ||
                    isProcessing ||
                    isOpposingStake ||
                    (isTransactionComplete &&
                      isStakeSuccess &&
                      !hasTransactionError)
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                  }`}
                disabled={
                  isProcessing ||
                  isEventClosed ||
                  isOpposingStake ||
                  (isTransactionComplete &&
                    isStakeSuccess &&
                    !hasTransactionError)
                }
              />
              <div className="absolute flex items-center gap-2 transform -translate-y-1/2 right-3 top-1/2">
                <span className="text-gray-400">{tokenSymbol}</span>
                <img
                  src={getTokenIcon()}
                  alt={tokenSymbol}
                  className="w-6 h-6"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mb-6 text-sm">
            <div className="flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-[#00FFFF] to-[#27FE60]">
              <img src={getTokenIcon()} alt={tokenSymbol} className="w-4 h-4" />
              <span>{formatVolume(displayEventData.totalStaked)} Volume</span>
            </div>
            <div className="flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-[#00FFFF] to-[#27FE60]">
              <img src={star || "/placeholder.svg"} alt="star icon" />
              <span>
                {calculatePotentialWinnings(betOption)}% Potential Winnings
              </span>
            </div>
          </div>

          {/* Betting Selection Display */}
          <div className="bg-[#1A1F3F] p-3 rounded-xl mb-6 flex justify-between items-center">
            <div className="text-white">
              <span className="text-sm text-gray-400">
                {hasUserStaked && !isOpposingChoice()
                  ? "Adding to prediction:"
                  : "Your prediction:"}
              </span>
              <p className="font-semibold">
                {betOption === "optionA"
                  ? displayEventData.options?.A || "Option A"
                  : displayEventData.options?.B || "Option B"}
              </p>
            </div>
            <div
              className={`px-4 py-1 rounded-full ${betOption === "optionA"
                ? "bg-green-500/20 text-green-400"
                : "bg-red-500/20 text-red-400"
                } ${isOpposingStake ? "opacity-50" : ""}`}
            >
              {betOption === "optionA"
                ? displayEventData.options?.A || "Option A"
                : displayEventData.options?.B || "Option B"}
            </div>
          </div>

          <div className="mb-4">
            <button
              className={`w-full py-4 rounded-full font-semibold transition-colors ${!canStake
                ? "bg-[#1A1F3F] text-gray-400 cursor-not-allowed"
                : isStakeSuccess &&
                  isTransactionComplete &&
                  !hasTransactionError
                  ? "bg-green-600 text-white"
                  : hasTransactionError && isTransactionComplete
                    ? "bg-red-600 text-white hover:bg-red-500"
                    : isOpposingStake
                      ? "bg-red-600 text-white cursor-not-allowed"
                      : hasUserStaked && !isOpposingChoice()
                        ? "bg-blue-600 text-white hover:bg-blue-500"
                        : "bg-[#18DDF7] text-black hover:bg-opacity-90"
                }`}
              disabled={
                !canStake && !(hasTransactionError && isTransactionComplete)
              }
              onClick={handleContinue}
            >
              {getOptimizedButtonText()}
            </button>
          </div>

          {/* Status message display */}
          {(statusMessage || error) && (
            <div
              className={`text-center mb-4 p-3 rounded-lg ${error
                ? "bg-red-900 bg-opacity-20 text-red-500"
                : statusMessage.includes("Success") ||
                  statusMessage.includes("successful")
                  ? "bg-green-900 bg-opacity-20 text-green-500"
                  : statusMessage.includes("failed") ||
                    statusMessage.includes("Failed")
                    ? "bg-red-900 bg-opacity-20 text-red-500"
                    : statusMessage.includes("Refreshing")
                      ? "bg-blue-900 bg-opacity-20 text-blue-400"
                      : "bg-blue-900 bg-opacity-20 text-blue-400"
                }`}
            >
              {error || statusMessage}
            </div>
          )}

          {/* Show balance deduction info during staking */}
          {lastStakeAmount && stakingInProgress && (
            <div className="p-3 mb-4 border rounded-lg bg-yellow-500/10 border-yellow-500/30">
              <p className="text-sm text-center text-yellow-400">
                🔄 Processing {hasUserStaked ? "additional " : ""}stake of{" "}
                {lastStakeAmount} {tokenSymbol} on {lastBetOption}...
              </p>
              <p className="mt-1 text-xs text-center text-yellow-300">
                Balance will update after transaction confirms
              </p>
            </div>
          )}

          {/* Show guidance for users with existing stakes */}
          {hasUserStaked && !isOpposingChoice() && stake && (
            <div className="p-3 mb-4 border rounded-lg bg-blue-500/10 border-blue-500/30">
              <p className="text-sm text-center text-blue-400">
                💡 You're adding to your existing "{getUserPreviousChoiceName()}
                " stake
              </p>
              <p className="mt-1 text-xs text-center text-blue-300">
                Total stake will be:{" "}
                {formatTokenAmountWithDecimals(userStake.amount, true)} +{" "}
                {stake || "0"} ={" "}
                {userStake && stake
                  ? (
                    parseFloat(
                      formatTokenAmountWithDecimals(userStake.amount, true)
                    ) + parseFloat(stake || "0")
                  ).toString()
                  : formatTokenAmountWithDecimals(
                    userStake?.amount || 0,
                    true
                  )}{" "}
                {tokenSymbol}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Prediction;
