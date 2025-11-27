import { http, createConfig, fallback } from "wagmi";
import { celoAlfajores } from "wagmi/chains";
import { injected, metaMask, walletConnect } from "wagmi/connectors";

// Get your WalletConnect Project ID from https://cloud.walletconnect.com/
const projectId = import.meta.env.VITE_REOWN_PROJECT_ID;

// Enhanced RPC configuration for Celo Alfajores reliability
export const config = createConfig({
  chains: [celoAlfajores],
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
    [celoAlfajores.id]: fallback([
      // Primary: Official Celo Alfajores RPC
      http("https://rpc.ankr.com/celo_sepolia", {
        timeout: 12_000,
        retryCount: 3,
        retryDelay: ({ count }) => ~~(1 << count) * 400,
      }),

      // Secondary: Public Node
      http("https://celo-alfajores.publicnode.com", {
        timeout: 12_000,
        retryCount: 2,
        retryDelay: ({ count }) => ~~(1 << count) * 400,
      }),
    ], {
      rank: {
        interval: 60_000, // Re-rank every minute
        sampleCount: 10,   // Use 10 samples for ranking
        timeout: 5_000,    // 5 second timeout for ranking
      },
      retryCount: 2,
      retryDelay: ({ count }) => ~~(1 << count) * 200,
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

export const SUPPORTED_CHAIN_ID = celoAlfajores.id; // 44787
export const SUPPORTED_CHAIN = celoAlfajores;

// Network validation helper
export const isValidNetwork = (chainId) => {
  return chainId === celoAlfajores.id;
};

// Get network name helper
export const getNetworkName = (chainId) => {
  return chainId === celoAlfajores.id ? "Celo Alfajores" : "Unsupported Network";
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
    "https://rpc.ankr.com/celo_sepolia",
    "https://alfajores-forno.celo-testnet.org",
    "https://celo-alfajores.publicnode.com",
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