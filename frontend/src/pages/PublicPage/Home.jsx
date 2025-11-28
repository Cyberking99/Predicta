import { useState, useEffect } from "react";
import {
  Search,
  ChevronDown,
  MoreHorizontal,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { RWebShare } from "react-web-share";
import { HiQuestionMarkCircle } from "react-icons/hi";

// Import your components and assets
import ToggleMenu from "../../components/ui/ToggleMenu";
import Game from "../../assets/images/pngs/video-game.png";
import Signal from "../../assets/images/svgs/signal.svg";
import Profile from "../../assets/images/svgs/users-plus.svg";
import Up from "../../assets/images/svgs/up.svg";
import Down from "../../assets/images/svgs/down.svg";
import Share from "../../assets/images/svgs/share.svg";
import Flames from "../../assets/images/svgs/flames.svg";
import USDT from "../../assets/images/svgs/USDT.svg";
import USDC from "../../assets/images/svgs/USDC.svg";
import STIM from "../../assets/images/svgs/stim-coin.svg";

// Import the updated hook
import useEventsData from "../../../hooks/staking/useEventBetting";

// Import category icons utility
import { CategoryIcon, getCategoryIcon } from "../../utils/categoryIcons";

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

const Home = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [visibleItems, setVisibleItems] = useState(10);
  const [showModal, setShowModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const navigate = useNavigate();

  // Use the updated hook
  const {
    eventsData,
    categoryList,
    isLoading,
    errorMessage,
    refetch,
    getFilteredEvents,
  } = useEventsData();

  // Get token decimals based on address
  const getTokenDecimals = (tokenAddress) => {
    if (!tokenAddress) return 18;

    const normalizedAddress = tokenAddress.toLowerCase();
    const config = TOKEN_CONFIG[normalizedAddress];

    return config ? config.decimals : 18;
  };

  // Get token symbol based on address
  const getTokenSymbol = (tokenAddress) => {
    if (!tokenAddress) return "USDT";

    const normalizedAddress = tokenAddress.toLowerCase();
    const config = TOKEN_CONFIG[normalizedAddress];

    return config ? config.symbol : "USDT";
  };

  // Get correct token icon based on token address
  const getTokenIcon = (tokenAddress) => {
    if (!tokenAddress) return USDC;

    const normalizedAddress = tokenAddress.toLowerCase();
    const config = TOKEN_CONFIG[normalizedAddress];
    if (config) {
      return config.icon;
    }

    if (
      normalizedAddress === "0x0" ||
      normalizedAddress === "0x0000000000000000000000000000000000000000"
    ) {
      return USDC;
    }

    return USDC;
  };

  // FIXED: Function to convert BigInt to readable format with correct decimals per token
  const formatVolume = (volume, tokenAddress) => {
    try {
      if (!volume && volume !== 0) return "0";

      const decimals = getTokenDecimals(tokenAddress);
      let actualVolume;

      if (typeof volume === "bigint") {
        actualVolume = Number(volume) / Math.pow(10, decimals);
      } else if (typeof volume === "number") {
        if (volume < 1000) {
          actualVolume = volume;
        } else {
          actualVolume = volume / Math.pow(10, decimals);
        }
      } else if (typeof volume === "string") {
        const numValue = parseFloat(volume);
        if (volume.includes(".")) {
          actualVolume = numValue;
        } else if (numValue < 1000) {
          actualVolume = numValue;
        } else {
          actualVolume = numValue / Math.pow(10, decimals);
        }
      } else {
        return "0";
      }

      if (actualVolume >= 1000000) {
        return `${(actualVolume / 1000000).toFixed(2)}M`;
      } else if (actualVolume >= 1000) {
        return `${(actualVolume / 1000).toFixed(2)}K`;
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
      console.error("Error formatting volume:", error, "Input:", volume);
      return "0";
    }
  };

  // Function to format individual vote counts for modal
  const formatVoteCount = (votes, tokenAddress) => {
    try {
      if (!votes && votes !== 0) return "0";

      const decimals = getTokenDecimals(tokenAddress);
      let actualVotes;

      if (typeof votes === "bigint") {
        actualVotes = Number(votes) / Math.pow(10, decimals);
      } else if (typeof votes === "number") {
        if (votes < 1000) {
          actualVotes = votes;
        } else {
          actualVotes = votes / Math.pow(10, decimals);
        }
      } else if (typeof votes === "string") {
        const numValue = parseFloat(votes);
        if (votes.includes(".")) {
          actualVotes = numValue;
        } else if (numValue < 1000) {
          actualVotes = numValue;
        } else {
          actualVotes = numValue / Math.pow(10, decimals);
        }
      } else {
        return "0";
      }

      if (actualVotes >= 1000000) {
        return `${(actualVotes / 1000000).toFixed(2)}M`;
      } else if (actualVotes >= 1000) {
        return `${(actualVotes / 1000).toFixed(2)}K`;
      } else if (actualVotes >= 1) {
        return actualVotes.toFixed(2);
      } else if (actualVotes > 0) {
        return parseFloat(actualVotes.toFixed(6)).toString();
      } else {
        return "0";
      }
    } catch (error) {
      console.error("Error formatting vote count:", error, "Input:", votes);
      return "0";
    }
  };

  // Function to check if event is active (not expired)
  const isEventActive = (event) => {
    try {
      const now = new Date();
      const endTime = new Date(event.end_time);
      return now < endTime;
    } catch (error) {
      console.error("Error checking event time:", error);
      return false;
    }
  };

  // Get filtered events using the hook's helper function, then filter by active status
  const allFilteredEvents = getFilteredEvents(searchQuery, selectedCategory);
  const activeEvents = allFilteredEvents.filter(isEventActive);
  const visibleEvents = activeEvents.slice(0, visibleItems);
  console.log(activeEvents, visibleEvents);

  // Debug logging - Remove this in production
  useEffect(() => {
    if (visibleEvents.length > 0) {
      console.log("Sample event volume debug:", {
        question: visibleEvents[0].question.substring(0, 30),
        yes_votes: visibleEvents[0].yes_votes,
        yes_votes_type: typeof visibleEvents[0].yes_votes,
        no_votes: visibleEvents[0].no_votes,
        no_votes_type: typeof visibleEvents[0].no_votes,
        total: visibleEvents[0].yes_votes + visibleEvents[0].no_votes,
        tokenAddress: visibleEvents[0].tokenAddress,
        decimals: getTokenDecimals(visibleEvents[0].tokenAddress),
      });
    }
  }, [visibleEvents]);

  // Proper option handling for bet buttons
  const handleBetYes = (event) => {
    const betOption = "optionA";

    navigate("/prediction", {
      state: {
        betOption: betOption,
        predictionId: event.address,
        eventAddress: event.address,
        eventData: {
          question: event.question,
          options: event.options,
          category: event.category,
          totalStaked: event.yes_votes + event.no_votes,
          end_time: event.end_time,
          tokenAddress: event.tokenAddress,
        },
        question: event.question,
        options: event.options,
      },
    });
  };

  const handleBetNo = (event) => {
    const betOption = "optionB";

    navigate("/prediction", {
      state: {
        betOption: betOption,
        predictionId: event.address,
        eventAddress: event.address,
        eventData: {
          question: event.question,
          options: event.options,
          category: event.category,
          totalStaked: event.yes_votes + event.no_votes,
          end_time: event.end_time,
          tokenAddress: event.tokenAddress,
        },
        question: event.question,
        options: event.options,
      },
    });
  };

  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId);
    setShowCategoryDropdown(false);
    setVisibleItems(10);
  };

  const handleLoadMore = () => {
    setVisibleItems((prevCount) => prevCount + 10);
  };

  const openModal = (event) => {
    setSelectedEvent(event);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedEvent(null);
  };

  const refreshEvents = () => {
    refetch();
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

  const toggleOptions = [
    {
      id: "live",
      label: "Live",
      icon: Signal,
      iconAlt: "Public icon",
    },
    {
      id: "create",
      label: "Create",
      icon: Profile,
      iconAlt: "Private icon",
    },
  ];

  // Loading state
  if (isLoading) {
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
          <div className="pb-28">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold md:text-xl lg:text-2xl text-cyan-400">
                  PREDICT
                </span>
                <img
                  src={Game || "/placeholder.svg"}
                  alt="Play icon"
                  className="object-contain w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6"
                />
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div
                    className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-[#18ddf73f] opacity-80 border border-cyan-400 flex items-center justify-center cursor-pointer"
                    onClick={() => setShowDropdown(!showDropdown)}
                  >
                    <MoreHorizontal className="w-5 h-5 text-gray-400 md:w-6 md:h-6" />
                  </div>
                  {showDropdown && (
                    <div className="absolute right-0 mt-2 w-40 md:w-48 bg-[#1A1F3F] z-50 text-white rounded-lg shadow-lg p-2">
                      <div
                        className="p-2 md:p-3 hover:bg-[#252B4F] rounded-md cursor-pointer"
                        onClick={() => {
                          navigate("/bet-history");
                          setShowDropdown(false);
                        }}
                      >
                        All Predictions
                      </div>
                      <div
                        className="p-2 md:p-3 hover:bg-[#252B4F] rounded-md cursor-pointer"
                        onClick={() => {
                          refreshEvents();
                          setShowDropdown(false);
                        }}
                      >
                        Refresh Events
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <ToggleMenu options={toggleOptions} />

            <div className="flex items-center justify-center min-h-[400px]">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-12 h-12 animate-spin text-cyan-400" />
                <p className="text-lg text-white">Loading events...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
        <div className="pb-28">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold md:text-xl lg:text-2xl text-cyan-400">
                PREDICT
              </span>
              <img
                src={Game || "/placeholder.svg"}
                alt="Play icon"
                className="object-contain w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6"
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <div
                  className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-[#18ddf73f] opacity-80 border border-cyan-400 flex items-center justify-center cursor-pointer"
                  onClick={() => setShowDropdown(!showDropdown)}
                >
                  <MoreHorizontal className="w-5 h-5 text-gray-400 md:w-6 md:h-6" />
                </div>
                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-40 md:w-48 bg-[#1A1F3F] z-50 text-white rounded-lg shadow-lg p-2">
                    <div
                      className="p-2 md:p-3 hover:bg-[#252B4F] rounded-md cursor-pointer"
                      onClick={() => {
                        navigate("/bet-history");
                        setShowDropdown(false);
                      }}
                    >
                      All Predictions
                    </div>
                    <div
                      className="p-2 md:p-3 hover:bg-[#252B4F] rounded-md cursor-pointer"
                      onClick={() => {
                        refreshEvents();
                        setShowDropdown(false);
                      }}
                    >
                      Refresh Events
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <ToggleMenu options={toggleOptions} />

          {errorMessage && (
            <div className="flex items-center p-3 mb-4 text-white bg-red-500 border border-red-500 rounded-lg bg-opacity-20">
              <AlertCircle className="w-5 h-5 mr-2" />
              {errorMessage}
            </div>
          )}

          <div className="relative mt-5 mb-6">
            <div
              className="p-[2px] rounded-full w-full"
              style={{
                background: "linear-gradient(135deg, #195281, #09113B)",
              }}
            >
              <div className="flex items-center bg-[#09113B] rounded-full p-3 md:p-4 cursor-pointer">
                <Search className="w-5 h-5 mr-2 text-gray-400 md:w-6 md:h-6" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setVisibleItems(10);
                  }}
                  placeholder="Search"
                  className="flex-1 text-sm text-white placeholder-gray-400 bg-transparent outline-none md:text-base"
                />
                <div className="relative">
                  <ChevronDown
                    className={`w-5 h-5 md:w-6 md:h-6 text-gray-400 ml-2 cursor-pointer transition-transform ${showCategoryDropdown ? "rotate-180" : ""
                      }`}
                    onClick={() =>
                      setShowCategoryDropdown(!showCategoryDropdown)
                    }
                  />
                  {showCategoryDropdown && (
                    <div className="absolute right-0 mt-2 w-48 md:w-56 bg-[#1A1F3F] rounded-lg shadow-lg overflow-hidden z-50">
                      {categoryList.map((category) => (
                        <div
                          key={category.id}
                          className={`px-4 py-2 md:py-3 cursor-pointer hover:bg-[#252B4F] transition-colors ${selectedCategory === category.id
                            ? "bg-[#252B4F] text-cyan-400"
                            : "text-white"
                            }`}
                          onClick={() => handleCategorySelect(category.id)}
                        >
                          {category.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3">
            {visibleEvents.length > 0 ? (
              visibleEvents.map((event) => (
                <div
                  key={event.address}
                  className="p-[2px] rounded-2xl"
                  style={{
                    background: "linear-gradient(135deg, #195281, #09113B)",
                  }}
                >
                  <div className="bg-[#09113B] rounded-2xl p-4 h-full flex flex-col min-h-[155px]">
                    <div className="flex items-start gap-3 mb-1">
                      <div className="w-7 h-7 rounded-sm bg-[#01052D] flex items-center justify-center text-[#18DDF7] flex-shrink-0">
                        <CategoryIcon
                          categoryName={event.category?.name}
                          categoryLabel={event.category?.label}
                          className="w-4 h-4"
                        />
                      </div>
                      <div className="flex-1 min-h-[2.5rem]">
                        <h3 className="text-sm font-semibold leading-tight text-white md:text-base line-clamp-2">
                          {event.question}
                        </h3>
                      </div>
                      <div className="flex-shrink-0">
                        <HiQuestionMarkCircle
                          className="text-[#18DDF7] w-5 h-5 cursor-pointer"
                          onClick={() => openModal(event)}
                        />
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        className="flex-1 bg-[#51cddd50] text-[#18DDF7] py-2 rounded-full border border-[#18DDF7] flex items-center justify-center gap-2 transition-colors text-sm font-medium"
                        onClick={() => handleBetYes(event)}
                      >
                        {event.options.A}
                        <img
                          src={Up || "/placeholder.svg"}
                          alt="Option A icon"
                          className="w-3 h-3"
                        />
                      </button>

                      <button
                        className="flex-1 bg-[#ff5a5a3b] text-[#FF5A5A] py-2 rounded-full border border-[#FF5A5A] flex items-center justify-center gap-2 transition-colors text-sm font-medium"
                        onClick={() => handleBetNo(event)}
                      >
                        {event.options.B}
                        <img
                          src={Down || "/placeholder.svg"}
                          alt="Option B icon"
                          className="w-3 h-3"
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-auto text-xs text-gray-400">
                      <div className="flex items-center gap-1.5">
                        <img
                          src={getTokenIcon(event.tokenAddress)}
                          alt="token icon"
                          className="w-3 h-3"
                        />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00FFFF] to-[#27FE60]">
                          vol.{" "}
                          {formatVolume(
                            event.yes_votes + event.no_votes,
                            event.tokenAddress
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-white">
                          {formatTimeRemaining(event.end_time)}
                        </span>
                      </div>
                      <div className="flex items-center justify-center">
                        <RWebShare
                          data={{
                            text: event.question,
                            url: `${window.location.origin}/event/${event.address}`,
                            title: "Preden PVP",
                          }}
                          onClick={() => console.log("shared successfully!")}
                        >
                          <button className="flex items-center justify-center">
                            <img
                              src={Share || "/placeholder.svg"}
                              alt="share icon"
                              className="w-3 h-3"
                            />
                          </button>
                        </RWebShare>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center col-span-full">
                <p className="text-lg text-white">No active events found</p>
              </div>
            )}
          </div>

          {visibleItems < activeEvents.length && (
            <div className="flex justify-center mt-6">
              <button
                onClick={handleLoadMore}
                className="px-6 py-2 md:px-8 md:py-3 bg-[#1A1F3F] text-cyan-400 rounded-full hover:bg-[#252B4F] transition-colors text-sm md:text-base"
              >
                See More ({activeEvents.length - visibleItems} more active
                events)
              </button>
            </div>
          )}
        </div>
      </div>

      {showModal && selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-800 bg-opacity-75">
          <div className="bg-[#1A1F3F] p-6 rounded-lg w-full max-w-md md:max-w-lg lg:max-w-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white md:text-xl lg:text-2xl">
                Event Info
              </h2>
              <button
                className="text-xl text-white md:text-2xl hover:text-cyan-400"
                onClick={closeModal}
              >
                &times;
              </button>
            </div>
            <div className="mt-4 text-sm text-white md:text-base">
              <p className="mb-2">
                <strong>Question:</strong> {selectedEvent.question}
              </p>
              <p className="mb-2">
                <strong>Description:</strong>{" "}
                {selectedEvent.description ||
                  "No additional information available."}
              </p>
              <p className="mb-2">
                <strong>Category:</strong>{" "}
                {selectedEvent.category?.label || "Unknown"}
              </p>
              <p className="mb-2">
                <strong>End Date:</strong>{" "}
                {new Date(selectedEvent.end_time).toLocaleString()}
              </p>
              <p className="mb-2">
                <strong>Time Remaining:</strong>{" "}
                {formatTimeRemaining(selectedEvent.end_time)}
              </p>
              <p className="mb-2">
                <strong>Contract Address:</strong> {selectedEvent.address}
              </p>
              <div className="mt-4">
                <p className="mb-1">
                  <strong>Current Prediction:</strong>
                </p>
                <div className="flex gap-4 mt-2">
                  <div className="flex-1 bg-[#51cddd20] text-[#18DDF7] py-2 px-4 rounded-lg">
                    <div className="text-center">
                      <div className="font-semibold">
                        {selectedEvent.options.A}
                      </div>
                      <div className="text-xs">
                        {formatVoteCount(
                          selectedEvent.yes_votes,
                          selectedEvent.tokenAddress
                        )}{" "}
                        {getTokenSymbol(selectedEvent.tokenAddress)}
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 bg-[#ff5a5a20] text-[#FF5A5A] py-2 px-4 rounded-lg">
                    <div className="text-center">
                      <div className="font-semibold">
                        {selectedEvent.options.B}
                      </div>
                      <div className="text-xs">
                        {formatVoteCount(
                          selectedEvent.no_votes,
                          selectedEvent.tokenAddress
                        )}{" "}
                        {getTokenSymbol(selectedEvent.tokenAddress)}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-2 text-xs text-center text-gray-400">
                  Total Volume:{" "}
                  {formatVolume(
                    selectedEvent.yes_votes + selectedEvent.no_votes,
                    selectedEvent.tokenAddress
                  )}{" "}
                  {getTokenSymbol(selectedEvent.tokenAddress)}
                </div>
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <button
                className="px-4 py-2 bg-cyan-500 text-[#09113B] rounded-lg hover:bg-cyan-400 transition-colors"
                onClick={closeModal}
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

export default Home;
