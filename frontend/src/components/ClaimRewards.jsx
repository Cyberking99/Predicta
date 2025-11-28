import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAccount, useBalance, useSwitchChain, useChainId } from "wagmi";
import { celoSepolia } from "../wagmi/config";
import { useNotifications } from "./NotificationProvider";
import { useClaimReward } from "../../hooks/staking/useClaimReward";
import {
  ArrowLeft,
  Trophy,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import CUSD from "../assets/images/pngs/cUSD.png";
import { toast } from "react-toastify";
import { parseUnits } from "viem";
import { useReadContract } from "wagmi";

// STIM token address
const CUSD_ADDRESS = import.meta.env.VITE_CUSD_ADDRESS;

const ClaimRewardsPage = () => {
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const { switchChain } = useSwitchChain();
  const chainId = useChainId();
  const { notifications } = useNotifications();
  const [claimingEventId, setClaimingEventId] = useState(null);
  const [loading, setLoading] = useState(false);

  // Get current STIM balance
  const { data: stimBalanceData, refetch: refetchBalance } = useBalance({
    address: address,
    token: CUSD_ADDRESS,
    chainId: celoSepolia.id,
    enabled: !!address,
  });

  // Contract read hook for rewards
  const { data: rewardsData, refetch: refetchRewards } = useReadContract({
    address: import.meta.env.VITE_FACTORY_ADDRESS,
    abi: [
      {
        inputs: [{ internalType: "address", name: "user", type: "address" }],
        name: "getPendingRewards",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
      },
    ],
    functionName: "getPendingRewards",
    args: [address],
    enabled: !!address && chainId === celoSepolia.id,
  });

  // Filter notifications to get winning, losing, and claimed notifications
  const winningNotifications = notifications.filter(
    (notification) => notification.userWon && !notification.claimed
  );

  const claimedNotifications = notifications.filter(
    (notification) => notification.userWon && notification.claimed
  );

  // Get all losing notifications to show in history
  const losingNotifications = notifications.filter(
    (notification) => !notification.userWon
  );

  // Initialize claim reward hook for each notification
  const { claimReward, isClaiming } = useClaimReward({
    eventAddress: claimingEventId,
    onSuccess: () => {
      setClaimingEventId(null);
      // Refetch balance after successful claim
      if (refetchBalance) {
        setTimeout(() => refetchBalance(), 2000);
      }
    },
  });

  const handleClaimReward = async (notification) => {
    setClaimingEventId(notification.eventAddress);
    await claimReward();
  };

  const handleViewResult = (notification) => {
    // Navigate to appropriate page based on whether user won or lost
    if (notification.userWon) {
      navigate("/prediction-win", {
        state: { notification },
      });
    } else {
      navigate("/prediction-loss", {
        state: { notification },
      });
    }
  };

  const formatBalance = (balance) => {
    if (!balance) return "0.00";
    return parseFloat(balance.formatted).toFixed(2);
  };

  const RewardCard = ({ notification, type = "claimable" }) => (
    <div
      className="p-[2px] rounded-2xl mb-4"
      style={{
        background:
          type === "claimable"
            ? "linear-gradient(135deg, #27FE60, #18DDF7)"
            : type === "claimed"
              ? "linear-gradient(135deg, #195281, #09113B)"
              : "linear-gradient(135deg, #FF4444, #AA2222)", // Red gradient for losses
      }}
    >
      <div className="bg-[#09113B] rounded-2xl p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {type === "claimable" ? (
              <Trophy className="w-5 h-5 text-[#27FE60]" />
            ) : type === "claimed" ? (
              <CheckCircle className="w-5 h-5 text-green-400" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-400" />
            )}
            <span
              className={`text-sm font-semibold ${type === "claimable"
                ? "text-[#27FE60]"
                : type === "claimed"
                  ? "text-green-400"
                  : "text-red-400"
                }`}
            >
              {type === "claimable"
                ? "Ready to Claim"
                : type === "claimed"
                  ? "Already Claimed"
                  : "Lost Prediction"}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <img src={CUSD} alt="CUSD" className="w-4 h-4" />
            <span
              className={`font-semibold ${type === "lost" ? "text-red-400" : "text-white"
                }`}
            >
              {type === "lost"
                ? `-${notification.userStake}`
                : `${notification.potentialWinnings}`}
            </span>
          </div>
        </div>

        {/* Event Details */}
        <div className="mb-3">
          <h3 className="mb-1 text-sm font-medium text-white line-clamp-2">
            {notification.eventDetails?.question || "Prediction Event"}
          </h3>
          <p className="text-xs text-gray-400">
            Your bet:{" "}
            {notification.eventDetails?.userBetOption === 1 ? "Yes" : "No"} •
            Stake: ${notification.userStake}
            {type === "lost" && (
              <span className="text-red-400">
                {" "}
                • Result:{" "}
                {notification.eventDetails?.result || "Opposite outcome"}
              </span>
            )}
          </p>
        </div>

        {/* Event Image */}
        {notification.eventDetails?.eventImage && (
          <div className="mb-3">
            <img
              src={notification.eventDetails.eventImage}
              alt="Event"
              className="object-cover w-full h-24 rounded-lg"
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          {type === "claimable" ? (
            <>
              <button
                onClick={() => handleClaimReward(notification)}
                disabled={
                  isClaiming && claimingEventId === notification.eventAddress
                }
                className="flex-1 py-2 px-4 bg-[#27FE60] text-black rounded-full font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isClaiming && claimingEventId === notification.eventAddress
                  ? "Claiming..."
                  : "Claim Reward"}
              </button>
              <button
                onClick={() => handleViewResult(notification)}
                className="px-4 py-2 border border-[#18DDF7] text-[#18DDF7] rounded-full text-sm"
              >
                View
              </button>
            </>
          ) : (
            <button
              onClick={() => handleViewResult(notification)}
              className={`flex-1 py-2 px-4 rounded-full font-semibold ${type === "lost"
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-gray-600 text-white hover:bg-gray-700"
                }`}
            >
              View Details
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const EmptyState = ({ type }) => (
    <div className="py-8 text-center">
      <div className="w-16 h-16 bg-[#01052D] rounded-full flex items-center justify-center mx-auto mb-4">
        {type === "claimable" ? (
          <Trophy className="w-8 h-8 text-gray-400" />
        ) : (
          <CheckCircle className="w-8 h-8 text-gray-400" />
        )}
      </div>
      <h3 className="mb-2 text-lg font-semibold text-white">
        {type === "claimable" ? "No Rewards to Claim" : "No Claimed Rewards"}
      </h3>
      <p className="text-sm text-gray-400">
        {type === "claimable"
          ? "When you win predictions, your rewards will appear here"
          : "Your claimed rewards history will appear here"}
      </p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#01052D] text-white">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-800">
        <button
          onClick={() => navigate("/profile")}
          className="p-2 rounded-full bg-[#1A1F3F] hover:bg-opacity-80"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-[#18DDF7]">CLAIM REWARDS</h1>
          <p className="text-sm text-gray-400">
            Manage your prediction winnings
          </p>
        </div>
      </div>

      {/* Balance Card */}
      {address && stimBalanceData && (
        <div className="p-4">
          <div className="bg-gradient-to-r from-[#09113B] to-[#192EA1] rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Current Balance</p>
                <p className="text-2xl font-bold text-white">
                  {formatBalance(stimBalanceData)} CUSD
                </p>
              </div>
              <div className="w-12 h-12 bg-[#01052D] rounded-full flex items-center justify-center">
                <Trophy className="w-6 h-6 text-[#27FE60]" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        {/* Claimable Rewards Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">
              Available to Claim ({winningNotifications.length})
            </h2>
            {winningNotifications.length > 0 && (
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4 text-[#27FE60]" />
                <span className="text-[#27FE60] text-sm">Ready</span>
              </div>
            )}
          </div>

          {winningNotifications.length > 0 ? (
            winningNotifications.map((notification, index) => (
              <RewardCard
                key={`claimable-${notification.eventAddress}-${index}`}
                notification={notification}
                type="claimable"
              />
            ))
          ) : (
            <EmptyState type="claimable" />
          )}
        </div>

        {/* Claimed Rewards Section */}
        <div className="mb-6">
          <h2 className="mb-4 text-lg font-semibold text-white">
            Claimed Rewards ({claimedNotifications.length})
          </h2>

          {claimedNotifications.length > 0 ? (
            claimedNotifications
              .slice(0, 5)
              .map((notification, index) => (
                <RewardCard
                  key={`claimed-${notification.eventAddress}-${index}`}
                  notification={notification}
                  type="claimed"
                />
              ))
          ) : (
            <EmptyState type="claimed" />
          )}
        </div>

        {/* Lost Predictions Section */}
        <div>
          <h2 className="mb-4 text-lg font-semibold text-white">
            Lost Predictions ({losingNotifications.length})
          </h2>

          {losingNotifications.length > 0 ? (
            losingNotifications
              .slice(0, 5)
              .map((notification, index) => (
                <RewardCard
                  key={`lost-${notification.eventAddress}-${index}`}
                  notification={notification}
                  type="lost"
                />
              ))
          ) : (
            <div className="py-8 text-center">
              <div className="w-16 h-16 bg-[#01052D] rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-white">
                No Lost Predictions
              </h3>
              <p className="text-sm text-gray-400">
                You haven't lost any predictions yet. Keep up the good work!
              </p>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-8 p-4 bg-[#0A0E2E] rounded-2xl border border-gray-800">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[#18DDF7] mt-0.5" />
            <div>
              <h3 className="mb-1 text-sm font-semibold text-white">
                Important Information
              </h3>
              <p className="text-xs leading-relaxed text-gray-400">
                • Rewards must be claimed within the deadline period
                <br />
                • Gas fees apply for claiming transactions
                <br />• Claimed rewards are added to your PREDEN balance
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClaimRewardsPage;
