import React from "react";

const StepsIndicator = ({ step }) => {
  return (
    <div className="flex justify-center mb-8">
      <div className="flex items-center">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 1 ? "bg-cyan-400 text-[#09113B]" : "bg-[#1A1F3F] text-white"}`}>
          1
        </div>
        <div className={`w-16 h-1 ${step > 1 ? "bg-cyan-400" : "bg-[#1A1F3F]"}`}></div>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 2 ? "bg-cyan-400 text-[#09113B]" : "bg-[#1A1F3F] text-white"}`}>
          2
        </div>
        <div className={`w-16 h-1 ${step > 2 ? "bg-cyan-400" : "bg-[#1A1F3F]"}`}></div>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 3 ? "bg-cyan-400 text-[#09113B]" : "bg-[#1A1F3F] text-white"}`}>
          3
        </div>
      </div>
    </div>
  );
};

export default StepsIndicator;