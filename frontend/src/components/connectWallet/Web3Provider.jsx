"use client"

import '@rainbow-me/rainbowkit/styles.css';
import {
  getDefaultConfig,
  RainbowKitProvider,
} from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { celoAlfajores } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http } from 'wagmi';

// Configure wagmi with RainbowKit - Celo Alfajores
const config = getDefaultConfig({
  // Your dApp info
  appName: "Prediction & Staking Platform",
  appDescription: "Crypto Prediction & Staking Platform",
  appUrl: "https://predicta-app.vercel.app",
  appIcon: "https://predicta-app.vercel.app/logo.png", // Replace with your actual icon

  // WalletConnect Project ID
  projectId: import.meta.env.VITE_REOWN_PROJECT_ID,

  // Your dApp's chains - Celo Alfajores
  chains: [celoAlfajores],

  // Custom transports with your Alchemy keys - Celo Alfajores
  transports: {
    [celoAlfajores.id]: http(
      `https://rpc.ankr.com/celo_sepolia`,
    ),
  },

  ssr: false,
});

// Custom theme using official RainbowKit Theme type
const myCustomTheme = {
  blurs: {
    modalOverlay: 'blur(8px)',
  },
  colors: {
    accentColor: '#18DDF7', // Your cyan accent
    accentColorForeground: '#000000', // Black text on cyan
    actionButtonBorder: '#195281',
    actionButtonBorderMobile: '#195281',
    actionButtonSecondaryBackground: '#334155',
    closeButton: '#99A3BA',
    closeButtonBackground: '#334155',
    connectButtonBackground: '#18DDF7',
    connectButtonBackgroundError: '#FF4E4E',
    connectButtonInnerBackground: '#18DDF7',
    connectButtonText: '#000000',
    connectButtonTextError: '#FFFFFF',
    connectionIndicator: '#34D399',
    downloadBottomCardBackground: 'linear-gradient(126deg, rgba(0, 0, 0, 0) 9.49%, rgba(120, 120, 120, 0.2) 71.04%), #01052D',
    downloadTopCardBackground: 'linear-gradient(126deg, rgba(120, 120, 120, 0.2) 9.49%, rgba(0, 0, 0, 0) 71.04%), #01052D',
    error: '#FF4E4E',
    generalBorder: '#195281',
    generalBorderDim: '#334155',
    menuItemBackground: '#01052D',
    modalBackdrop: 'rgba(9, 17, 59, 0.85)', // Your app background with opacity
    modalBackground: '#09113B', // Your main app background
    modalBorder: '#195281', // Your gradient color
    modalText: '#FFFFFF',
    modalTextDim: '#99A3BA',
    modalTextSecondary: '#E2E8F0',
    profileAction: '#01052D',
    profileActionHover: '#18DDF715', // Your cyan with opacity
    profileForeground: '#09113B',
    selectedOptionBorder: '#18DDF7',
    standby: '#FFD700',
  },
  fonts: {
    body: 'Lato, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  radii: {
    actionButton: '16px',
    connectButton: '16px',
    menuButton: '16px',
    modal: '20px',
    modalMobile: '20px',
  },
  shadows: {
    connectButton: '0 4px 12px rgba(24, 221, 247, 0.3)',
    dialog: '0 8px 32px rgba(9, 17, 59, 0.8)',
    profileDetailsAction: '0 2px 6px rgba(25, 82, 129, 0.15)',
    selectedOption: '0 2px 6px rgba(24, 221, 247, 0.2)',
    selectedWallet: '0 2px 6px rgba(24, 221, 247, 0.2)',
    walletLogo: '0 2px 16px rgba(0, 0, 0, 0.16)',
  },
};

const queryClient = new QueryClient();

export const Web3Provider = ({ children }) => {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={myCustomTheme}
          modalSize="compact"
          initialChain={celoAlfajores}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};