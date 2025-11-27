import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Mascort from "../assets/images/pngs/dp1.png";
import Flames from "../assets/images/svgs/flames.svg";

const Login = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Function to simulate wallet connection
  const connectWallet = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      // Simulate opening a Web3 wallet connection modal
      // Replace this with your actual Web3 wallet connection code

      // Simulating connection process
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // After successful connection, navigate to the stake page
      navigate("/stake");
    } catch (err) {
      console.error("Wallet connection error:", err);
      setError("Failed to connect wallet. Please try again.");
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="relative w-full min-h-screen overflow-hidden">
      {/* Background flames */}
      <div className="fixed bottom-0 left-0 w-[100%] h-[700px] md:w-[100%] md:h-[90%] z-0">
        <img
          src={Flames}
          alt="background"
          className="object-cover w-full h-full"
        />
      </div>

      {/* Content container */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 md:px-8 lg:px-16">
        <div
          className="p-[2px] rounded-2xl w-full max-w-sm sm:max-w-md md:max-w-xl lg:max-w-3xl"
          style={{ background: "linear-gradient(135deg, #195281, #09113B)" }}
        >
          <div className="bg-[#09113B] rounded-2xl p-8 md:p-12 space-y-8">
            {/* Logo and mascot section */}
            <div className="flex flex-col items-center space-y-6">
              <img
                src={Mascort}
                alt="Preden Mascort"
                className="w-24 md:w-32 lg:w-40"
              />
              <h1 className="text-2xl font-bold text-center text-white md:text-3xl lg:text-4xl">
                Connect Your Wallet
              </h1>
            </div>

            {/* Description */}
            <div className="space-y-4 text-center">
              <p className="text-gray-300 text-md md:text-lg">
                Connect your wallet to access the Preden platform and start
                making predictions.
              </p>
              <p className="text-sm text-cyan-400 md:text-md">
                Don't have a wallet? No worries! We'll help you create one.
              </p>
            </div>

            {/* Wallet connect button */}
            <div className="flex justify-center pt-4">
              <button
                onClick={connectWallet}
                disabled={isConnecting}
                className={`
                  flex items-center justify-center space-x-2
                  bg-gradient-to-r from-cyan-400 to-blue-500
                  hover:from-cyan-500 hover:to-blue-600
                  text-[#09113B] font-bold py-4 px-8
                  rounded-full transition-all duration-300
                  shadow-lg hover:shadow-[0_0_25px_rgba(6,182,212,0.5)]
                  w-full max-w-md
                  ${isConnecting ? "opacity-70 cursor-not-allowed" : ""}
                `}
              >
                {isConnecting ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-[#09113B]"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <span>Connecting...</span>
                  </>
                ) : (
                  <span>Connect Wallet</span>
                )}
              </button>
            </div>

            {/* Error message */}
            {error && (
              <div className="mt-4 text-center text-red-500">{error}</div>
            )}

            {/* Features list */}
            <div className="pt-8 border-t border-gray-700">
              <h3 className="mb-4 text-lg font-semibold text-center text-white md:text-xl">
                Why Connect Your Wallet?
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="flex items-start space-x-3">
                  <div className="p-1 mt-1 rounded-full bg-cyan-400">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-[#09113B]"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-300">
                    Place secure bets and predictions
                  </span>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="p-1 mt-1 rounded-full bg-cyan-400">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-[#09113B]"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-300">
                    Access your rewards and winnings
                  </span>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="p-1 mt-1 rounded-full bg-cyan-400">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-[#09113B]"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-300">
                    Join exclusive prediction pools
                  </span>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="p-1 mt-1 rounded-full bg-cyan-400">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-[#09113B]"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-300">
                    Earn Preden tokens and rewards
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
