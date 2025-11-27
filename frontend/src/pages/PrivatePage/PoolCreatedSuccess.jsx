import React, { useState } from "react";
import { X } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import Success from "../../assets/images/svgs/success.svg";
import Share from "../../assets/images/svgs/share.svg";
import { RWebShare } from "react-web-share";

const PoolCreatedSuccess = () => {
  const [stake, setStake] = useState(1);
  const navigate = useNavigate();
  const { state } = useLocation();
  const { betOption } = state || {};

  const handleClose = () => navigate(-1);

  const handleInvite = () => {
    navigate("/private-invite");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80">
      <div className="relative mt-36 w-[100%] h-[80%] max-w-md bg-[#09113B] rounded-t-3xl p-6">
        {/* Close Button */}
        <button
          className="absolute top-4 right-4 bg-[#18DDF7] flex items-center justify-center opacity-40 rounded-full w-10 h-10 hover:text-white"
          onClick={handleClose}
        >
          <X className="text-blue-600" />
        </button>

        {/* Prediction Details */}
        <div className="flex items-center justify-center min-h-full">
          <div className="space-y-5 text-center">
            <div className="flex justify-center">
              <img src={Success} alt="Success" />
            </div>
            <div className="flex flex-col items-center">
              <h2 className="text-2xl font-semibold text-gray-100">
                Pool Created
              </h2>
              <p className="text-lg text-gray-200">
                Your prediction pool has been created successfully!
              </p>
            </div>

            <div className="flex justify-center">
              <RWebShare
                data={{
                  text: "Web Share - GfG",
                  url: "http://localhost:3000",
                  title: "Preden PVP",
                }}
                onClick={() => console.log("shared successfully!")}
                style={{
                  background: "#000",
                }}
              >
                <button className="flex items-center justify-center gap-2 border border-[#18DDF7] text-white py-2 px-4 rounded-full w-40">
                  <img src={Share} alt="share icon" />
                  Share
                </button>
              </RWebShare>
            </div>

            {/* Confirm Button */}
            <button
              className="w-full py-4 rounded-full font-semibold bg-[#18DDF7] text-black"
              onClick={handleInvite}
            >
              Go to Active Bets
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PoolCreatedSuccess;
