"use client"

import { useState, useEffect, useCallback } from "react"
import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi"
import { parseUnits } from "viem"

// ERC20 ABI for token operations
const ERC20_ABI = [
  {
    constant: true,
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: true,
    inputs: [{ name: "owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    payable: false,
    stateMutability: "view",
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
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: false,
    inputs: [
      { name: "spender", type: "address" },
      { name: "value", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
]

/**
 * Hook for handling token approval operations
 */
const useTokenApproval = (tokenAddress, spenderAddress, userAddress, tokenDecimals = 6) => {
  const [isApproved, setIsApproved] = useState(false)
  const [pendingApproval, setPendingApproval] = useState(false)
  const [approvalHash, setApprovalHash] = useState(null)
  const [pendingAmount, setPendingAmount] = useState(null)
  const [error, setError] = useState(null)

  const { writeContractAsync } = useWriteContract()

  // Transaction receipt hook
  const { isLoading: isApprovalPending, isSuccess: isApprovalSuccess } = useWaitForTransactionReceipt({
    hash: approvalHash,
    enabled: !!approvalHash,
  })

  // Check allowance
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: [userAddress, spenderAddress],
    enabled: !!userAddress && !!tokenAddress && !!spenderAddress,
  })

  // Get user balance
  const { data: userBalance, refetch: refetchBalance } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: [userAddress],
    enabled: !!userAddress && !!tokenAddress,
  })

  // Check if amount is approved
  const checkIfApproved = useCallback(
    (amount) => {
      if (!amount || !allowance) return false
      try {
        const amountInWei = parseUnits(amount.toString(), tokenDecimals)
        return allowance >= amountInWei
      } catch (err) {
        console.error("Error comparing allowance:", err)
        return false
      }
    },
    [allowance, tokenDecimals],
  )

  // Update approval status
  useEffect(() => {
    if (pendingAmount && allowance) {
      const approved = checkIfApproved(pendingAmount)
      setIsApproved(approved)
      if (isApprovalSuccess && approved) {
        setPendingApproval(false)
      }
    }
  }, [allowance, checkIfApproved, pendingAmount, isApprovalSuccess])

  // Handle transaction confirmations
  useEffect(() => {
    if (isApprovalSuccess && approvalHash) {
      console.log("Approval transaction confirmed:", approvalHash)
      setApprovalHash(null)
      setPendingApproval(false)
      if (pendingAmount) {
        refetchAllowance()
        setIsApproved(true)
      }
    }
  }, [isApprovalSuccess, approvalHash, pendingAmount, refetchAllowance])

  // Approve token
  const approveToken = async (amount) => {
    try {
      if (!amount || Number.parseFloat(amount) <= 0) {
        throw new Error("Invalid amount")
      }

      if (!userAddress) {
        throw new Error("Wallet not connected")
      }

      setPendingApproval(true)
      setPendingAmount(amount)

      const amountInWei = parseUnits(amount.toString(), tokenDecimals)
      const txHash = await writeContractAsync({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [spenderAddress, amountInWei],
      })

      setApprovalHash(txHash)
      return { success: true, hash: txHash }
    } catch (err) {
      console.error("Approval error:", err)
      setPendingApproval(false)
      setPendingAmount(null)

      let errorMessage = "Approval failed"
      if (err.message?.includes("User rejected")) {
        errorMessage = "Transaction was rejected"
      } else if (err.message?.includes("insufficient funds")) {
        errorMessage = "Insufficient funds for gas fee"
      } else if (err.message) {
        errorMessage = `Approval failed: ${err.message}`
      }

      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  return {
    isApproved,
    pendingApproval,
    isApprovalPending,
    isApprovalSuccess,
    userBalance: userBalance || BigInt(0),
    allowance,
    error,
    approveToken,
    checkIfApproved,
    refetchAllowance,
    refetchBalance,
    setError,
    clearError: () => setError(null),
  }
}

export default useTokenApproval
