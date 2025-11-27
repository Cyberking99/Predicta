import React from "react";

const FormNavigation = ({ 
  step, 
  goToPrevStep, 
  goToNextStep, 
  isSubmitting, 
  isTokenApproving, 
  isConfirming,
  isLastStep
}) => {
  return (
    <div className="flex justify-between pt-4">
      {step > 1 ? (
        <button
          type="button"
          onClick={goToPrevStep}
          className="px-6 py-3 border border-cyan-400 text-cyan-400 rounded-lg font-medium hover:bg-cyan-900 hover:bg-opacity-20 transition-colors"
        >
          Back
        </button>
      ) : <div />}
      
      {isLastStep ? (
        <button
          type="submit"
          disabled={isSubmitting || isTokenApproving || isConfirming}
          className={`px-6 py-3 bg-gradient-to-r from-cyan-400 to-blue-500 text-[#09113B] rounded-lg font-medium ${
            isSubmitting || isTokenApproving || isConfirming ? 'opacity-70 cursor-not-allowed' : 'hover:opacity-90'
          } transition-opacity`}
        >
          {isSubmitting || isTokenApproving ? 'Approving...' : 
           isConfirming ? 'Confirming...' : 'Create Event'}
        </button>
      ) : (
        <button
          type="button"
          onClick={goToNextStep}
          className="px-6 py-3 bg-gradient-to-r from-cyan-400 to-blue-500 text-[#09113B] rounded-lg font-medium hover:opacity-90 transition-opacity"
        >
          Next
        </button>
      )}
    </div>
  );
};

export default FormNavigation;