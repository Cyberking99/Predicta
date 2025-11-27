import React, { useState } from "react";
import { X } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import PredictionForm from '../../components/ui/PredictionForm';  


const CreatePool = () => {
  const [stake, setStake] = useState(1);
  const navigate = useNavigate();
  const { state } = useLocation();
  const { betOption } = state || {};

  const handleClose = () => navigate(-1);

  const handleWin = () => {
    navigate("/prediction-win");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80">
      <div className="relative mt-20 w-[100%] h-auto max-w-md bg-[#09113B] rounded-t-3xl p-4 overflow-y-auto">
        {/* Close Button */}
        <button
          className="absolute top-4 right-4 bg-[#18DDF7] flex items-center justify-center opacity-40 rounded-full w-8 h-8 hover:text-white"
          onClick={handleClose}
        >
          <X className="text-blue-600 w-5 h-5" />
        </button>

        {/* Create pool title */}
        <div className="flex flex-col items-center justify-center gap-2 mt-8 mb-4">
          <h1 className="text-white text-2xl font-semibold">Create Your Prediction Pool</h1>
          <p className="text-gray-100 text-center text-sm">Join the Fun! Create Your Own Prediction Pool and Invite Friends to Join!</p>
        </div>

        {/* Prediction Form */}
        <PredictionForm />
      </div>
    </div>
  );
};

export default CreatePool;
