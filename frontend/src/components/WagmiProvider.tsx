"use client";

import { createConfig, http, WagmiProvider } from "wagmi";
import { celoAlfajores } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { coinbaseWallet, metaMask, walletConnect } from "wagmi/connectors";
// import { APP_NAME, APP_ICON_URL, APP_URL } from "@lib/constants";
import { useEffect, useState, createContext, useContext } from "react";
import { useConnect, useAccount, useDisconnect } from "wagmi";
import React from "react";

// Constants

const APP_NAME: string = process.env.NEXT_PUBLIC_APP_NAME!;
const APP_URL: string = process.env.NEXT_PUBLIC_URL!;
const APP_ICON_URL: string = `${APP_URL}/icon.png`;

// Wallet context and types
interface WalletContextType {
  connect: (connectorId?: string) => void;
  disconnect: () => void;
  isConnected: boolean;
  isConnecting: boolean;
  address: string | undefined;
  connectors: readonly any[];
  primaryConnector: any;
}

const WalletContext = createContext<WalletContextType | null>(null);

// Custom hook for centralized wallet management
export function useWallet(): WalletContextType {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within WagmiProvider");
  }
  return context;
}

// Custom hook for Coinbase Wallet detection and auto-connection
function useCoinbaseWalletAutoConnect() {
  const [isCoinbaseWallet, setIsCoinbaseWallet] = useState(false);
  const { connect, connectors } = useConnect();
  const { isConnected } = useAccount();

  useEffect(() => {
    // Check if we're running in Coinbase Wallet
    const checkCoinbaseWallet = () => {
      const isInCoinbaseWallet =
        window.ethereum?.isCoinbaseWallet ||
        window.ethereum?.isCoinbaseWalletExtension ||
        window.ethereum?.isCoinbaseWalletBrowser;
      setIsCoinbaseWallet(!!isInCoinbaseWallet);
    };

    checkCoinbaseWallet();
    window.addEventListener("ethereum#initialized", checkCoinbaseWallet);

    return () => {
      window.removeEventListener("ethereum#initialized", checkCoinbaseWallet);
    };
  }, []);

  useEffect(() => {
    // Auto-connect if in Coinbase Wallet and not already connected
    if (isCoinbaseWallet && !isConnected) {
      connect({ connector: connectors[1] }); // Coinbase Wallet connector
    }
  }, [isCoinbaseWallet, isConnected, connect, connectors]);

  return isCoinbaseWallet;
}

export const config = createConfig({
  chains: [celoAlfajores],
  transports: {
    [celoAlfajores.id]: http(process.env.NEXT_PUBLIC_RPC_URL),
  },
  connectors: [
    coinbaseWallet({
      appName: APP_NAME,
      appLogoUrl: APP_ICON_URL,
      preference: "all",
    }),
    metaMask({
      dappMetadata: {
        name: APP_NAME,
        // url: window.ethereum,
      },
    }),
    walletConnect({
      projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
      showQrModal: true,
      metadata: {
        name: APP_NAME,
        description: "Predicta - Prediction Markets",
        url: APP_URL,
        icons: [APP_ICON_URL],
      },
    }),
  ],
});

const queryClient = new QueryClient();

// Wrapper component that provides Coinbase Wallet auto-connection and wallet context
function WalletProvider({ children }: { children: React.ReactNode }) {
  const { connect: wagmiConnect, connectors: wagmiConnectors } = useConnect();
  const { disconnect: wagmiDisconnect } = useDisconnect();
  const {
    address,
    isConnected: wagmiIsConnected,
    isConnecting: wagmiIsConnecting,
  } = useAccount();

  // Auto-connect logic
  useCoinbaseWalletAutoConnect();

  // Determine primary connector with better fallback logic
  const primaryConnector = React.useMemo(() => {
    return (
      wagmiConnectors.find((c) => c.id.includes("coinbase")) ||
      wagmiConnectors.find((c) => c.id === "walletConnect") ||
      wagmiConnectors[0] ||
      null
    );
  }, [wagmiConnectors]);

  const walletValue: WalletContextType = {
    connect: (connectorId?: string) => {
      if (connectorId) {
        const connector = wagmiConnectors.find((c) => c.id === connectorId);
        if (connector) {
          wagmiConnect({ connector });
        }
      } else if (primaryConnector) {
        wagmiConnect({ connector: primaryConnector });
      }
    },
    disconnect: wagmiDisconnect,
    isConnected: wagmiIsConnected,
    isConnecting: wagmiIsConnecting,
    address,
    connectors: wagmiConnectors,
    primaryConnector,
  };

  return (
    <WalletContext.Provider value={walletValue}>
      {children}
    </WalletContext.Provider>
  );
}

export default function Provider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <WalletProvider>{children}</WalletProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
