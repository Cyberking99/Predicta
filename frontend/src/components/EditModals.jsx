import React, { useRef, useState, useEffect } from 'react';
import { X, Trash2, UserPen, MapPin, Mail, AtSign, User, Globe } from 'lucide-react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useAccount, useSignMessage } from "wagmi";

// Blockies avatar generation function
const generateBlockiesAvatar = (seed, size = 64) => {
  if (!seed) return null;
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = size;
  canvas.height = size;
  
  // Generate deterministic hash from seed
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Generate colors based on hash
  const colors = [
    `hsl(${Math.abs(hash) % 360}, 70%, 20%)`, // Background
    `hsl(${Math.abs(hash * 2) % 360}, 80%, 60%)`, // Main color
    `hsl(${Math.abs(hash * 3) % 360}, 90%, 80%)`, // Accent color
    `hsl(${Math.abs(hash * 4) % 360}, 75%, 45%)`, // Secondary color
  ];
  
  // Create grid pattern
  const gridSize = 8;
  const blockSize = canvas.width / gridSize;
  
  // Fill background
  ctx.fillStyle = colors[0];
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Generate symmetrical pattern
  for (let x = 0; x < gridSize; x++) {
    for (let y = 0; y < gridSize; y++) {
      // Create symmetry by mirroring patterns
      const mirrorX = x >= gridSize / 2 ? gridSize - 1 - x : x;
      const index = mirrorX * gridSize + y;
      
      // Generate pseudo-random number for this position
      const colorSeed = Math.abs((hash + index) * 7 + mirrorX * 3 + y * 5);
      const colorIndex = colorSeed % 4;
      
      // Skip background color sometimes for transparency
      if (colorIndex > 0 && (colorSeed % 3) !== 0) {
        ctx.fillStyle = colors[colorIndex];
        ctx.fillRect(x * blockSize, y * blockSize, blockSize, blockSize);
      }
    }
  }
  
  // Add some circular patterns for more visual appeal
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  
  // Add center dot
  if ((hash % 5) === 0) {
    ctx.fillStyle = colors[1];
    ctx.beginPath();
    ctx.arc(centerX, centerY, blockSize / 2, 0, 2 * Math.PI);
    ctx.fill();
  }
  
  // Add corner accents
  if ((hash % 7) === 0) {
    ctx.fillStyle = colors[2];
    const cornerSize = blockSize / 3;
    ctx.fillRect(0, 0, cornerSize, cornerSize);
    ctx.fillRect(canvas.width - cornerSize, 0, cornerSize, cornerSize);
    ctx.fillRect(0, canvas.height - cornerSize, cornerSize, cornerSize);
    ctx.fillRect(canvas.width - cornerSize, canvas.height - cornerSize, cornerSize, cornerSize);
  }
  
  return canvas.toDataURL();
};

// Location Detection Hook (unchanged)
const useLocationDetection = () => {
  const [location, setLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const getLocationFromIP = async () => {
    setIsLoading(true);
    setError(null);

    try {
      let locationData = null;

      // Try ipapi.co first (most reliable)
      try {
        const response = await fetch('https://ipapi.co/json/');
        if (response.ok) {
          const data = await response.json();
          if (data.city && data.country_name) {
            locationData = {
              city: data.city,
              region: data.region,
              country: data.country_name,
              countryCode: data.country_code,
              timezone: data.timezone,
              latitude: data.latitude,
              longitude: data.longitude,
              formatted: data.region ? `${data.city}, ${data.region}, ${data.country_name}` : `${data.city}, ${data.country_name}`
            };
          }
        }
      } catch (error) {
        console.log('ipapi.co failed, trying backup...');
      }

      // Try ip-api.com as backup
      if (!locationData) {
        try {
          const response = await fetch('http://ip-api.com/json/');
          if (response.ok) {
            const data = await response.json();
            if (data.status === 'success') {
              locationData = {
                city: data.city,
                region: data.regionName,
                country: data.country,
                countryCode: data.countryCode,
                timezone: data.timezone,
                latitude: data.lat,
                longitude: data.lon,
                formatted: data.regionName ? `${data.city}, ${data.regionName}, ${data.country}` : `${data.city}, ${data.country}`
              };
            }
          }
        } catch (error) {
          console.log('ip-api.com failed');
        }
      }

      if (locationData) {
        setLocation(locationData);
        
        const cacheData = {
          location: locationData,
          timestamp: Date.now(),
          expiry: 24 * 60 * 60 * 1000
        };
        localStorage.setItem('cached_location', JSON.stringify(cacheData));
        
        return locationData;
      } else {
        throw new Error('Unable to detect location from any service');
      }
    } catch (err) {
      setError(err.message);
      console.error('Location detection error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const getPreciseLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      setIsLoading(true);
      
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            
            const response = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
            );
            
            if (response.ok) {
              const data = await response.json();
              const locationData = {
                city: data.city || data.locality,
                region: data.principalSubdivision,
                country: data.countryName,
                countryCode: data.countryCode,
                latitude,
                longitude,
                formatted: `${data.city || data.locality}, ${data.principalSubdivision}, ${data.countryName}`,
                precise: true
              };
              
              setLocation(locationData);
              setIsLoading(false);
              resolve(locationData);
            } else {
              throw new Error('Failed to get address from coordinates');
            }
          } catch (error) {
            setError(error.message);
            setIsLoading(false);
            reject(error);
          }
        },
        (error) => {
          setError(error.message);
          setIsLoading(false);
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      );
    });
  };

  useEffect(() => {
    const cached = localStorage.getItem('cached_location');
    if (cached) {
      try {
        const { location: cachedLocation, timestamp, expiry } = JSON.parse(cached);
        
        if (Date.now() - timestamp < expiry) {
          setLocation(cachedLocation);
          return;
        }
      } catch (error) {
        console.log('Invalid cached location data');
      }
    }
    
    getLocationFromIP();
  }, []);

  return {
    location,
    isLoading,
    error,
    getLocationFromIP,
    getPreciseLocation,
    setLocation
  };
};

// Updated Profile Data Hook - NO AUTHENTICATION REQUIREMENT FOR LOADING
const useProfileData = () => {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load profile data - NO AUTHENTICATION CHECK
  const loadProfileData = () => {
    if (!address || !isConnected) {
      setProfileData(null);
      return null;
    }

    const profileKey = `stim_profile_${address}`;
    const storedProfile = localStorage.getItem(profileKey);
    
    if (storedProfile) {
      try {
        const parsed = JSON.parse(storedProfile);
        setProfileData(parsed);
        return parsed;
      } catch (error) {
        console.error("❌ Error loading profile data:", error);
      }
    }

    // Create default profile with blockies avatar
    const defaultProfile = {
      address,
      username: `@${address.slice(0, 6)}`,
      name: "",
      location: "",
      email: "",
      language: "en",
      avatar: generateBlockiesAvatar(address.toLowerCase()), // Generate blockies avatar
      createdAt: Date.now(),
      lastUpdated: Date.now(),
      isAuthenticated: false // Not authenticated yet
    };

    // Save default profile immediately
    localStorage.setItem(profileKey, JSON.stringify(defaultProfile));
    setProfileData(defaultProfile);
    return defaultProfile;
  };

  // Save profile data with blockchain signature - AUTHENTICATION HAPPENS HERE
  const saveProfileData = async (newProfileData) => {
    if (!address || !isConnected) {
      throw new Error("Wallet not connected");
    }

    setIsLoading(true);
    try {
      const timestamp = Date.now();
      
      // Create profile update message for signing - THIS IS WHERE AUTHENTICATION HAPPENS
      const updateMessage = `STIM Profile Update

Wallet: ${address}
Timestamp: ${timestamp}
Action: Update and authenticate profile

Profile Changes:
Username: ${newProfileData.username || 'Not set'}
Name: ${newProfileData.name || 'Not set'}
Email: ${newProfileData.email || 'Not set'}
Location: ${newProfileData.location || 'Not set'}
Language: ${newProfileData.language || 'en'}

By signing this message, you confirm these profile updates and authenticate your profile.`;

      console.log("🔐 Requesting signature for profile update and authentication...");
      const signature = await signMessageAsync({ message: updateMessage });

      const profileWithAuth = {
        ...newProfileData,
        address,
        lastUpdated: timestamp,
        updateSignature: signature,
        updateMessage,
        isAuthenticated: true, // Mark as authenticated after successful signature
        avatar: newProfileData.avatar || generateBlockiesAvatar(address.toLowerCase()) // Ensure avatar exists
      };

      const profileKey = `stim_profile_${address}`;
      localStorage.setItem(profileKey, JSON.stringify(profileWithAuth));
      
      // Update local state immediately
      setProfileData(profileWithAuth);
      
      // Dispatch event to notify other components
      window.dispatchEvent(new CustomEvent('profileUpdated', { 
        detail: profileWithAuth 
      }));
      
      console.log("✅ Profile data saved and authenticated successfully");
      
      return { success: true, signature, profileData: profileWithAuth };
    } catch (error) {
      console.error("❌ Failed to save profile data:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isConnected && address) {
      loadProfileData();
    }
  }, [address, isConnected]);

  return {
    profileData,
    isLoading,
    saveProfileData,
    loadProfileData
  };
};

// Google Translate Hook (unchanged)
const useGoogleTranslate = () => {
  const [isReady, setIsReady] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('en');

  useEffect(() => {
    const checkGoogleTranslate = () => {
      if (window.google && window.google.translate) {
        setIsReady(true);
      } else {
        setTimeout(checkGoogleTranslate, 500);
      }
    };
    checkGoogleTranslate();
  }, []);

  const translateTo = async (languageCode) => {
    if (!isReady) {
      console.log('Google Translate not ready yet');
      return false;
    }

    try {
      // Method 1: Try to find and trigger the select element
      const selectElement = document.querySelector('select.goog-te-combo');
      if (selectElement) {
        selectElement.value = languageCode;
        selectElement.dispatchEvent(new Event('change', { bubbles: true }));
        setCurrentLanguage(languageCode);
        localStorage.setItem('google_translate_language', languageCode);
        return true;
      }

      // Method 2: Try to find language links in the menu
      const translateFrame = document.querySelector('.goog-te-menu-frame');
      if (translateFrame) {
        const frameDoc = translateFrame.contentDocument || translateFrame.contentWindow.document;
        const langLink = frameDoc.querySelector(`a[lang="${languageCode}"]`);
        if (langLink) {
          langLink.click();
          setCurrentLanguage(languageCode);
          localStorage.setItem('google_translate_language', languageCode);
          return true;
        }
      }

      console.log('Could not find Google Translate elements');
      return false;
    } catch (error) {
      console.error('Error translating:', error);
      return false;
    }
  };

  // Auto-restore saved language
  useEffect(() => {
    if (isReady) {
      const savedLang = localStorage.getItem('google_translate_language');
      if (savedLang && savedLang !== 'en') {
        setTimeout(() => {
          translateTo(savedLang);
        }, 1000);
      }
    }
  }, [isReady]);

  return {
    isReady,
    currentLanguage,
    translateTo
  };
};

export const CardWrapper = ({ children }) => (
  <div 
    className="w-full p-[2px] rounded-3xl mb-4"
    style={{
      background: "linear-gradient(135deg, #195281, #09113B)",
    }}
  >
    <div className="w-full rounded-3xl bg-[#0F1535] py-8 px-6">
      {children}
    </div>
  </div>
);

export const EditModal = ({ title, type }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { profileData, saveProfileData, isLoading } = useProfileData();
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState('');

  // Get initial value from profile data
  useEffect(() => {
    if (profileData) {
      switch(type) {
        case 'username':
          // If username is empty or just the default generated one, show empty field
          const username = profileData.username || '';
          setInputValue(username.startsWith('@' + profileData.address?.slice(0, 6)) ? '' : username.replace('@', ''));
          break;
        case 'name':
          // If name is empty or default, show empty field
          setInputValue((profileData.name === "Add your name" || !profileData.name) ? '' : profileData.name);
          break;
        case 'email':
          // If email is empty or default, show empty field
          setInputValue((profileData.email === "Not yet added" || !profileData.email) ? '' : profileData.email);
          break;
        case 'location':
          // If location is empty or default, show empty field
          setInputValue((profileData.location === "Add your location" || !profileData.location) ? '' : profileData.location);
          break;
        default:
          setInputValue('');
      }
    }
  }, [profileData, type]);

  const handleClose = () => navigate(-1);

  const handleSave = async () => {
    let finalValue = inputValue.trim();
    
    if (!finalValue) {
      setError('This field cannot be empty');
      return;
    }

    // Validation for specific fields
    if (type === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(finalValue)) {
        setError('Please enter a valid email address');
        return;
      }
    }

    if (type === 'username') {
      if (!finalValue.startsWith('@')) {
        finalValue = '@' + finalValue.replace('@', '');
      }
      if (finalValue.length < 4) {
        setError('Username must be at least 4 characters long');
        return;
      }
    }

    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      const updatedProfile = {
        ...profileData,
        [type]: finalValue
      };

      console.log('🔄 Updating profile field:', type, 'with value:', finalValue);
      const result = await saveProfileData(updatedProfile);
      console.log('✅ Profile update result:', result);
      
      setSuccess('Profile updated and authenticated successfully!');
      
      // Navigate back after short delay
      setTimeout(() => {
        navigate(-1);
      }, 1500);
    } catch (error) {
      console.error('❌ Save error:', error);
      if (error.message.includes("User rejected")) {
        setError("Signature was rejected. Profile not updated.");
      } else {
        setError(error.message || 'Failed to save changes');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const getIcon = () => {
    switch(type) {
      case 'username':
        return <AtSign className="w-6 h-6 text-[#18DDF7]" />;
      case 'name':
        return <User className="w-6 h-6 text-[#18DDF7]" />;
      case 'email':
        return <Mail className="w-6 h-6 text-[#18DDF7]" />;
      case 'location':
        return <MapPin className="w-6 h-6 text-[#18DDF7]" />;
      default:
        return <User className="w-6 h-6 text-[#18DDF7]" />;
    }
  };

  const getPlaceholder = () => {
    switch(type) {
      case 'username':
        return 'Enter username (e.g., johndoe)';
      case 'name':
        return 'Enter your full name';
      case 'email':
        return 'Enter your email address';
      case 'location':
        return 'Enter your location';
      default:
        return `Enter ${type}`;
    }
  };

  if (type === 'location') {
    const { location: detectedLocation, isLoading: locationLoading, getLocationFromIP, getPreciseLocation } = useLocationDetection();
    
    const handleAutoDetect = async () => {
      try {
        setError('');
        const location = await getLocationFromIP();
        if (location) {
          setInputValue(location.formatted);
        }
      } catch (error) {
        setError('Failed to detect location automatically');
      }
    };

    const handlePreciseLocation = async () => {
      try {
        setError('');
        const location = await getPreciseLocation();
        if (location) {
          setInputValue(location.formatted);
        }
      } catch (error) {
        setError('Failed to get precise location. Please check location permissions.');
      }
    };

    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-[#01052D]">
        <div className="relative w-full bg-[#0B122E] h-full rounded-t-3xl border-t border-[#18DDF7] mt-40 pt-3 px-4">
          <div className="flex flex-col items-start mt-8">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-[#01052D] rounded-xl flex items-center justify-center">
                {getIcon()}
              </div>
              <h2 className="text-2xl text-white font-medium">Update {title}</h2>
            </div>

            {error && (
              <div className="w-full mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {success && (
              <div className="w-full mb-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
                <p className="text-green-400 text-sm">{success}</p>
              </div>
            )}

            {/* Auto-detect buttons */}
            <div className="w-full mb-4 space-y-2">
              <div className="flex gap-2">
                <button
                  onClick={handleAutoDetect}
                  disabled={locationLoading || isSaving}
                  className="flex-1 px-3 py-2 bg-[#18DDF7]/20 border border-[#18DDF7] text-[#18DDF7] rounded-lg hover:bg-[#18DDF7]/30 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                >
                  {locationLoading ? (
                    <>
                      <div className="w-3 h-3 border-2 border-[#18DDF7]/30 border-t-[#18DDF7] rounded-full animate-spin"></div>
                      Detecting...
                    </>
                  ) : (
                    <>
                      <MapPin className="w-4 h-4" />
                      Auto-detect (IP)
                    </>
                  )}
                </button>
                <button
                  onClick={handlePreciseLocation}
                  disabled={locationLoading || isSaving}
                  className="flex-1 px-3 py-2 bg-[#27FE60]/20 border border-[#27FE60] text-[#27FE60] rounded-lg hover:bg-[#27FE60]/30 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Precise GPS
                </button>
              </div>
              {detectedLocation && (
                <div className="p-2 bg-[#18DDF7]/10 border border-[#18DDF7]/30 rounded-lg">
                  <p className="text-[#18DDF7] text-xs">
                    📍 Detected: {detectedLocation.formatted}
                  </p>
                </div>
              )}
            </div>

            <CardWrapper>
              <div className="space-y-2">
                <label className="text-gray-400 text-lg">Location</label>
                <div className="relative">
                  <input
                    type="text"
                    className="w-full bg-[#01052D] text-white text-lg px-4 py-2 pr-12 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#18DDF7]/50"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Enter your location or use auto-detect"
                  />
                  <MapPin className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#18DDF7]" />
                </div>
              </div>
            </CardWrapper>

            <div className="w-full mt-auto fixed bottom-24 left-0 px-4 flex gap-4">
              <button
                onClick={handleClose}
                className="flex-1 py-4 rounded-full text-lg font-medium bg-[#18DDF733] border border-[#18DDF7] text-[#18DDF7]"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || !inputValue.trim()}
                className="flex-1 py-4 rounded-full text-lg font-medium bg-[#18DDF7] text-black hover:bg-[#18DDF7]/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                    Signing & Saving...
                  </>
                ) : (
                  'Save & Sign'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#141827]">
      <div className="relative w-full bg-[#0B122E] h-full rounded-t-3xl border-t border-[#18DDF7] mt-40 pt-3 px-4">
        <div className="flex flex-col items-start mt-8">
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-12 h-12 bg-[#01052D] rounded-xl flex items-center justify-center">
              {getIcon()}
            </div>
            <h2 className="text-2xl text-white font-medium">Update {title}</h2>
          </div>

          {error && (
            <div className="w-full mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="w-full mb-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
              <p className="text-green-400 text-sm">{success}</p>
            </div>
          )}

          <CardWrapper>
            <div className="space-y-2">
              <label className="text-gray-400 text-lg">
                {type.charAt(0).toUpperCase() + type.slice(1)}
                {type === 'username' && <span className="text-[#18DDF7] ml-1">@</span>}
              </label>
              <input
                type={type === 'email' ? 'email' : 'text'}
                className="w-full bg-[#01052D] text-white text-lg px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#18DDF7]/50"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={getPlaceholder()}
              />
              {type === 'username' && (
                <p className="text-xs text-gray-400 mt-2">
                  Will be displayed as @{inputValue || 'username'}
                </p>
              )}
            </div>
          </CardWrapper>

          {/* Authentication info */}
          <div className="w-full p-3 bg-[#01052D] rounded-lg border border-[#195281]/50 mb-4">
            <p className="text-xs text-gray-400 text-center">
              💡 Your wallet will prompt you to sign a message to authenticate this update and secure your profile.
            </p>
          </div>

          <div className="flex w-full gap-4 mt-8">
            <button
              onClick={handleClose}
              className="flex-1 py-2 rounded-full text-lg font-medium border border-[#18DDF7] text-[#18DDF7]"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || !inputValue.trim()}
              className="flex-1 py-2 rounded-full text-lg font-medium bg-[#18DDF7] text-black hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                  Signing...
                </>
              ) : (
                'Save & Sign'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const AvatarModal = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const { profileData, saveProfileData, isLoading } = useProfileData();
  const { address } = useAccount();
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (profileData?.avatar) {
      setPreviewUrl(profileData.avatar);
    } else if (address) {
      // Generate default blockies avatar if no avatar set
      const blockiesAvatar = generateBlockiesAvatar(address.toLowerCase());
      setPreviewUrl(blockiesAvatar);
    }
  }, [profileData, address]);

  const handleClose = () => navigate(-1);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }

      setError('');
      setSelectedImage(file);

      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUseWalletAvatar = () => {
    if (address) {
      const blockiesAvatar = generateBlockiesAvatar(address.toLowerCase());
      setPreviewUrl(blockiesAvatar);
      setSelectedImage(null);
      setError('');
    }
  };

  const handleSaveAvatar = async () => {
    if (!previewUrl) {
      setError('Please select an avatar first');
      return;
    }

    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      const updatedProfile = {
        ...profileData,
        avatar: previewUrl
      };

      await saveProfileData(updatedProfile);
      setSuccess('Avatar updated and authenticated successfully!');
      
      // Navigate back after short delay
      setTimeout(() => {
        navigate(-1);
      }, 1500);
    } catch (error) {
      console.error('Failed to update avatar:', error);
      if (error.message.includes("User rejected")) {
        setError("Signature was rejected. Avatar not updated.");
      } else {
        setError(error.message || 'Failed to save avatar');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!address) return;

    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      // Reset to blockies avatar
      const blockiesAvatar = generateBlockiesAvatar(address.toLowerCase());
      const updatedProfile = {
        ...profileData,
        avatar: blockiesAvatar
      };

      await saveProfileData(updatedProfile);
      setPreviewUrl(blockiesAvatar);
      setSelectedImage(null);
      setSuccess('Avatar reset to wallet avatar successfully!');
      
      // Navigate back after short delay
      setTimeout(() => {
        navigate(-1);
      }, 1500);
    } catch (error) {
      console.error('Failed to reset avatar:', error);
      if (error.message.includes("User rejected")) {
        setError("Signature was rejected. Avatar not reset.");
      } else {
        setError(error.message || 'Failed to reset avatar');
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#141827]">
      <div className="relative w-full bg-[#0B122E] h-full rounded-t-[20px] border-t border-[#18DDF7] mt-40 pt-3 px-4">
        <button
          className="absolute right-4 bg-[#1A1F3F] rounded-full p-2 hover:bg-opacity-80"
          onClick={handleClose}
          disabled={isSaving}
        >
          <X className="w-5 h-5 text-white" />
        </button>

        <div className="flex flex-col items-center mt-8">
          <h2 className="text-xl text-white font-semibold">Change Avatar</h2>
          <p className="text-gray-400 text-sm mt-2 text-center">
            Upload custom image or use your unique wallet avatar
          </p>

          {error && (
            <div className="w-full mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm text-center">{error}</p>
            </div>
          )}

          {success && (
            <div className="w-full mt-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
              <p className="text-green-400 text-sm text-center">{success}</p>
            </div>
          )}

          <div className="relative mt-8 mb-4">
            {/* Glow effect container */}
            <div 
              className="absolute inset-0 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(24, 221, 247, 0.2) 0%, rgba(9, 17, 59, 0) 70%)',
                transform: 'scale(1.2)',
              }}
            />
            
            {/* Clickable avatar circle */}
            <div 
              onClick={handleAvatarClick}
              className="w-32 h-32 bg-[#09113B] border-2 border-[#FFFFFF0D] rounded-full flex items-center justify-center cursor-pointer relative overflow-hidden"
            >
              {previewUrl ? (
                <img 
                  src={previewUrl} 
                  alt="Avatar preview" 
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <UserPen className="w-8 h-8 text-[#18DDF7]" />
              )}
              
              {/* Hidden file input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
                disabled={isSaving}
              />
            </div>
          </div>

          {/* Avatar options */}
          <div className="w-full space-y-3 mb-6">
            {/* Use Wallet Avatar */}
            <button
              onClick={handleUseWalletAvatar}
              disabled={isSaving}
              className="w-full p-4 bg-[#01052D] border border-[#195281] rounded-lg hover:bg-[#195281]/30 transition-colors text-left flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-full overflow-hidden border border-[#18DDF7]/30">
                {address && (
                  <img 
                    src={generateBlockiesAvatar(address.toLowerCase())} 
                    alt="Wallet avatar" 
                    className="w-full h-full object-cover" 
                  />
                )}
              </div>
              <div>
                <h3 className="text-white font-medium">Use Wallet Avatar</h3>
                <p className="text-sm text-gray-400">Unique pattern generated from your wallet address</p>
              </div>
            </button>

            {/* Upload Custom Image */}
            <button
              onClick={handleAvatarClick}
              disabled={isSaving}
              className="w-full p-4 bg-[#01052D] border border-[#195281] rounded-lg hover:bg-[#195281]/30 transition-colors text-left flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-full bg-[#18DDF7]/20 border border-[#18DDF7]/50 flex items-center justify-center">
                <UserPen className="w-6 h-6 text-[#18DDF7]" />
              </div>
              <div>
                <h3 className="text-white font-medium">Upload Custom Image</h3>
                <p className="text-sm text-gray-400">JPG, PNG, or GIF (max 5MB)</p>
              </div>
            </button>
          </div>

          {/* Reset to wallet avatar button (if current avatar is not wallet avatar) */}
          {previewUrl && address && previewUrl !== generateBlockiesAvatar(address.toLowerCase()) && (
            <button 
              onClick={handleRemoveAvatar}
              disabled={isSaving}
              className="mb-4 px-4 py-2 bg-[#FF443E33] border border-red-500/30 text-red-400 rounded-lg hover:bg-[#FF443E50] transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Reset to Wallet Avatar
            </button>
          )}

          {/* Authentication info */}
          <div className="w-full p-3 bg-[#01052D] rounded-lg border border-[#195281]/50 mb-4">
            <p className="text-xs text-gray-400 text-center">
              💡 Your wallet will prompt you to sign a message to authenticate this avatar change and secure your profile.
            </p>
          </div>

          <div className="flex gap-4 w-full mt-4">
            <button 
              onClick={handleClose}
              disabled={isSaving}
              className="flex-1 py-3 rounded-full font-semibold border border-[#18DDF7] text-[#18DDF7] hover:bg-[#18DDF7]/10 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button 
              onClick={handleSaveAvatar}
              disabled={isSaving || !previewUrl}
              className="flex-1 py-3 rounded-full font-semibold bg-[#18DDF7] text-black hover:bg-[#18DDF7]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                  Signing...
                </>
              ) : (
                'Save & Sign'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ===== ENHANCED LANGUAGE MODAL WITH GOOGLE TRANSLATE =====
export const LanguageModal = () => {
  const navigate = useNavigate();
  const { profileData, saveProfileData } = useProfileData();
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const { isReady, translateTo } = useGoogleTranslate();

  useEffect(() => {
    if (profileData?.language) {
      setSelectedLanguage(profileData.language);
    }
  }, [profileData]);

  const handleClose = () => navigate(-1);

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'it', name: 'Italiano', flag: '🇮🇹' },
    { code: 'pt', name: 'Português', flag: '🇵🇹' },
    { code: 'zh-cn', name: '中文', flag: '🇨🇳' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' },
    { code: 'ko', name: '한국어', flag: '🇰🇷' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
    { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
    { code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
    { code: 'sv', name: 'Svenska', flag: '🇸🇪' },
    { code: 'da', name: 'Dansk', flag: '🇩🇰' },
    { code: 'no', name: 'Norsk', flag: '🇳🇴' },
    { code: 'fi', name: 'Suomi', flag: '🇫🇮' },
    { code: 'pl', name: 'Polski', flag: '🇵🇱' },
    { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
    { code: 'th', name: 'ไทย', flag: '🇹🇭' },
    { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
    { code: 'id', name: 'Bahasa Indonesia', flag: '🇮🇩' },
    { code: 'ms', name: 'Bahasa Melayu', flag: '🇲🇾' },
    { code: 'tl', name: 'Filipino', flag: '🇵🇭' }
  ];

  const handleLanguageSelect = async (language) => {
    if (language.code === selectedLanguage) return;

    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      // First, translate the page using Google Translate
      if (isReady) {
        const success = await translateTo(language.code);
        if (success) {
          console.log(`✅ Page translated to ${language.name}`);
        } else {
          console.log(`⚠️ Translation to ${language.name} failed, but continuing...`);
        }
      } else {
        setError('Google Translate is not ready yet. Please try again in a moment.');
        setIsSaving(false);
        return;
      }

      // Then save to profile with authentication
      if (profileData) {
        const updatedProfile = {
          ...profileData,
          language: language.code
        };
        await saveProfileData(updatedProfile);
      }
      
      setSelectedLanguage(language.code);
      setSuccess(`Language changed to ${language.name} and authenticated successfully!`);
      
      // Small delay to let user see the translation happen
      setTimeout(() => {
        navigate(-1);
      }, 1500);
      
    } catch (error) {
      console.error('Failed to change language:', error);
      if (error.message.includes("User rejected")) {
        setError("Signature was rejected. Language not changed.");
      } else {
        setError(error.message || 'Failed to change language');
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#141827]">
      <div className="relative w-full bg-[#0B122E] h-full rounded-t-[20px] border-t border-[#18DDF7] mt-40 pt-3 px-4">
        <button
          className="absolute right-4 bg-[#1A1F3F] rounded-full p-2 hover:bg-opacity-80"
          onClick={handleClose}
          disabled={isSaving}
        >
          <X className="w-5 h-5 text-white" />
        </button>

        <div className="flex flex-col items-center mt-8">
          <div className="w-16 h-16 bg-[#1A1F3F] rounded-xl flex items-center justify-center mb-4">
            <Globe className="w-8 h-8 text-[#18DDF7]" />
          </div>
          <h2 className="text-xl text-white font-semibold">Change Language</h2>
          <p className="text-gray-400 text-sm">Choose Your Preferred Language</p>
          
          {!isReady && (
            <div className="mt-2 p-2 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
              <p className="text-yellow-400 text-xs text-center">Loading Google Translate...</p>
            </div>
          )}

          {isSaving && (
            <div className="mt-2 p-2 bg-[#18DDF7]/20 border border-[#18DDF7]/30 rounded-lg">
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-[#18DDF7]/30 border-t-[#18DDF7] rounded-full animate-spin"></div>
                <p className="text-[#18DDF7] text-xs">Translating page and signing...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="w-full mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm text-center">{error}</p>
            </div>
          )}

          {success && (
            <div className="w-full mt-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
              <p className="text-green-400 text-sm text-center">{success}</p>
            </div>
          )}

          <div className="w-full space-y-2 mt-6 max-h-96 overflow-y-auto">
            <div className="grid grid-cols-2 gap-2">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  className={`flex items-center gap-2 p-3 rounded-lg transition-colors border ${
                    lang.code === selectedLanguage
                      ? 'bg-[#18DDF7] text-black border-[#18DDF7]'
                      : 'bg-[#09113B] text-white border-[#195281] hover:bg-[#195281]'
                  } ${isSaving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  onClick={() => handleLanguageSelect(lang)}
                  disabled={isSaving}
                >
                  <span className="text-lg">{lang.flag}</span>
                  <div className="flex-1 text-left">
                    <span className="text-sm font-medium block">{lang.name}</span>
                  </div>
                  {lang.code === selectedLanguage && (
                    <div className="w-2 h-2 bg-black rounded-full"></div>
                  )}
                  {isSaving && lang.code !== selectedLanguage && (
                    <div className="w-3 h-3 border-2 border-gray-400/30 border-t-gray-400 rounded-full animate-spin"></div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Authentication info */}
          <div className="mt-6 p-4 bg-[#01052D] rounded-lg border border-[#195281]/50">
            <p className="text-gray-400 text-xs text-center">
              💡 Language changes are authenticated with your wallet signature • Powered by Google Translate
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ===== OPTIONAL: Custom Language Switcher Component =====
// You can add this to any page for quick language switching
export const QuickLanguageSwitcher = () => {
  const { translateTo, isReady } = useGoogleTranslate();
  
  const quickLanguages = [
    { code: 'en', flag: '🇺🇸', name: 'EN' },
    { code: 'fr', flag: '🇫🇷', name: 'FR' },
    { code: 'es', flag: '🇪🇸', name: 'ES' },
    { code: 'de', flag: '🇩🇪', name: 'DE' }
  ];

  return (
    <div className="flex gap-1 p-2">
      {quickLanguages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => translateTo(lang.code)}
          disabled={!isReady}
          className="flex items-center gap-1 px-2 py-1 bg-[#09113B] border border-[#195281] rounded text-white text-xs hover:bg-[#195281] transition-colors disabled:opacity-50"
        >
          <span>{lang.flag}</span>
          <span>{lang.name}</span>
        </button>
      ))}
    </div>
  );
};