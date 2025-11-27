"use client"

import { formatUnits, parseUnits } from "viem"

// Event Status Constants
const EVENT_STATUS = {
  PENDING: 0,
  APPROVED: 1,
  CLOSED: 2,
  COMPLETED: 3,
  CANCELLED: 4,
  REJECTED: 5,
}

const EVENT_STATUS_MESSAGES = {
  [EVENT_STATUS.PENDING]: "Pending approval",
  [EVENT_STATUS.APPROVED]: "Open for betting",
  [EVENT_STATUS.CLOSED]: "Closed for betting",
  [EVENT_STATUS.COMPLETED]: "Completed",
  [EVENT_STATUS.CANCELLED]: "Cancelled",
  [EVENT_STATUS.REJECTED]: "Rejected",
}

// ABIs
const EVENT_CONTRACT_ABI = [
  {
    type: "function",
    name: "getEventDetails",
    inputs: [],
    outputs: [
      { name: "question", type: "string" },
      { name: "description", type: "string" },
      { name: "options", type: "string[]" },
      { name: "eventType", type: "string" },
      { name: "category", type: "string" },
      { name: "eventImage", type: "string" },
      { name: "status", type: "uint8" },
      { name: "endTime", type: "uint256" },
      { name: "winningOption", type: "uint8" },
      { name: "creator", type: "address" },
      { name: "tokenAddress", type: "address" },
      { name: "creatorStake", type: "uint256" },
      { name: "totalStaked", type: "uint256" },
      { name: "creatorFeePercentage", type: "uint256" },
      { name: "creatorRewardClaimed", type: "bool" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getUserStake",
    inputs: [{ name: "_user", type: "address" }],
    outputs: [
      { name: "selectedOption", type: "uint8" },
      { name: "amount", type: "uint256" },
      { name: "claimed", type: "bool" },
    ],
    stateMutability: "view",
  },
]

const ERC20_ABI = [
  {
    constant: true,
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [{ name: "owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    type: "function",
  },
]

/**
 * Simplified debugging utility that works with existing hook data
 */
export const debugStakeTransaction = async (
  eventData,
  userAddress,
  tokenAddress,
  optionValue,
  amount,
  userBalance,
  allowance,
  tokenDecimals = 6,
) => {
  const debugInfo = {
    timestamp: new Date().toISOString(),
    userAddress,
    tokenAddress,
    optionValue,
    amount,
    checks: {},
    errors: [],
    warnings: [],
    recommendations: [],
  }

  try {
    console.log("🔍 Starting simplified stake transaction debug...")
    console.log("Parameters:", { userAddress, tokenAddress, optionValue, amount })

    // 1. Check if addresses are valid
    if (!userAddress || userAddress === "0x0") {
      debugInfo.errors.push("Invalid user address (wallet not connected)")
      return debugInfo
    }

    if (!tokenAddress || tokenAddress === "0x0") {
      debugInfo.errors.push("Invalid token address")
      return debugInfo
    }

    // 2. Validate input parameters
    if (optionValue !== 0 && optionValue !== 1) {
      debugInfo.errors.push(`Invalid option value: ${optionValue}. Must be 0 (Yes) or 1 (No)`)
    }

    if (!amount || Number.parseFloat(amount) <= 0) {
      debugInfo.errors.push(`Invalid amount: ${amount}. Must be greater than 0`)
    }

    // 3. Check event data
    if (!eventData) {
      debugInfo.errors.push("Event data not loaded")
      return debugInfo
    }

    debugInfo.checks.eventDetails = {
      question: eventData.question,
      status: eventData.status,
      statusMessage: eventData.statusMessage,
      endTime: eventData.end_time,
      hasEnded: eventData.hasEnded,
      isOpenForBetting: eventData.isOpenForBetting,
      totalStaked: eventData.totalStaked,
    }

    // 4. Check event status
    console.log("🎯 Checking event status...")
    const eventStatus = eventData.status
    const hasEnded = eventData.hasEnded

    debugInfo.checks.eventStatus = {
      status: eventStatus,
      statusMessage: eventData.statusMessage,
      isApproved: eventStatus === EVENT_STATUS.APPROVED,
      hasEnded,
      isOpenForBetting: eventData.isOpenForBetting,
    }

    if (eventStatus !== EVENT_STATUS.APPROVED) {
      debugInfo.errors.push(`Event is not approved for betting. Status: ${eventData.statusMessage}`)
    }

    if (hasEnded) {
      debugInfo.errors.push(
        `Event has ended. End time: ${eventData.end_time?.toLocaleString()}, Current time: ${new Date().toLocaleString()}`,
      )
    }

    // 5. Check user balance
    console.log("💰 Checking user's token balance...")
    if (userBalance && amount) {
      try {
        const amountInWei = parseUnits(amount.toString(), tokenDecimals)
        const balanceFormatted = formatUnits(userBalance, tokenDecimals)

        debugInfo.checks.userBalance = {
          balance: Number(userBalance),
          balanceFormatted,
          requiredAmount: Number(amountInWei),
          requiredAmountFormatted: amount,
          hasSufficientBalance: userBalance >= amountInWei,
        }

        if (userBalance < amountInWei) {
          debugInfo.errors.push(`Insufficient balance. Required: ${amount} tokens, Available: ${balanceFormatted} tokens`)
        }
      } catch (err) {
        debugInfo.errors.push("Error validating balance: " + err.message)
      }
    } else {
      debugInfo.warnings.push("User balance not available for validation")
    }

    // 6. Check token allowance
    console.log("✅ Checking token allowance...")
    if (allowance && amount) {
      try {
        const amountInWei = parseUnits(amount.toString(), tokenDecimals)
        const allowanceFormatted = formatUnits(allowance, tokenDecimals)

        debugInfo.checks.allowance = {
          allowance: Number(allowance),
          allowanceFormatted,
          requiredAmount: Number(amountInWei),
          requiredAmountFormatted: amount,
          hasSufficientAllowance: allowance >= amountInWei,
        }

        if (allowance < amountInWei) {
          debugInfo.errors.push(
            `Insufficient allowance. Required: ${amount} tokens, Approved: ${allowanceFormatted} tokens`,
          )
          debugInfo.recommendations.push("Approve tokens before staking")
        }
      } catch (err) {
        debugInfo.errors.push("Error validating allowance: " + err.message)
      }
    } else {
      debugInfo.warnings.push("Token allowance not available for validation")
    }

    // 7. Additional validations
    if (eventData.options && Number(optionValue) >= Object.keys(eventData.options).length) {
      debugInfo.errors.push(`Invalid option value: ${optionValue}. Event has ${Object.keys(eventData.options).length} options`)
    }

    // 8. Generate summary
    debugInfo.summary = {
      canStake: debugInfo.errors.length === 0,
      criticalIssues: debugInfo.errors.length,
      warnings: debugInfo.warnings.length,
      mainBlocker: debugInfo.errors[0] || null,
    }

    // 9. Generate recommendations
    if (debugInfo.errors.length === 0) {
      debugInfo.recommendations.push("All checks passed! Transaction should succeed.")
    } else {
      debugInfo.recommendations.push("Fix the errors above before attempting to stake.")
    }

    console.log("🎉 Debug complete!")
    console.log("Summary:", debugInfo.summary)
    console.log("Errors:", debugInfo.errors)
    console.log("Warnings:", debugInfo.warnings)

    return debugInfo
  } catch (error) {
    console.error("❌ Debug failed:", error)
    debugInfo.errors.push(`Debug failed: ${error.message}`)
    debugInfo.summary = {
      canStake: false,
      criticalIssues: debugInfo.errors.length,
      warnings: debugInfo.warnings.length,
      mainBlocker: error.message,
    }
    return debugInfo
  }
}

/**
 * Quick validation before stake attempt
 */
export const validateStakeInputs = (
  eventData,
  userAddress,
  amount,
  optionValue,
  userBalance,
  allowance,
  tokenDecimals = 6,
) => {
  const errors = []
  const warnings = []

  // Basic input validation
  if (!userAddress) {
    errors.push("Wallet not connected")
  }

  if (!amount || Number.parseFloat(amount) <= 0) {
    errors.push("Invalid stake amount")
  }

  if (optionValue !== 0 && optionValue !== 1) {
    errors.push("Invalid option value")
  }

  if (!eventData) {
    errors.push("Event data not loaded")
    return { errors, warnings, canStake: false }
  }

  // Event status validation
  if (eventData.status !== EVENT_STATUS.APPROVED) {
    errors.push(`Event is not approved for betting. Status: ${eventData.statusMessage}`)
  }

  if (eventData.hasEnded) {
    errors.push("Event has already ended")
  }

  // Balance validation
  if (amount && userBalance) {
    try {
      const amountInWei = parseUnits(amount.toString(), tokenDecimals)
      if (userBalance < amountInWei) {
        const balanceFormatted = formatUnits(userBalance, tokenDecimals)
        errors.push(`Insufficient balance. Required: ${amount}, Available: ${balanceFormatted}`)
      }
    } catch (err) {
      errors.push("Error validating balance")
    }
  }

  // Allowance validation
  if (amount && allowance) {
    try {
      const amountInWei = parseUnits(amount.toString(), tokenDecimals)
      if (allowance < amountInWei) {
        const allowanceFormatted = formatUnits(allowance, tokenDecimals)
        errors.push(`Insufficient allowance. Required: ${amount}, Approved: ${allowanceFormatted}`)
      }
    } catch (err) {
      errors.push("Error validating allowance")
    }
  }

  return {
    errors,
    warnings,
    canStake: errors.length === 0,
    mainBlocker: errors[0] || null,
  }
}
