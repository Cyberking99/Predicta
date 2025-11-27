"use client"

import { useNavigate, useLocation } from "react-router-dom"

// Import your existing assets
import Up from "../../assets/images/svgs/up.svg"
import Down from "../../assets/images/svgs/down.svg"
import Flag from "../../assets/images/pngs/flag-us.png"
import USDT from "../../assets/images/pngs/usdt.png"
import Failure from "../../assets/images/svgs/failure.svg"
import Close from "../../assets/images/svgs/x-close.svg"

const EnhancedPredictionLoss = () => {
  const navigate = useNavigate()
  const { state } = useLocation()
  const { notification } = state || {}

  const handleClose = () => navigate(-1)
  const handleBack = () => navigate("/play")

  // Use data from notification if available, otherwise use defaults
  const displayData = {
    question: notification?.eventDetails?.question || "Will United States Win The Final World Cup?",
    userBetOption: notification?.eventDetails?.userBetOption || 1,
    resultText: notification?.eventDetails?.result || "United States Loses!",
    stake: notification?.userStake || "1",
    eventImage: notification?.eventDetails?.eventImage,
    totalStaked: notification?.eventDetails?.totalStaked || "0",
    creatorFeePercentage: notification?.eventDetails?.creatorFeePercentage || 0,
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#141827]">
      <div className="relative w-full bg-[#0B122E] h-full rounded-t-[20px] border-t border-[#18DDF7] mt-40 pt-3 px-4">
        {/* Close Button */}
        <button className="absolute right-4 bg-[#1A1F3F] rounded-full p-2 hover:bg-opacity-80" onClick={handleClose}>
          <img src={Close || "/placeholder.svg"} alt="close image" />
        </button>

        {/* Loss Content */}
        <div className="flex flex-col items-center justify-center gap-3 mt-5">
          <div className="flex justify-center">
            <img src={Failure || "/placeholder.svg"} alt="Failure" className="w-10 h-10" />
          </div>
          <h3 className="text-white text-xl font-semibold">Better Luck Next Time</h3>
        </div>

        {/* Prediction Details */}
        <div className="bg-[#0A0E2E] mt-8 rounded-xl border border-[#18DDF7] px-3 py-2">
          <div className="flex items-center justify-center gap-3 mb-3 mt-6">
            <img
              src={displayData.eventImage || Flag || "/placeholder.svg"}
              alt="Event"
              className="w-10 h-10 rounded-sm bg-[#01052D] object-cover"
            />
            <h3 className="text-white text-lg font-semibold">{displayData.question}</h3>
          </div>

          {/* User's Bet */}
          <div className="mb-2">
            <div className="relative flex justify-center">
              <button className="bg-[#18DDF71A] text-[#18DDF7] py-2 w-[200px] rounded-full flex items-center justify-center gap-2 transition-colors">
                {displayData.userBetOption === 1 ? "Bet Yes" : "Bet No"}
                <img
                  src={displayData.userBetOption === 1 ? Up : Down}
                  alt={displayData.userBetOption === 1 ? "Yes icon" : "No icon"}
                  className="w-4 h-4"
                />
              </button>
            </div>
            {/* Result */}
            <div className="flex justify-center items-center mt-1">
              <p className="text-gray-100">
                Result: <span className="text-red-400">{displayData.resultText}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Loss Details */}
        <div className="flex items-center flex-col text-sm text-gray-400 mt-2">
          <div className="flex items-center justify-between w-full gap-2">
            <h2 className="text-gray-100 text-md font-semibold">Your Stake:</h2>
            <div className="flex items-center gap-2">
              <img src={USDT || "/placeholder.svg"} alt="" className="w-4 h-4" />
              <span className="text-lg font-semibold">${displayData.stake}</span>
            </div>
          </div>
          <div className="flex items-center justify-between w-full gap-2">
            <h2 className="text-gray-100 font-semibold text-md">Total Pool:</h2>
            <div className="flex items-center gap-2">
              <img src={USDT || "/placeholder.svg"} alt="" className="w-4 h-4" />
              <span className="text-lg font-semibold">${displayData.totalStaked}</span>
            </div>
          </div>
          <div className="flex items-center justify-between w-full gap-2">
            <h2 className="text-gray-100 font-semibold text-md">Creator Fee:</h2>
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold">{displayData.creatorFeePercentage}%</span>
            </div>
          </div>
          <div className="flex items-center justify-between w-full gap-2 border-t border-gray-600 pt-2 mt-2">
            <h2 className="text-gray-100 font-semibold text-lg">Lost Amount:</h2>
            <div className="flex items-center gap-2">
              <img src={USDT || "/placeholder.svg"} alt="" className="w-4 h-4" />
              <span className="text-lg font-semibold text-red-400">${displayData.stake}</span>
            </div>
          </div>
        </div>

        {/* Loss Message */}
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mt-4">
          <p className="text-red-400 text-center font-semibold">
            Your prediction was incorrect. Better luck next time!
          </p>
        </div>

        {/* Go Back Button */}
        <button
          className="w-full py-3 mt-4 rounded-full font-semibold bg-[#18DDF7] text-black hover:bg-opacity-90 transition-opacity"
          onClick={handleBack}
        >
          Back to Play
        </button>
      </div>
    </div>
  )
}

export default EnhancedPredictionLoss
