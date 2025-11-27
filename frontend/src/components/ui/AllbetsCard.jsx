import React from "react";
import { ChevronRight } from "lucide-react";

const BetCard = ({
  flag,
  question,
  yesPercentage,
  noPercentage,
  votes,
  timeLeft,
  category,
  onViewDetails,
  outcome,
  stake,
  bet
}) => {
  return (
    <div className="mb-4 p-6 rounded-2xl bg-[#0A1230] border border-[#1E2B4D]">
      <div className="flex gap-3">
        <div className="w-10 h-10">
          <div className="bg-white/5 w-full h-full rounded-lg flex items-center justify-center">
            <img src={flag} alt={category} className="w-8 h-8 object-cover" />
          </div>
        </div>
        <div className="flex flex-col flex-1">
          <h3 className="text-white text-base font-medium mb-2">{question}</h3>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-sm">Bet:</span>
              <span className="text-white text-sm">{bet}</span>
            </div>
            {outcome && (
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-sm">Outcome:</span>
                <span className={`text-sm ${outcome === "Won" ? "text-green-400" : "text-red-400"}`}>
                  {outcome}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-sm">Stake:</span>
              <span className="text-white text-sm">${stake}</span>
            </div>
            {timeLeft && (
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-sm">Ending in:</span>
                <span className="text-white text-sm">{timeLeft}</span>
              </div>
            )}
          </div>
          <button
            onClick={onViewDetails}
            className="mt-4 text-cyan-400 text-sm px-4 py-2 rounded-lg bg-cyan-400/10 hover:bg-cyan-400/20 transition-colors w-fit flex items-center gap-2"
          >
            View Details
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

const AllPredictions = ({ predictions }) => {
  const [activeTab, setActiveTab] = React.useState("Ongoing");

  return (
    <div className="flex flex-col">
      {/* Search Bar */}
      <div className="relative mb-6">
        <input 
          type="text" 
          placeholder="Search" 
          className="w-full bg-[#0A1230] border border-[#1E2B4D] rounded-xl px-4 py-3 text-white pl-10"
        />
        <svg
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </div>

      {/* Tabs */}
      <div className="flex gap-8 mb-6 text-sm">
        <button 
          className={`${activeTab === "All Bets" ? "text-cyan-400 border-b-2 border-cyan-400" : "text-white"} pb-2`}
          onClick={() => setActiveTab("All Bets")}
        >
          All Bets
        </button>
        <button 
          className={`${activeTab === "Ongoing" ? "text-cyan-400 border-b-2 border-cyan-400" : "text-white"} pb-2`}
          onClick={() => setActiveTab("Ongoing")}
        >
          Ongoing
        </button>
        <button 
          className={`${activeTab === "Completed" ? "text-cyan-400 border-b-2 border-cyan-400" : "text-white"} pb-2`}
          onClick={() => setActiveTab("Completed")}
        >
          Completed
        </button>
      </div>

      {/* Date Header */}
      <div className="text-cyan-400 text-sm mb-4">
        Today- Monday, November 4, 2024
      </div>

      {/* Bet Cards */}
      {predictions.map((prediction) => (
        <BetCard
          key={prediction.id}
          {...prediction}
          bet="Yes"
          stake={prediction.id === 1 ? "1.00" : prediction.id === 2 ? "12.50" : "1.00"}
          outcome={prediction.id === 2 ? "Won" : prediction.id === 3 ? "Lost" : null}
          onViewDetails={() => console.log(`View details for ${prediction.question}`)}
        />
      ))}
    </div>
  );
};

export default AllPredictions;