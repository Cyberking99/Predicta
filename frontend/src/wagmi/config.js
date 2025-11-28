import { http, createConfig, fallback } from "wagmi";
import { injected, metaMask, walletConnect } from "wagmi/connectors";

// Manually define Celo Sepolia since it's not in wagmi/chains yet
export const celoSepolia = {
  id: 11142220,
  name: "Celo Sepolia",
  nativeCurrency: { name: "Celo", symbol: "CELO", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://forno.celo-sepolia.celo-testnet.org"] },
  },
  blockExplorers: {
    default: { name: "CeloScan", url: "https://sepolia.celoscan.io" },
  },
  testnet: true,
};

// Get your WalletConnect Project ID from https://cloud.walletconnect.com/
const projectId = import.meta.env.VITE_REOWN_PROJECT_ID;

// Enhanced RPC configuration for Celo Sepolia reliability
export const config = createConfig({
  chains: [celoSepolia],
  connectors: [
    injected(),
    metaMask(),
    walletConnect({
      projectId,
      metadata: {
        name: "Predicta Prediction Platform",
        description: "Decentralized prediction and staking platform",
        url: "https://predicta-app.vercel.app",
        icons: ["https://predicta-app.vercel.app/icon.png"],
      },
      showQrModal: true,
    }),
  ],
  transports: {
    [celoSepolia.id]: fallback([
      // Primary: Official Celo Sepolia RPC
      http("https://forno.celo-sepolia.celo-testnet.org", {
        timeout: 20_000,
        retryCount: 5,
        retryDelay: ({ count }) => ~~(1 << count) * 500,
      }),

      // Secondary: DRPC
      http("https://celo-sepolia.drpc.org", {
        timeout: 20_000,
        retryCount: 3,
        retryDelay: ({ count }) => ~~(1 << count) * 500,
      }),
    ], {
      rank: {
        interval: 30_000, // Re-rank every 30 seconds
        sampleCount: 5,    // Use 5 samples for ranking
        timeout: 3_000,    // 3 second timeout for ranking
      },
      retryCount: 5,
      retryDelay: ({ count }) => ~~(1 << count) * 500,
    }),
  },
  // Optimized configuration for better performance
  ssr: false,
  syncConnectedChain: true,

  // Enhanced batching configuration for mainnet
  batch: {
    multicall: {
      batchSize: 32,        // Smaller batches for better reliability
      wait: 50,             // 50ms wait time for batching
    },
  },

  // Polling configuration for real-time updates
  pollingInterval: 15_000,    // Poll every 15 seconds instead of default 4 seconds

  // Cache configuration
  cacheTime: 30_000,          // 30 second cache time
});

export const SUPPORTED_CHAIN_ID = celoSepolia.id; // 11142220
export const SUPPORTED_CHAIN = celoSepolia;

// Network validation helper
export const isValidNetwork = (chainId) => {
  return chainId === celoSepolia.id;
};

// Get network name helper
export const getNetworkName = (chainId) => {
  return chainId === celoSepolia.id ? "Celo Sepolia" : "Unsupported Network";
};

// Enhanced error handling helper
export const handleRpcError = (error) => {
  const errorMessage = error?.message?.toLowerCase() || "";

  if (errorMessage.includes("rate limit") || errorMessage.includes("429")) {
    return "Rate limited. Please wait a moment and try again.";
  }

  if (errorMessage.includes("timeout") || errorMessage.includes("network")) {
    return "Network timeout. Please check your connection.";
  }

  if (errorMessage.includes("invalid") || errorMessage.includes("revert")) {
    return "Invalid contract call. Please check the contract address.";
  }

  return "Network error. Please try again.";
};

// RPC health check utility
export const checkRpcHealth = async () => {
  const healthChecks = [
    "https://forno.celo-sepolia.celo-testnet.org",
  ];

  const results = await Promise.allSettled(
    healthChecks.map(async (url) => {
      const start = Date.now();
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_blockNumber',
            params: [],
            id: 1
          }),
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
        if (data.error) throw new Error(data.error.message);

        return {
          url,
          latency: Date.now() - start,
          status: 'healthy',
          blockNumber: data.result
        };
      } catch (error) {
        return {
          url,
          latency: Date.now() - start,
          status: 'unhealthy',
          error: error.message
        };
      }
    })
  );

  return results.map((result, index) => ({
    url: healthChecks[index],
    ...result.value
  }));
};