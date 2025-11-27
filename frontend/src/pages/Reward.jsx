import React from "react";
import { useNavigate } from "react-router-dom";
import Flames from "../assets/images/svgs/flames.svg";
import Banner from "../assets/images/svgs/reward-banner.svg";
import Coin from "../assets/images/svgs/stim-coin.svg";
import RightArrow from "../assets/images/svgs/chevron-right.svg";
import Medal from "../assets/images/svgs/military-medal.svg";
import Youtube from "../assets/images/svgs/social-Icons/youtube.svg";
import Discord from "../assets/images/svgs/social-Icons/discord.svg";
import Twitter from "../assets/images/svgs/social-Icons/x.svg";
import Tictok from "../assets/images/svgs/social-Icons/bcc.svg";
import ComingSoon from "../components/ComingSoon"; 
import Mascort from "../assets/images/pngs/dp1.png";

const Reward = () => {
  const navigate = useNavigate();

  const comingSoon = false;

  const rewards = [
    {
      name: "TikTok Rewards",
      status: "Coming Soon",
      icon: Tictok,
    },
    {
      name: "YouTube Rewards",
      status: "Coming Soon",
      icon: Youtube,
    },
    {
      name: "Discord Rewards",
      status: "Coming Soon",
      icon: Discord,
    },
    {
      name: "Twitter Rewards",
      status: "Coming Soon",
      icon: Twitter,
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
    <div className="relative bg-[#01052D] min-h-screen text-white">
      {/* Background Image */}
      <div className="fixed bottom-0 left-0 w-[100%] h-[700px] md:w-[100%] md:h-[90%] z-0">
        <img
          src={Flames}
          alt="background"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Content */}
      <div className="relative z-10 py-2 w-full space-y-7">
        {/* Banner */}
        <div className="w-full">
          <div className="flex ml-5">
            <h1 className="text-lg text-[#18DDF7] font-bold">REWARDS</h1>
            <img src={Medal} alt="" />
          </div>
          {/*<img
            src={Banner}
            alt="Rewards Banner"
            className="w-dvw object-cover"
          />*/}
        </div>

        {/* Reward Cards */}
        <div className="space-y-4 p-4">
          {rewards.map((reward, index) => (
            <div
              key={index}
              className="p-[2px] rounded-2xl"
              style={{
                background: "linear-gradient(135deg, #195281, #09113B)",
              }}
            >
              <div className="bg-[#09113B] rounded-2xl">
                <div className="flex items-center justify-between px-4 py-6">
                  {/* Reward Details */}
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-[#01052D] rounded-md flex items-center justify-center text-lg font-bold">
                      <img
                        src={reward.icon}
                        alt={`${reward.name} icon`}
                        className="w-6 h-6"
                      />
                    </div>
                    <div>
                      <p className="text-md font-semibold">{reward.name}</p>
                    </div>
                  </div>

                  {/* Status Button and Right Arrow */}
                  <div className="flex gap-1">
                    <button className="px-4 py-1 rounded-full text-sm font-semibold bg-[#18DDF7] text-gray-800">
                      {reward.status}
                    </button>
                    <img
                      src={RightArrow}
                      alt="Right arrow"
                      onClick={() =>
                        navigate("/verify-task", {
                          state: { taskName: reward.name },
                        })
                      }
                      className="cursor-pointer"
                    />
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

export default Reward;
