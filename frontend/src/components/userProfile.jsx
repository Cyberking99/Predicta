import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAccount, useSignMessage } from "wagmi";
import mail from "../assets/images/svgs/mail.svg";
import at from "../assets/images/svgs/at-sign.svg";
import marker from "../assets/images/svgs/marker-pin.svg";
import translate from "../assets/images/svgs/translate.svg";
import coin from "../assets/images/svgs/stim-coin.svg";
import image from "../assets/images/svgs/image.svg";
import user from "../assets/images/svgs/user-01.svg";
import userprofile from "../assets/images/pngs/user-profile.png";
import check from "../assets/images/svgs/check.svg";
import gear from "../assets/images/svgs/Gear.svg";
import Flames from "../assets/images/svgs/flames.svg";
import {
  Twitter,
  CheckCircle,
  ExternalLink,
  Copy,
  AlertCircle,
} from "lucide-react";

// Import updated blockies utility
import {
  generateBlockiesAvatar,
  getCurrentAvatar,
} from "../utils/blockiesAvatar";

import {
  useTwitterVerification,
  TwitterVerificationCard as ImportedTwitterVerificationCard,
} from "../../services/TwitterVerification";

// Enhanced Wallet Profile Hook
const useWalletProfile = () => {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Generate wallet-based avatar using shared utility
  const generateWalletAvatar = (walletAddress) => {
    if (!walletAddress) return null;
    return generateBlockiesAvatar(walletAddress.toLowerCase(), 64);
  };

  // Load profile data for connected wallet
  const loadProfileData = () => {
    if (!address || !isConnected) {
      setProfileData(null);
      return null;
    }

    const profileKey = `preden_profile_${address}`;
    const storedProfile = localStorage.getItem(profileKey);

    if (storedProfile) {
      try {
        const parsed = JSON.parse(storedProfile);
        console.log("📊 Loaded profile data:", parsed);
        setProfileData(parsed);
        return parsed;
      } catch (error) {
        console.error("❌ Error loading profile data:", error);
      }
    }

    // Create default profile with wallet-based avatar
    const defaultProfile = {
      address,
      username: `@${address.slice(0, 6)}`,
      name: "",
      location: "",
      email: "",
      language: "English US",
      avatar: generateWalletAvatar(address),
      createdAt: Date.now(),
      lastUpdated: Date.now(),
      isAuthenticated: false,
    };

    // Save default profile immediately
    localStorage.setItem(profileKey, JSON.stringify(defaultProfile));
    setProfileData(defaultProfile);
    return defaultProfile;
  };

  // Force reload profile data
  const forceReloadProfile = () => {
    if (!address || !isConnected) {
      return;
    }
    return loadProfileData();
  };

  // Save profile data and authenticate with signature
  const saveProfileData = async (newProfileData) => {
    if (!address || !isConnected) {
      throw new Error("Wallet not connected");
    }

    setIsLoading(true);
    try {
      const timestamp = Date.now();

      const updateMessage = `Preden Profile Update

Wallet: ${address}
Timestamp: ${timestamp}
Action: Update and authenticate profile

Profile Data:
Username: ${newProfileData.username || "Not set"}
Name: ${newProfileData.name || "Not set"}
Email: ${newProfileData.email || "Not set"}
Location: ${newProfileData.location || "Not set"}
Language: ${newProfileData.language || "English US"}

By signing this message, you confirm these profile updates and authenticate your profile.`;

      console.log("🔐 Requesting signature for profile update...");
      const signature = await signMessageAsync({ message: updateMessage });

      const profileWithAuth = {
        ...newProfileData,
        address,
        lastUpdated: timestamp,
        updateSignature: signature,
        updateMessage,
        isAuthenticated: true,
        avatar: newProfileData.avatar || generateWalletAvatar(address),
      };

      const profileKey = `preden_profile_${address}`;
      localStorage.setItem(profileKey, JSON.stringify(profileWithAuth));

      setProfileData(profileWithAuth);

      window.dispatchEvent(
        new CustomEvent("profileUpdated", {
          detail: profileWithAuth,
        })
      );

      console.log("✅ Profile data saved and authenticated successfully");

      return { success: true, signature };
    } catch (error) {
      console.error("❌ Failed to save profile data:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Reset avatar to wallet-generated profile image
  const resetToWalletAvatar = async () => {
    if (!address || !profileData) return;

    const walletAvatar = generateWalletAvatar(address);
    const updatedProfile = {
      ...profileData,
      avatar: walletAvatar,
    };

    const profileKey = `preden_profile_${address}`;
    localStorage.setItem(profileKey, JSON.stringify(updatedProfile));
    setProfileData(updatedProfile);

    window.dispatchEvent(
      new CustomEvent("profileUpdated", {
        detail: updatedProfile,
      })
    );
  };

  // Clear profile data
  const clearProfile = () => {
    if (address) {
      localStorage.removeItem(`preden_profile_${address}`);
    }
    setProfileData(null);
  };

  // Auto-load profile when wallet changes
  useEffect(() => {
    if (isConnected && address) {
      loadProfileData();
    } else {
      setProfileData(null);
    }
  }, [address, isConnected]);

  return {
    profileData,
    isLoading,
    saveProfileData,
    loadProfileData,
    forceReloadProfile,
    resetToWalletAvatar,
    clearProfile,
    generateWalletAvatar,
  };
};

// Icon components
const RewardIcon = () => (
  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 7V9C15 10.1 15.9 11 17 11V20C17 21.1 16.1 22 15 22H9C7.9 22 7 21.1 7 20V11C8.1 11 9 10.1 9 9V7H3V9C3 10.1 3.9 11 5 11V20C5 21.1 5.9 22 7 22H17C18.1 22 19 21.1 19 20V11C20.1 11 21 10.1 21 9Z" />
  </svg>
);

const HistoryIcon = () => (
  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
    <path d="M3 3V21H21V19H5V3H3M7 17L10.5 13.5L13.5 16.5L19 11V15H21V9H15V11H19L13.5 16.5L10.5 13.5L7 17Z" />
  </svg>
);

const FriendsIcon = () => (
  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 12.75c1.63 0 3.07.39 4.24.9c1.08.48 1.76 1.56 1.76 2.73V18H6v-1.61c0-1.18.68-2.26 1.76-2.73c1.17-.52 2.61-.91 4.24-.91zM4 13c1.1 0 2-.9 2-2s-.9-2-2-2s-2 .9-2 2s.9 2 2 2zm1.13 1.1c-.37-.06-.74-.1-1.13-.1c-.99 0-1.93.21-2.78.58A2.01 2.01 0 000 16.43V18h4.5v-1.61c0-.83.23-1.61.63-2.29zM20 13c1.1 0 2-.9 2-2s-.9-2-2-2s-2 .9-2 2s.9 2 2 2zm2.78 1.58c-.85-.37-1.79-.58-2.78-.58c-.39 0-.76.04-1.13.1c.4.68.63 1.46.63 2.29V18H24v-1.57c0-.81-.48-1.53-1.22-1.85zM12 6c1.1 0 2 .9 2 2s-.9 2-2 2s-2-.9-2-2s.9-2 2-2z" />
  </svg>
);

const UserProfile = () => {
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();

  const {
    profileData,
    isLoading,
    saveProfileData,
    forceReloadProfile,
    resetToWalletAvatar,
    generateWalletAvatar,
  } = useWalletProfile();

  // Add smooth scrolling effect on mount
  useEffect(() => {
    document.documentElement.style.scrollBehavior = "smooth";
    document.body.style.webkitOverflowScrolling = "touch";
    document.body.style.overflowScrolling = "touch";

    return () => {
      document.documentElement.style.scrollBehavior = "";
      document.body.style.webkitOverflowScrolling = "";
      document.body.style.overflowScrolling = "";
    };
  }, []);

  // Listen for profile updates from edit modals
  useEffect(() => {
    const handleProfileUpdate = (event) => {
      console.log("📡 Profile update received in UserProfile:", event.detail);
      forceReloadProfile();
    };

    window.addEventListener("profileUpdated", handleProfileUpdate);
    return () => {
      window.removeEventListener("profileUpdated", handleProfileUpdate);
    };
  }, [forceReloadProfile]);

  // Force refresh when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isConnected) {
        console.log("📱 Page became visible, reloading profile data");
        forceReloadProfile();
      }
    };

    const handleFocus = () => {
      if (isConnected) {
        console.log("🎯 Window focused, reloading profile data");
        forceReloadProfile();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [isConnected, forceReloadProfile]);

  const handleEditClick = (route) => {
    if (!isConnected) {
      navigate("/wallet");
      return;
    }

    if (route === "about") {
      window.open("https://www.preden.app", "_blank");
      return;
    }

    navigate(`/edit/${route}`, { state: { profileData } });
  };

  const handleClaimRewardClick = () => {
    navigate("/prediction-win");
  };

  const handleBetHistoryClick = () => {
    navigate("/bet-history");
  };

  const handleFriendsClick = () => {
    navigate("/friends");
  };

  // Helper function to get display value
  const getDisplayValue = (field) => {
    if (!profileData) {
      switch (field) {
        case "username":
          return address ? `@${address.slice(0, 6)}` : "@Connect";
        case "name":
          return "Connect Wallet";
        case "location":
          return "Not connected";
        case "email":
          return "Not yet added";
        default:
          return "Not set";
      }
    }

    const value = profileData[field];
    if (!value || value === "") {
      switch (field) {
        case "username":
          return `@${address?.slice(0, 6) || "user"}`;
        case "name":
          return "Add your name";
        case "location":
          return "Add your location";
        case "email":
          return "Not yet added";
        default:
          return value || "Not set";
      }
    }
    return value;
  };

  // Show connect wallet message if not connected
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-[#01052D] text-white flex items-center justify-center p-4">
        <div className="mx-auto text-center max-w-7xl">
          <div className="w-20 h-20 bg-[#18DDF7]/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-10 h-10 text-[#18DDF7]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <h2 className="mb-4 text-2xl font-bold text-white">
            Connect Your Wallet
          </h2>
          <p className="mb-6 text-gray-400">
            Please connect your wallet to access your profile
          </p>
          <button
            onClick={() => navigate("/wallet")}
            className="px-6 py-3 bg-[#18DDF7] text-black rounded-lg font-semibold hover:bg-[#18DDF7]/90 transition-colors"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  // Profile completion percentage (updated to exclude email)
  const getProfileCompletion = () => {
    if (!profileData) return 0;

    const fields = ["username", "name", "location"];
    const completed = fields.filter(
      (field) =>
        profileData[field] &&
        profileData[field] !== "Not yet added" &&
        profileData[field] !== "Not set" &&
        profileData[field] !== "" &&
        !profileData[field].startsWith("@")
    ).length;

    return Math.round((completed / fields.length) * 100);
  };

  // Authentication status card
  const AuthStatusCard = () => {
    const isAuthenticated = profileData?.isAuthenticated || false;

    return (
      <div className="p-[2px] rounded-2xl mb-6">
        <div
          className={`bg-[#09113B] rounded-2xl p-4 flex justify-between items-center border ${
            isAuthenticated ? "border-[#27FE60]/30" : "border-[#195281]"
          }`}
        >
          <div>
            <h2 className="text-white text-[14px] mb-1">
              {isAuthenticated ? "Profile Authenticated" : "Profile Ready"}
            </h2>
            <p className="text-[12px] text-gray-400">
              {isAuthenticated
                ? "Your profile is secured with wallet signature"
                : "Update your profile to authenticate with signature"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[#27FE60] rounded-full"></div>
                <span className="text-[#27FE60] text-xs">Authenticated</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[#18DDF7] rounded-full"></div>
                <span className="text-[#18DDF7] text-xs">Ready</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Complete Profile Card Component
  const CompleteProfileCard = () => {
    const completion = getProfileCompletion();
    const isAuthenticated = profileData?.isAuthenticated || false;

    return (
      <div
        className="p-[2px] rounded-2xl mb-6 transform transition-transform duration-200 ease-out"
        style={{
          background:
            completion === 100 && isAuthenticated
              ? "linear-gradient(135deg, #27FE60, #18DDF7)"
              : "linear-gradient(135deg, #195281, #09113B)",
        }}
      >
        <div className="bg-[#09113B] rounded-2xl p-4 flex justify-between items-center">
          <div>
            <h2 className="text-white text-[14px] mb-1">
              {completion === 100 && isAuthenticated
                ? "Profile Complete!"
                : "Complete Your Profile"}
            </h2>
            <p className="text-[12px] text-gray-400">
              {completion === 100 && isAuthenticated
                ? "Your profile is fully secured with your wallet"
                : `${completion}% complete - ${
                    !isAuthenticated
                      ? "Update profile to authenticate"
                      : "Add more details"
                  }`}
            </p>
            {isConnected && (
              <p className="text-[10px] text-[#18DDF7] mt-1">
                ✓ Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
              </p>
            )}
          </div>
          <div className="bg-[#01052D] p-2 rounded-lg">
            {completion === 100 && isAuthenticated ? (
              <svg
                className="w-6 h-6 text-[#27FE60]"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
              </svg>
            ) : (
              <img src={check} alt="Complete Icon" className="w-6 h-6" />
            )}
          </div>
        </div>
      </div>
    );
  };

  // Simple Claim Rewards Card
  const ClaimRewardsCard = () => (
    <div
      className="p-[2px] rounded-2xl mb-6 cursor-pointer transform transition-transform duration-200 ease-out hover:scale-[1.02] active:scale-[0.98]"
      style={{
        background: "linear-gradient(135deg, #27FE60, #18DDF7)",
      }}
      onClick={handleClaimRewardClick}
    >
      <div className="bg-[#09113B] rounded-2xl p-4 flex justify-between items-center">
        <div>
          <h2 className="text-white text-[14px] mb-1 font-semibold">
            Check for Winnings
          </h2>
          <p className="text-[12px] text-gray-400">
            Check if you have any claimable rewards
          </p>
        </div>
        <div className="bg-gradient-to-r from-[#27FE60]/20 to-[#18DDF7]/20 p-2 rounded-lg">
          <div className="text-[#27FE60]">
            <RewardIcon />
          </div>
        </div>
      </div>
    </div>
  );

  // Bet History Card
  const BetHistoryCard = () => (
    <div
      className="p-[2px] rounded-2xl mb-6 cursor-pointer transform transition-transform duration-200 ease-out hover:scale-[1.02] active:scale-[0.98]"
      style={{
        background: "linear-gradient(135deg, #18DDF7, #195281)",
      }}
      onClick={handleBetHistoryClick}
    >
      <div className="bg-[#09113B] rounded-2xl p-4 flex justify-between items-center">
        <div>
          <h2 className="text-white text-[14px] mb-1 font-semibold">
            Bet History
          </h2>
          <p className="text-[12px] text-gray-400">
            View all your betting activity and results
          </p>
        </div>
        <div className="bg-gradient-to-r from-[#18DDF7]/20 to-[#195281]/20 p-2 rounded-lg">
          <div className="text-[#18DDF7]">
            <HistoryIcon />
          </div>
        </div>
      </div>
    </div>
  );

  // Friends Card
  const FriendsCard = () => (
    <div
      className="p-[2px] rounded-2xl mb-6 cursor-pointer transform transition-transform duration-200 ease-out hover:scale-[1.02] active:scale-[0.98]"
      style={{
        background: "linear-gradient(135deg, #195281, #09113B)",
      }}
      onClick={handleFriendsClick}
    >
      <div className="bg-[#09113B] rounded-2xl p-4 flex justify-between items-center">
        <div>
          <h2 className="text-white text-[14px] mb-1 font-semibold">Friends</h2>
          <p className="text-[12px] text-gray-400">
            Invite friends and earn rewards
          </p>
        </div>
        <div className="bg-[#01052D] p-2 rounded-lg">
          <div className="text-[#18DDF7]">
            <FriendsIcon />
          </div>
        </div>
      </div>
    </div>
  );

  // Avatar Section with Profile Images
  const AvatarSection = () => (
    <div
      className="p-[2px] rounded-2xl mb-6 cursor-pointer transform transition-transform duration-200 ease-out hover:scale-[1.02] active:scale-[0.98]"
      style={{
        background: "linear-gradient(135deg, #195281, #09113B)",
      }}
      onClick={() => handleEditClick("avatar")}
    >
      <div className="bg-[#09113B] rounded-2xl px-2 py-6 flex justify-between items-center">
        <div className="flex flex-col items-center">
          <div className="w-14 h-14 bg-[#01052D] rounded-full overflow-hidden mb-2 border-2 border-[#18DDF7]/30">
            <img
              src={profileData?.avatar || generateWalletAvatar(address)}
              alt="user profile"
              className="object-cover w-full h-full"
            />
          </div>
          <div className="text-center">
            <h2 className="text-white text-[14px] mb-1">Change Avatar</h2>
            <p className="text-[13px] text-gray-400 whitespace-nowrap">
              Upload or use default profile
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            className="px-2 py-1 w-[110px] border border-[#27FE60] bg-[#27FE6033] text-[#27FE60] rounded-full text-sm transition-all duration-200 ease-out hover:bg-[#27FE6050] active:scale-95"
            onClick={(e) => {
              e.stopPropagation();
              resetToWalletAvatar();
            }}
          >
            Reset Default
          </button>
          <div className="flex items-center justify-center w-10 h-10 rounded-md">
            <img src={image} alt="image" />
          </div>
        </div>
      </div>
    </div>
  );

  // Profile Item Component
  const ProfileItem = ({
    icon,
    label,
    value,
    verified,
    editable,
    hasArrow,
    route,
  }) => (
    <div
      className={`p-[2px] rounded-2xl mb-4 cursor-pointer transform transition-transform duration-200 ease-out hover:scale-[1.02] active:scale-[0.98]`}
      style={{
        background: "linear-gradient(135deg, #195281, #09113B)",
      }}
      onClick={() => route && handleEditClick(route)}
    >
      <div className="bg-[#09113B] rounded-2xl">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-[#01052D] rounded-md flex items-center justify-center">
              {icon}
            </div>
            <div>
              <p className="text-sm text-gray-400">{label}</p>
              <p className="text-white">{value}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {verified && (
              <span className="px-3 py-1 text-sm bg-[#27FE6033] text-[#27FE60] rounded-full">
                Verified
              </span>
            )}
            {editable && (
              <svg
                className="w-5 h-5 text-[#18DDF7] transition-transform duration-200 ease-out"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </svg>
            )}
            {hasArrow && (
              <svg
                className="w-5 h-5 text-gray-400 transition-transform duration-200 ease-out"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#01052D] text-white">
      <div
        className="overflow-x-hidden overflow-y-auto"
        style={{
          WebkitOverflowScrolling: "touch",
          overflowScrolling: "touch",
          scrollBehavior: "smooth",
        }}
      >
        <div className="p-4 pb-20 mx-auto max-w-7xl">
          <div className="flex items-center mb-2 space-x-2">
            <h1 className="text-lg text-[#18DDF7] font-bold">MANAGE PROFILE</h1>
            <img src={gear} alt="gear" className="w-5 h-5" />
          </div>

          {/* Loading indicator */}
          {isLoading && (
            <div className="p-3 mb-4 border rounded-lg bg-blue-500/20 border-blue-500/30">
              <p className="flex items-center gap-2 text-sm text-blue-300">
                <div className="w-4 h-4 border-2 border-blue-400 rounded-full border-t-transparent animate-spin"></div>
                Saving profile changes...
              </p>
            </div>
          )}

          {/* Check for Rewards Card */}
          <ClaimRewardsCard />

          {/* Bet History Card */}
          <BetHistoryCard />

          {/* Friends Card */}
          <FriendsCard />

          {/* Authentication Status Card */}
          <AuthStatusCard />

          {/* Complete Profile Card */}
          <CompleteProfileCard />

          {/* Avatar Section */}
          <AvatarSection />

          {/* ✅ Twitter Verification Card - IMPORTED, NOT DUPLICATED */}
          <ImportedTwitterVerificationCard />

          {/* Profile Items */}
          <ProfileItem
            icon={<img src={user} alt="user" />}
            label="Name"
            value={getDisplayValue("name")}
            editable={true}
            route="name"
          />
          <ProfileItem
            icon={<img src={marker} alt="location" />}
            label="Location"
            value={getDisplayValue("location")}
            route="location"
          />

          {/* Wallet Info Section */}
          {profileData && (
            <div className="mt-6 p-4 bg-[#09113B] rounded-2xl border border-[#195281]">
              <h3 className="mb-2 font-semibold text-white">
                Wallet Information
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Address:</span>
                  <span className="text-[#18DDF7] font-mono">
                    {address?.slice(0, 6)}...{address?.slice(-6)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Profile Created:</span>
                  <span className="text-white">
                    {profileData?.createdAt
                      ? new Date(profileData.createdAt).toLocaleDateString()
                      : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Last Updated:</span>
                  <span className="text-white">
                    {profileData?.lastUpdated
                      ? new Date(profileData.lastUpdated).toLocaleDateString()
                      : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Authentication:</span>
                  <span
                    className={`text-sm ${
                      profileData?.isAuthenticated
                        ? "text-[#27FE60]"
                        : "text-[#18DDF7]"
                    }`}
                  >
                    {profileData?.isAuthenticated
                      ? "Signed & Verified"
                      : "Ready for Updates"}
                  </span>
                </div>
              </div>
            </div>
          )}
          {/* Security Notice */}
          <div className="mt-6 p-4 bg-[#01052D] rounded-2xl border border-[#195281]/50">
            <h3 className="flex items-center gap-2 mb-2 font-semibold text-white">
              <svg
                className="w-5 h-5 text-[#18DDF7]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              Security & Privacy
            </h3>
            <ul className="space-y-1 text-xs text-gray-400">
              <li>
                • Your profile picture is selected deterministically from
                curated images
              </li>
              <li>
                • Profile data is stored locally and secured with wallet
                signatures
              </li>
              <li>
                • Twitter verification provides additional security for rewards
                eligibility
              </li>
              <li>
                • Only you can access and modify your profile with your wallet
              </li>
              <li>
                • No personal data is sent to external servers without
                verification
              </li>
            </ul>
          </div>

          <ProfileItem
            icon={<img src={coin} alt="coin" />}
            label="About Preden"
            value=""
            hasArrow={true}
            route="about"
          />
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
