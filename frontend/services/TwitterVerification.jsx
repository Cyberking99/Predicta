// TwitterVerification.jsx - Frontend React components
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount, useSignMessage } from 'wagmi';
import { Twitter, CheckCircle, ExternalLink, Copy, AlertCircle } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

console.log('🔧 Twitter Verification - API Base URL:', API_BASE_URL);

// Twitter Verification Hook
const useTwitterVerification = () => {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Check verification status
  const checkVerificationStatus = async () => {
    if (!address) return;

    const url = `${API_BASE_URL}/twitter/verification-status/${address}`;
    console.log('🔍 Checking verification status at:', url);

    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error('❌ Response not OK:', response.status, response.statusText);
        return;
      }
      
      const data = await response.json();
      console.log('✅ Verification status response:', data);
      
      if (data.success) {
        setVerificationStatus(data);
      }
    } catch (error) {
      console.error('❌ Error checking verification status:', error);
    }
  };

  // Sign message for authentication
  const signVerificationMessage = async (action = 'verification') => {
    const timestamp = Date.now();
    const message = `STIM Twitter Verification Request

Wallet: ${address}
Timestamp: ${timestamp}
Action: ${action}

By signing this message, you authorize the linking of your Twitter account to your STIM profile for rewards eligibility.`;

    const signature = await signMessageAsync({ message });
    return { message, signature, timestamp };
  };

  // Start verification process
  const initiateVerification = async () => {
    if (!isConnected || !address) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    setError('');

    const url = `${API_BASE_URL}/twitter/initiate-verification`;
    console.log('🚀 Initiating verification at:', url);

    try {
      const { message, signature, timestamp } = await signVerificationMessage('initiate');

      // 🔧 IMPORTANT: Use lowercase address to match backend
      const requestBody = {
        walletAddress: address.toLowerCase(), // Backend compares lowercase
        signature,
        message
      };

      console.log('📤 Sending request:', {
        walletAddress: requestBody.walletAddress,
        signatureLength: signature.length,
        messagePreview: message.substring(0, 100) + '...'
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Backend error response:', errorData);
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Initiate verification response:', data);

      if (data.success) {
        return data;
      } else {
        throw new Error(data.error || 'Failed to initiate verification');
      }
    } catch (error) {
      console.error('❌ Initiate verification error:', error);
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Complete verification
  const completeVerification = async () => {
    if (!isConnected || !address) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    setError('');

    const url = `${API_BASE_URL}/twitter/complete-verification`;
    console.log('🎯 Completing verification at:', url);

    try {
      const { message, signature } = await signVerificationMessage('complete');

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: address.toLowerCase(), // 🔧 Lowercase
          signature,
          message
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Response not OK:', response.status, errorText);
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Complete verification response:', data);

      if (data.success) {
        await checkVerificationStatus();
        return data;
      } else {
        throw new Error(data.error || 'Failed to complete verification');
      }
    } catch (error) {
      console.error('❌ Complete verification error:', error);
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Unlink Twitter account
  const unlinkTwitter = async () => {
    if (!isConnected || !address) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    setError('');

    const url = `${API_BASE_URL}/twitter/unlink`;
    console.log('🔗 Unlinking Twitter at:', url);

    try {
      const { message, signature } = await signVerificationMessage('unlink');

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: address.toLowerCase(), // 🔧 Lowercase
          signature,
          message
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Response not OK:', response.status, errorText);
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Unlink response:', data);

      if (data.success) {
        setVerificationStatus({ verified: false, step: 0 });
        return data;
      } else {
        throw new Error(data.error || 'Failed to unlink account');
      }
    } catch (error) {
      console.error('❌ Unlink error:', error);
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Load status on mount and when address changes
  useEffect(() => {
    if (isConnected && address) {
      console.log('📱 Checking verification status for address:', address);
      checkVerificationStatus();
    }
  }, [address, isConnected]);

  return {
    verificationStatus,
    isLoading,
    error,
    initiateVerification,
    completeVerification,
    unlinkTwitter,
    checkVerificationStatus
  };
};

// Main Twitter Verification Component
export const TwitterVerificationCard = () => {
  const {
    verificationStatus,
    isLoading,
    error,
    initiateVerification,
    completeVerification,
    unlinkTwitter,
    checkVerificationStatus
  } = useTwitterVerification();
  
  const [copied, setCopied] = useState(false);
  const [success, setSuccess] = useState('');
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);

  // Poll for verification status updates when on step 2
  useEffect(() => {
    let intervalId;
    
    if (verificationStatus?.step === 2) {
      // Check status every 5 seconds when waiting for tweet
      intervalId = setInterval(() => {
        console.log('🔄 Polling verification status...');
        checkVerificationStatus();
      }, 5000);
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [verificationStatus?.step, checkVerificationStatus]);

  // Check for callback success in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const twitterAuth = urlParams.get('twitter_auth');
    const step = urlParams.get('step');
    
    if (twitterAuth === 'success' && step === '2') {
      console.log('✅ Twitter authorization successful, checking status...');
      setSuccess('Twitter authorization successful! Please tweet the verification code.');
      
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Check status after a short delay
      setTimeout(() => {
        checkVerificationStatus();
      }, 1000);
    }
  }, [checkVerificationStatus]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartVerification = async () => {
  try {
    console.log('🔵 Starting verification process...');
    setSuccess('');
    // Remove setError(''); - this is causing the error
    
    const result = await initiateVerification();
    
    // Redirect to Twitter auth (full page redirect for better UX)
    if (result.authUrl) {
      console.log('🐦 Redirecting to Twitter auth...');
      setSuccess('Redirecting to Twitter for authorization...');
      
      // Wait a moment to show the message, then redirect
      setTimeout(() => {
        window.location.href = result.authUrl;
      }, 500);
    }
  } catch (error) {
    console.error('❌ Failed to start verification:', error);
    // The error is already set by the hook's initiateVerification function
  }
};

  const handleCompleteVerification = async () => {
    try {
      console.log('🔵 Completing verification...');
      setIsCheckingStatus(true);
      const result = await completeVerification();
      setSuccess(result.message || 'Twitter account verified successfully!');
    } catch (error) {
      console.error('❌ Failed to complete verification:', error);
      setError(error.message || 'Verification failed. Please make sure you tweeted the code.');
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const handleUnlink = async () => {
    if (window.confirm('Are you sure you want to unlink your Twitter account? This will make you ineligible for rewards.')) {
      try {
        console.log('🔵 Unlinking Twitter account...');
        await unlinkTwitter();
        setSuccess('Twitter account unlinked successfully.');
      } catch (error) {
        console.error('❌ Failed to unlink account:', error);
      }
    }
  };

  // Verified state - Step 3
  if (verificationStatus?.verified) {
    return (
      <div
        className="p-[2px] rounded-2xl mb-4 cursor-pointer transform transition-transform duration-200 ease-out hover:scale-[1.02] active:scale-[0.98]"
        style={{
          background: "linear-gradient(135deg, #27FE60, #18DDF7)",
        }}
      >
        <div className="bg-[#09113B] rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-[#01052D] rounded-md flex items-center justify-center">
                <Twitter className="w-5 h-5 text-[#1DA1F2]" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Twitter Account</p>
                <p className="text-white flex items-center gap-2">
                  @{verificationStatus.twitterUser?.username}
                  <CheckCircle className="w-4 h-4 text-[#27FE60]" />
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 text-sm bg-[#27FE6033] text-[#27FE60] rounded-full">
                Verified ✓
              </span>
              <button
                onClick={handleUnlink}
                className="text-xs px-2 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30"
                disabled={isLoading}
              >
                Unlink
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Tweet verification code
  if (verificationStatus?.step === 2) {
    const tweetText = `Verifying my STIM account: ${verificationStatus.verificationCode}`;
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;

    return (
      <div
        className="p-[2px] rounded-2xl mb-4"
        style={{
          background: "linear-gradient(135deg, #1DA1F2, #195281)",
        }}
      >
        <div className="bg-[#09113B] rounded-2xl p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-[#01052D] rounded-md flex items-center justify-center">
                <Twitter className="w-5 h-5 text-[#1DA1F2]" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Step 2 of 2: Tweet Verification Code</p>
                <p className="text-white">Authorized as @{verificationStatus.twitterUser?.username}</p>
              </div>
            </div>
          </div>

          <div className="bg-[#01052D] p-3 rounded-lg mb-4">
            <p className="text-gray-400 text-sm mb-2">Tweet this verification code:</p>
            <div className="flex items-center gap-2">
              <code className="text-[#18DDF7] text-lg font-mono bg-[#18DDF7]/10 px-2 py-1 rounded">
                {verificationStatus.verificationCode}
              </code>
              <button
                onClick={() => copyToClipboard(verificationStatus.verificationCode)}
                className="p-1 hover:bg-[#18DDF7]/20 rounded"
              >
                <Copy className="w-4 h-4 text-[#18DDF7]" />
              </button>
              {copied && <span className="text-[#27FE60] text-xs">Copied!</span>}
            </div>
          </div>

          <div className="flex gap-2 mb-4">
            <a
              href={tweetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-[#1DA1F2] text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-[#1DA1F2]/90 transition-colors"
            >
              <Twitter className="w-4 h-4" />
              Tweet Code
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          <button
            onClick={handleCompleteVerification}
            disabled={isLoading || isCheckingStatus}
            className="w-full bg-[#27FE60] text-black py-2 px-4 rounded-lg font-semibold hover:bg-[#27FE60]/90 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
          >
            {isLoading || isCheckingStatus ? (
              <>
                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                Checking Tweet...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                I've Tweeted the Code
              </>
            )}
          </button>

          <p className="text-xs text-gray-500 text-center mt-2">
            After tweeting, click the button above to complete verification
          </p>

          {error && (
            <div className="mt-3 p-2 bg-red-500/20 border border-red-500/30 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="mt-3 p-2 bg-green-500/20 border border-green-500/30 rounded-lg flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
              <p className="text-green-400 text-sm">{success}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Step 1: Start verification (or Step 0: Not started)
  return (
    <div
      className="p-[2px] rounded-2xl mb-4 cursor-pointer transform transition-transform duration-200 ease-out hover:scale-[1.02] active:scale-[0.98]"
      style={{
        background: "linear-gradient(135deg, #195281, #09113B)",
      }}
    >
      <div className="bg-[#09113B] rounded-2xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-[#01052D] rounded-md flex items-center justify-center">
              <Twitter className="w-5 h-5 text-[#1DA1F2]" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Twitter Verification</p>
              <p className="text-white">Link your Twitter account</p>
              <p className="text-xs text-gray-500">Required for rewards eligibility</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-yellow-500" />
            <button
              onClick={handleStartVerification}
              disabled={isLoading}
              className="px-4 py-2 bg-[#1DA1F2] text-white rounded-lg hover:bg-[#1DA1F2]/90 disabled:opacity-50 flex items-center gap-2 transition-all"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Starting...
                </>
              ) : (
                <>
                  <Twitter className="w-4 h-4" />
                  Start Verification
                </>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-3 p-2 bg-red-500/20 border border-red-500/30 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="mt-3 p-2 bg-blue-500/20 border border-blue-500/30 rounded-lg flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
            <p className="text-blue-400 text-sm">{success}</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Modal component for the verification process
export const TwitterVerificationModal = () => {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#01052D]">
      <div className="relative w-full bg-[#0B122E] h-full rounded-t-3xl border-t border-[#18DDF7] mt-40 pt-3 px-4">
        <div className="flex flex-col items-start mt-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-[#01052D] rounded-xl flex items-center justify-center">
              <Twitter className="w-6 h-6 text-[#1DA1F2]" />
            </div>
            <h2 className="text-2xl text-white font-medium">Twitter Verification</h2>
          </div>

          <div className="w-full">
            <TwitterVerificationCard />
          </div>

          <div className="w-full mt-6 p-4 bg-[#01052D] rounded-lg border border-[#195281]/50">
            <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-[#27FE60]" />
              Why verify your Twitter account?
            </h3>
            <ul className="text-gray-400 text-sm space-y-1">
              <li>• Required for all STIM rewards and earnings</li>
              <li>• Prevents gaming the system with multiple accounts</li>
              <li>• Builds trust in the community</li>
              <li>• One-time verification process</li>
            </ul>
          </div>

          <div className="w-full mt-auto fixed bottom-24 left-0 px-4">
            <button
              onClick={() => navigate(-1)}
              className="w-full py-4 rounded-full text-lg font-medium bg-[#18DDF733] border border-[#18DDF7] text-[#18DDF7]"
            >
              Back to Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Export the hook for use in other components
export { useTwitterVerification };

// Default export
export default TwitterVerificationCard;