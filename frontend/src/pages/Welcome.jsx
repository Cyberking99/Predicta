import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import STIM from "../assets/images/pngs/stim-coin.png";

const Welcome = () => {
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Loading effect
  useEffect(() => {
    // Simulate loading time (3-4 seconds)
    const loadingTimeout = setTimeout(() => {
      setIsLoading(false);

      // Navigate after a brief delay
      setTimeout(() => {
        navigate("/predict");
        console.log("Loading complete - navigating to stake page...");
      }, 500);
    }, 3500);

    // Cleanup timeout
    return () => clearTimeout(loadingTimeout);
  }, [navigate]);

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-[#0B1426] to-[#01042c] flex flex-col items-center justify-center overflow-hidden">
      {/* Animated background particles */}
      {/* <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-cyan-400 opacity-20 animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          ></div>
        ))}
      </div> */}

      {/* Main loading content */}
      <div className="relative z-10 flex flex-col items-center space-y-16">
        {/* Preden Logo with Background Glow */}
        <div className="relative">
          {/* Background glow effect */}
          <div className="absolute -inset-8 bg-gradient-radial from-cyan-400/20 via-blue-500/10 to-transparent blur-2xl"></div>
          <div className="absolute -inset-4 bg-gradient-radial from-cyan-400/30 via-blue-500/15 to-transparent blur-xl animate-pulse"></div>

          {/* Logo container */}
          <div className="relative flex items-center justify-center w-32 h-32 md:w-40 md:h-40">
            <img
              src={STIM}
              alt="Preden"
              className="object-contain w-24 h-32 md:w-32 md:h-40 drop-shadow-lg"
            />
          </div>
        </div>

        {/* Spinner Section - Updated to match bet history page */}
        <div className="flex items-center gap-3">
          {/* Loading text */}
          <p className="text-lg font-medium text-cyan-400">Loading...</p>

          {/* Circular spinner matching bet history page */}
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#18DDF7]"></div>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
