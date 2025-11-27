import React, { useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Close from "../assets/images/svgs/x-close.svg";
import glow from "../assets/images/svgs/glow.svg";
import Tictok from "../assets/images/svgs/social-Icons/bcc.svg";
import Youtube from "../assets/images/svgs/social-Icons/youtube.svg";
import Discord from "../assets/images/svgs/social-Icons/discord.svg";
import Facebook from "../assets/images/svgs/social-Icons/facebook.svg";
import Twitter from "../assets/images/svgs/social-Icons/x.svg";
import Instagram from "../assets/images/svgs/social-Icons/instagram.svg";
import Telegram from "../assets/images/svgs/social-Icons/telegram.svg";
import Appstore from "../assets/images/svgs/social-Icons/appstore.svg";

const iconMap = {
  "TikTok Tasks": Tictok,
  "Youtube Tasks": Youtube,
  "Instagram Tasks": Instagram,
  "Discord Tasks": Discord,
  "Telegram Tasks": Telegram,
  "X (Twitter) Tasks": Twitter,
  "Facebook Tasks": Facebook,
  "Play & App Store Tasks": Appstore,
};

const VerifyTask = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const taskName = location.state?.taskName || "TikTok Tasks";
  const taskIcon = iconMap[taskName] || Tictok;

  const handleClose = () => navigate(-1);

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#141827]">
      <div className="relative w-full bg-[#0B122E] h-full rounded-t-[20px] border-t border-[#18DDF7] mt-32 pt-6 px-4">
        {/* Close Button */}
               <button
                 className="absolute right-4 bg-[#1A1F3F] z-10 rounded-full p-2 hover:bg-opacity-80"
                 onClick={handleClose}
               >
                 <img src={Close} alt="close image" />
               </button>
       
        <div className="flex justify-center mt-10 relative">
          <img
            src={glow}
            alt="glow image"
            className="absolute z-0 top-[-60px] scale-110" 
          />
        </div>
        <div className="flex flex-col items-center mt-2">
           
        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4">
            <img
              src={taskIcon}
              alt={`${taskName} icon`}
              className="w-16 h-16"
            />
          </div>
          <h2 className="text-xl text-white font-semibold mb-2">
            Verify {taskName}
          </h2>
          
          <p className="text-gray-400 text-center mb-4">
            You Would Need To Verify<br />
            The Task Done To Claim The Prize
          </p>

          {/* Prize Display */}
          <div className="w-full bg-[#1A1F3F] rounded-xl p-4 mb-6 relative overflow-hidden">
            <div className="absolute inset-0 border border-[#18DDF7] rounded-xl [mask-image:linear-gradient(to_right,black_50%,transparent_100%)]" />
            <p className="text-[#18DDF7] text-center">
              Proof the Prize and Claim it!
            </p>
            <p className="text-white text-center text-2xl font-bold mt-2">
              +1.20
            </p>
          </div>

          {/* File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*"
          />

          {/* Attach Proof Button */}
          <div className="w-full bg-[#1A1F3F] rounded-xl p-4 mb-4 flex justify-between items-center relative overflow-hidden">
            <div className="absolute inset-0 border border-[#18DDF7] rounded-xl [mask-image:linear-gradient(to_right,black_50%,transparent_100%)]" />
            <span className="text-white">
              {selectedFile ? selectedFile.name : "Attach Proof Of Task"}
            </span>
            <button
              onClick={handleAttachClick}
              className="bg-[#18DDF733] z-10 rounded-full p-2"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#18DDF7"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
              </svg>
            </button>
          </div>

          {/* Send Button */}
          <button
            className={`w-full py-3 rounded-full font-semibold mt-4 transition-all duration-200 ${
              selectedFile 
                ? 'bg-[#18DDF7] text-black cursor-pointer' 
                : 'bg-[#0000004D] text-[#FFFFFF80] cursor-not-allowed opacity-50'
            }`}
            disabled={!selectedFile}
            onClick={() => selectedFile && console.log('File sent!')}
          >
            Send File
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyTask;