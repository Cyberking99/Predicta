import React, { useState } from 'react';
import Edit from '../../assets/images/svgs/pencil-line.svg';
import { useNavigate, useLocation } from "react-router-dom";

const PredictionForm = ({ onSubmit }) => {
  const [formValues, setFormValues] = useState({
    topic: '',
    choice1: '',
    choice2: '',
    slotLimit: '',
    duration: '',
  });
  const navigate = useNavigate();
  const { state } = useLocation();
  const isFormComplete = Object.values(formValues).every(value => value.trim() !== '');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormValues((prevValues) => ({
      ...prevValues,
      [name]: value,
    }));
  };

  const handleContinue = () => {
    navigate('/pool-summary');
  };


  return (
    <div
      className="w-full max-w-md p-[2px] mb-4 rounded-2xl"
      style={{
        background: 'linear-gradient(135deg, #195281, #09113B)',
      }}
    >
      <form className="space-y-3 px-5 py-10 bg-[#09113B]">
        <div className="flex flex-col space-y-2">
          <div className="flex justify-between items-center">
            <div className="bg-[#01052D] rounded-xl p-2">
              <img src={Edit} alt="Edit icon" />
            </div>
            <h2 className="text-white">Provide your pool details</h2>
          </div>
          <div className="h-[0.3px] bg-[#18DDF7] opacity-40  rounded-full"></div>
        </div>

        {/* Topic Input */}
        <div className="space-y-1">
          <label className="text-[#18DDF7] text-xs">Topic</label>
          <input
            type="text"
            name="topic"
            value={formValues.topic}
            onChange={handleInputChange}
            placeholder="Barcelona to win Real Madrid"
            className="w-full bg-[#01052D] rounded-lg p-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#18DDF7]"
          />
        </div>

        {/* Choice 1 */}
        <div className="space-y-1">
          <label className="text-[#18DDF7] text-xs">Choice 1</label>
          <input
            type="text"
            name="choice1"
            value={formValues.choice1}
            onChange={handleInputChange}
            placeholder="Bet Yes"
            className="w-full bg-[#01052D] rounded-lg p-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#18DDF7]"
          />
        </div>

        {/* Choice 2 */}
        <div className="space-y-1">
          <label className="text-[#18DDF7] text-xs">Choice 2</label>
          <input
            type="text"
            name="choice2"
            value={formValues.choice2}
            onChange={handleInputChange}
            placeholder="Bet No"
            className="w-full bg-[#01052D] rounded-lg p-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#18DDF7]"
          />
        </div>

        {/* Slot Limit */}
        <div className="space-y-1">
          <label className="text-[#18DDF7] text-xs">Slot Limit</label>
          <input
            type="number"
            name="slotLimit"
            value={formValues.slotLimit}
            onChange={handleInputChange}
            placeholder="5 Slots"
            className="w-full bg-[#01052D] rounded-lg p-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#18DDF7]"
          />
        </div>

        {/* Duration */}
        <div className="space-y-1">
          <label className="text-[#18DDF7] text-xs">Duration</label>
          <input
            type="text"
            name="duration"
            value={formValues.duration}
            onChange={handleInputChange}
            placeholder="24hrs"
            className="w-full bg-[#01052D] rounded-lg p-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#18DDF7]"
          />
        </div>

        {/* Continue Button */}
        <button
          type="submit"
          disabled={!isFormComplete}
          className={`w-full py-4 px-4 rounded-full mt-4 text-sm font-semibold transition-colors ${
            isFormComplete
              ? 'bg-[#18DDF7] text-[#09113B] hover:bg-[#18DDF7]/90'
              : 'bg-[#0000004D] opacity-70 text-gray-300 cursor-not-allowed'
          }`}
        onClick={handleContinue}>
          Continue
        </button>
      </form>
    </div>
  );
};

export default PredictionForm;
