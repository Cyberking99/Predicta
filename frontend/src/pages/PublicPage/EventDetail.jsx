import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { HiQuestionMarkCircle } from "react-icons/hi";
import { RWebShare } from "react-web-share";

// Import your existing components and utilities
import { CategoryIcon } from "../../utils/categoryIcons";
import useEventsData from "../../../hooks/staking/useEventBetting";

// Import your assets
import Up from "../../assets/images/svgs/up.svg";
import Down from "../../assets/images/svgs/down.svg";
import Share from "../../assets/images/svgs/share.svg";
import Flames from "../../assets/images/svgs/flames.svg";
import USDC from "../../assets/images/svgs/USDC.svg";
import USDT from "../../assets/images/svgs/USDT.svg";

// Token configuration
const TOKEN_CONFIG = {
  [import.meta.env.VITE_USDT_ADDRESS]: {
    name: "USDT",
    symbol: "USDT",
    decimals: 18,
    icon: USDT,
  },
  [import.meta.env.VITE_USDC_ADDRESS]: {
    name: "USDC",
    symbol: "USDC",
    decimals: 18,
    icon: USDC,
  },
};

const EventDetail = () => {
  const { eventAddress } = useParams();
  const navigate = useNavigate();
  const [eventData, setEventData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);

  // Use your existing hook to get events data
  const { eventsData, isLoading: eventsLoading } = useEventsData();

  // Find the specific event when data is loaded
  useEffect(() => {
    if (!eventsLoading && eventsData && eventsData.length > 0) {
      const foundEvent = eventsData.find(
        (event) => event.address.toLowerCase() === eventAddress.toLowerCase()
      );

      if (foundEvent) {
        setEventData(foundEvent);
        setError("");
      } else {
        setError("Event not found or may have expired");
      }
      setLoading(false);
    }
  }, [eventsData, eventsLoading, eventAddress]);

  // Helper functions (copied from your Home component)
  const getTokenIcon = (tokenAddress) => {
    if (!tokenAddress) return "/default-token-icon"; // Update with your default icon path

    const normalizedAddress = tokenAddress.toLowerCase();
    const config = TOKEN_CONFIG[normalizedAddress];
    if (config) {
      return config.icon;
    }

    return "/default-token-icon"; // Default fallback
  };

  const getTokenSymbol = (tokenAddress) => {
    const normalizedAddress = tokenAddress.toLowerCase();
    const config = TOKEN_CONFIG[normalizedAddress];

    return config ?? config.symbol;
  };

  const getTokenDecimals = (tokenAddress) => {
    if (!tokenAddress) return 18;

    const normalizedAddress = tokenAddress.toLowerCase();
    const config = TOKEN_CONFIG[normalizedAddress];

    return config ? config.decimals : 18;
  };

  const formatVolume = (volume, tokenAddress) => {
    try {
      if (!volume) return "0";

      const decimals = getTokenDecimals(tokenAddress);
      const volumeStr = volume.toString();
      let actualVolume;

      if (volumeStr.includes(".")) {
        actualVolume = parseFloat(volumeStr);
      } else {
        actualVolume = Number(volumeStr) / Math.pow(10, decimals);
      }

      if (actualVolume >= 1000000) {
        return `${(actualVolume / 1000000).toFixed(2)}M`;
      } else if (actualVolume >= 1) {
        return actualVolume.toFixed(2);
      } else if (actualVolume >= 0.01) {
        return actualVolume.toFixed(2);
      } else if (actualVolume > 0) {
        return parseFloat(actualVolume.toFixed(6)).toString();
      } else {
        return "0";
      }
    } catch (error) {
      console.error("Error formatting volume:", error);
      return "0";
    }
  };

  const formatTimeRemaining = (endTimeString) => {
    try {
      const now = new Date();
      const endTime = new Date(endTimeString);
      const timeLeft = endTime - now;

      if (timeLeft <= 0) return "Ended";

      const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        return `${days}d ${hours}h`;
      } else if (hours > 0) {
        return `${hours}h ${minutes}m`;
      } else if (minutes > 0) {
        return `${minutes}m`;
      } else {
        return "< 1m";
      }
    } catch (error) {
      console.error("Error formatting time:", error);
      return "Invalid time";
    }
  };

  const handleBetYes = () => {
    navigate("/prediction", {
      state: {
        betOption: "optionA",
        predictionId: eventData.address,
        eventAddress: eventData.address,
        eventData: {
          question: eventData.question,
          options: eventData.options,
          category: eventData.category,
          totalStaked: eventData.yes_votes + eventData.no_votes,
          end_time: eventData.end_time,
          tokenAddress: eventData.tokenAddress,
        },
        question: eventData.question,
        options: eventData.options,
      },
    });
  };

  const handleBetNo = () => {
    navigate("/prediction", {
      state: {
        betOption: "optionB",
        predictionId: eventData.address,
        eventAddress: eventData.address,
        eventData: {
          question: eventData.question,
          options: eventData.options,
          category: eventData.category,
          totalStaked: eventData.yes_votes + eventData.no_votes,
          end_time: eventData.end_time,
          tokenAddress: eventData.tokenAddress,
        },
        question: eventData.question,
        options: eventData.options,
      },
    });
  };

  if (loading || eventsLoading) {
    return (
      <div className="relative min-h-screen p-4 md:p-6 lg:p-8">
        <div className="fixed inset-0 w-full h-full pointer-events-none -z-10">
          <img
            src={Flames || "/placeholder.svg"}
            alt="background"
            className="object-cover w-full h-full"
          />
        </div>
        <div className="relative z-10 max-w-screen-xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 rounded-full animate-spin border-cyan-400 border-t-transparent"></div>
              <p className="text-lg text-white">Loading event...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !eventData) {
    return (
      <div className="relative min-h-screen p-4 md:p-6 lg:p-8">
        <div className="fixed inset-0 w-full h-full pointer-events-none -z-10">
          <img
            src={Flames || "/placeholder.svg"}
            alt="background"
            className="object-cover w-full h-full"
          />
        </div>
        <div className="relative z-10 max-w-screen-xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <h2 className="mb-4 text-2xl font-bold text-white">
                Event Not Found
              </h2>
              <p className="mb-6 text-gray-400">
                {error || "This event may have been removed or expired."}
              </p>
              <button
                onClick={() => navigate("/predict")}
                className="px-6 py-3 text-white transition-colors rounded-lg bg-cyan-500 hover:bg-cyan-400"
              >
                Back to Events
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen p-4 md:p-6 lg:p-8">
      {/* Background */}
      <div className="fixed inset-0 w-full h-full pointer-events-none -z-10">
        <img
          src={Flames || "/placeholder.svg"}
          alt="background"
          className="object-cover w-full h-full"
        />
      </div>

      <div className="relative z-10 max-w-screen-xl mx-auto">
        <div className="pb-28">
          {/* Back Button */}
          <div className="mb-6">
            <button
              onClick={() => navigate("/predict")}
              className="transition-colors text-cyan-400 hover:text-cyan-300"
            >
              ← Back to Events
            </button>
          </div>

          {/* Event Card - Larger version */}
          <div className="max-w-2xl mx-auto">
            <div
              className="p-[2px] rounded-2xl"
              style={{
                background: "linear-gradient(135deg, #195281, #09113B)",
              }}
            >
              <div className="bg-[#09113B] rounded-2xl p-6 h-full flex flex-col">
                <div className="flex items-start gap-4 mb-4">
                  {/* Category Icon */}
                  <div className="w-10 h-10 rounded-sm bg-[#01052D] flex items-center justify-center text-[#18DDF7] flex-shrink-0">
                    <CategoryIcon
                      categoryName={eventData.category?.name}
                      categoryLabel={eventData.category?.label}
                      className="w-6 h-6"
                    />
                  </div>
                  <div className="flex-1">
                    <h1 className="mb-2 text-xl font-bold leading-tight text-white md:text-2xl">
                      {eventData.question}
                    </h1>
                    {eventData.description && (
                      <p className="text-sm text-gray-300 md:text-base">
                        {eventData.description}
                      </p>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    <HiQuestionMarkCircle
                      className="text-[#18DDF7] w-6 h-6 cursor-pointer"
                      onClick={() => setShowModal(true)}
                    />
                  </div>
                </div>

                {/* Betting Options */}
                <div className="flex gap-4 mb-6">
                  <button
                    className="flex-1 bg-[#51cddd50] text-[#18DDF7] py-4 rounded-full border border-[#18DDF7] flex items-center justify-center gap-3 transition-colors text-lg font-medium hover:bg-[#51cddd70]"
                    onClick={handleBetYes}
                  >
                    {eventData.options.A}
                    <img
                      src={Up || "/placeholder.svg"}
                      alt="Option A icon"
                      className="w-4 h-4"
                    />
                  </button>

                  <button
                    className="flex-1 bg-[#ff5a5a3b] text-[#FF5A5A] py-4 rounded-full border border-[#FF5A5A] flex items-center justify-center gap-3 transition-colors text-lg font-medium hover:bg-[#ff5a5a50]"
                    onClick={handleBetNo}
                  >
                    {eventData.options.B}
                    <img
                      src={Down || "/placeholder.svg"}
                      alt="Option B icon"
                      className="w-4 h-4"
                    />
                  </button>
                </div>

                {/* Event Stats */}
                <div className="flex items-center justify-between text-sm text-gray-400">
                  <div className="flex items-center gap-2">
                    <img
                      src={getTokenIcon(eventData.tokenAddress)}
                      alt="token icon"
                      className="w-4 h-4"
                    />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00FFFF] to-[#27FE60]">
                      Volume:{" "}
                      {formatVolume(
                        eventData.yes_votes + eventData.no_votes,
                        eventData.tokenAddress
                      )}{" "}
                      {getTokenSymbol(eventData.tokenAddress)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-white">
                      {formatTimeRemaining(eventData.end_time)}
                    </span>
                  </div>
                  <div className="flex items-center justify-center">
                    <RWebShare
                      data={{
                        text: eventData.question,
                        url: window.location.href,
                        title: "STIM PVP - " + eventData.question,
                      }}
                      onClick={() => console.log("Event shared successfully!")}
                    >
                      <button className="flex items-center justify-center p-2 hover:bg-[#1A1F3F] rounded-full transition-colors">
                        <img
                          src={Share || "/placeholder.svg"}
                          alt="share icon"
                          className="w-4 h-4"
                        />
                      </button>
                    </RWebShare>
                  </div>
                </div>

                {/* Category and Contract Info */}
                <div className="pt-4 mt-6 border-t border-gray-700">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Category:</span>
                      <p className="text-white">
                        {eventData.category?.label || "Unknown"}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-400">Event Type:</span>
                      <p className="text-white capitalize">
                        {eventData.eventType || "Binary"}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-400">Contract:</span>
                      <p className="font-mono text-xs text-white break-all">
                        {eventData.address}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-800 bg-opacity-75">
          <div className="bg-[#1A1F3F] p-6 rounded-lg w-full max-w-md md:max-w-lg lg:max-w-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white md:text-xl lg:text-2xl">
                Event Details
              </h2>
              <button
                className="text-xl text-white md:text-2xl hover:text-cyan-400"
                onClick={() => setShowModal(false)}
              >
                &times;
              </button>
            </div>
            <div className="mt-4 text-sm text-white md:text-base">
              <p className="mb-2">
                <strong>Question:</strong> {eventData.question}
              </p>
              <p className="mb-2">
                <strong>Description:</strong>{" "}
                {eventData.description ||
                  "No additional information available."}
              </p>
              <p className="mb-2">
                <strong>Category:</strong>{" "}
                {eventData.category?.label || "Unknown"}
              </p>
              <p className="mb-2">
                <strong>End Date:</strong>{" "}
                {new Date(eventData.end_time).toLocaleString()}
              </p>
              <p className="mb-2">
                <strong>Time Remaining:</strong>{" "}
                {formatTimeRemaining(eventData.end_time)}
              </p>
              <p className="mb-2">
                <strong>Contract Address:</strong> {eventData.address}
              </p>
              <div className="mt-4">
                <p className="mb-1">
                  <strong>Current Prediction:</strong>
                </p>
                <div className="flex gap-4 mt-2">
                  <div className="flex-1 bg-[#51cddd20] text-[#18DDF7] py-2 px-4 rounded-lg">
                    <div className="text-center">
                      <div className="font-semibold">{eventData.options.A}</div>
                      <div className="text-xs">
                        {formatVolume(
                          eventData.yes_votes,
                          eventData.tokenAddress
                        )}{" "}
                        {getTokenSymbol(eventData.tokenAddress)}
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 bg-[#ff5a5a20] text-[#FF5A5A] py-2 px-4 rounded-lg">
                    <div className="text-center">
                      <div className="font-semibold">{eventData.options.B}</div>
                      <div className="text-xs">
                        {formatVolume(
                          eventData.no_votes,
                          eventData.tokenAddress
                        )}{" "}
                        {getTokenSymbol(eventData.tokenAddress)}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-2 text-xs text-center text-gray-400">
                  Total Volume:{" "}
                  {formatVolume(
                    eventData.yes_votes + eventData.no_votes,
                    eventData.tokenAddress
                  )}{" "}
                  {getTokenSymbol(eventData.tokenAddress)}
                </div>
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <button
                className="px-4 py-2 bg-cyan-500 text-[#09113B] rounded-lg hover:bg-cyan-400 transition-colors"
                onClick={() => setShowModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventDetail;
