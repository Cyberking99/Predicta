import { useState } from "react";
import { useWriteContract, useWaitForTransactionReceipt, useAccount, useReadContract } from "wagmi";
import { toast } from "react-toastify";
import { parseUnits, isAddress } from "viem";

// ABI for standard ERC20 approve method
const erc20Abi = [
  {
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" }
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" }
    ],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  }
];

/**
 * Hook for interacting with ERC20 tokens on Base and other chains
 * @param {string} tokenAddress - The address of the ERC20 token
 * @param {number} chainId - The current chain ID
 * @returns {Object} - Functions and state for token operations
 */
export const useERC20Token = (tokenAddress, chainId) => {
  const { address } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [hash, setHash] = useState(null);

  const { writeContract } = useWriteContract();

  // Get transaction receipt
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
    enabled: !!hash,
  });

  /**
   * Approve token spending
   * @param {string} token - Token address
   * @param {string} spender - Address to approve
   * @param {string|number|bigint} amount - Amount to approve (in base units or with decimals)
   * @param {number} decimals - Token decimals (default: 18)
   * @returns {Promise<boolean>} - Success status
   */
  const approveToken = async (token, spender, amount, decimals = 18) => {
    // Validate parameters
    if (!token || !spender || !amount) {
      const errorMsg = `Missing required parameters: token=${token}, spender=${spender}, amount=${amount}`;
      console.error(errorMsg);
      setError(new Error(errorMsg));
      toast.error(errorMsg);
      return false;
    }

    // Validate addresses
    if (!isAddress(token)) {
      const errorMsg = `Invalid token address: ${token}`;
      console.error(errorMsg);
      setError(new Error(errorMsg));
      toast.error(errorMsg);
      return false;
    }

    if (!isAddress(spender)) {
      const errorMsg = `Invalid spender address: ${spender}`;
      console.error(errorMsg);
      setError(new Error(errorMsg));
      toast.error(errorMsg);
      return false;
    }

    if (!address) {
      const errorMsg = `No wallet connected`;
      console.error(errorMsg);
      setError(new Error(errorMsg));
      toast.error(errorMsg);
      return false;
    }

    setIsLoading(true);
    setError(null);
    setIsSuccess(false);
    setHash(null);

    try {
      // Log the input parameters for debugging
      console.log("Approval parameters:", {
        token,
        spender,
        amount,
        amountType: typeof amount,
        decimals,
        chainId
      });

      // Convert amount to appropriate format based on its type
      let approvalAmount;
      try {
        if (typeof amount === 'bigint') {
          approvalAmount = amount;
        } else if (typeof amount === 'string') {
          // Check if the string has a decimal point
          if (amount.includes('.')) {
            approvalAmount = parseUnits(amount, decimals);
          } else {
            // Handle string representation of a number without decimal point
            approvalAmount = BigInt(amount);
          }
        } else if (typeof amount === 'number') {
          // Convert number to string then to BigInt with correct decimals
          approvalAmount = parseUnits(amount.toString(), decimals);
        } else {
          throw new Error(`Unsupported amount type: ${typeof amount}`);
        }

        console.log("Converted amount:", approvalAmount.toString());
      } catch (err) {
        console.error("Error converting amount:", err);
        throw new Error(`Failed to convert amount: ${err.message}`);
      }

      // Write the contract transaction
      const result = await writeContract({
        address: token,
        abi: erc20Abi,
        functionName: 'approve',
        args: [spender, approvalAmount],
        chainId,
      });

      setHash(result);
      console.log("Approve transaction submitted:", result);
      toast.info("Approval transaction submitted");

      setIsSuccess(true);
      return true;
    } catch (err) {
      console.error("Error approving token:", err);
      setError(err);
      toast.error(`Failed to approve token: ${err.message}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Check token allowance using wagmi's useReadContract
   * @param {string} token - Token address
   * @param {string} owner - Token owner address
   * @param {string} spender - Spender address
   * @returns {Promise<bigint>} - Current allowance
   */
  const checkAllowance = async (token, owner, spender) => {
    if (!token || !owner || !spender) {
      console.warn("Missing parameters for allowance check:", { token, owner, spender });
      return BigInt(0);
    }

    if (!isAddress(token) || !isAddress(owner) || !isAddress(spender)) {
      console.warn("Invalid addresses provided for allowance check");
      return BigInt(0);
    }

    try {
      // Use wagmi's read functionality instead of direct API calls
      const { data } = await useReadContract({
        address: token,
        abi: erc20Abi,
        functionName: 'allowance',
        args: [owner, spender],
        chainId,
      });

      return data || BigInt(0);
    } catch (err) {
      console.error("Error checking allowance:", err);
      // Return 0 as BigInt to ensure consistent return type
      return BigInt(0);
    }
  };

  /**
   * Alternative direct RPC approach for allowance checking
   * @param {string} token - Token address
   * @param {string} owner - Token owner address
   * @param {string} spender - Spender address
   * @returns {Promise<bigint>} - Current allowance
   */
  const checkAllowanceDirectRPC = async (token, owner, spender) => {
    if (!token || !owner || !spender) {
      console.warn("Missing parameters for allowance check");
      return BigInt(0);
    }

    if (!isAddress(token) || !isAddress(owner) || !isAddress(spender)) {
      console.warn("Invalid addresses provided for allowance check");
      return BigInt(0);
    }

    try {
      // Get base chain RPC URL based on chainId
      const rpcUrl = getRpcUrlForChain(chainId);
      if (!rpcUrl) {
        console.error("No RPC URL available for chainId:", chainId);
        return BigInt(0);
      }

      // Create the payload for the JSON-RPC call
      const payload = {
        jsonrpc: "2.0",
        id: 1,
        method: "eth_call",
        params: [{
          to: token,
          data: encodeAllowanceData(owner, spender)
        }, "latest"]
      };

      // Make the call
      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.result) {
        // Convert the hex result to a BigInt
        return BigInt(data.result);
      }

      console.warn("No result from RPC call:", data);
      return BigInt(0);
    } catch (err) {
      console.error("Error checking allowance via RPC:", err);
      return BigInt(0);
    }
  };

  /**
   * Get appropriate RPC URL for the chain
   * @param {number} chainId - Chain ID
   * @returns {string|null} - RPC URL or null
   */
  const getRpcUrlForChain = (chainId) => {
    // Public RPC endpoints - in production, use your own API keys
    const rpcUrls = {
      // Celo Alfajores Testnet
      44787: "https://rpc.ankr.com/celo_sepolia",
      // Celo Mainnet (for reference)
      42220: "https://mainnet.celo.org",
      // Ethereum
      1: "https://eth.public-rpc.com",
      5: "https://goerli.public-rpc.com",
      // Add more as needed
    };

    return rpcUrls[chainId] || null;
  };

  /**
   * Helper function to encode the allowance function call data
   * @param {string} owner - Owner address
   * @param {string} spender - Spender address
   * @returns {string} - Encoded function call data
   */
  const encodeAllowanceData = (owner, spender) => {
    // Function signature for allowance(address,address)
    const functionSignature = "0xdd62ed3e";

    // Pad addresses to 32 bytes (64 characters)
    const paddedOwner = owner.slice(2).padStart(64, '0');
    const paddedSpender = spender.slice(2).padStart(64, '0');

    return `${functionSignature}${paddedOwner}${paddedSpender}`;
  };

  /**
   * Helper to reset the state
   */
  const resetState = () => {
    setIsLoading(false);
    setIsSuccess(false);
    setError(null);
    setHash(null);
  };

  return {
    approveToken,
    checkAllowance: checkAllowanceDirectRPC,
    resetState,
    isLoading: isLoading || isConfirming,
    isSuccess: isSuccess && isConfirmed,
    isConfirming,
    isConfirmed,
    error,
    hash,
    address
  };
};

export default useERC20Token;