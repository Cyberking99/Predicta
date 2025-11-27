import React from "react";

const FAQSection = () => {
  return (
    <div className="mt-12 max-w-3xl mx-auto">
      <h3 className="text-xl font-semibold text-cyan-400 mb-4">Frequently Asked Questions</h3>
      
      <div className="space-y-4">
        <div className="p-4 bg-[#0C1544] rounded-lg border border-[#2A3052]">
          <h4 className="text-white font-medium mb-2">How do events get resolved?</h4>
          <p className="text-gray-300">Events are resolved by oracles or authorized resolvers when the end time is reached. The winning option is confirmed, and stakes are distributed accordingly.</p>
        </div>
        
        <div className="p-4 bg-[#0C1544] rounded-lg border border-[#2A3052]">
          <h4 className="text-white font-medium mb-2">What happens to my staked tokens?</h4>
          <p className="text-gray-300">Your staked tokens are locked in the smart contract until the event is resolved. If your chosen option wins, you'll receive your stake back plus your share of the rewards.</p>
        </div>
        
        <div className="p-4 bg-[#0C1544] rounded-lg border border-[#2A3052]">
          <h4 className="text-white font-medium mb-2">Can I cancel an event after creating it?</h4>
          <p className="text-gray-300">Once an event is created and approved, it cannot be canceled. Make sure all details are correct before submitting.</p>
        </div>
      </div>
    </div>
  );
};

export default FAQSection;