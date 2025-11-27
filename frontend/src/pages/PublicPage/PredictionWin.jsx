"use client";

import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAccount, useBalance, useReadContract } from "wagmi";
import { readContract } from "wagmi/actions";
import { config } from "../../wagmi/config";
import { toast } from "react-toastify";
import { celoAlfajores } from "wagmi/chains";
import { useClaimReward } from "../../../hooks/staking/useClaimReward";
import { isAddress } from "viem";

// Import your existing assets
import Up from "../../assets/images/svgs/up.svg";
import Down from "../../assets/images/svgs/down.svg";
import Success from "../../assets/images/svgs/success.svg";
import Close from "../../assets/images/svgs/x-close.svg";

// Import the ABIs
import StimEventContractABI from "../../deployedContract/abi/StimEventContract.json";
import FactoryABI from "../../deployedContract/abi/Preden.json";

const USDT_ADDRESS = import.meta.env.VITE_USDT_ADDRESS;
const USDC_ADDRESS = import.meta.env.VITE_USDC_ADDRESS;

const EnhancedPredictionWin = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { id } = useParams();
  const [isRewardClaimed, setIsRewardClaimed] = useState(false);
  const [eventData, setEventData] = useState(null);
  const [userStakeData, setUserStakeData] = useState(null);
  const [isCheckingRewards, setIsCheckingRewards] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [fallbackToDirectClaim, setFallbackToDirectClaim] = useState(false);

  const { address } = useAccount();
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 2000;
  const FACTORY_ADDRESS = import.meta.env.VITE_FACTORY_ADDRESS;

  // Enhanced logic to get contract address from multiple sources
  const getContractAddress = () => {
    if (id && isAddress(id)) {
      console.log("✅ Got address from URL params (id):", id);
      return id;
    }

    if (state?.eventAddress && isAddress(state.eventAddress)) {
      console.log("✅ Got address from navigation state:", state.eventAddress);
      return state.eventAddress;
    }

    if (
      state?.notification?.eventAddress &&
      isAddress(state.notification.eventAddress)
    ) {
      console.log(
        "✅ Got address from notification:",
        state.notification.eventAddress
      );
      return state.notification.eventAddress;
    }

    console.log("❌ No valid event address found");
    return null;
  };

  const contractAddress = getContractAddress();

  // Get all events from factory for reward detection (only when no specific event is targeted)
  const { data: allEvents } = useReadContract({
    abi: FactoryABI,
    address: FACTORY_ADDRESS,
    functionName: "getAllEvents",
    enabled: !!address && !contractAddress, // Only fetch when no specific contract address
  });

  // Prioritize getEventDetails (matches AllBets logic)
  const {
    data: fullEventDetails,
    error: fullEventDetailsError,
    refetch: refetchFullEventDetails,
  } = useReadContract({
    abi: StimEventContractABI,
    address: contractAddress,
    functionName: "getEventDetails",
    enabled: !!contractAddress && isAddress(contractAddress),
    retry: (failureCount) => failureCount < 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Fallback to eventDetails if getEventDetails fails
  const {
    data: fetchedEventDetails,
    error: eventDetailsError,
    refetch: refetchEventDetails,
  } = useReadContract({
    abi: StimEventContractABI,
    address: contractAddress,
    functionName: "eventDetails",
    enabled:
      !!contractAddress && isAddress(contractAddress) && !fullEventDetails,
    retry: (failureCount) => failureCount < 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const {
    data: fetchedUserStake,
    error: userStakeError,
    refetch: refetchUserStake,
  } = useReadContract({
    abi: StimEventContractABI,
    address: contractAddress,
    functionName: "getUserStake",
    args: [address],
    enabled: !!contractAddress && !!address && isAddress(contractAddress),
    retry: (failureCount) => failureCount < 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const {
    data: fetchedOptionTotals,
    error: optionTotalsError,
    refetch: refetchOptionTotals,
  } = useReadContract({
    abi: StimEventContractABI,
    address: contractAddress,
    functionName: "getOptionTotals",
    enabled: !!contractAddress && isAddress(contractAddress),
    retry: (failureCount) => failureCount < 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Read nullification reason
  const { data: nullificationReason, refetch: refetchNullificationReason } =
    useReadContract({
      abi: StimEventContractABI,
      address: contractAddress,
      functionName: "getNullificationReason",
      enabled: !!contractAddress && isAddress(contractAddress),
    });

  // Initialize the enhanced claim reward hook
  const {
    claimReward,
    claimRefund,
    claimCreatorRefund,
    isClaiming,
    isClaimingRefund,
    isClaimingCreatorRefund,
    isSuccess,
    error,
    canClaimReward,
    canClaimRefund,
    canClaimCreatorRefund,
    expectedWinnings,
    refundAmount,
    creatorRefundAmount,
    eventDetails: hookEventDetails,
    userStakeData: hookUserStakeData,
    getEventStatusInfo,
    refreshAllData,
    formatAmount,
  } = useClaimReward({
    eventAddress: contractAddress,
    onSuccess: () => {
      setIsRewardClaimed(true);

      setTimeout(() => {
        window.dispatchEvent(new Event("refreshWalletBalance"));
        window.dispatchEvent(new Event("refreshBalance"));
        localStorage.setItem("balanceNeedsRefresh", "true");
        toast.success("Balance will be updated shortly...");
      }, 2000);

      // Navigate back to stakes after successful claim
      setTimeout(() => navigate("/stake"), 3000);
    },
  });

  // Get current STIM balance
  const { data: stimBalanceData } = useBalance({
    address: address,
    token: USDT_ADDRESS,
    chainId: celoAlfajores.id,
    enabled: !!address,
    refetchInterval: 30000,
  });

  // Add USDC balance support
  const { data: usdcBalanceData } = useBalance({
    address: address,
    token: USDC_ADDRESS,
    chainId: celoAlfajores.id,
    enabled: !!address,
    refetchInterval: 30000,
  });

  // Auto-retry logic
  const autoRetryDataFetch = async () => {
    if (retryCount >= MAX_RETRIES) {
      setFallbackToDirectClaim(true);
      return;
    }

    setIsRetrying(true);
    setRetryCount((prev) => prev + 1);

    try {
      await new Promise((resolve) =>
        setTimeout(resolve, RETRY_DELAY * Math.pow(2, retryCount))
      );

      const retryPromises = [];
      if (eventDetailsError && refetchEventDetails) {
        retryPromises.push(refetchEventDetails());
      }
      if (fullEventDetailsError && refetchFullEventDetails) {
        retryPromises.push(refetchFullEventDetails());
      }
      if (userStakeError && refetchUserStake) {
        retryPromises.push(refetchUserStake());
      }
      if (optionTotalsError && refetchOptionTotals) {
        retryPromises.push(refetchOptionTotals());
      }

      await Promise.allSettled(retryPromises);
    } catch (error) {
      console.error("❌ Auto-retry failed:", error);
    } finally {
      setIsRetrying(false);
    }
  };

  // Trigger auto-retry on errors
  useEffect(() => {
    const hasErrors =
      eventDetailsError ||
      fullEventDetailsError ||
      userStakeError ||
      optionTotalsError;
    const hasData =
      fetchedEventDetails ||
      fullEventDetails ||
      fetchedUserStake ||
      fetchedOptionTotals;

    if (hasErrors && !hasData && !isRetrying && retryCount < MAX_RETRIES) {
      const retryTimer = setTimeout(() => {
        autoRetryDataFetch();
      }, 1000);

      return () => clearTimeout(retryTimer);
    }
  }, [
    eventDetailsError,
    fullEventDetailsError,
    userStakeError,
    optionTotalsError,
    fetchedEventDetails,
    fullEventDetails,
    fetchedUserStake,
    fetchedOptionTotals,
    isRetrying,
    retryCount,
  ]);

  // Event claimable checking (only when no specific contract address)
  const checkEventClaimable = async (eventAddress) => {
    if (!address || !eventAddress) return false;

    try {
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), 5000)
      );

      const userStakePromise = readContract(config, {
        abi: StimEventContractABI,
        address: eventAddress,
        functionName: "getUserStake",
        args: [address],
      });

      const userStakeData = await Promise.race([userStakePromise, timeout]);
      if (!userStakeData) return false;

      const [selectedOption, amount, claimed] = userStakeData;
      if (!amount || amount === 0n || claimed) return false;

      const eventDetailsPromise = readContract(config, {
        abi: StimEventContractABI,
        address: eventAddress,
        functionName: "eventDetails",
      });

      const eventDetails = await Promise.race([eventDetailsPromise, timeout]);
      if (!eventDetails) return false;

      const status = Number(eventDetails[5]);
      const winningOption = Number(eventDetails[7]);
      const selectedOptionNum = Number(selectedOption);
      const creator = eventDetails[8];

      const isCreator =
        creator && address && address.toLowerCase() === creator.toLowerCase();

      const isCompleted = status === 2;
      const isNullified = status === 5;
      const isCancelled = status === 3;
      const isRejected = status === 4;

      const userWon = isCompleted && selectedOptionNum === winningOption;
      const canClaimRefund =
        (isNullified || isCancelled || isRejected) && !claimed;
      const canClaimCreatorRefund =
        (isNullified || isCancelled || isRejected) &&
        isCreator &&
        !eventDetails[13];

      return userWon || canClaimRefund || canClaimCreatorRefund;
    } catch (error) {
      console.error(`❌ Error checking event ${eventAddress}:`, error.message);
      return false;
    }
  };

  // Reward detection (only when no specific contract address)
  useEffect(() => {
    const checkAllEventsForRewards = async () => {
      // Skip reward detection if we have a specific contract address
      if (contractAddress || !allEvents || !address || allEvents.length === 0) {
        return;
      }

      setIsCheckingRewards(true);
      const claimableEventAddresses = [];

      try {
        const batchSize = 3;
        for (let i = 0; i < allEvents.length; i += batchSize) {
          const batch = allEvents.slice(i, i + batchSize);

          const batchPromises = batch.map(async (eventAddress) => {
            try {
              const hasClaimableReward = await checkEventClaimable(
                eventAddress
              );
              return hasClaimableReward ? eventAddress : null;
            } catch (error) {
              return null;
            }
          });

          const batchResults = await Promise.all(batchPromises);
          const claimableFromBatch = batchResults.filter(Boolean);
          claimableEventAddresses.push(...claimableFromBatch);

          if (i + batchSize < allEvents.length) {
            await new Promise((resolve) => setTimeout(resolve, 500));
          }
        }

        console.log(
          `🎯 Found ${claimableEventAddresses.length} claimable rewards`
        );
      } catch (error) {
        console.error("❌ Error checking events:", error);
      } finally {
        setIsCheckingRewards(false);
      }
    };

    checkAllEventsForRewards();
  }, [allEvents, address, contractAddress]);

  // Process fetched data
  useEffect(() => {
    if (fetchedEventDetails) {
      console.log("📋 Processing fetched event details:", fetchedEventDetails);

      let processedData;
      if (Array.isArray(fetchedEventDetails)) {
        const [
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
        ] = fetchedEventDetails;

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
          options: ["Yes", "No"],
        };

        if (contractAddress) {
          readContract(config, {
            abi: StimEventContractABI,
            address: contractAddress,
            functionName: "getEventDetails",
          })
            .then((fullDetails) => {
              if (fullDetails && fullDetails[2]) {
                setEventData((prev) => ({
                  ...prev,
                  options: fullDetails[2],
                }));
              }
            })
            .catch((error) => {
              console.warn(
                "Could not fetch options from getEventDetails:",
                error
              );
            });
        }
      } else {
        processedData = fetchedEventDetails;
      }

      setEventData(processedData);
    }
  }, [fetchedEventDetails, contractAddress]);

  useEffect(() => {
    if (fetchedUserStake) {
      console.log("🔍 Processing fetched user stake:", fetchedUserStake);
      const [selectedOption, amount, claimed] = fetchedUserStake;

      setUserStakeData({
        selectedOption: Number(selectedOption),
        amount: amount,
        claimed,
      });
    }
  }, [fetchedUserStake]);

  const handleClose = () => navigate(-1);

  useEffect(() => {
    if (state?.notification?.claimed || userStakeData?.claimed) {
      setIsRewardClaimed(true);
    }
  }, [state?.notification, userStakeData]);

  const handleClaimWinnings = async () => {
    if (!contractAddress) {
      toast.error("Event address not found");
      return;
    }
    if (userStakeData?.claimed || isRewardClaimed) {
      toast.info("Winnings already claimed!");
      return;
    }
    await claimReward();
  };

  const handleClaimRefund = async () => {
    if (!contractAddress) {
      toast.error("Event address not found");
      return;
    }
    if (userStakeData?.claimed || isRewardClaimed) {
      toast.info("Refund already claimed!");
      return;
    }
    await claimRefund();
  };

  const handleClaimCreatorRefund = async () => {
    if (!contractAddress) {
      toast.error("Event address not found");
      return;
    }
    await claimCreatorRefund();
  };

  const formatBalance = (balance) => {
    if (!balance) return "0.00";
    return parseFloat(balance.formatted).toFixed(4);
  };

  // Enhanced getTokenInfo function
  const getTokenInfo = (currentEventData) => {
    console.log(
      "🔍 Getting token info for event:",
      currentEventData?.tokenAddress
    );

    if (!currentEventData?.tokenAddress) {
      console.log("⚠️ No token address, defaulting to USDT");
      return {
        symbol: "USDT",
        balanceData: stimBalanceData,
        tokenAddress: USDT_ADDRESS,
      };
    }

    const tokenAddress = currentEventData.tokenAddress.toLowerCase();

    if (tokenAddress === USDC_ADDRESS.toLowerCase()) {
      console.log("✅ Event uses USDC");
      return {
        symbol: "USDC",
        balanceData: usdcBalanceData,
        tokenAddress: USDC_ADDRESS,
      };
    } else if (tokenAddress === USDT_ADDRESS.toLowerCase()) {
      console.log("✅ Event uses USDT");
      return {
        symbol: "USDT",
        balanceData: stimBalanceData,
        tokenAddress: USDT_ADDRESS,
      };
    }

    console.log("⚠️ Unknown token, defaulting to USDT");
    return {
      symbol: "USDT",
      balanceData: stimBalanceData,
      tokenAddress: USDT_ADDRESS,
    };
  };

  // Use hook data when available, fallback to fetched data
  const currentEventData = hookEventDetails || eventData;
  const currentUserStakeData = hookUserStakeData || userStakeData;

  // Get event status information
  const statusInfo = currentEventData
    ? getEventStatusInfo(currentEventData.status)
    : null;

  // Get token information
  const tokenInfo = getTokenInfo(currentEventData);

  // Show checking state with progress (only when no specific contract address)
  if (!contractAddress && isCheckingRewards) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-[#141827]">
        <div className="relative w-full bg-[#0B122E] h-full rounded-t-[20px] border-t border-[#18DDF7] mt-20 sm:mt-32 md:mt-40 pt-6 px-4 overflow-y-auto">
          <button
            className="absolute right-4 top-4 bg-[#1A1F3F] rounded-full p-2 hover:bg-opacity-80"
            onClick={handleClose}
          >
            <img
              src={Close || "/placeholder.svg"}
              alt="close"
              className="w-5 h-5"
            />
          </button>

          <div className="flex flex-col items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#18DDF7] mb-4"></div>
            <p className="mb-2 text-lg text-white">Checking for rewards...</p>
            <p className="text-sm text-gray-400">
              Scanning {allEvents?.length || 0} events
            </p>
          </div>
        </div>
      </div>
    );
  }

  // No rewards message (only when no specific contract address)
  if (!contractAddress && !isCheckingRewards) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-[#141827]">
        <div className="relative w-full bg-[#0B122E] h-full rounded-t-[20px] border-t border-[#18DDF7] mt-20 sm:mt-32 md:mt-40 pt-6 px-4 overflow-y-auto">
          <button
            className="absolute right-4 top-4 bg-[#1A1F3F] rounded-full p-2 hover:bg-opacity-80"
            onClick={handleClose}
          >
            <img
              src={Close || "/placeholder.svg"}
              alt="close"
              className="w-5 h-5"
            />
          </button>

          <div className="flex flex-col items-center justify-center h-full">
            <div className="mb-6 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-[#18DDF7] to-[#195281] rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-white"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 7V9C15 10.1 15.9 11 17 11V20C17 21.1 16.1 22 15 22H9C7.9 22 7 21.1 7 20V11C8.1 11 9 10.1 9 9V7H3V9C3 10.1 3.9 11 5 11V20C5 21.1 5.9 22 7 22H17C18.1 22 19 21.1 19 20V11C20.1 11 21 10.1 21 9Z" />
                </svg>
              </div>
              <p className="mb-2 text-xl text-white">All Caught Up!</p>
              <p className="mb-1 text-sm text-gray-400">
                You don't have any rewards to claim right now.
              </p>
              <p className="text-sm text-gray-400">
                Keep making predictions to earn more rewards!
              </p>
            </div>

            <div className="w-full max-w-sm space-y-3">
              <button
                onClick={() => navigate("/stake")}
                className="w-full py-3 px-6 bg-[#18DDF7] text-black rounded-full font-semibold hover:bg-opacity-90 transition-opacity"
              >
                Make New Prediction
              </button>
              <button
                onClick={() => navigate("/profile")}
                className="w-full py-2 px-6 bg-transparent border border-[#18DDF7] text-[#18DDF7] rounded-full font-semibold hover:bg-[#18DDF7] hover:text-black transition-colors"
              >
                View Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Invalid address handling
  if (!contractAddress || !isAddress(contractAddress)) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-[#141827]">
        <div className="relative w-full bg-[#0B122E] h-full rounded-t-[20px] border-t border-[#18DDF7] mt-20 sm:mt-32 md:mt-40 pt-6 px-4 overflow-y-auto">
          <button
            className="absolute right-4 top-4 bg-[#1A1F3F] rounded-full p-2 hover:bg-opacity-80"
            onClick={handleClose}
          >
            <img
              src={Close || "/placeholder.svg"}
              alt="close"
              className="w-5 h-5"
            />
          </button>

          <div className="flex flex-col items-center justify-center h-full max-w-md mx-auto">
            <div className="mb-6 text-center">
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-500/20">
                <svg
                  className="w-8 h-8 text-yellow-400"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 7V9C15 10.1 15.9 11 17 11V20C17 21.1 16.1 22 15 22H9C7.9 22 7 21.1 7 20V11C8.1 11 9 10.1 9 9V7H3V9C3 10.1 3.9 11 5 11V20C5 21.1 5.9 22 7 22H17C18.1 22 19 21.1 19 20V11C20.1 11 21 10.1 21 9Z" />
                </svg>
              </div>
              <p className="mb-2 text-lg text-white">Event Not Found</p>
              <p className="text-sm text-gray-400">
                We couldn't find the event you're looking for.
              </p>
            </div>

            <div className="w-full space-y-3">
              <button
                onClick={() => navigate("/stake")}
                className="w-full py-3 px-6 bg-[#18DDF7] text-black rounded-full font-semibold"
              >
                Back to Predictions
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show loading with retry feedback
  if ((!currentEventData || !currentUserStakeData) && !fallbackToDirectClaim) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-[#141827]">
        <div className="relative w-full bg-[#0B122E] h-full rounded-t-[20px] border-t border-[#18DDF7] mt-20 sm:mt-32 md:mt-40 pt-6 px-4 overflow-y-auto">
          <button
            className="absolute right-4 top-4 bg-[#1A1F3F] rounded-full p-2 hover:bg-opacity-80"
            onClick={handleClose}
          >
            <img
              src={Close || "/placeholder.svg"}
              alt="close"
              className="w-5 h-5"
            />
          </button>

          <div className="flex flex-col items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#18DDF7] mb-4"></div>
            <p className="mb-2 text-lg text-white">Loading your reward...</p>

            {isRetrying && (
              <div className="text-center">
                <p className="text-sm text-gray-400">
                  Attempting to reconnect...
                </p>
                <p className="text-xs text-gray-500">
                  Retry {retryCount}/{MAX_RETRIES}
                </p>
              </div>
            )}

            {!isRetrying && (
              <p className="text-sm text-gray-400">Please wait a moment</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Fallback UI for persistent issues
  if (fallbackToDirectClaim) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-[#141827]">
        <div className="relative w-full bg-[#0B122E] h-full rounded-t-[20px] border-t border-[#18DDF7] mt-20 sm:mt-32 md:mt-40 pt-6 px-4 overflow-y-auto">
          <button
            className="absolute right-4 top-4 bg-[#1A1F3F] rounded-full p-2 hover:bg-opacity-80"
            onClick={handleClose}
          >
            <img
              src={Close || "/placeholder.svg"}
              alt="close"
              className="w-5 h-5"
            />
          </button>

          <div className="flex flex-col items-center justify-center h-full max-w-md mx-auto">
            <div className="mb-6 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-[#18DDF7] to-[#195281] rounded-full flex items-center justify-center mx-auto mb-4">
                <img
                  src={Success || "/placeholder.svg"}
                  alt="Success"
                  className="w-8 h-8"
                />
              </div>
              <p className="mb-2 text-xl text-white">Claim Your Reward</p>
              <p className="mb-4 text-sm text-gray-400">
                We're having trouble loading event details, but you can still
                claim your reward!
              </p>
            </div>

            <div className="w-full space-y-3">
              <button
                onClick={handleClaimWinnings}
                disabled={isClaiming}
                className="w-full py-3 px-6 bg-[#18DDF7] text-black rounded-full font-semibold hover:bg-opacity-90 transition-opacity disabled:opacity-50"
              >
                {isClaiming ? "Claiming..." : "Claim Reward"}
              </button>

              <button
                onClick={() => navigate("/stake")}
                className="w-full py-2 px-6 bg-transparent border border-[#18DDF7] text-[#18DDF7] rounded-full font-semibold hover:bg-[#18DDF7] hover:text-black transition-colors"
              >
                Back to Predictions
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Check if no action is available
  if (!canClaimReward && !canClaimRefund && !canClaimCreatorRefund) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-[#141827]">
        <div className="relative w-full bg-[#0B122E] h-full rounded-t-[20px] border-t border-[#18DDF7] mt-20 sm:mt-32 md:mt-40 pt-6 px-4 overflow-y-auto">
          <button
            className="absolute right-4 top-4 bg-[#1A1F3F] rounded-full p-2 hover:bg-opacity-80"
            onClick={handleClose}
          >
            <img
              src={Close || "/placeholder.svg"}
              alt="close"
              className="w-5 h-5"
            />
          </button>

          <div className="flex flex-col items-center justify-center h-full">
            <div className="mb-6 text-center">
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-orange-500/20">
                <svg
                  className="w-8 h-8 text-orange-400"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
              </div>
              <p className="mb-2 text-lg text-white">No Actions Available</p>
              {currentEventData?.status !== undefined && statusInfo && (
                <p className="mb-2 text-sm text-yellow-400">
                  Event Status: {statusInfo.name}
                </p>
              )}
              <p className="text-sm text-gray-400">
                Keep making predictions to win rewards!
              </p>

              {currentUserStakeData && currentEventData && (
                <div className="p-3 mt-4 rounded-lg bg-gray-800/50">
                  <div className="space-y-1 text-sm text-gray-400">
                    <p>
                      Your bet:{" "}
                      <span className="text-white">
                        {
                          currentEventData.options?.[
                          currentUserStakeData.selectedOption
                          ]
                        }
                      </span>
                    </p>
                    {currentEventData.status === 2 && (
                      <p>
                        Winning option:{" "}
                        <span className="text-green-400">
                          {
                            currentEventData.options?.[
                            currentEventData.winningOption
                            ]
                          }
                        </span>
                      </p>
                    )}
                    <p>
                      Your stake:{" "}
                      <span className="text-white">
                        {formatAmount(
                          currentUserStakeData.amount,
                          currentEventData?.tokenAddress
                        )}{" "}
                        {tokenInfo.symbol}
                      </span>
                    </p>
                    {currentUserStakeData.claimed && (
                      <p className="text-blue-400">✓ Already claimed</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="w-full max-w-sm space-y-3">
              <button
                onClick={() => navigate("/stake")}
                className="w-full py-3 px-6 bg-[#18DDF7] text-black rounded-full font-semibold hover:bg-opacity-90 transition-opacity"
              >
                Make New Prediction
              </button>
              <button
                onClick={() => navigate("/profile")}
                className="w-full py-2 px-6 bg-transparent border border-[#18DDF7] text-[#18DDF7] rounded-full font-semibold hover:bg-[#18DDF7] hover:text-black transition-colors"
              >
                View Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main UI - user has claimable actions
  const isCreator =
    address &&
    currentEventData &&
    currentEventData.creator &&
    address.toLowerCase() === currentEventData.creator.toLowerCase();
  const isNullified = currentEventData?.status === 5;
  const isCancelled = currentEventData?.status === 3;
  const isRejected = currentEventData?.status === 4;
  const isCompleted = currentEventData?.status === 2;

  // Determine what type of claim this is
  let claimTitle = "Congratulations!";
  let claimSubtitle = "You Won This Prediction!";
  let claimIcon = Success;
  let claimColor = "green";

  if (isNullified || isCancelled || isRejected) {
    claimTitle = "Event Refund Available";
    claimSubtitle = isNullified
      ? "Event was nullified - claim your refund"
      : isCancelled
        ? "Event was cancelled - claim your refund"
        : "Event was rejected - claim your refund";
    claimIcon = Success;
    claimColor = "blue";
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#141827]">
      <div className="relative w-full bg-[#0B122E] h-full rounded-t-[20px] border-t border-[#18DDF7] mt-20 sm:mt-32 md:mt-40 lg:mt-32 xl:mt-28 pt-6 px-4 overflow-y-auto">
        {/* Close Button */}
        <button
          className="absolute right-4 top-4 bg-[#1A1F3F] rounded-full p-2 hover:bg-opacity-80 z-10"
          onClick={handleClose}
        >
          <img
            src={Close || "/placeholder.svg"}
            alt="close"
            className="w-5 h-5"
          />
        </button>

        {/* Content Container */}
        <div className="max-w-lg pb-8 mx-auto">
          {/* Header */}
          <div className="flex flex-col items-center justify-center gap-3 mt-2 mb-6">
            <div className="flex justify-center">
              <div
                className={`w-16 h-16 bg-gradient-to-br ${claimColor === "green"
                    ? "from-green-400 to-green-600"
                    : "from-blue-400 to-blue-600"
                  } rounded-full flex items-center justify-center`}
              >
                <img
                  src={claimIcon || "/placeholder.svg"}
                  alt="Success"
                  className="w-8 h-8"
                />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-white">{claimTitle}</h3>
            <p
              className={`text-lg ${claimColor === "green" ? "text-green-400" : "text-blue-400"
                }`}
            >
              {claimSubtitle}
            </p>
          </div>

          {/* Event Details */}
          <div className="bg-gradient-to-r from-[#0A0E2E] to-[#0A1230] rounded-xl border border-[#18DDF7] px-4 py-4 mb-6">
            <div className="flex items-center justify-center gap-3 mb-3">
              {/* Football Icon */}
              <div className="w-10 h-10 rounded-sm bg-[#01052D] flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 16.93C7.06 18.43 4 15.57 4 12c0-.85.17-1.66.47-2.4L10 15.13v1.37c0 1.1.9 2 2 2h.5v.43zm6.6-2.45c-.17-.37-.55-.62-.98-.62H16v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V8h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 1.39-.35 2.7-.97 3.84L15.6 16.48z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold leading-tight text-center text-white md:text-lg">
                {currentEventData?.question || "Loading..."}
              </h3>
            </div>

            {/* User's Bet */}
            {currentUserStakeData && currentEventData && (
              <div className="mb-2">
                <div className="relative flex justify-center">
                  <div className="bg-[#18DDF71A] text-[#18DDF7] py-2 px-6 rounded-full flex items-center justify-center gap-2 border border-[#18DDF7]/30">
                    <span className="font-medium">
                      You bet:{" "}
                      {(() => {
                        const options = currentEventData.options;
                        const selectedOption =
                          currentUserStakeData.selectedOption;

                        if (
                          options &&
                          Array.isArray(options) &&
                          options.length > selectedOption
                        ) {
                          return options[selectedOption];
                        }

                        return `Option ${selectedOption}`;
                      })()}
                    </span>
                    <img
                      src={
                        currentUserStakeData.selectedOption === 0 ? Up : Down
                      }
                      alt={
                        currentUserStakeData.selectedOption === 0
                          ? "Yes icon"
                          : "No icon"
                      }
                      className="w-4 h-4"
                    />
                  </div>
                </div>

                {/* Result/Status */}
                <div className="flex items-center justify-center mt-3">
                  <div
                    className={`border rounded-full px-4 py-2 ${canClaimReward
                        ? "bg-green-500/20 border-green-500/30"
                        : "bg-blue-500/20 border-blue-500/30"
                      }`}
                  >
                    <p
                      className={`text-sm font-medium ${canClaimReward ? "text-green-400" : "text-blue-400"
                        }`}
                    >
                      {canClaimReward && currentEventData
                        ? `✓ Result: ${(() => {
                          const options = currentEventData.options;
                          const winningOption =
                            currentEventData.winningOption;

                          if (
                            options &&
                            Array.isArray(options) &&
                            options.length > winningOption
                          ) {
                            return options[winningOption];
                          }

                          return `Option ${winningOption}`;
                        })()}`
                        : statusInfo?.name || "Processing..."}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Nullification Reason */}
          {isNullified && nullificationReason && (
            <div className="p-4 mb-6 border bg-yellow-500/10 border-yellow-500/30 rounded-xl">
              <h4 className="mb-2 font-semibold text-yellow-400">
                Nullification Reason:
              </h4>
              <p className="text-sm text-gray-300">{nullificationReason}</p>
            </div>
          )}

          {/* Claim Details */}
          <div className="bg-[#0A0E2E] rounded-xl border border-gray-600 p-4 mb-6">
            <h3 className="mb-4 text-lg font-semibold text-center text-white">
              {canClaimReward ? "Reward Details" : "Refund Details"}
            </h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Your Stake:</span>
                <span className="font-semibold text-white">
                  {(() => {
                    const amount = currentUserStakeData?.amount;
                    if (!amount || amount === 0n) {
                      return `0.00 ${tokenInfo.symbol}`;
                    }

                    const formattedAmount = formatAmount(
                      amount,
                      currentEventData?.tokenAddress
                    );
                    return `${formattedAmount} ${tokenInfo.symbol}`;
                  })()}
                </span>
              </div>

              {currentEventData && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Total Pool:</span>
                    <span className="font-semibold text-white">
                      {formatAmount(
                        currentEventData.totalStaked,
                        currentEventData?.tokenAddress
                      )}{" "}
                      {tokenInfo.symbol}
                    </span>
                  </div>

                  {canClaimReward && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">
                        Creator Fee:
                      </span>
                      <span className="font-semibold text-white">
                        {Number(currentEventData.creatorFeePercentage)}%
                      </span>
                    </div>
                  )}
                </>
              )}

              <div className="pt-3 border-t border-gray-600">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold text-gray-100">
                    {canClaimReward ? "Your Winnings:" : "Your Refund:"}
                  </span>
                  <span
                    className={`text-2xl font-bold ${canClaimReward ? "text-green-400" : "text-blue-400"
                      }`}
                  >
                    {canClaimReward ? expectedWinnings : refundAmount}{" "}
                    {tokenInfo.symbol}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Current Balance Display */}
          {address && tokenInfo.balanceData && (
            <div className="p-3 mb-4 border rounded-lg bg-blue-500/10 border-blue-500/30">
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-400">
                  Current {tokenInfo.symbol} Balance:
                </span>
                <span className="font-semibold text-blue-400">
                  {formatBalance(tokenInfo.balanceData)} {tokenInfo.symbol}
                </span>
              </div>
            </div>
          )}

          {/* Event Status */}
          {currentEventData && statusInfo && (
            <div
              className={`border rounded-lg p-3 mb-6 ${canClaimReward
                  ? "bg-green-500/10 border-green-500/30"
                  : "bg-blue-500/10 border-blue-500/30"
                }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-sm ${canClaimReward ? "text-green-400" : "text-blue-400"
                    }`}
                >
                  Event Status:
                </span>
                <span
                  className={`font-semibold ${canClaimReward ? "text-green-400" : "text-blue-400"
                    }`}
                >
                  {canClaimReward ? "✓ Completed" : statusInfo.name}
                </span>
              </div>
            </div>
          )}

          {/* Claim Status */}
          {(currentUserStakeData?.claimed || isRewardClaimed) && (
            <div className="p-3 mb-4 border rounded-lg bg-green-500/10 border-green-500/30">
              <p className="font-semibold text-center text-green-400">
                ✅ {canClaimReward ? "Reward" : "Refund"} Successfully Claimed!
              </p>
            </div>
          )}

          {/* Transaction Status */}
          {(isClaiming || isClaimingRefund || isClaimingCreatorRefund) && (
            <div className="p-3 mb-4 border rounded-lg bg-yellow-500/10 border-yellow-500/30">
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-yellow-400 rounded-full animate-spin border-t-transparent"></div>
                <p className="font-semibold text-yellow-400">
                  {isClaiming
                    ? "Processing reward claim..."
                    : isClaimingRefund
                      ? "Processing refund..."
                      : "Processing creator refund..."}
                </p>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error &&
            !isClaiming &&
            !isClaimingRefund &&
            !isClaimingCreatorRefund && (
              <div className="p-3 mb-4 border rounded-lg bg-red-500/10 border-red-500/30">
                <p className="text-sm text-center text-red-400">
                  {error?.shortMessage ||
                    error?.message ||
                    "Failed to process transaction"}
                </p>
              </div>
            )}

          {/* Action Buttons */}
          {!(currentUserStakeData?.claimed || isRewardClaimed) ? (
            <div className="space-y-3">
              {/* Primary Claim Button */}
              {canClaimReward && (
                <button
                  className="w-full py-4 rounded-full font-bold text-lg bg-gradient-to-r from-[#18DDF7] to-[#27FE60] text-black hover:from-[#27FE60] hover:to-[#18DDF7] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleClaimWinnings}
                  disabled={isClaiming}
                >
                  {isClaiming
                    ? "Claiming..."
                    : `Claim ${expectedWinnings} ${tokenInfo.symbol}`}
                </button>
              )}

              {/* Refund Button */}
              {canClaimRefund && (
                <button
                  className="w-full py-4 rounded-full font-bold text-lg bg-gradient-to-r from-[#18DDF7] to-[#4A90E2] text-black hover:from-[#4A90E2] hover:to-[#18DDF7] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleClaimRefund}
                  disabled={isClaimingRefund}
                >
                  {isClaimingRefund
                    ? "Claiming Refund..."
                    : `Claim Refund ${refundAmount} ${tokenInfo.symbol}`}
                </button>
              )}

              {/* Creator Refund Button */}
              {canClaimCreatorRefund && (
                <button
                  className="w-full py-3 rounded-full font-semibold bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-black hover:from-[#FFA500] hover:to-[#FFD700] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleClaimCreatorRefund}
                  disabled={isClaimingCreatorRefund}
                >
                  {isClaimingCreatorRefund
                    ? "Claiming Creator Refund..."
                    : `Claim Creator Refund ${creatorRefundAmount} ${tokenInfo.symbol}`}
                </button>
              )}

              {/* Status Messages */}
              {!canClaimReward && !canClaimRefund && !canClaimCreatorRefund && (
                <p className="text-sm text-center text-gray-400">
                  {statusInfo?.name === "Ongoing (Open for betting)"
                    ? "Event will complete automatically when the time expires"
                    : "Processing event status..."}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {/* Navigation Buttons */}
              <div className="flex gap-3">
                <button
                  className="flex-1 py-3 rounded-full font-semibold bg-[#18DDF7] text-black hover:bg-opacity-90 transition-opacity"
                  onClick={() => navigate("/stake")}
                >
                  New Prediction
                </button>
                <button
                  className="flex-1 py-3 rounded-full font-semibold bg-transparent border border-[#18DDF7] text-[#18DDF7] hover:bg-[#18DDF7] hover:text-black transition-colors"
                  onClick={() => navigate("/profile")}
                >
                  View Profile
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedPredictionWin;
