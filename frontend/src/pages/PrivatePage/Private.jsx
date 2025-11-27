import React, { useState } from "react";
import {
  Search,
  MoreVertical,
  ChevronDown,
  Share2,
  MoreHorizontal,
} from "lucide-react";
import ToggleMenu from "../../components/ui/ToggleMenu";
import { useNavigate } from "react-router-dom";
import Game from "../../assets/images/pngs/video-game.png";
import Signal from "../../assets/images/svgs/signal.svg";
import Profile from "../../assets/images/svgs/users-plus.svg";
import Play from "../../assets/images/svgs/play.svg"


const Private = () => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

  const toggleOptions = [
    {
      id: "public",
      label: "Public",
      icon: Signal,
      iconAlt: "Public icon",
    },
    {
      id: "private",
      label: "Private",
      icon: Profile,
      iconAlt: "Private icon",
    },
  ];

  const handleCreatePool = () => {
    navigate("/create-pool");
  };


  return (
    <div className="min-h-screen flex flex-col">
      <div className="py-4 px-3 flex-1 flex flex-col">
        {/* Play Section Title */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-cyan-400">PLAY</span>
            <img
              src={Game}
              alt="Play icon"
              className="w-4 h-4 object-contain"
            />
          </div>
          <div className="relative">
            <div
              className="w-8 h-8 rounded-full bg-[#1A1F3F] flex items-center justify-center cursor-pointer"
              onClick={() => setShowDropdown(!showDropdown)}
            >
              <MoreHorizontal className="w-5 h-5 text-gray-400" />
            </div>
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-40 bg-[#1A1F3F] text-white rounded-lg shadow-lg p-2">
                <div className="p-2 hover:bg-[#252B4F] rounded-md cursor-pointer">
                  Option 1
                </div>
                <div className="p-2 hover:bg-[#252B4F] rounded-md cursor-pointer">
                  Option 2
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Public/Private Toggle */}
        <ToggleMenu
          options={toggleOptions}
        />

        {/* Search Bar */}
        <div
          className="relative mt-5 mb-6 p-[2px] rounded-full"
          style={{
            background: "linear-gradient(135deg, #195281, #09113B)",
          }}
        >
          <div
            className="flex items-center bg-[#09113B] rounded-full p-3 cursor-pointer"
            onClick={() => setShowSearch(true)}
          >
            <Search className="w-5 h-5 text-gray-400 mr-2" />
            {showSearch ? (
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search"
                className="bg-transparent outline-none flex-1 text-white placeholder-gray-400"
                autoFocus
              />
            ) : (
              <span className="text-gray-400">Search</span>
            )}
            <ChevronDown className="w-5 h-5 text-gray-400 ml-auto" />
          </div>
        </div>

        {/* Centered Buttons Container */}
        <div className="flex mt-10 items-center justify-center">
          <div className="flex flex-col gap-6">
            <button
              className="w-80 bg-[#18DDF71A] text-[#18DDF7] py-4 rounded-full border border-[#18DDF7] flex items-center justify-center gap-2 transition-colors hover:bg-[#18DDF730]"
              onClick={handleCreatePool}
            >
              Create A Play
              <img src={Play} alt="play icon" />
            </button>
            <button className="w-80 py-4 rounded-full font-semibold bg-[#18DDF7] text-black hover:bg-[#18DDF7CC] transition-colors">
              Join A PLay
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Private;