"use client"
import { useNavigate, useLocation } from "react-router-dom"
import HeaderBar from "../../components/Headerbar"
import Close from "../../assets/images/svgs/x-close.svg"
import Up from "../../assets/images/svgs/up.svg"
import Down from "../../assets/images/svgs/down.svg"
import CUSD from "../../assets/images/pngs/cUSD.png"

const ConfirmPrediction = () => {
  const navigate = useNavigate()
  const { state } = useLocation()
  const { betOption, stake, predictionId, question, timeLeft, potentialWinnings, eventAddress, eventData } = state || {}

  const handleClose = () => navigate(-1)

  const handleConfirm = () => {
    navigate("/prediction-success", {
      state: {
        betOption,
        stake,
        predictionId,
        question,
        potentialWinnings,
        eventAddress,
        eventData,
      },
    })
  }

  // Calculate potential ROI amount
  const calculateROI = () => {
    if (!stake || !potentialWinnings) return "0.00"
    const stakeAmount = Number.parseFloat(stake)
    const roiAmount = stakeAmount * (potentialWinnings / 100)
    return roiAmount.toFixed(2)
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#141827]">
      <HeaderBar handleClose={handleClose} />
      <div className="relative w-full bg-[#0B122E] h-full rounded-t-[20px] border-t border-[#18DDF7] mt-40 pt-6 px-4">
        <button className="absolute right-4 bg-[#1A1F3F] rounded-full p-2 hover:bg-opacity-80" onClick={handleClose}>
          <img src={Close || "/placeholder.svg"} alt="close" className="w-6 h-6" />
        </button>

        <div className="flex items-center justify-center gap-3 mt-10 mb-6">
          <h3 className="text-white text-xl font-semibold">Summary</h3>
        </div>

        <div className="bg-[#09113b] mt-16 rounded-xl border border-[#18DDF7] px-4 py-6">
          <div className="mb-6 text-center">
            <h3 className="text-white text-lg font-semibold">{question || "Loading..."}</h3>
          </div>

          <div className="mb-2">
            <div className="relative flex justify-center">
              <button className="bg-[#18ddf759] text-[#18DDF7] py-2 w-[200px] rounded-full flex items-center justify-center gap-2">
                Bet {betOption === "yes" ? "Yes" : "No"}
                <img
                  src={betOption === "yes" ? Up || "/placeholder.svg" : Down || "/placeholder.svg"}
                  alt={`${betOption} icon`}
                  className="w-4 h-4"
                />
              </button>
            </div>

            <div className="flex justify-center items-center mt-5">
              <span className="text-gray-100">{timeLeft || "Loading..."}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 mt-5 mb-6">
          <div className="flex items-center justify-between w-full">
            <h2 className="text-gray-100 text-lg font-semibold">Stake:</h2>
            <div className="flex items-center gap-2">
              <img src={CUSD || "/placeholder.svg"} alt="CUSD" className="w-4 h-4" />
              <span className="text-lg font-semibold text-white">${stake || "0"}</span>
            </div>
          </div>

          <div className="flex items-center justify-between w-full">
            <h2 className="text-gray-100 font-semibold text-lg">Potential ROI</h2>
            <div className="flex items-center gap-2">
              <img src={CUSD || "/placeholder.svg"} alt="CUSD" className="w-4 h-4" />
              <span className="text-lg font-semibold text-white">${calculateROI()}</span>
            </div>
          </div>

          <div className="flex items-center justify-between w-full">
            <h2 className="text-gray-100 font-semibold text-lg">Potential Winnings:</h2>
            <span className="text-lg font-semibold text-green-400">{potentialWinnings || 0}%</span>
          </div>
        </div>

        <button
          className="w-full py-4 rounded-full font-semibold bg-[#18DDF7] text-black hover:bg-opacity-90 transition-colors"
          onClick={handleConfirm}
        >
          Confirm
        </button>
      </div>
    </div>
  )
}

export default ConfirmPrediction
