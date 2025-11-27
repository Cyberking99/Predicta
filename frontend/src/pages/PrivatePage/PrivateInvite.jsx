import React, { useState } from "react";
import { X } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import Message from "../../assets/images/pngs/message.png";

const PrivateInvite = () => {
  const [otp, setOtp] = useState("");
  const navigate = useNavigate();
  const { state } = useLocation();
  const { betOption } = state || {};

  const handleClose = () => navigate(-1);

  const handleContinue = () => {
    navigate("/private-predict");
  };

  // function to check if the OTP is valid
  const isOtpValid = otp.length === 6 && /^\d+$/.test(otp);

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

        <div className="flex flex-col justify-center items-center gap-3 mt-10 mb-6">
          <img src={Message} alt="message icon" className="w-20 h-20" />
          <h1 className="text-xl text-white font-semibold">Verify your Invitation Code</h1>
        </div>

        {/* OTP Input Field */}
        <div className="mb-6 flex flex-col bg-gradient-to-br from-[#195281] to-[#09113B] p-6 rounded-lg border border-[#18DDF7] text-white">
          <label className="text-gray-400 text-sm mb-2 block">Otp Code</label>
          <div className="relative">
            <input
              type="text"
              value={otp}
              onChange={(e) => {
                const value = e.target.value;
                if (value === "" || /^\d+$/.test(value)) { // Only allow numbers
                  setOtp(value);
                }
              }}
              maxLength={6} // Limit input to 6 characters
              className="w-full p-2 bg-[#09113B] text-white rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#18DDF7]"
              placeholder="123456"
            />
          </div>
        </div>

        {/* Verify Button */}
        <button
          className={`w-full py-4 rounded-full font-semibold ${
            isOtpValid
              ? "bg-[#18DDF7] text-black hover:bg-[#18DDF7]/90"
              : "bg-[#0000004D] opacity-70 cursor-not-allowed text-gray-200"
          }`}
          disabled={!isOtpValid}
          onClick={handleContinue}
        >
          Verify
        </button>
      </div>
    </div>
  );
};

export default PrivateInvite;
