import React from "react";
import { HelpCircle, X } from "lucide-react";

const EventDetailsForm = ({ formData, handleChange, handleOptionChange, addOption, removeOption, toggleInfoTooltip, showInfoTooltip }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-white">Event Details</h2>
      
      {/* Question */}
      <div>
        <div className="flex items-center mb-2">
          <label className="text-white font-medium">Question</label>
          <div className="relative ml-2">
            <HelpCircle 
              className="w-4 h-4 text-cyan-400 cursor-pointer" 
              onClick={() => toggleInfoTooltip('question')}
            />
            {showInfoTooltip.question && (
              <div className="absolute z-10 w-64 bg-[#1A1F3F] border border-cyan-700 p-3 rounded-lg text-sm text-white -right-2 top-6">
                Ask a clear, specific question that can be answered with the options you provide. Examples: "Who will win the 2024 NBA Finals?" or "Will Bitcoin reach $100k by end of year?"
              </div>
            )}
          </div>
        </div>
        <input
          type="text"
          name="question"
          value={formData.question}
          onChange={handleChange}
          placeholder="e.g., Who will win the 2024 NBA Finals?"
          className="w-full bg-[#1A1F3F] text-white border border-[#2A3052] rounded-lg p-3 placeholder-gray-500 focus:border-cyan-400 focus:outline-none"
        />
      </div>
      
      {/* Description */}
      <div>
        <div className="flex items-center mb-2">
          <label className="text-white font-medium">Description</label>
          <div className="relative ml-2">
            <HelpCircle 
              className="w-4 h-4 text-cyan-400 cursor-pointer" 
              onClick={() => toggleInfoTooltip('description')}
            />
            {showInfoTooltip.description && (
              <div className="absolute z-10 w-64 bg-[#1A1F3F] border border-cyan-700 p-3 rounded-lg text-sm text-white -right-2 top-6">
                Provide additional context about the event, including any conditions or criteria for resolution.
              </div>
            )}
          </div>
        </div>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Provide details about your prediction event..."
          rows="4"
          className="w-full bg-[#1A1F3F] text-white border border-[#2A3052] rounded-lg p-3 placeholder-gray-500 focus:border-cyan-400 focus:outline-none"
        ></textarea>
      </div>
      
      {/* Options */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <label className="text-white font-medium">Answer Options</label>
            <div className="relative ml-2">
              <HelpCircle 
                className="w-4 h-4 text-cyan-400 cursor-pointer" 
                onClick={() => toggleInfoTooltip('options')}
              />
              {showInfoTooltip.options && (
                <div className="absolute z-10 w-64 bg-[#1A1F3F] border border-cyan-700 p-3 rounded-lg text-sm text-white -right-2 top-6">
                  Add 2-10 possible answers to your question. You can customize these beyond just Yes/No. Examples: "Arsenal", "Chelsea", "Manchester City" for sports, or "Above $50k", "Below $50k" for price predictions.
                </div>
              )}
            </div>
          </div>
          <button 
            type="button" 
            onClick={addOption}
            className="text-cyan-400 text-sm hover:text-cyan-300 flex items-center gap-1"
            disabled={formData.options.length >= 10}
          >
            + Add Option
          </button>
        </div>
        
        <div className="bg-[#1A1F3F] rounded-lg p-4 mb-4">
          <p className="text-gray-400 text-sm mb-3">
            💡 <strong>Tip:</strong> You can create custom options! Instead of just "Yes/No", try specific answers like team names, price ranges, or any other relevant choices for your question.
          </p>
          <div className="space-y-3">
            {formData.options.map((option, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="text-gray-400 text-sm w-6">#{index + 1}</span>
                <input
                  type="text"
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  placeholder={`Option ${index + 1} (e.g., ${index === 0 ? 'Arsenal' : index === 1 ? 'Chelsea' : 'Manchester City'})`}
                  className="flex-1 bg-[#0B122E] text-white border border-[#2A3052] rounded-lg p-3 placeholder-gray-500 focus:border-cyan-400 focus:outline-none"
                />
                {formData.options.length > 2 && (
                  <button 
                    type="button"
                    onClick={() => removeOption(index)}
                    className="w-10 h-10 flex items-center justify-center text-red-400 hover:text-red-300 bg-[#0B122E] rounded-lg border border-[#2A3052] hover:border-red-400 transition-colors"
                    title="Remove option"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            ))}
          </div>
          
          {formData.options.length < 10 && (
            <div className="mt-3 pt-3 border-t border-[#2A3052]">
              <p className="text-gray-500 text-xs">
                You can add up to {10 - formData.options.length} more option{10 - formData.options.length !== 1 ? 's' : ''}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventDetailsForm;