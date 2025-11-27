import React from "react";
import Up from "../../assets/images/svgs/up.svg";
import Down from "../../assets/images/svgs/down.svg";
import Share from "../../assets/images/svgs/share.svg";
import User from "../../assets/images/svgs/user-circle.svg";
import { RWebShare } from "react-web-share";

const PredictionCard = ({
  categoryIcon,
  question,
  yesPercentage = 70,
  noPercentage = 30,
  votes = "05",
  timeLeft = "20 hrs 56 mins left",
  showBorder = true,
  optionA = "Yes", // New prop for option A text
  optionB = "No", // New prop for option B text
}) => {
  return (
    <div
      className={`bg-[#09113b] rounded-xl ${
        showBorder ? "border border-[#18DDF7]" : ""
      } px-4 py-2 mt-2 mb-6`}
    >
      {/* Question Header */}
      <div className="flex items-center gap-3 mt-2 mb-3">
        <div className="w-10 h-10 rounded-sm bg-[#01052D] flex items-center justify-center text-white text-lg">
          {categoryIcon}
        </div>
        <h3 className="text-lg font-semibold text-white">{question}</h3>
      </div>

      {/* Option A (was "Yes") */}
      <div className="mb-2">
        <div className="relative w-full h-10 rounded-full bg-[#18DDF71A] overflow-hidden">
          {/* Option A Text and Icon */}
          <div className="absolute inset-y-0 flex items-center gap-2 font-semibold text-white left-5">
            <span>{optionA}</span>
            <img src={Up} alt="Up Icon" className="w-4 h-4" />
          </div>
          {/* Percentage */}
          <div className="absolute inset-y-0 flex items-center font-semibold text-white right-2">
            <span>{yesPercentage}%</span>
          </div>
          {/* Progress Bar */}
          <div
            className="h-full bg-[#18DDF7] opacity-50"
            style={{ width: `${yesPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Option B (was "No") */}
      <div>
        <div className="relative w-full h-10 rounded-full bg-[#FF5A5A1A] overflow-hidden">
          {/* Option B Text and Icon */}
          <div className="absolute inset-y-0 flex items-center gap-2 font-semibold text-white left-5">
            <span>{optionB}</span>
            <img src={Down} alt="Down Icon" className="w-4 h-4" />
          </div>
          {/* Percentage */}
          <div className="absolute inset-y-0 flex items-center font-semibold text-white right-2">
            <span>{noPercentage}%</span>
          </div>
          {/* Progress Bar */}
          <div
            className="h-full bg-[#FF5A5A] opacity-30"
            style={{ width: `${noPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Time Remaining */}
      <div className="flex items-center justify-center mt-2">
        <span className="text-gray-100">{timeLeft}</span>
      </div>

      {/* Stats Footer */}
      <div className="flex items-center justify-between mt-2 text-sm text-gray-400">
        <div className="flex items-center gap-2">
          <img src={User} alt="User icon" />
          <div className="flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-[#00FFFF] to-[#27FE60]">
            <span className="inline-block w-2 h-2 rounded-full" />
            <span>{votes}</span>
            <span>Votes</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span>{timeLeft}</span>
          <RWebShare
            data={{
              text: "Web Share - GfG",
              url: "https://www.stimapp.com",
              title: "Preden PVP",
            }}
            onClick={() => console.log("shared successfully!")}
          >
            <button className="flex items-center justify-center">
              <img src={Share} alt="share icon" className="w-4 h-4" />
            </button>
          </RWebShare>
        </div>
      </div>
    </div>
  );
};

export default PredictionCard;
