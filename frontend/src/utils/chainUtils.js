/**
 * Chain utilities for Celo Sepolia Testnet
 * Simplified for single-chain support
 */

// Celo Sepolia Testnet chain ID
export const CELO_SEPOLIA_CHAIN_ID = 11142220;
export const CHAIN_ID = CELO_SEPOLIA_CHAIN_ID; // Generic export

/**
 * Map chainId to chain name
 * @param {number} chainId - The blockchain network ID
 * @returns {string} - The human-readable chain name
 */
export const getChainName = (chainId) => {
  return chainId === CELO_SEPOLIA_CHAIN_ID ? "Celo Sepolia" : "Unsupported Network";
};

/**
 * Check if a chainId is supported by the application
 * @param {number} chainId - The blockchain network ID
 * @returns {boolean} - Whether the chain is supported
 */
export const isChainSupported = (chainId) => {
  return chainId === CELO_SEPOLIA_CHAIN_ID;
};

/**
 * Check if running in Opera MiniPay
 * @returns {boolean} - True if running in MiniPay
 */
export const isMiniPay = () => {
  return typeof window !== 'undefined' && window.ethereum && (window.ethereum.isMiniPay);
};

/**
 * Get chain explorer URL
 * @param {number} chainId - The blockchain network ID
 * @returns {string} - The block explorer URL
 */
export const getExplorerUrl = (chainId) => {
  return chainId === CELO_SEPOLIA_CHAIN_ID ? "https://sepolia.celoscan.io" : "";
};

/**
 * Format transaction hash with explorer link
 * @param {string} txHash - Transaction hash
 * @param {number} chainId - The blockchain network ID
 * @returns {string} - Formatted transaction explorer URL
 */
export const getTransactionUrl = (txHash, chainId) => {
  const baseUrl = getExplorerUrl(chainId);
  return baseUrl ? `${baseUrl}/tx/${txHash}` : "";
};

/**
 * Format address with explorer link
 * @param {string} address - Wallet/contract address
 * @param {number} chainId - The blockchain network ID
 * @returns {string} - Formatted address explorer URL
 */
export const getAddressUrl = (address, chainId) => {
  const baseUrl = getExplorerUrl(chainId);
  return baseUrl ? `${baseUrl}/address/${address}` : "";
};

/**
 * Get native currency symbol (CELO for Celo Sepolia)
 * @param {number} chainId - The blockchain network ID
 * @returns {string} - The native currency symbol
 */
export const getNativeCurrencySymbol = (chainId) => {
  return chainId === CELO_SEPOLIA_CHAIN_ID ? "CELO" : "CELO";
};

/**
 * Get RPC URL for Celo Sepolia
 * @param {number} chainId - The blockchain network ID
 * @returns {string} - The RPC URL
 */
export const getRpcUrl = (chainId) => {
  if (chainId === CELO_SEPOLIA_CHAIN_ID) {
    return "https://forno.celo-sepolia.celo-testnet.org";
  }
  return "";
};

/**
 * Validate if the current network is Celo Sepolia
 * @param {number} chainId - The blockchain network ID
 * @returns {boolean} - True if Celo Sepolia, false otherwise
 */
export const isBaseMainnet = (chainId) => {
  // Keeping function name for backward compatibility if needed, but logic is Celo
  return chainId === CELO_SEPOLIA_CHAIN_ID;
};

/**
 * Get network status message
 * @param {number} chainId - The blockchain network ID
 * @returns {string} - Status message for the network
 */
export const getNetworkStatus = (chainId) => {
  if (chainId === CELO_SEPOLIA_CHAIN_ID) {
    return "Connected to Celo Sepolia ✅";
  }
  return `Unsupported network (Chain ID: ${chainId}). Please switch to Celo Sepolia.`;
};

/**
 * Get network configuration object
 * @returns {object} - Celo Sepolia configuration
 */
export const getNetworkConfig = () => {
  return {
    chainId: CELO_SEPOLIA_CHAIN_ID,
    name: "Celo Sepolia",
    symbol: "CELO",
    decimals: 18,
    explorer: "https://sepolia.celoscan.io",
    rpc: getRpcUrl(CELO_SEPOLIA_CHAIN_ID),
    isSupported: true
  };
};

// Export constants for easy access
export const NETWORK_CONFIG = {
  CHAIN_ID: CELO_SEPOLIA_CHAIN_ID,
  NAME: "Celo Sepolia",
  SYMBOL: "CELO",
  DECIMALS: 18,
  EXPLORER: "https://sepolia.celoscan.io",
  RPC_URL: getRpcUrl(CELO_SEPOLIA_CHAIN_ID)
};

// Default export with all utilities
export default {
  CELO_SEPOLIA_CHAIN_ID,
  CHAIN_ID: CELO_SEPOLIA_CHAIN_ID,
  getChainName,
  isChainSupported,
  getExplorerUrl,
  getTransactionUrl,
  getAddressUrl,
  getNativeCurrencySymbol,
  getRpcUrl,
  isBaseMainnet, // Deprecated name, kept for compatibility
  getNetworkStatus,
  getNetworkConfig,
  NETWORK_CONFIG
};