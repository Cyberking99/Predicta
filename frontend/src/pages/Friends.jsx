import React, { useState } from 'react';
import Flames from "../assets/images/svgs/flames.svg";
import User from "../assets/images/svgs/user-circle.svg"
import Book from "../assets/images/pngs/book.png"
import Copy from "../assets/images/svgs/copy.svg"
import Telegram from "../assets/images/svgs/social-Icons/telegram-two.svg"
import RightArrow from "../assets/images/svgs/chevron-right.svg"
import Stim from "../assets/images/svgs/stim-coin.svg"
import ComingSoon from "../components/ComingSoon"; 
import Mascort from "../assets/images/pngs/dp1.png";

const Friends = () => {
  const [activeTab, setActiveTab] = useState('invite');

  const comingSoon = true;
  
  const friends = [
    { name: 'James Don', username: '@user2081', stim: 120 },
    { name: 'Cynthia', username: '@user0948', stim: 50 },
    { name: 'Samuel Dornal', username: '@user09325', stim: 20.05 },
    { name: 'Beautik', username: '@user0731', stim: 5.40 }
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
    <div className="min-h-screen text-white">
        {/* Background Image */}
        <div className="fixed bottom-0 left-0 w-[100%] h-[700px] md:w-[100%] md:h-[90%] z-0">
              <img
                src={Flames}
                alt="background"
                className="w-full h-full object-cover"
              />
            </div>
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="p-4 pb-2">
          <h1 className="text-cyan-400 text-lg font-medium flex items-center gap-2">
            FRIENDS 👥
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Invite friends and earn 5% from their earnings and 1% from their referrals
          </p>
        </div>

        {/* Tabs */}
        <div className="flex w-full  border-b border-gray-800">
          <button
            className={`flex-1 py-2 text-sm font-medium transition-colors border-b-2 
              ${activeTab === 'invite' 
                ? 'text-white bg-[#18DDF71A] border-cyan-400' 
                : 'text-gray-400 border-transparent'}`}
            onClick={() => setActiveTab('invite')}
          >
            Invite
          </button>
          <button
            className={`flex-1 py-2 text-sm font-medium transition-colors border-b-2
              ${activeTab === 'invited' 
                ? 'text-white bg-[#18DDF71A] border-cyan-400' 
                : 'text-gray-400 border-transparent'}`}
            onClick={() => setActiveTab('invited')}
          >
            Invited
          </button>
        </div>

        <div className="p-4">
          {activeTab === 'invite' ? (
            <div className="space-y-3">
              {/* Friends Card */}
            {/* Friends Card with Glow Effect */}
            <div className="p-[2px] rounded-2xl" style={{ background: "linear-gradient(135deg, #195281, #09113B)" }}>
                <div className="relative bg-[#09113B] rounded-2xl p-4 h-36">
                  <div className="flex justify-between items-start mb-6">
                    <span className="text-lg font-medium">YOUR FRIENDS</span>
                    <div className="flex items-center gap-1 text-gray-400 text-sm">
                      Total <img src={User} alt="user-circle" className="w-4 h-4" /> 0
                    </div>
                  </div>
                  <div className="absolute bottom-0">
                    <div className="relative">
                    <div className="absolute inset-0 blur-xl" style={{ backgroundColor: '#0e3d40', opacity: '1' }} />
                      <div className="absolute inset-0 blur-2xl" style={{ backgroundColor: '#0e3d40', opacity: '0.8' }} />
                      <div className="absolute inset-0 blur-3xl" style={{ backgroundColor: '#0e3d40', opacity: '0.6' }} />
                      <img src={Book} alt="Friends icon" className="relative w-24 h-24 z-10" />
                    </div>
                  </div>
                  <div className="absolute bottom-5 right-4">
                    <button className="bg-[#27FE60] text-black px-6 py-2 rounded-full text-sm font-medium">
                      View List
                    </button>
                  </div>
                </div>
              </div>
              {/* Invite Friend Card */}
              <div className="p-[2px] rounded-2xl" style={{ background: "linear-gradient(135deg, #195281, #09113B)" }}>
                <div className="bg-[#09113B] z-10 rounded-2xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 bg-[#01052D] rounded-xl flex items-center justify-center">
                        <img src={Telegram} alt="Telegram" className="w-10 h-10" />
                      </div>
                      <div>
                        <div className="font-medium mb-0.5">Invite A Friend</div>
                        <div className="text-sm text-gray-400 flex items-center gap-1">
                          And earn <img src={Stim} alt="coin" className="w-4 h-4" /> <span className="text-cyan-400">+100</span>
                        </div>
                      </div>
                    </div>
                    <div className='flex'>
                    {/* <button className="bg-gray-700/50 text-white px-6 py-2 rounded-full flex items-center gap-1">
                      Go
                    </button> */}
                    <button className="bg-gray-700/50 text-white px-6 py-2 rounded-full flex items-center gap-1">
                      Coming Soon
                    </button>
                    <img src={RightArrow} alt="" />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Copy Link Card */}
              <div className="p-[2px] rounded-2xl" style={{ background: "linear-gradient(135deg, #195281, #09113B)" }}>
                <div className="bg-[#09113B] rounded-2xl p-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Copy Invitation Link</span>
                    <button className="bg-[#18DDF733] text-cyan-400 px-3 py-1 rounded-full flex items-center gap-1">
                      Copy <img src={Copy} alt="copy icon" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Rewards Card */}
              <div className="p-[2px] rounded-2xl border border-[#18DDF7]">
  <div className="bg-[#09113B] rounded-2xl p-6">
    <h3 className="text-cyan-400 text-center mb-4">Rewards From Your Friends' Earnings</h3>
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-2">
        <img src={User} alt="coin" className="w-4 h-4" />
        <span className="text-cyan-400 text-xl font-medium">0</span>
      </div>
      {/* <button className="bg-[#27FE60] text-black px-8 py-2 rounded-full text-sm font-medium w-32">
        Claim
      </button> */}
      <button className="bg-[#27FE60] text-black px-8 py-2 rounded-full text-sm font-medium w-40">
        Coming Soon
      </button>
    </div>
  </div>
</div>

              {/* Friends List */}
              <div className="space-y-2">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-medium">Joined Friends</span>
                  <div className="text-gray-400 flex items-center gap-1">
                    Total <img src={User} alt="user-circle" className="w-4 h-4" /> 0
                  </div>
                </div>

                {/* {friends.map((friend, index) => (
                  <div key={index} className="p-[2px] rounded-2xl" style={{ background: "linear-gradient(135deg, #195281, #09113B)" }}>
                    <div className="bg-[#09113B] rounded-2xl p-3 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <img
                          src={Mascort}
                          alt={friend.name}
                          className="w-10 h-10 rounded-full bg-gray-700"
                        />
                        <div>
                          <div className="font-medium">{friend.name}</div>
                          <div className="text-gray-400 text-sm">{friend.username}</div>
                        </div>
                      </div>
                      <div className=" flex items-center gap-1">
                        <span className='text-[#979FCB] text-sm'>STIM</span> <img src={Stim} alt="stim" className="w-4 h-4" /> <span className='text-[#18DDF7] font-semibold'>{friend.stim}</span>
                      </div>
                    </div>
                  </div>
                ))} */}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Friends;