"use client";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Success from "../../assets/images/svgs/success.svg";
import Close from "../../assets/images/svgs/x-close.svg";
import glow from "../../assets/images/svgs/glow.svg";

const PredictionSuccess = () => {
  const navigate = useNavigate();
  const { state } = useLocation();

  // Extract all the data from navigation state
  const {
    betOption,
    stake,
    question,
    eventAddress,
    predictionId,
    timeLeft,
    potentialWinnings,
    eventData,
    betSuccess,
    isAdditionalStake, // NEW: Flag for additional stakes
    // Additional data from bet history
    outcome,
    resultStatus,
    userWon,
    claimed,
  } = state || {};

  // If no state data, redirect to stake page
  useEffect(() => {
    if (!state || !betSuccess) {
      console.log("No success state found, redirecting to stake page");
      navigate("/stake", { replace: true });
    }
  }, [state, betSuccess, navigate]);

  const handleClose = () => {
    // Navigate to home or main page
    navigate("/", { replace: true });
  };

  const handleGoToActiveBets = () => {
    // Navigate to bet history page to see all bets
    navigate("/bet-history", { replace: true });
  };

  const handleViewPrediction = () => {
    // Navigate back to the specific prediction page to view details
    if (eventAddress || predictionId) {
      navigate(`/prediction/${eventAddress || predictionId}`, {
        replace: true,
      });
    } else {
      navigate("/stake", { replace: true });
    }
  };

  // NEW: Function to get the actual option name instead of "Yes/No"
  const getActualOptionName = () => {
    // Check if we have event data with options
    if (eventData && eventData.options) {
      // betOption can be "yes" (0) or "no" (1)
      if (betOption === "yes" || betOption === 0) {
        return eventData.options.A || eventData.options[0] || "Yes";
      } else if (betOption === "no" || betOption === 1) {
        return eventData.options.B || eventData.options[1] || "No";
      }
    }

    // Fallback to the betOption if we don't have event data
    if (typeof betOption === "string") {
      return betOption === "yes"
        ? "Yes"
        : betOption === "no"
          ? "No"
          : betOption;
    }

    // Final fallback
    return betOption === 0 ? "Yes" : betOption === 1 ? "No" : "Unknown";
  };

  // NEW: Function to determine bet color based on option index
  const getBetOptionColor = () => {
    // For traditional Yes/No, keep the green/red pattern
    const actualOption = getActualOptionName();
    const isTraditionalYesNo = actualOption === "Yes" || actualOption === "No";

    if (isTraditionalYesNo) {
      return betOption === "yes" || betOption === 0
        ? "bg-green-500/20 text-green-400"
        : "bg-red-500/20 text-red-400";
    }

    // For custom options (like team names), use blue for first option, orange for second
    return betOption === "yes" || betOption === 0
      ? "bg-blue-500/20 text-blue-400" // First option (A)
      : "bg-orange-500/20 text-orange-400"; // Second option (B)
  };

  // Determine the main title based on context
  const getMainTitle = () => {
    if (outcome) {
      // Coming from bet history
      switch (outcome) {
        case "Won":
          return claimed ? "Reward Claimed!" : "You Won!";
        case "Lost":
          return "Bet Result";
        case "Claimed":
          return "Reward Claimed!";
        default:
          return "Bet Details";
      }
    }
    // Coming from new bet placement
    return isAdditionalStake
      ? "Additional Stake Added!"
      : "Bet Placed Successfully!";
  };

  const getSubtitle = () => {
    if (outcome) {
      // Coming from bet history
      switch (outcome) {
        case "Won":
          return claimed
            ? "Your reward has been claimed."
            : "Congratulations! Your bet was successful!";
        case "Lost":
          return "Unfortunately, your bet was not successful.";
        case "Claimed":
          return "Your reward has been successfully claimed.";
        default:
          return "Here are your bet details.";
      }
    }
    // Coming from new bet placement
    return isAdditionalStake
      ? "Your additional stake has been successfully added to your existing bet!"
      : "Your bet has been successfully placed!";
  };

  // NEW: Get token symbol from event data or state
  const getTokenSymbol = () => {
    // First, check if token symbol is passed directly in state
    if (state.tokenSymbol) {
      return state.tokenSymbol;
    }

    // Second, check if we have event data with token address
    if (eventData && eventData.tokenAddress) {
      const tokenAddr = eventData.tokenAddress.toLowerCase();
      // Map token addresses to symbols
      const TOKEN_SYMBOLS = {
        "0x56fD3F2bEE130e9867942D0F463a16fBE49B8d81": "cUSD", // cUSD token
        "0x01C5C0122039549AD1493B8220cABEdD739BC44E": "USDC", // USDC token
      };
      return TOKEN_SYMBOLS[tokenAddr] || "cUSD";
    }

    // Third, check if eventData has tokenSymbol directly
    if (eventData && eventData.tokenSymbol) {
      return eventData.tokenSymbol;
    }

    // Default to cUSD if nothing else is available
    return "cUSD";
  };

  // Don't render if no success state
  if (!state || !betSuccess) {
    return null;
  }

  const actualOptionName = getActualOptionName();
  const betOptionColor = getBetOptionColor();
  const tokenSymbol = getTokenSymbol();

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#141827]">
      <div className="flex-grow" />
      <div className="relative w-full bg-[#0B122E] rounded-t-[20px] border-t border-[#18DDF7] pt-4 px-4 max-h-[85vh] overflow-y-auto">
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

        {/* Prediction Details */}
        <div className="flex items-center justify-center py-6">
          <div className="w-full max-w-md mx-auto space-y-4 text-center">
            {/* Success Icon */}
            <div className="relative flex justify-center mb-6">
              <img
                src={glow || "/placeholder.svg"}
                alt="glow"
                className="absolute z-0 top-[-40px] scale-90"
              />
              <img
                src={Success || "/placeholder.svg"}
                alt="Success"
                className="z-10 w-12 h-12"
              />
            </div>

            {/* Title Section */}
            <div className="flex flex-col items-center space-y-2">
              <h2 className="text-xl font-semibold text-gray-100">
                {getMainTitle()}
              </h2>
              <p className="text-base text-gray-200">{getSubtitle()}</p>

              {/* Bet Details Card */}
              {question && (
                <div className="mt-4 p-4 bg-[#1A1F3F] rounded-xl w-full border border-[#18DDF7]/20 shadow-lg">
                  <div className="space-y-3">
                    {/* Question */}
                    <div>
                      <p className="mb-1 text-xs text-gray-300">Event:</p>
                      <p className="text-sm font-semibold leading-relaxed text-left text-white">
                        {question}
                      </p>
                    </div>

                    {/* Bet Details Grid */}
                    <div className="grid grid-cols-1 gap-2 pt-3 border-t border-gray-600">
                      <div className="flex items-center justify-between py-1">
                        <span className="text-xs text-gray-300">Your bet:</span>
                        <span
                          className={`font-bold text-sm px-2 py-1 rounded-full ${betOptionColor}`}
                        >
                          {actualOptionName}
                        </span>
                      </div>

                      {stake && (
                        <div className="flex items-center justify-between py-1">
                          <span className="text-xs text-gray-300">
                            {isAdditionalStake
                              ? "Additional stake:"
                              : "Stake amount:"}
                          </span>
                          <span className="text-sm font-bold text-white">
                            {stake} {tokenSymbol}
                          </span>
                        </div>
                      )}

                      {/* Show outcome if available (from bet history) */}
                      {outcome && (
                        <div className="flex items-center justify-between py-1">
                          <span className="text-xs text-gray-300">Result:</span>
                          <span
                            className={`font-bold text-sm px-2 py-1 rounded-full ${outcome === "Won"
                              ? "bg-green-500/20 text-green-400"
                              : outcome === "Lost"
                                ? "bg-red-500/20 text-red-400"
                                : outcome === "Claimed"
                                  ? "bg-blue-500/20 text-blue-400"
                                  : "bg-gray-500/20 text-gray-400"
                              }`}
                          >
                            {outcome}
                          </span>
                        </div>
                      )}

                      {potentialWinnings && potentialWinnings > 0 && (
                        <div className="flex items-center justify-between py-1">
                          <span className="text-xs text-gray-300">
                            {outcome === "Won" || outcome === "Claimed"
                              ? "Winnings:"
                              : "Potential winnings:"}
                          </span>
                          <span className="text-sm font-bold text-green-400">
                            +{potentialWinnings}%
                          </span>
                        </div>
                      )}

                      {timeLeft && (
                        <div className="flex items-center justify-between py-1">
                          <span className="text-xs text-gray-300">
                            {resultStatus === "ongoing"
                              ? "Time left:"
                              : "Status:"}
                          </span>
                          <span
                            className={`font-bold text-sm ${resultStatus === "ongoing"
                              ? "text-yellow-400"
                              : "text-gray-300"
                              }`}
                          >
                            {timeLeft}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Show claim status if applicable */}
                    {outcome === "Won" && !claimed && (
                      <div className="p-2 mt-3 border rounded-lg bg-green-500/10 border-green-500/30">
                        <p className="text-xs text-center text-green-400">
                          🎉 You can claim your reward!
                        </p>
                      </div>
                    )}

                    {claimed && (
                      <div className="p-2 mt-3 border rounded-lg bg-blue-500/10 border-blue-500/30">
                        <p className="text-xs text-center text-blue-400">
                          ✅ Reward claimed successfully!
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Show event options for reference */}
              {eventData && eventData.options && (
                <div className="mt-3 p-3 bg-[#1A1F3F]/50 rounded-lg w-full border border-[#18DDF7]/10">
                  <p className="mb-2 text-xs text-center text-gray-400">
                    Event Options:
                  </p>
                  <div className="flex justify-between text-xs">
                    <span
                      className={`px-2 py-1 rounded ${betOption === "yes" || betOption === 0
                        ? betOptionColor
                        : "bg-gray-500/20 text-gray-400"
                        }`}
                    >
                      {eventData.options.A ||
                        eventData.options[0] ||
                        "Option A"}
                    </span>
                    <span className="text-gray-500">vs</span>
                    <span
                      className={`px-2 py-1 rounded ${betOption === "no" || betOption === 1
                        ? betOptionColor
                        : "bg-gray-500/20 text-gray-400"
                        }`}
                    >
                      {eventData.options.B ||
                        eventData.options[1] ||
                        "Option B"}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="w-full pt-4 space-y-2">
              <button
                className="w-full py-3 px-4 rounded-full font-semibold text-sm bg-[#18DDF7] text-black hover:bg-opacity-90 transition-colors shadow-lg hover:shadow-xl transform hover:scale-105 duration-200"
                onClick={handleGoToActiveBets}
              >
                {outcome ? "View All Bets" : "Go to Active Bets"}
              </button>

              {/* Show claim button if user won and hasn't claimed */}
              {outcome === "Won" && !claimed && (
                <button
                  className="w-full px-4 py-3 text-sm font-semibold text-white transition-colors duration-200 transform bg-green-600 rounded-full shadow-lg hover:bg-green-700 hover:shadow-xl hover:scale-105"
                  onClick={() =>
                    navigate("/prediction-win", { state: { eventAddress } })
                  }
                >
                  Claim Reward
                </button>
              )}

              <button
                className="w-full px-4 py-2 text-sm font-semibold text-gray-400 transition-colors duration-200 transform bg-transparent border-2 border-gray-600 rounded-full shadow-lg hover:bg-gray-600 hover:text-white hover:shadow-xl hover:scale-105"
                onClick={handleClose}
              >
                Close
              </button>
            </div>

            {/* Additional info for bet history views */}
            {outcome && eventAddress && (
              <div className="pt-2">
                <p className="text-xs text-gray-500">
                  Contract: {eventAddress?.slice(0, 6)}...
                  {eventAddress?.slice(-4)}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PredictionSuccess;
