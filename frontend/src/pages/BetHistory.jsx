"use client";

import React, { useState, useEffect } from "react";
import {
  ChevronRight,
  Search,
  Trophy,
  Clock,
  X,
  CheckCircle,
  RefreshCw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAccount, useReadContract } from "wagmi";
import { readContract } from "wagmi/actions";
import { config } from "../wagmi/config";

// Import ABIs
const StimEventContractABI = [
  {
    type: "function",
    name: "getUserStake",
    inputs: [{ name: "_user", type: "address", internalType: "address" }],
    outputs: [
      { name: "selectedOption", type: "uint8", internalType: "uint8" },
      { name: "amount", type: "uint256", internalType: "uint256" },
      { name: "claimed", type: "bool", internalType: "bool" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getEventDetails",
    inputs: [],
    outputs: [
      { name: "question", type: "string", internalType: "string" },
      { name: "description", type: "string", internalType: "string" },
      { name: "options", type: "string[]", internalType: "string[]" },
      { name: "eventType", type: "string", internalType: "string" },
      { name: "category", type: "string", internalType: "string" },
      { name: "eventImage", type: "string", internalType: "string" },
      {
        name: "status",
        type: "uint8",
        internalType: "enum EventContract.EventStatus",
      },
      { name: "endTime", type: "uint256", internalType: "uint256" },
      { name: "winningOption", type: "uint8", internalType: "uint8" },
      { name: "creator", type: "address", internalType: "address" },
      { name: "tokenAddress", type: "address", internalType: "address" },
      { name: "totalStaked", type: "uint256", internalType: "uint256" },
      {
        name: "creatorFeePercentage",
        type: "uint256",
        internalType: "uint256",
      },
      { name: "creatorRewardClaimed", type: "bool", internalType: "bool" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "creatorStake",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getNullificationReason",
    inputs: [],
    outputs: [{ name: "", type: "string", internalType: "string" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getOptionTotals",
    inputs: [],
    outputs: [{ name: "", type: "uint256[]", internalType: "uint256[]" }],
    stateMutability: "view",
  },
];

const FactoryABI = [
  {
    type: "function",
    name: "getAllEvents",
    inputs: [],
    outputs: [{ name: "", type: "address[]", internalType: "address[]" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getEventsByStatus",
    inputs: [
      {
        name: "_status",
        type: "uint8",
        internalType: "enum EventContract.EventStatus",
      },
    ],
    outputs: [
      {
        name: "",
        type: "address[]",
        internalType: "address[]",
      },
    ],
    stateMutability: "view",
  },
];

const BetCard = ({
  title,
  bet,
  stake,
  outcome,
  timeRemaining,
  icon,
  onViewDetails,
  onClaimReward,
  onClaimRefund,
  showClaimButton = false,
  showRefundButton = false,
  statusTag,
  showAllBets = false,
  resultStatus,
  isCreator = false,
  onClaimCreatorRefund,
  showCreatorRefundButton = false,
}) => {
  return (
    <div className="mb-4 p-6 rounded-2xl bg-[#0A1230] border border-[#fff]">
      <div className="flex gap-3">
        <div className="w-10 h-10">
          <div className="flex items-center justify-center w-full h-full rounded-lg bg-white/5">
            {icon}
          </div>
        </div>
        <div className="flex flex-col flex-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-base font-medium text-white">{title}</h3>
            <div className="flex items-center gap-2">
              {isCreator && (
                <span className="px-2 py-1 text-xs text-yellow-400 border rounded-full bg-yellow-500/20 border-yellow-500/30">
                  Creator
                </span>
              )}
              {showAllBets && statusTag && (
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    statusTag === "Ongoing"
                      ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                      : statusTag === "Completed"
                      ? "bg-green-500/20 text-green-400 border border-green-500/30"
                      : statusTag === "Nullified" ||
                        statusTag === "Cancelled" ||
                        statusTag === "Rejected"
                      ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                      : statusTag === "Refund Claimed"
                      ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                      : statusTag === "Pending Approval"
                      ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                      : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                  }`}
                >
                  {statusTag}
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Bet:</span>
              <span className="text-sm text-white">{bet}</span>
            </div>
            {outcome && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Outcome:</span>
                <span
                  className={`text-sm ${
                    outcome === "Won"
                      ? "text-green-400"
                      : outcome === "Lost"
                      ? "text-red-400"
                      : outcome === "Claimed"
                      ? "text-blue-400"
                      : outcome === "Refund Claimed"
                      ? "text-purple-400"
                      : outcome?.includes("Refundable") ||
                        outcome?.includes("Nullified")
                      ? "text-blue-400"
                      : "text-yellow-400"
                  }`}
                >
                  {outcome}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Stake:</span>
              <span className="text-sm text-white">{stake}</span>
            </div>
            {timeRemaining && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Ending in:</span>
                <span className="text-sm text-white">{timeRemaining}</span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            <button
              onClick={onViewDetails}
              className="text-cyan-400 text-sm px-4 py-2 rounded-full bg-[#18DDF7]/50 border border-[#18DDF7] hover:bg-cyan-400/20 transition-colors w-fit flex items-center gap-2"
            >
              View Details
              <ChevronRight className="w-4 h-4" />
            </button>

            {showClaimButton && (
              <button
                onClick={onClaimReward}
                className="flex items-center gap-2 px-4 py-2 text-sm text-white transition-colors bg-green-500 rounded-full hover:bg-green-600 w-fit"
              >
                Claim Reward
                <Trophy className="w-4 h-4" />
              </button>
            )}

            {showRefundButton && (
              <button
                onClick={onClaimRefund}
                className="flex items-center gap-2 px-4 py-2 text-sm text-white transition-colors bg-blue-500 rounded-full hover:bg-blue-600 w-fit"
              >
                Claim Refund
                <RefreshCw className="w-4 h-4" />
              </button>
            )}

            {showCreatorRefundButton && (
              <button
                onClick={onClaimCreatorRefund}
                className="flex items-center gap-2 px-4 py-2 text-sm text-white transition-colors bg-yellow-500 rounded-full hover:bg-yellow-600 w-fit"
              >
                Claim Creator Refund
                <Trophy className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const AllBets = () => {
  const navigate = useNavigate();
  const { address } = useAccount();
  const [activeTab, setActiveTab] = useState("All Stakes");
  const [searchTerm, setSearchTerm] = useState("");
  const [betHistory, setBetHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Factory address
  const FACTORY_ADDRESS = import.meta.env.VITE_FACTORY_ADDRESS;

  // Get all events for "All Stakes" tab
  const { data: allEvents } = useReadContract({
    abi: FactoryABI,
    address: FACTORY_ADDRESS,
    functionName: "getAllEvents",
    enabled: !!address,
  });

  // Enhanced formatAmount function with token address support
  const formatAmount = (amount, tokenAddress = null) => {
    if (!amount) return "0.00";

    let amountValue;
    if (typeof amount === "bigint") {
      amountValue = amount;
    } else {
      amountValue = BigInt(amount.toString());
    }

    // Determine decimals based on token address
    let decimals = 18; // Default for STIM

    if (tokenAddress) {
      const tokenAddr = tokenAddress.toLowerCase();
      // Check if USDC
      if (
        tokenAddr === import.meta.env.VITE_USDC_ADDRESS?.toLowerCase()
      ) {
        decimals = 6; // USDC has 6 decimals
      }
    }

    const divisor = BigInt(10 ** decimals);
    const wholePart = amountValue / divisor;
    const fractionalPart = amountValue % divisor;

    const fractionalStr = fractionalPart.toString().padStart(decimals, "0");
    const decimal = parseFloat(`${wholePart}.${fractionalStr}`);

    return decimal.toFixed(2);
  };

  // Add token symbol detection function
  const getTokenSymbol = (tokenAddress) => {
    if (!tokenAddress) return "CUSD";

    const tokenAddr = tokenAddress.toLowerCase();
    // Check token addresses from environment
    if (
      tokenAddr === import.meta.env.VITE_USDC_ADDRESS?.toLowerCase()
    ) {
      return "USDC";
    } else if (
      tokenAddr === import.meta.env.VITE_CUSD_ADDRESS?.toLowerCase()
    ) {
      return "CUSD";
    }

    return "CUSD"; // Default
  };

  const getTimeRemaining = (endTime) => {
    const now = new Date();
    const end = new Date(endTime * 1000);
    const diff = end - now;

    if (diff <= 0) return null;

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours.toString().padStart(2, "0")} hrs ${minutes
      .toString()
      .padStart(2, "0")} mins`;
  };

  // Status determination with nullified status and better logic
  const getBetStatus = (
    eventStatus,
    endTime,
    winningOption,
    userOption,
    claimed
  ) => {
    const now = new Date();
    const end = new Date(endTime * 1000);
    const hasEnded = now >= end;
    const statusNum = Number(eventStatus);

    console.log(
      `🔍 Determining status: eventStatus=${statusNum}, hasEnded=${hasEnded}, winningOption=${winningOption}, userOption=${userOption}, claimed=${claimed}`
    );

    // Status 0: Pending approval (yet to start)
    if (statusNum === 0) {
      return "pending_approval";
    }

    // Status 1: Ongoing (Open for betting)
    if (statusNum === 1) {
      if (!hasEnded) {
        return "ongoing"; // Still accepting bets
      } else {
        return "ongoing_expired"; // Time ended but still marked as ongoing
      }
    }

    // Status 2: Completed with result
    if (statusNum === 2) {
      const userWon = Number(userOption) === Number(winningOption);
      if (userWon) {
        return claimed ? "claimed" : "won";
      } else {
        return "lost";
      }
    }

    // Status 3: Cancelled
    if (statusNum === 3) {
      return claimed ? "refund_claimed" : "cancelled_refundable";
    }

    // Status 4: Rejected
    if (statusNum === 4) {
      return claimed ? "refund_claimed" : "rejected_refundable";
    }

    // Status 5: Nullified
    if (statusNum === 5) {
      return claimed ? "refund_claimed" : "nullified_refundable";
    }

    // Default fallback
    return "unknown";
  };

  const getOutcome = (resultStatus) => {
    switch (resultStatus) {
      case "won":
        return "Won";
      case "lost":
        return "Lost";
      case "claimed":
        return "Claimed";
      case "ongoing":
        return null; // Don't show outcome for ongoing bets
      case "pending_approval":
        return "Pending Approval";
      case "ongoing_expired":
        return "Ongoing (Expired)";
      case "cancelled_refundable":
        return "Cancelled (Refundable)";
      case "rejected_refundable":
        return "Rejected (Refundable)";
      case "nullified_refundable":
        return "Nullified (Refundable)";
      case "refund_claimed":
        return "Refund Claimed";
      case "unknown":
        return "Unknown";
      default:
        return null;
    }
  };

  const getIcon = (resultStatus) => {
    switch (resultStatus) {
      case "won":
        return <Trophy className="w-5 h-5 text-green-400" />;
      case "claimed":
        return <CheckCircle className="w-5 h-5 text-blue-400" />;
      case "lost":
        return <X className="w-5 h-5 text-red-400" />;
      case "ongoing":
        return <Clock className="w-5 h-5 text-yellow-400" />;
      case "pending_approval":
        return <Clock className="w-5 h-5 text-orange-400" />;
      case "ongoing_expired":
        return <Clock className="w-5 h-5 text-orange-400" />;
      case "cancelled_refundable":
        return <RefreshCw className="w-5 h-5 text-purple-400" />;
      case "rejected_refundable":
        return <RefreshCw className="w-5 h-5 text-purple-400" />;
      case "nullified_refundable":
        return <RefreshCw className="w-5 h-5 text-blue-400" />;
      case "refund_claimed":
        return <CheckCircle className="w-5 h-5 text-purple-400" />;
      case "unknown":
        return <Clock className="w-5 h-5 text-gray-400" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusTag = (resultStatus) => {
    switch (resultStatus) {
      case "ongoing":
        return "Ongoing";
      case "pending_approval":
        return "Pending Approval";
      case "ongoing_expired":
        return "Ongoing (Expired)";
      case "won":
      case "lost":
      case "claimed":
        return "Completed";
      case "cancelled_refundable":
        return "Cancelled";
      case "rejected_refundable":
        return "Rejected";
      case "nullified_refundable":
        return "Nullified";
      case "refund_claimed":
        return "Refund Claimed";
      case "unknown":
        return "Unknown";
      default:
        return "Unknown";
    }
  };

  // Calculate potential winnings based on outcome
  const calculatePotentialWinnings = (bet) => {
    if (bet.resultStatus === "won" || bet.resultStatus === "claimed") {
      const stakeAmount = parseFloat(bet.stake);
      return Math.round(stakeAmount * 0.85); // 85% return as example
    }
    return 0;
  };

  // Load user's bet history based on active tab
  useEffect(() => {
    const loadBetHistory = async () => {
      if (!address) {
        console.log("⚠️ Wallet not connected");
        setLoading(false);
        return;
      }

      setLoading(true);
      console.log(`🔍 Loading bet history for ${activeTab} tab...`);

      // Always load ALL events first, then filter by user stakes and tab requirements
      const eventsToCheck = allEvents || [];

      if (eventsToCheck.length === 0) {
        console.log("⚠️ No events found");
        setBetHistory([]);
        setLoading(false);
        return;
      }

      console.log(
        `🔍 Checking ${eventsToCheck.length} total events for user stakes...`
      );

      const userBets = [];

      try {
        for (const eventAddress of eventsToCheck) {
          try {
            console.log(`📋 Checking event: ${eventAddress}`);

            // Get user stake data first - this determines if user participated
            const userStakeData = await readContract(config, {
              abi: StimEventContractABI,
              address: eventAddress,
              functionName: "getUserStake",
              args: [address],
            });

            // Skip if user didn't stake on this event
            if (!userStakeData || userStakeData[1] === 0n) {
              console.log(`⏭️ Skipping ${eventAddress} - no stake found`);
              continue;
            }

            console.log(
              `💰 User has stake in ${eventAddress}: ${userStakeData[1].toString()}`
            );

            // Get event details using getEventDetails
            let eventDetails;
            try {
              eventDetails = await readContract(config, {
                abi: StimEventContractABI,
                address: eventAddress,
                functionName: "getEventDetails",
              });
            } catch (error) {
              console.log(
                `❌ getEventDetails failed for ${eventAddress}:`,
                error.message
              );
              continue;
            }

            if (!eventDetails) {
              console.log(`⚠️ No event details found for ${eventAddress}`);
              continue;
            }

            const [selectedOption, amount, claimed] = userStakeData;

            // Parse getEventDetails response (14 fields, no creatorStake)
            const [
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
              totalStaked,
              ,
              creatorRewardClaimed,
            ] = eventDetails;

            // Get creatorStake separately
            let creatorStake = 0n;
            try {
              creatorStake = await readContract(config, {
                abi: StimEventContractABI,
                address: eventAddress,
                functionName: "creatorStake",
              });
            } catch (error) {
              console.log(`⚠️ Could not get creatorStake for ${eventAddress}`);
            }

            // Get nullification reason separately
            let nullificationReason = "";
            try {
              nullificationReason = await readContract(config, {
                abi: StimEventContractABI,
                address: eventAddress,
                functionName: "getNullificationReason",
              });
            } catch (error) {
              // Nullification reason may not exist for all events
            }

            console.log(`💰 Event: ${question}`);
            console.log(`💰 Raw stake amount: ${amount}`);
            console.log(
              `📊 Event status: ${status}, End time: ${endTime}, Winning option: ${winningOption}`
            );
            console.log(
              `👤 User option: ${selectedOption}, Claimed: ${claimed}`
            );

            // Use the status determination
            const resultStatus = getBetStatus(
              status,
              Number(endTime),
              winningOption,
              selectedOption,
              claimed
            );
            console.log(`🎯 Result status: ${resultStatus}`);

            const formattedStake = formatAmount(amount, tokenAddress);
            const tokenSymbol = getTokenSymbol(tokenAddress);
            console.log(`💵 Formatted stake: ${formattedStake} ${tokenSymbol}`);

            // Check if user is the creator
            const isCreator = address.toLowerCase() === creator.toLowerCase();

            const betData = {
              eventAddress,
              title: question,
              bet: options
                ? options[Number(selectedOption)]
                : `Option ${selectedOption}`,
              stake: `${formattedStake} ${tokenSymbol}`,
              stakeRaw: amount,
              tokenAddress,
              tokenSymbol,
              outcome: getOutcome(resultStatus),
              timeRemaining:
                resultStatus === "ongoing"
                  ? getTimeRemaining(Number(endTime))
                  : null,
              icon: getIcon(resultStatus),
              resultStatus,
              statusTag: getStatusTag(resultStatus),
              userWon: resultStatus === "won" || resultStatus === "claimed",
              eventStatus: Number(status),
              endTime: Number(endTime),
              winningOption: Number(winningOption),
              userBet: {
                option: Number(selectedOption),
                amount: amount,
                claimed,
              },
              options: options || ["Yes", "No"],
              totalStaked,
              category,
              eventImage,
              createdAt: Number(endTime) - 7 * 24 * 60 * 60,
              isOngoing:
                resultStatus === "ongoing" ||
                resultStatus === "pending_approval" ||
                resultStatus === "ongoing_expired",
              isCompleted:
                resultStatus === "won" ||
                resultStatus === "lost" ||
                resultStatus === "claimed",
              isCreator,
              creator,
              creatorStake,
              creatorRewardClaimed,
              nullificationReason: nullificationReason || "",
            };

            console.log(`✅ Added bet to history:`, betData);
            userBets.push(betData);
          } catch (error) {
            console.error(
              `❌ Error loading bet for event ${eventAddress}:`,
              error
            );
          }
        }

        // Filter based on active tab AFTER we have all user bets
        let filteredUserBets = userBets;

        if (activeTab === "Ongoing") {
          filteredUserBets = userBets.filter((bet) => bet.isOngoing);
        } else if (activeTab === "Completed") {
          filteredUserBets = userBets.filter((bet) => bet.isCompleted);
        }
        // For "All Stakes", we show everything (no filtering)

        // Sort by creation time (most recent first)
        filteredUserBets.sort((a, b) => b.createdAt - a.createdAt);

        console.log(
          `🎯 Final bet history loaded: ${filteredUserBets.length} bets for ${activeTab} tab (out of ${userBets.length} total user bets)`
        );
        console.log(`📊 Breakdown:`, {
          ongoing: userBets.filter((b) => b.resultStatus === "ongoing").length,
          pending_approval: userBets.filter(
            (b) => b.resultStatus === "pending_approval"
          ).length,
          ongoing_expired: userBets.filter(
            (b) => b.resultStatus === "ongoing_expired"
          ).length,
          won: userBets.filter((b) => b.resultStatus === "won").length,
          lost: userBets.filter((b) => b.resultStatus === "lost").length,
          claimed: userBets.filter((b) => b.resultStatus === "claimed").length,
          cancelled_refundable: userBets.filter(
            (b) => b.resultStatus === "cancelled_refundable"
          ).length,
          rejected_refundable: userBets.filter(
            (b) => b.resultStatus === "rejected_refundable"
          ).length,
          nullified_refundable: userBets.filter(
            (b) => b.resultStatus === "nullified_refundable"
          ).length,
          refund_claimed: userBets.filter(
            (b) => b.resultStatus === "refund_claimed"
          ).length,
          unknown: userBets.filter((b) => b.resultStatus === "unknown").length,
        });

        setBetHistory(filteredUserBets);
      } catch (error) {
        console.error("❌ Error loading bet history:", error);
      } finally {
        setLoading(false);
      }
    };

    // Only trigger when we have allEvents and address
    if (allEvents && address) {
      loadBetHistory();
    } else if (address) {
      setLoading(false);
    }
  }, [allEvents, address, activeTab]);

  // Filter bets based on search term
  const filteredBets = betHistory.filter((bet) => {
    const matchesSearch =
      bet.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bet.bet.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  // Navigate to prediction success page with corrected status checks
  const handleViewDetails = (bet) => {
    navigate("/prediction-success", {
      state: {
        betOption: bet.userBet.option === 0 ? "yes" : "no",
        stake: bet.stake,
        question: bet.title,
        eventAddress: bet.eventAddress,
        predictionId: bet.eventAddress,
        timeLeft:
          bet.timeRemaining ||
          (bet.resultStatus === "ongoing" ? "Ongoing" : "Completed"),
        potentialWinnings: calculatePotentialWinnings(bet),
        eventData: {
          question: bet.title,
          options: { A: bet.options[0], B: bet.options[1] },
          category: { label: bet.category, id: "0" },
          totalStaked: bet.totalStaked,
          end_time: new Date(bet.endTime * 1000).toISOString(),
          status: bet.eventStatus,
          statusMessage:
            bet.eventStatus === 2
              ? "Completed"
              : bet.eventStatus === 1
              ? "Open for betting"
              : bet.eventStatus === 0
              ? "Pending approval"
              : bet.eventStatus === 5
              ? "Nullified"
              : bet.eventStatus === 3
              ? "Cancelled"
              : bet.eventStatus === 4
              ? "Rejected"
              : "Other",
          winningOption: bet.winningOption,
          isOpenForBetting:
            bet.eventStatus === 1 && new Date() < new Date(bet.endTime * 1000),
          hasEnded: new Date() >= new Date(bet.endTime * 1000),
          nullificationReason: bet.nullificationReason,
        },
        betSuccess: true,
        outcome: bet.outcome,
        resultStatus: bet.resultStatus,
        userWon: bet.userWon,
        claimed: bet.userBet.claimed,
      },
    });
  };

  const handleClaimReward = (eventAddress) => {
    navigate("/prediction-win", {
      state: {
        eventAddress,
        claimType: "reward",
      },
    });
  };

  const handleClaimRefund = (eventAddress) => {
    navigate("/prediction-win", {
      state: {
        eventAddress,
        claimType: "refund",
      },
    });
  };

  const handleClaimCreatorRefund = (eventAddress) => {
    navigate("/prediction-win", {
      state: {
        eventAddress,
        claimType: "creator-refund",
      },
    });
  };

  // Get current date for header
  const getCurrentDate = () => {
    const today = new Date();
    const options = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return `Today- ${today.toLocaleDateString("en-US", options)}`;
  };

  if (!address) {
    return (
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col px-5">
          <div className="py-12 text-center">
            <p className="text-gray-400">
              Please connect your wallet to view bet history
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-col px-5">
        {/* Search Bar */}
        <div className="relative mb-6">
          <input
            type="text"
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0A1230] border border-[#1E2B4D] rounded-xl px-4 py-3 text-white pl-10"
          />
          <Search className="absolute w-5 h-5 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-8 mb-6 text-sm">
          <button
            className={`${
              activeTab === "All Stakes"
                ? "text-cyan-400 border-b-2 border-cyan-400"
                : "text-white"
            } pb-2`}
            onClick={() => setActiveTab("All Stakes")}
          >
            All Stakes
          </button>
          <button
            className={`${
              activeTab === "Ongoing"
                ? "text-cyan-400 border-b-2 border-cyan-400"
                : "text-white"
            } pb-2`}
            onClick={() => setActiveTab("Ongoing")}
          >
            Ongoing
          </button>
          <button
            className={`${
              activeTab === "Completed"
                ? "text-cyan-400 border-b-2 border-cyan-400"
                : "text-white"
            } pb-2`}
            onClick={() => setActiveTab("Completed")}
          >
            Completed
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="py-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#18DDF7] mx-auto mb-4"></div>
            <p className="text-sm text-gray-400">Loading bet history...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredBets.length === 0 && (
          <div className="py-12 text-center">
            <p className="mb-4 text-gray-400">
              {searchTerm
                ? `No bets found matching "${searchTerm}"`
                : activeTab === "All Stakes"
                ? "No stakes found"
                : `No ${activeTab.toLowerCase()} stakes found`}
            </p>
            {!searchTerm && (
              <button
                onClick={() => navigate("/stake")}
                className="px-6 py-2 bg-[#18DDF7] text-black rounded-full font-semibold"
              >
                Go back to stake
              </button>
            )}
          </div>
        )}

        {/* Date Header - only show if there are bets */}
        {!loading && filteredBets.length > 0 && (
          <div className="mb-4 text-sm text-cyan-400">{getCurrentDate()}</div>
        )}

        {/* Bet Cards */}
        {!loading &&
          filteredBets.map((bet, index) => (
            <BetCard
              key={`${bet.eventAddress}-${index}`}
              title={bet.title}
              bet={bet.bet}
              stake={bet.stake}
              outcome={bet.outcome}
              timeRemaining={bet.timeRemaining}
              icon={bet.icon}
              statusTag={bet.statusTag}
              resultStatus={bet.resultStatus}
              isCreator={bet.isCreator}
              showAllBets={activeTab === "All Stakes"}
              showClaimButton={bet.resultStatus === "won"}
              showRefundButton={
                bet.resultStatus === "nullified_refundable" ||
                bet.resultStatus === "cancelled_refundable" ||
                bet.resultStatus === "rejected_refundable"
              }
              showCreatorRefundButton={
                bet.isCreator &&
                (bet.resultStatus === "nullified_refundable" ||
                  bet.resultStatus === "cancelled_refundable" ||
                  bet.resultStatus === "rejected_refundable") &&
                !bet.creatorRewardClaimed
              }
              onViewDetails={() => handleViewDetails(bet)}
              onClaimReward={() => handleClaimReward(bet.eventAddress)}
              onClaimRefund={() => handleClaimRefund(bet.eventAddress)}
              onClaimCreatorRefund={() =>
                handleClaimCreatorRefund(bet.eventAddress)
              }
            />
          ))}
      </div>
    </div>
  );
};

export default AllBets;
