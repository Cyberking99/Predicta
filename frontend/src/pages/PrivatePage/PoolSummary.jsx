import React, { useState } from "react";
import { X } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import Up from "../../assets/images/svgs/up.svg";
import Down from "../../assets/images/svgs/down.svg";
import Flag from "../../assets/images/pngs/flag-us.png";
import USDT from "../../assets/images/pngs/usdt.png";
import User from "../../assets/images/svgs/user-circle.svg";

const PoolSummary = () => {
  const [stake, setStake] = useState(1);
  const navigate = useNavigate();
  const { state } = useLocation();
  const { betOption } = state || {};

  const handleClose = () => navigate(-1);

  const handleConfirm = () => {
    navigate("/pool-success");
  };

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

        {/* Confirm Prediction Content */}
        <div className="flex items-center justify-center gap-3 mt-10">
          <h3 className="text-white text-2xl font-semibold">Pool Summary</h3>
        </div>

        {/* Prediction Details */}
        <div className="bg-[#0A0E2E] mt-16 rounded-xl border border-[#18DDF7] px-4 py-6">
          <div className="flex items-center gap-3 mb-6 mt-6">
            <img
              src={Flag}
              alt="Flag"
              className="w-10 h-10 rounded-sm bg-[#01052D]"
            />
            <h3 className="text-white text-lg font-semibold">
              Will United States Win The Final World Cup?
            </h3>
          </div>

          {/* Stake */}
          <div className="mb-6">
            {/* Remaining Time */}
            <div className="flex justify-center gap-4 items-center mt-5">
              <h2 className="text-gray-100 text-lg">Duration</h2>
              <span className="text-gray-100 text-xl font-semibold p-4 bg-[#19528133] rounded-full">
                20 hrs 56 mins left
              </span>
            </div>
            <div className="h-[0.3px] bg-[#18DDF7] mt-10 opacity-40 rounded-full"></div>
          </div>

          {/* Potential Winnings */}
          <div className="flex items-center flex-col text-sm text-gray-100 mb-6">
            <div className="flex items-center justify-between w-full gap-2">
              <h2 className="text-gray-100 text-lg font-semibold">Options</h2>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg text-[#18DDF7]">Bet Yes</span>
                  <img src={Up} alt="" className="w-4 h-4" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-md text-[#FF443E]">Bet No</span>
                  <img src={Down} alt="" className="w-4 h-4" />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between w-full gap-2">
              <h2 className="text-white font-semibold text-lg">
                Slot Limit
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-md">5 Slots</span>
              </div>
            </div>
          </div>
        </div>
          {/* Confirm Button */}
          <div className="mt-8">
          <button
            className="w-full py-4 rounded-full font-semibold bg-[#18DDF7] text-black"
            onClick={handleConfirm}
          >
            Confirm
          </button>
          </div>
      </div>
    </div>
  );
};

export default PoolSummary;
