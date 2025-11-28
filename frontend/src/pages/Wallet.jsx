import React, { useState, useEffect, useRef } from "react";
import { formatUnits, isAddress } from "viem";
import Box from "../assets/images/svgs/Box.svg";
import Flames from "../assets/images/svgs/flames.svg";
// import STIMIcon from "../assets/images/svgs/stim-coin.svg";
import CUSD from "../assets/images/pngs/cUSD.png";
import USDC from "../assets/images/svgs/USDC.svg";
import {
  useAccount,
  useDisconnect,
  useBalance,
  useChainId,
  useSwitchChain,
} from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { toast } from "react-toastify";
import { celoSepolia } from "../wagmi/config";
import { isMiniPay } from "../utils/chainUtils";

// MAINNET ADDRESSES ONLY - Celo Sepolia
const CUSD_TOKEN_ADDRESS = import.meta.env.VITE_CUSD_ADDRESS;
const USDC_TOKEN_ADDRESS = import.meta.env.VITE_USDC_ADDRESS;

// Token configurations for Celo Sepolia only
const NETWORK_TOKENS = {
  [celoSepolia.id]: [
    { symbol: "USDC", address: USDC_TOKEN_ADDRESS, decimals: 6 },
    { symbol: "cUSD", address: CUSD_TOKEN_ADDRESS, decimals: 18 },
  ],
};

const Wallet = ({ setWalletBalance }) => {
  const { address, isConnected, isConnecting, isReconnecting } = useAccount();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const chainId = useChainId();

  // Track previous connection state to detect new connections
  const prevConnected = useRef(isConnected);
  const prevAddress = useRef(address);
  const hasShownConnectedToast = useRef(false);
  const lastRefreshTime = useRef(0);
  const hasTriedAutoSwitch = useRef(false);

  const [tokenBalances, setTokenBalances] = useState({
    USDC: "0.0000",
    CUSD: "0.0000",
  });

  // Use multiple useBalance hooks for different tokens - MAINNET ADDRESSES ONLY
  const {
    data: stimBalanceData,
    isLoading: isLoadingCusd,
    error: cusdError,
    refetch: refetchCusd,
  } = useBalance({
    address: address,
    token: CUSD_TOKEN_ADDRESS,
    enabled: isConnected && !!address,
    refetchInterval: 300000,
  });

  const {
    data: usdcBalanceData,
    isLoading: isLoadingUsdc,
    error: usdcError,
    refetch: refetchUsdc,
  } = useBalance({
    address: address,
    token: USDC_TOKEN_ADDRESS,
    enabled: isConnected && !!address,
    refetchInterval: 300000,
  });

  // Check if any balance is loading
  const isLoadingBalance = isLoadingCusd || isLoadingUsdc;
  const hasBalanceError = cusdError || usdcError;

  // Auto-switch to Celo Sepolia when connected to any other network
  useEffect(() => {
    if (isConnected && chainId && !hasTriedAutoSwitch.current) {
      if (chainId !== celoSepolia.id) {
        console.log("🔄 Auto-switching to Celo Sepolia from network:", chainId);
        hasTriedAutoSwitch.current = true;

        switchChain?.({ chainId: celoSepolia.id })
          .then(() => {
            console.log("✅ Successfully switched to Celo Sepolia");
            toast.success("Switched to Celo Sepolia");
          })
          .catch((error) => {
            console.error("❌ Failed to switch to Celo Sepolia:", error);
            toast.error(
              "Please manually switch to Celo Sepolia for full functionality"
            );
          })
          .finally(() => {
            // Reset the flag after a delay to allow future auto-switches
            setTimeout(() => {
              hasTriedAutoSwitch.current = false;
            }, 10000);
          });
      }
    }
  }, [isConnected, chainId, switchChain]);

  // Reset auto-switch flag when disconnected
  useEffect(() => {
    if (!isConnected) {
      hasTriedAutoSwitch.current = false;
    }
  }, [isConnected]);

  // Force balance refresh utility
  const forceBalanceRefresh = () => {
    const now = Date.now();
    if (now - lastRefreshTime.current < 2000) {
      console.log("⏸️ Skipping refresh - too frequent");
      return;
    }

    lastRefreshTime.current = now;
    console.log("🔄 Wallet: Force balance refresh triggered");

    if (isConnected) {
      refetchCusd?.();
      refetchUsdc?.();
    }
  };

  // Update STIM balance when data changes
  useEffect(() => {
    if (stimBalanceData && isConnected) {
      try {
        const formattedBalance = parseFloat(stimBalanceData.formatted).toFixed(
          4
        );

        setTokenBalances((prev) => ({
          ...prev,
          CUSD: formattedBalance,
        }));

        // Update parent component with the STIM balance
        setWalletBalance?.(formattedBalance);

        console.log("💰 Wallet: CUSD Balance updated:", formattedBalance);
      } catch (error) {
        console.error("❌ Wallet: Error formatting CUSD balance:", error);
        setTokenBalances((prev) => ({
          ...prev,
          CUSD: "Error",
        }));
      }
    }
  }, [stimBalanceData, setWalletBalance, isConnected]);

  // Update USDC balance when data changes
  useEffect(() => {
    if (usdcBalanceData && isConnected) {
      try {
        const formattedBalance = parseFloat(usdcBalanceData.formatted).toFixed(
          4
        );

        setTokenBalances((prev) => ({
          ...prev,
          USDC: formattedBalance,
        }));

        console.log("💰 Wallet: USDC Balance updated:", formattedBalance);
      } catch (error) {
        console.error("❌ Wallet: Error formatting USDC balance:", error);
        setTokenBalances((prev) => ({
          ...prev,
          USDC: "Error",
        }));
      }
    }
  }, [usdcBalanceData, isConnected]);

  // Reset balances when disconnected
  useEffect(() => {
    if (!isConnected) {
      const resetBalance = "0.0000";
      setTokenBalances({
        USDC: resetBalance,
        STIM: resetBalance,
      });
      setWalletBalance?.(resetBalance);
    }
  }, [isConnected, setWalletBalance]);

  // Listen for balance refresh events from other components
  useEffect(() => {
    const handleForceRefresh = () => {
      console.log("🔄 Wallet: Received force refresh event");
      forceBalanceRefresh();
    };

    const handleStakeSuccess = () => {
      console.log("🎉 Wallet: Stake success event received");
      setTimeout(() => {
        forceBalanceRefresh();
        toast.info("Refreshing wallet balance...");
      }, 3000);
    };

    // Listen for multiple refresh events
    window.addEventListener("refreshWalletBalance", handleForceRefresh);
    window.addEventListener("refreshBalance", handleForceRefresh);
    window.addEventListener("forceBalanceRefetch", handleForceRefresh);
    window.addEventListener("stakeSuccess", handleStakeSuccess);

    // Check for pending refresh flag
    const checkRefreshFlag = () => {
      if (localStorage.getItem("balanceNeedsRefresh") === "true") {
        console.log("🔄 Wallet: Found refresh flag, refreshing...");
        localStorage.removeItem("balanceNeedsRefresh");
        setTimeout(forceBalanceRefresh, 1000);
      }
    };

    checkRefreshFlag();

    const handleFocus = () => {
      if (document.visibilityState === "visible") {
        checkRefreshFlag();
      }
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkRefreshFlag();
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("refreshWalletBalance", handleForceRefresh);
      window.removeEventListener("refreshBalance", handleForceRefresh);
      window.removeEventListener("forceBalanceRefetch", handleForceRefresh);
      window.removeEventListener("stakeSuccess", handleStakeSuccess);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isConnected]);

  // Only show toast for NEW connections
  useEffect(() => {
    const isNewConnection = !prevConnected.current && isConnected && address;
    const isWalletChanged =
      prevConnected.current &&
      isConnected &&
      prevAddress.current &&
      address &&
      prevAddress.current !== address;

    if (
      (isNewConnection || isWalletChanged) &&
      !hasShownConnectedToast.current
    ) {
      console.log("🔗 Wallet: New wallet connection detected:", {
        isNewConnection,
        isWalletChanged,
        address,
      });
      toast.success("Wallet connected successfully!");
      hasShownConnectedToast.current = true;

      setTimeout(() => {
        console.log("🔄 Wallet: Refreshing balance after new connection");
        forceBalanceRefresh();
      }, 2000);
    }

    prevConnected.current = isConnected;
    prevAddress.current = address;

    if (!isConnected) {
      hasShownConnectedToast.current = false;
    }
  }, [isConnected, address]);

  // Handle errors
  useEffect(() => {
    if (hasBalanceError) {
      console.error("❌ Wallet: Balance fetch errors:", {
        cusdError,
        usdcError,
      });

      // Update specific token balances to show error
      if (cusdError) {
        setTokenBalances((prev) => ({ ...prev, STIM: "Error" }));
      }
      if (usdcError) {
        setTokenBalances((prev) => ({ ...prev, USDC: "Error" }));
      }
    }
  }, [cusdError, usdcError, hasBalanceError]);

  // Handle network changes
  useEffect(() => {
    if (isConnected && chainId) {
      console.log(
        "🌐 Wallet: Network changed to:",
        getNetworkName(),
        "Chain ID:",
        chainId
      );

      setTimeout(() => {
        forceBalanceRefresh();
      }, 1000);
    }
  }, [chainId, isConnected]);

  const formatAddress = (addr) => {
    if (!addr || !isAddress(addr)) return "";
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      setTokenBalances({
        USDC: "0.0000",
        CUSD: "0.0000",
      });
      setWalletBalance?.("0.0000");

      hasShownConnectedToast.current = false;
      hasTriedAutoSwitch.current = false;

      toast.success("Wallet disconnected successfully");
    } catch (error) {
      console.error("❌ Wallet: Disconnect error:", error);
      toast.error("Failed to disconnect wallet");
    }
  };

  // Enhanced network name function
  const getNetworkName = () => {
    switch (chainId) {
      case celoSepolia.id:
        return "Celo Sepolia";
      default:
        return "Unsupported Network";
    }
  };

  // Check if current network is supported (Celo Sepolia only)
  const isSupportedNetwork = () => {
    return chainId === celoSepolia.id;
  };

  // Check if we should show network warning
  const shouldShowNetworkWarning = () => {
    return isConnected && chainId && !isSupportedNetwork();
  };

  // Handle manual network switch
  const handleSwitchToMainnet = async () => {
    try {
      await switchChain({ chainId: celoSepolia.id });
      toast.success("Switched to Celo Sepolia");
    } catch (error) {
      console.error("❌ Failed to switch network:", error);
      toast.error("Failed to switch network. Please try manually.");
    }
  };

  const isLoading = isConnecting || isReconnecting || isLoadingBalance;

  return (
    <div className="px-3">
      <div className="fixed bottom-0 left-0 w-[100%] h-[700px] md:w-[100%] md:h-[90%] z-0">
        <img
          src={Flames}
          alt="background"
          className="object-cover w-full h-full"
        />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="flex justify-center mt-10 mb-4">
          <div className="relative">
            <div className="absolute inset-0 bg-[#18DDF7]/30 rounded-full blur-lg"></div>
            <img
              src={Box}
              alt="box icon"
              className="relative w-12 h-12 lg:w-16 lg:h-16"
            />
          </div>
        </div>

        <h1 className="mb-2 text-xl font-semibold text-center text-white lg:text-3xl lg:mb-4">
          {isConnected ? "Your Wallet" : "Connect Your Wallet"}
        </h1>

        {isConnected && (
          <p className="max-w-2xl mx-5 mx-auto mb-4 text-sm text-center text-white lg:text-base lg:mb-8">
            Connect Your EVM Compatible Crypto Wallet to Deposit & Withdraw CUSD
            and USDC on Celo Sepolia.
          </p>
        )}


        {isMiniPay() && (
          <div className="flex justify-center mb-6">
            <a
              href="https://minipay.opera.com/add_cash"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#18DDF7] hover:bg-[#18DDF7]/80 text-black font-bold py-2 px-6 rounded-full text-sm transition-colors shadow-lg hover:shadow-[#18DDF7]/20 flex items-center gap-2"
            >
              Fund your account
            </a>
          </div>
        )}

        {/* Enhanced glowing wallet card with desktop optimization */}
        <div className="relative max-w-md mx-auto lg:max-w-4xl">
          {/* Glowing border effect */}
          <div
            className="absolute inset-0 rounded-2xl lg:rounded-3xl p-[2px] bg-gradient-to-r from-[#18DDF7] via-[#195281] to-transparent opacity-70 blur-sm"
            style={{
              background:
                "linear-gradient(90deg, #18DDF7 0%, #195281 50%, rgba(25, 82, 129, 0.3) 70%, transparent 100%)",
            }}
          ></div>

          {/* Main border gradient */}
          <div
            className="relative p-[2px] rounded-2xl lg:rounded-3xl"
            style={{
              background:
                "linear-gradient(90deg, #18DDF7 0%, #195281 40%, #09113B 70%, rgba(9, 17, 59, 0.5) 100%)",
            }}
          >
            <div className="bg-[#01052D] rounded-2xl lg:rounded-3xl px-6 py-4 lg:px-8 lg:py-6 relative">
              {/* Inner glow effect */}
              <div className="absolute inset-0 rounded-2xl lg:rounded-3xl bg-gradient-to-r from-[#18DDF7]/5 via-transparent to-transparent pointer-events-none"></div>

              <h3 className="relative z-10 mb-3 text-lg font-medium text-center text-white lg:text-xl lg:mb-4">
                {isConnected ? "Connected Wallet" : "Connect Wallet"}
              </h3>

              <div className="relative z-10 flex flex-col items-center gap-2 mb-3 lg:gap-3 lg:mb-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-[#18DDF7]/20 rounded-full blur-md"></div>
                  <img
                    src={Box}
                    alt="wallet icon"
                    className="relative w-10 h-10 lg:w-12 lg:h-12"
                  />
                </div>

                {isLoading && (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 rounded-full animate-spin lg:h-5 lg:w-5 border-cyan-400 border-t-transparent"></div>
                    <p className="text-sm text-white lg:text-base">
                      Loading wallet data...
                    </p>
                  </div>
                )}

                {isConnected && address && (
                  <>
                    <p className="text-sm font-medium text-white lg:text-lg">
                      {formatAddress(address)}
                    </p>

                    {/* Enhanced network indicator with glow */}
                    <div className="relative">
                      <div className="absolute inset-0 bg-[#18DDF7]/20 rounded-full blur-md"></div>
                      <div className="relative flex items-center gap-2 px-3 py-1 lg:px-4 lg:py-1.5 bg-[#18DDF7]/10 border border-[#18DDF7]/50 rounded-full backdrop-blur-sm">
                        <div
                          className={`w-2 h-2 rounded-full animate-pulse shadow-lg ${chainId === celoSepolia.id
                            ? "bg-green-400 shadow-green-400/50"
                            : "bg-red-400 shadow-red-400/50"
                            }`}
                        ></div>
                        <span
                          className={`text-xs lg:text-sm font-medium ${chainId === celoSepolia.id
                            ? "text-green-400"
                            : "text-red-400"
                            }`}
                        >
                          {getNetworkName(chainId)}
                        </span>
                      </div>
                    </div>
                  </>
                )}

                {isConnected && address && isSupportedNetwork() && (
                  <div className="relative z-10 w-full max-w-lg mt-2 space-y-2 lg:space-y-3 lg:max-w-xl">
                    {/* Enhanced STIM balance card with glowing effect */}
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-[#18DDF7]/20 via-[#18DDF7]/10 to-transparent rounded-full lg:rounded-lg blur-sm opacity-50 group-hover:opacity-70 transition-opacity"></div>
                      <div className="relative flex items-center justify-between px-4 py-2 lg:px-5 lg:py-3 rounded-full lg:rounded-lg bg-[#18DDF7]/10 border border-[#18DDF7]/30 backdrop-blur-sm hover:border-[#18DDF7]/50 transition-all duration-300">
                        <div className="flex items-center">
                          <div className="relative">
                            <div className="absolute inset-0 bg-[#18DDF7]/30 rounded-full blur-sm"></div>
                            <img
                              src={CUSD}
                              alt="CUSD"
                              className="relative w-5 h-5 mr-2 lg:w-6 lg:h-6"
                            />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[#18DDF7] text-sm lg:text-base font-medium">
                              cUSD
                            </span>
                            <span className="text-xs text-gray-400">
                              Celo Dollar
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[#18DDF7] text-sm lg:text-lg font-bold">
                            {isLoadingCusd ? (
                              <div className="w-4 h-4 border-2 rounded-full animate-spin lg:h-5 lg:w-5 border-cyan-400 border-t-transparent"></div>
                            ) : (
                              tokenBalances.CUSD
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Enhanced USDC card with real balance */}
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-[#18DDF7]/15 via-[#18DDF7]/5 to-transparent rounded-full lg:rounded-lg blur-sm opacity-30 group-hover:opacity-50 transition-opacity"></div>
                      <div className="relative flex items-center justify-between px-4 py-2 lg:px-5 lg:py-3 rounded-full lg:rounded-lg bg-[#18DDF7]/5 border border-[#18DDF7]/20 backdrop-blur-sm hover:border-[#18DDF7]/30 transition-all duration-300">
                        <div className="flex items-center">
                          <div className="relative">
                            <div className="absolute inset-0 rounded-full bg-blue-400/20 blur-sm"></div>
                            <img
                              src={USDC}
                              alt="USDC"
                              className="relative w-5 h-5 mr-2 lg:w-6 lg:h-6"
                            />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[#18DDF7] text-sm lg:text-base font-medium">
                              USDC
                            </span>
                            <span className="text-xs text-gray-400">
                              USD Coin
                            </span>
                          </div>
                        </div>
                        <span className="text-[#18DDF7] text-sm lg:text-lg font-bold">
                          {isLoadingUsdc ? (
                            <div className="w-4 h-4 border-2 rounded-full animate-spin lg:h-5 lg:w-5 border-cyan-400 border-t-transparent"></div>
                          ) : (
                            tokenBalances.USDC
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Enhanced error states */}
              {hasBalanceError && isConnected && isSupportedNetwork() && (
                <div className="relative z-10 w-full p-3 mt-4 border rounded-lg lg:p-4 bg-red-900/20 border-red-600/30 backdrop-blur-sm">
                  <p className="text-xs text-center text-red-300 lg:text-sm">
                    Failed to load some token balances. Network connection issue
                    detected.
                  </p>
                  <button
                    onClick={() => {
                      console.log("🔄 Wallet: Retry button clicked");
                      forceBalanceRefresh();
                      toast.info("Retrying balance fetch...");
                    }}
                    className="block mx-auto mt-1 text-xs text-red-200 underline transition-colors lg:text-sm hover:text-red-100"
                  >
                    Retry Now
                  </button>
                </div>
              )}

              {/* Enhanced loading indicator */}
              {isLoadingBalance && isConnected && isSupportedNetwork() && (
                <div className="relative z-10 w-full p-2 mt-4 border rounded-lg lg:p-4 bg-blue-900/20 border-blue-600/30 backdrop-blur-sm">
                  <p className="flex items-center justify-center gap-2 text-xs text-center text-blue-300 lg:text-sm">
                    <div className="w-3 h-3 border-2 border-blue-400 rounded-full animate-spin lg:h-5 lg:w-5 border-t-transparent"></div>
                    Updating balances...
                  </p>
                </div>
              )}

              {/* Network warning for unsupported networks */}
              {shouldShowNetworkWarning() && (
                <div className="relative z-10 w-full p-3 mt-4 border rounded-lg lg:p-4 bg-red-900/20 border-red-600/30 backdrop-blur-sm">
                  <p className="mb-2 text-xs text-center text-red-300 lg:text-sm">
                    ⚠️ Unsupported network detected. This app only works on Celo Sepolia.
                  </p>
                  <button
                    onClick={handleSwitchToMainnet}
                    className="bg-[#18DDF7] hover:bg-[#18DDF7]/80 text-black font-medium py-2 px-6 rounded-lg text-xs lg:text-sm mx-auto block transition-colors"
                  >
                    Switch to Celo Sepolia
                  </button>
                </div>
              )}

              <div className="relative z-10 flex justify-center mt-3 lg:mt-4">
                {isConnected ? (
                  <div className="flex justify-center w-full">
                    {/* Enhanced disconnect button */}
                    <button
                      onClick={handleDisconnect}
                      disabled={isLoading}
                      className="relative group bg-red-600/80 hover:bg-red-600 disabled:bg-red-400 disabled:cursor-not-allowed text-white font-bold py-2 lg:py-2.5 px-8 lg:px-12 rounded-lg transition-all duration-300 backdrop-blur-sm border border-red-500/30 hover:border-red-400/50"
                    >
                      <div className="absolute inset-0 transition-opacity rounded-lg opacity-0 bg-gradient-to-r from-red-500/20 to-transparent group-hover:opacity-100"></div>
                      <span className="relative text-sm lg:text-base">
                        {isLoading ? "Disconnecting..." : "Disconnect Wallet"}
                      </span>
                    </button>
                  </div>
                ) : (
                  <div className="flex justify-center w-full">
                    <div className="relative transition-transform transform hover:scale-105">
                      <div className="absolute inset-0 bg-[#18DDF7]/20 rounded-lg blur-md"></div>
                      <ConnectButton
                        chainStatus="icon"
                        accountStatus="address"
                        label="Connect Wallet"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Wallet;
