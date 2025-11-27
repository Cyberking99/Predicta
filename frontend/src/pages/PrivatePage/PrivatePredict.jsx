import React, { useState } from "react";
import { X } from "lucide-react";
import User from "../../assets/images/svgs/user-circle.svg";
import { useNavigate, useLocation } from "react-router-dom";
import Flag from "../../assets/images/pngs/flag-us.png";
import USDT from "../../assets/images/pngs/usdt.png";
import Up from "../../assets/images/svgs/up.svg";
import Down from "../../assets/images/svgs/down.svg";
import Share from "../../assets/images/svgs/share.svg";
import { RWebShare } from "react-web-share";

import PredictionCard from "../../components/ui/PredictionCard";

const Prediction = () => {
  const [stake, setStake] = useState(1);
  const navigate = useNavigate();
  const { state } = useLocation();
  const { betOption } = state || {};
  const [searchQuery, setSearchQuery] = useState("");

  const handleClose = () => navigate(-1);

  const handleContinue = () => {
    navigate("/confirm-prediction");
  };

  const handleSelectStake = (amount) => {
    setStake(amount);
  };

  const handleBetYes = () => {
    navigate("/prediction", { state: { betOption: "yes" } });
  };

  const handleBetNo = () => {
    navigate("/prediction", { state: { betOption: "no" } });
  };

  const predictions = [
    {
      id: 1,
      flag: Flag,
      question: "Will United States Win The Final World Cup?",
      image: User,
      votes: "05",
      timeLeft: "20 hrs 56 mins left",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80">
      <div className="relative mt-36 w-[100%] h-[80%] max-w-md bg-[#09113B] rounded-t-3xl p-6">
        {/* Close Button */}
        <button
          className="absolute top-4 right-4 bg-[#18DDF7] flex items-center justify-center opacity-40 rounded-full w-10 h-10 hover:text-white"
          onClick={handleClose}
        >
          <X className="text-blue-600" />
        </button>
        {predictions
          .filter((pred) =>
            searchQuery
              ? pred.question.toLowerCase().includes(searchQuery.toLowerCase())
              : true
          )
          .map((prediction) => (
            <div
              key={prediction.id}
              className="p-[2px] mt-20 mb-4 rounded-2xl"
              style={{
                background: "linear-gradient(135deg, #195281, #09113B)",
              }}
            >
              <div className="bg-[#09113B] rounded-2xl p-4">
                <div className="flex items-center gap-3 mb-4">
                  <img
                    src={prediction.flag}
                    alt="Flag"
                    className="w-8 h-8 rounded-sm bg-[#01052D]"
                  />
                  <div className="flex-1">
                    <h3 className="mb-1 font-semibold text-white">
                      {prediction.question}
                    </h3>
                  </div>
                </div>

                {/* Bet Yes and Bet No Buttons */}
                <div className="flex gap-4 mb-4">
                  {/* Bet Yes Button */}
                  <button
                    className="flex-1 bg-[#18DDF71A] text-[#18DDF7] py-2 rounded-full border border-[#18DDF7] flex items-center justify-center gap-2 transition-colors"
                    onClick={handleBetYes}
                  >
                    Bet Yes
                    <img src={Up} alt="Yes icon" className="w-4 h-4" />
                  </button>

                  {/* Bet No Button */}
                  <button
                    className="flex-1 bg-[#FF5A5A1A] text-[#FF5A5A] py-2 rounded-full border border-[#FF5A5A] flex items-center justify-center gap-2 transition-colors"
                    onClick={handleBetNo}
                  >
                    Bet No
                    <img src={Down} alt="No icon" className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center justify-center text-sm text-gray-400">
                  <div className="flex items-center justify-center gap-4">
                    <span>{prediction.timeLeft}</span>
                    <RWebShare
                      data={{
                        text: "Web Share - GfG",
                        url: "http://localhost:3000",
                        title: "Preden PVP",
                      }}
                      onClick={() => console.log("shared successfully!")}
                      style={{
                        background: "#000",
                      }}
                    >
                      <button className="flex items-center justify-center">
                        <img src={Share} alt="share icon w-4 h-4" />
                      </button>
                    </RWebShare>
                  </div>
                </div>
              </div>
            </div>
          ))}
        {/* Stake Information */}
        <div className="mb-4">
          <label className="block mb-2 text-sm text-gray-400">Stake</label>
          <div className="relative">
            <input
              type="number"
              value={stake}
              onChange={(e) => setStake(e.target.value)}
              className="w-full  p-2 bg-[#1A1F3F] text-white rounded-md"
              min="1"
              placeholder="1 Stake - $1.00"
            />
            <img
              src={USDT}
              alt="USDT token"
              className="absolute w-5 h-5 transform -translate-y-1/2 right-3 top-1/2"
            />
          </div>

          {/* Amounts */}
          <ul className="flex items-center justify-center mt-3 space-x-5 text-lg">
            {[1, 5, 10, 20, 50, 100].map((amount) => (
              <li
                key={amount}
                className="flex items-center gap-2 cursor-pointer hover:opacity-80"
                onClick={() => handleSelectStake(amount)}
              >
                <img src={USDT} alt="USDT Token" className="w-5 h-5" />
                <span className="text-white">{amount}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Continue Button */}
        <button
          className={`w-full py-4 rounded-full font-semibold ${
            stake <= 0
              ? "bg-[#0000004D] opacity-70 cursor-not-allowed text-gray-200"
              : "bg-[#18DDF7] text-black"
          }`}
          disabled={stake <= 0}
          onClick={handleContinue}
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default Prediction;
