"use client"
import { useNavigate, useLocation } from "react-router-dom"
import Close from "../../assets/images/svgs/x-close.svg"
import glow from "../../assets/images/svgs/glow.svg"

const PredictionFail = () => {
  const navigate = useNavigate()
  const { state } = useLocation()
  const { betOption, stake, question, eventAddress, error, errorDetails } = state || {}

  const handleClose = () => {
    // Navigate to home or main page
    navigate("/")
  }

  const handleRetry = () => {
    // Navigate back to the prediction page to retry
    if (eventAddress) {
      navigate(`/prediction/${eventAddress}`, {
        state: {
          betOption,
          predictionId: state?.predictionId,
          eventAddress,
          eventData: state?.eventData,
          question,
          options: state?.options,
        },
      })
    } else {
      navigate("/stake")
    }
  }

  const handleGoToStake = () => {
    // Navigate to stake page
    navigate("/stake")
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#141827]">
      <div className="relative w-full bg-[#0B122E] h-full rounded-t-[20px] border-t border-[#FF5A5A] mt-40 pt-6 px-4">
        {/* Close Button */}
        <button className="absolute right-4 bg-[#1A1F3F] rounded-full p-2 hover:bg-opacity-80" onClick={handleClose}>
          <img src={Close || "/placeholder.svg"} alt="close image" />
        </button>

        {/* Prediction Details */}
        <div className="flex items-center justify-center min-h-full">
          <div className="space-y-5 text-center">
            <div className="flex justify-center mb-20 relative">
              <img
                src={glow || "/placeholder.svg"}
                alt="glow image"
                className="absolute z-0 top-[-60px] scale-110 opacity-50"
              />
              <div className="z-10 w-20 h-20 rounded-full bg-red-500 flex items-center justify-center">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>

            <div className="flex flex-col items-center space-y-2">
              <h2 className="text-2xl text-gray-100 font-semibold">Transaction Failed</h2>
              <p className="text-lg text-gray-200">Your bet could not be placed</p>

              {/* Show error details */}
              <div className="mt-4 p-4 bg-[#1A1F3F] rounded-lg border border-red-500/20">
                <p className="text-sm text-gray-300 mb-2">Error Details:</p>
                <p className="text-red-400 font-medium mb-3">{error || "Transaction failed due to an unknown error"}</p>

                {errorDetails && (
                  <div className="text-xs text-gray-400 mt-2 p-2 bg-gray-800 rounded">
                    <p className="font-mono">{errorDetails}</p>
                  </div>
                )}

                {question && (
                  <>
                    <div className="border-t border-gray-600 pt-3 mt-3">
                      <p className="text-sm text-gray-300 mb-2">Attempted Bet:</p>
                      <p className="text-white font-medium mb-3">{question}</p>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-300">Your choice:</span>
                        <span className={`font-semibold ${betOption === "yes" ? "text-green-400" : "text-red-400"}`}>
                          {betOption === "yes" ? "Yes" : "No"}
                        </span>
                      </div>
                      {stake && (
                        <div className="flex justify-between items-center text-sm mt-2">
                          <span className="text-gray-300">Stake amount:</span>
                          <span className="text-white font-semibold">${stake} USDT</span>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 w-full">
              <button
                className="w-full py-4 rounded-full font-semibold bg-[#18DDF7] text-black hover:bg-opacity-90 transition-colors"
                onClick={handleRetry}
              >
                Try Again
              </button>

              <button
                className="w-full py-3 rounded-full font-semibold bg-transparent border border-[#18DDF7] text-[#18DDF7] hover:bg-[#18DDF7] hover:text-black transition-colors"
                onClick={handleGoToStake}
              >
                Back to Predictions
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PredictionFail
