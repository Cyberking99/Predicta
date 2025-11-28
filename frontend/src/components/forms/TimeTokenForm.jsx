import React from "react";
import { HelpCircle, ChevronDown, ChevronUp, Clock } from "lucide-react";

const TimeTokenForm = ({
  formData,
  handleChange,
  toggleInfoTooltip,
  showInfoTooltip,
  showTokenDropdown,
  setShowTokenDropdown,
  getTokenInfo,
  handleTokenSelect,
  TOKENS,
  isSubmitting,
  creatorStakeAmount = "Loading...",
  defaultCreatorFeePercentage = "Loading...",
  isAdminOrModerator = false,
}) => {
  // Users can pick between USDC and CUSD for staking
  const allowedTokens = TOKENS.filter(
    (token) => token.symbol === "USDC" || token.symbol.toUpperCase() === "CUSD"
  );

  const selectedToken = getTokenInfo(formData.tokenAddress);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-white">
        Event Timeline & Token Settings
      </h2>

      {/* End Time */}
      <div>
        <div className="flex items-center mb-2">
          <label className="font-medium text-white">End Time</label>
          <div className="relative ml-2">
            <HelpCircle
              className="w-4 h-4 cursor-pointer text-cyan-400"
              onClick={() => toggleInfoTooltip("endTime")}
            />
            {showInfoTooltip.endTime && (
              <div className="absolute z-10 w-64 bg-[#1A1F3F] border border-cyan-700 p-3 rounded-lg text-sm text-white -right-2 top-6">
                When staking closes and the event will be resolved. Users can
                stake immediately after event creation.
              </div>
            )}
          </div>
        </div>
        <div className="relative">
          <input
            type="datetime-local"
            name="endTime"
            value={formData.endTime}
            onChange={handleChange}
            min={new Date(Date.now() + 60000).toISOString().slice(0, 16)} // Minimum 1 minute from now
            className="w-full bg-[#1A1F3F] text-white border border-[#2A3052] rounded-lg p-3 placeholder-gray-500 focus:border-cyan-400 focus:outline-none"
          />
          <Clock className="absolute text-gray-400 right-3 top-3" size={20} />
        </div>
      </div>

      {/* Staking Token Selection - Users can choose USDC or CUSD for betting */}
      <div>
        <div className="flex items-center mb-2">
          <label className="font-medium text-white">Staking Token</label>
          <div className="relative ml-2">
            <HelpCircle
              className="w-4 h-4 cursor-pointer text-cyan-400"
              onClick={() => toggleInfoTooltip("token")}
            />
            {showInfoTooltip.token && (
              <div className="absolute z-10 w-64 bg-[#1A1F3F] border border-cyan-700 p-3 rounded-lg text-sm text-white -right-2 top-6">
                Select which token users will stake when betting on this event.
                You can choose between cUSD and USDC. Note: The creator fee is
                always paid in cUSD tokens regardless of your staking token
                choice.
              </div>
            )}
          </div>
        </div>
        <div className="relative">
          <div
            className="w-full bg-[#1A1F3F] text-white border border-[#2A3052] rounded-lg p-3 flex items-center justify-between cursor-pointer hover:border-cyan-400 transition-colors"
            onClick={() => setShowTokenDropdown(!showTokenDropdown)}
          >
            {formData.tokenAddress && selectedToken ? (
              <div className="flex items-center gap-2">
                <img src={selectedToken.icon} alt="token" className="w-5 h-5" />
                <div>
                  <span className="font-medium text-white">
                    {selectedToken.symbol}
                  </span>
                  <span className="ml-2 text-sm text-gray-400">
                    {selectedToken.symbol.toUpperCase() === "CUSD"
                      ? "cUSD Token"
                      : "USDC Token"}
                  </span>
                </div>
              </div>
            ) : (
              <span className="text-gray-400">Select Staking Token</span>
            )}
            {showTokenDropdown ? (
              <ChevronUp size={20} />
            ) : (
              <ChevronDown size={20} />
            )}
          </div>

          {showTokenDropdown && (
            <div className="absolute top-full left-0 w-full mt-1 bg-[#1A1F3F] border border-[#2A3052] rounded-lg z-20 max-h-48 overflow-y-auto shadow-lg">
              {allowedTokens.map((token) => (
                <div
                  key={token.address}
                  className="p-3 hover:bg-[#2A3052] cursor-pointer flex items-center gap-3 transition-colors first:rounded-t-lg last:rounded-b-lg"
                  onClick={() => handleTokenSelect(token.address)}
                >
                  <img
                    src={token.icon}
                    alt={token.symbol}
                    className="w-5 h-5"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-white">{token.symbol}</div>
                    <div className="text-sm text-gray-400">
                      {token.symbol.toUpperCase() === "CUSD" ? "cUSD" : "USDC"}
                    </div>
                  </div>
                  {formData.tokenAddress === token.address && (
                    <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="mt-1 text-xs text-gray-400">
          💡 This is what users will stake when betting on your event
        </div>
      </div>

      {/* Creator Fee Information - Always CUSD */}
      <div className="bg-[#1A1F3F] border border-[#2A3052] rounded-lg p-4">
        {/*<h3 className="flex items-center gap-2 mb-3 font-medium text-white">
          Creator Fee Requirements
          <div className="relative">
            <HelpCircle
              className="w-4 h-4 cursor-pointer text-cyan-400"
              onClick={() => toggleInfoTooltip("requirements")}
            />
            {showInfoTooltip.requirements && (
              <div className="absolute z-10 w-72 bg-[#1A1F3F] border border-cyan-700 p-3 rounded-lg text-sm text-white -right-2 top-6">
                {isAdminOrModerator
                  ? "As an admin/moderator, you can create events without paying creator fees. No CUSD tokens are required."
                  : "To create an event, you must pay a creator fee in CUSD tokens. This is separate from the staking token users will use to bet on your event. The fee helps maintain the platform."}
              </div>
            )}
          </div>
        </h3>*/}

        {/*isAdminOrModerator ? (
          // Admin/Moderator view
          <div className="space-y-2 text-sm text-gray-300">
            <div className="flex items-center justify-between">
              <span>Admin/Moderator Status:</span>
              <span className="font-medium text-green-400">✅ Verified</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Creator Fee Required:</span>
              <span className="font-medium text-green-400">None (Exempt)</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Fee Token:</span>
              <span className="font-medium text-green-400">N/A</span>
            </div>
            <div className="text-xs text-green-400 mt-2 p-2 bg-[#0B122E] rounded border border-green-500/20">
              🎉 Admin/Moderator privileges: Create events instantly without any
              creator fees!
            </div>
          </div>
        ) : (
          // Regular user view
          <div className="space-y-2 text-sm text-gray-300">
            <div className="flex justify-between">
              <span>Creator Fee Amount:</span>
              <span className="font-medium text-cyan-400">
                {creatorStakeAmount} CUSD
              </span>
            </div>
            <div className="flex justify-between">
              <span>Fee Percentage:</span>
              <span className="font-medium text-cyan-400">
                {defaultCreatorFeePercentage}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Fee Token:</span>
              <span className="font-medium text-orange-400">CUSD Only</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Staking Token:</span>
              <span>
                {selectedToken?.symbol || "Not selected"} (For user betting)
              </span>
            </div>
            <div className="text-xs text-gray-400 mt-2 p-2 bg-[#0B122E] rounded border border-orange-500/20">
              💡 <strong>Two separate tokens:</strong>
              <br />• <strong>Creator fee:</strong> Always paid in CUSD tokens
              (returned after resolution)
              <br />• <strong>User staking:</strong> Uses the token you selected
              above ({selectedToken?.symbol || "none selected"})
            </div>
          </div>
        )*/}
      </div>

      {/* Event Image (Optional) */}
      {/* <div>
        <div className="flex items-center mb-2">
          <label className="font-medium text-white">Event Image (Optional)</label>
          <div className="relative ml-2">
            <HelpCircle
              className="w-4 h-4 cursor-pointer text-cyan-400"
              onClick={() => toggleInfoTooltip('eventImage')}
            />
            {showInfoTooltip.eventImage && (
              <div className="absolute z-10 w-64 bg-[#1A1F3F] border border-cyan-700 p-3 rounded-lg text-sm text-white -right-2 top-6">
                Add an image URL to make your event more attractive. This is optional but recommended for better engagement.
              </div>
            )}
          </div>
        </div>
        <input
          type="url"
          name="eventImage"
          value={formData.eventImage}
          onChange={handleChange}
          placeholder="https://example.com/image.jpg"
          className="w-full bg-[#1A1F3F] text-white border border-[#2A3052] rounded-lg p-3 placeholder-gray-500 focus:border-cyan-400 focus:outline-none"
        />
      </div> */}

      {/* Status Messages */}
      {isSubmitting && (
        <div className="p-3 text-blue-300 bg-blue-500 border border-blue-500 rounded-lg bg-opacity-20">
          <p className="font-medium">
            {isAdminOrModerator
              ? "Creating your event..."
              : "Creating your event..."}
          </p>
        </div>
      )}
    </div>
  );
};

export default TimeTokenForm;
