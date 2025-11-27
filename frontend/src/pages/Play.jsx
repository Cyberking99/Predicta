import React from "react";
import Flames from "../assets/images/svgs/flames.svg";
import Lottery from "../assets/images/pngs/lottery.png";
import Casino from "../assets/images/pngs/casino.png";
import Slot from "../assets/images/pngs/slot.png";
import Game from "../assets/images/pngs/video-game.png";
import HeadsAndTail from "../assets/images/pngs/heads-tails.png"; 
import ComingSoon from "../components/ComingSoon"; 
import Mascort from "../assets/images/pngs/dp1.png";

const Play = () => {

  const comingSoon = false;

  const gameCards = [
    {
      title: "LOTTERY",
      image: Lottery,
      available: "Now",
    },
    {
      title: "ROULETTE",
      image: Casino,
      available: "Now",
    },
    {
      title: "SLOT",
      image: Slot,
      available: "Now",
    },
    {
      title: "HEADS & TAIL",
      image: HeadsAndTail,
      available: "Now",
    },
  ];

  if (comingSoon) {
    return (
      <div className="relative min-h-screen py-2 px-3">
        <div className="fixed bottom-0 left-0 w-full h-[90%]  z-0">
          <img src={Flames} alt="background" className="w-full h-full object-cover" />
        </div>
        <div className="relative z-10 flex flex-col items-center justify-center min-h-[80vh] text-center">
          <div
            className="p-[2px] rounded-2xl w-full max-w-lg"
            style={{ background: "linear-gradient(135deg, #195281, #09113B)" }}
          >
            <div className="bg-[#09113B] rounded-2xl p-8 space-y-6">
              <div className="flex justify-center">
                <img src={Mascort} alt="STIM Mascot" className="w-20" />
              </div>
              <ComingSoon />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen py-2 px-3">
      {/* Set Flames background to be fixed */}
      <div className="fixed bottom-0 left-0 w-[100%] h-[700px] md:w-[100%] md:h-[90%] z-0">
        <img
          src={Flames}
          alt="background"
          className="w-full h-full object-cover"
        />
      </div>
      <div className="relative z-10">
        <div className="flex items-center mb-4 gap-2">
          <span className="text-lg font-bold text-cyan-400">PLAY</span>
          <img
            src={Game}
            alt="Play icon"
            className="w-4 h-4 object-contain"
          />
        </div>
        <div className="space-y-4">
          {gameCards.map((game, index) => (
            <div
              key={index}
              className="p-[2px] rounded-2xl mb-4"
              style={{
                background: "linear-gradient(135deg, #195281, #09113B)",
              }}
            >
              <div className="bg-[#09113B] rounded-2xl p-3">
                <div className="flex justify-between items-start h-full">
                  {/* Left side with title and image */}
                  <div className="flex flex-col">
                    <span className="text-white text-lg font-semibold mb-2">
                      {game.title}
                    </span>
                    <div className="w-28 h-16 -ml-3 -mb-3">
                      <img
                        src={game.image}
                        alt={game.title}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>

                  {/* Right side - button at bottom */}
                  <div className="flex items-end h-full mt-12 -mb-2">
                    <button className="bg-cyan-400 text-[#09113B] px-3 py-1.5 md:px-6 md:py-2 rounded-full text-sm md:text-base font-semibold hover:bg-cyan-500 transition-all duration-300 hover:shadow-[0_0_15px_rgba(6,182,212,0.5)]">
                      Coming Soon
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Play;