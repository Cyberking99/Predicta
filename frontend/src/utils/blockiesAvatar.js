import profile1 from "../assets/images/profile/profile1.jpeg";
import profile2 from "../assets/images/profile/profile2.jpeg";
import profile3 from "../assets/images/profile/profile3.jpeg";
import profile4 from "../assets/images/profile/profile4.jpeg";

// Array of profile images
const PROFILE_IMAGES = [profile1, profile2, profile3, profile4];

/**
 * Get a deterministic profile image based on wallet address
 * @param {string} seed - Usually the wallet address
 * @param {number} size - Not used anymore but kept for compatibility
 * @returns {string} - Profile image URL
 */
export const generateBlockiesAvatar = (seed, size = 64) => {
  if (!seed) return null;
  
  // Generate deterministic hash from seed
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Use hash to deterministically select one of the 4 profile images
  const imageIndex = Math.abs(hash) % PROFILE_IMAGES.length;
  return PROFILE_IMAGES[imageIndex];
};

/**
 * Generate a geometric pattern avatar (alternative style) - kept for backward compatibility
 * @param {string} seed - Usually the wallet address
 * @param {number} size - Canvas size (default: 64)
 * @returns {string} - Base64 data URL of the generated avatar
 */
export const generateGeometricAvatar = (seed, size = 64) => {
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
    hash = hash & hash;
  }
  
  // Generate colors
  const hue = Math.abs(hash) % 360;
  const colors = [
    `hsl(${hue}, 80%, 45%)`,
    `hsl(${(hue + 60) % 360}, 70%, 55%)`,
    `hsl(${(hue + 120) % 360}, 75%, 65%)`,
    `hsl(${hue}, 30%, 20%)`,
  ];
  
  // Background
  ctx.fillStyle = colors[3];
  ctx.fillRect(0, 0, size, size);
  
  // Draw triangular patterns
  const centerX = size / 2;
  const centerY = size / 2;
  const numShapes = 6 + (Math.abs(hash) % 6); // 6-11 shapes
  
  for (let i = 0; i < numShapes; i++) {
    const angle = (i * 2 * Math.PI) / numShapes + (hash % 50) / 25;
    const distance = size * 0.2 + (Math.abs(hash * (i + 1)) % 20) / 100 * size;
    const shapeSize = size * 0.1 + (Math.abs(hash * (i + 2)) % 10) / 200 * size;
    
    const x = centerX + Math.cos(angle) * distance;
    const y = centerY + Math.sin(angle) * distance;
    
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle + (hash * (i + 1)) % 6);
    
    // Draw diamond shape
    ctx.beginPath();
    ctx.moveTo(0, -shapeSize);
    ctx.lineTo(shapeSize, 0);
    ctx.lineTo(0, shapeSize);
    ctx.lineTo(-shapeSize, 0);
    ctx.closePath();
    
    ctx.fillStyle = colors[i % 3];
    ctx.fill();
    
    ctx.restore();
  }
  
  // Central circle
  ctx.beginPath();
  ctx.arc(centerX, centerY, size * 0.15, 0, 2 * Math.PI);
  ctx.fillStyle = colors[0];
  ctx.fill();
  
  return canvas.toDataURL();
};

/**
 * Get the current avatar for a wallet address (custom or profile image)
 * @param {string} address - Wallet address
 * @param {number} size - Avatar size (not used for profile images)
 * @returns {string|null} - Avatar URL
 */
export const getCurrentAvatar = (address, size = 64) => {
  if (!address) return null;

  const profileKey = `stim_profile_${address}`;
  const storedProfile = localStorage.getItem(profileKey);
  
  if (storedProfile) {
    try {
      const parsed = JSON.parse(storedProfile);
      // Return custom avatar if exists, otherwise use profile image
      if (parsed.avatar && !PROFILE_IMAGES.includes(parsed.avatar)) {
        return parsed.avatar; // Custom uploaded avatar
      }
    } catch (error) {
      console.error("Error loading profile avatar:", error);
    }
  }

  // Fallback to deterministic profile image selection
  return generateBlockiesAvatar(address.toLowerCase(), size);
};

/**
 * Get a deterministic color palette for a wallet address
 */
export const getWalletColorPalette = (address) => {
  if (!address) return ['#333', '#666', '#999'];
  
  let hash = 0;
  for (let i = 0; i < address.length; i++) {
    hash = address.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const hue = Math.abs(hash) % 360;
  return [
    `hsl(${hue}, 80%, 45%)`,
    `hsl(${(hue + 60) % 360}, 70%, 55%)`,
    `hsl(${(hue + 120) % 360}, 75%, 65%)`,
  ];
};

/**
 * Generate a simple identicon pattern (alternative to blockies)
 */
export const generateIdenticon = (address, size = 64) => {
  if (!address) return null;
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = size;
  canvas.height = size;
  
  // Generate hash
  let hash = 0;
  for (let i = 0; i < address.length; i++) {
    hash = address.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Generate colors
  const hue = Math.abs(hash) % 360;
  const bgColor = `hsl(${hue}, 30%, 90%)`;
  const fgColor = `hsl(${hue}, 80%, 50%)`;
  
  // Fill background
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, size, size);
  
  // Create simple geometric pattern
  ctx.fillStyle = fgColor;
  const blockSize = size / 5;
  
  for (let i = 0; i < 25; i++) {
    const x = (i % 5) * blockSize;
    const y = Math.floor(i / 5) * blockSize;
    
    if ((hash + i) % 3 === 0) {
      ctx.fillRect(x, y, blockSize, blockSize);
    }
  }
  
  return canvas.toDataURL();
};

/**
 * Get a random profile image (for initial selection or reset)
 */
export const getRandomProfileImage = () => {
  const randomIndex = Math.floor(Math.random() * PROFILE_IMAGES.length);
  return PROFILE_IMAGES[randomIndex];
};

/**
 * Get all available profile images
 */
export const getAllProfileImages = () => {
  return [...PROFILE_IMAGES];
};