import React from 'react';
import { GiSoccerKick } from "react-icons/gi";
import { MdLocalMovies } from "react-icons/md";
import { GiPublicSpeaker } from "react-icons/gi";
import { SiBitcoinsv } from "react-icons/si";
import { FaComputer } from "react-icons/fa6";
import { 
  FaGlobe as Globe, 
  FaGamepad as Gamepad2,
  FaChartLine as TrendingUp,
  FaBriefcase as Briefcase,
  FaHeart as Heart,
  FaGraduationCap as GraduationCap,
  FaCar as Car,
  FaHome as Home,
  FaPalette as Palette,
  FaPlane as Plane,
  FaBuilding as Building,
  FaUsers as Users,
  FaCalendar as Calendar,
  FaAward as Award,
  FaBullseye as Target,
  FaQuestionCircle as HelpCircle
} from "react-icons/fa";

// Category icon mapping
export const CATEGORY_ICONS = {
  // Sports
  sport: GiSoccerKick,
  sports: GiSoccerKick,
  football: GiSoccerKick,
  soccer: GiSoccerKick,
  basketball: GiSoccerKick,
  tennis: GiSoccerKick,
  
  // Politics
  politics: GiPublicSpeaker,
  political: GiPublicSpeaker,
  government: GiPublicSpeaker,
  election: GiPublicSpeaker,
  
  // Entertainment
  entertainment: MdLocalMovies,
  music: MdLocalMovies,
  movies: MdLocalMovies,
  celebrity: MdLocalMovies,
  film: MdLocalMovies,
  
  // Crypto/Finance
  crypto: SiBitcoinsv,
  cryptocurrency: SiBitcoinsv,
  bitcoin: SiBitcoinsv,
  finance: TrendingUp,
  financial: TrendingUp,
  stocks: TrendingUp,
  trading: TrendingUp,
  
  // General
  general: Globe,
  misc: Globe,
  other: Globe,
  
  // Technology
  technology: FaComputer,
  tech: FaComputer,
  ai: FaComputer,
  software: FaComputer,
  
  // Gaming
  gaming: Gamepad2,
  games: Gamepad2,
  esports: Gamepad2,
  
  // Business
  business: Briefcase,
  corporate: Briefcase,
  startup: Briefcase,
  
  // Health
  health: Heart,
  medical: Heart,
  healthcare: Heart,
  
  // Education
  education: GraduationCap,
  science: GraduationCap,
  research: GraduationCap,
  
  // Transportation
  transportation: Car,
  automotive: Car,
  travel: Plane,
  
  // Real Estate
  realestate: Home,
  property: Home,
  housing: Home,
  
  // Art
  art: Palette,
  design: Palette,
  creative: Palette,
  
  // Social
  social: Users,
  community: Users,
  society: Users,
  
  // Events
  events: Calendar,
  event: Calendar,
  
  // Awards/Competition
  competition: Award,
  contest: Award,
  
  // Predictions/Forecasting
  prediction: Target,
  forecast: Target,
  
  // Default fallback
  default: HelpCircle
};

/**
 * Get the icon component for a category
 * @param {string} categoryName - The category name (case insensitive)
 * @param {string} categoryLabel - Optional category label for fallback
 * @returns {React.Component} - The icon component
 */
export const getCategoryIcon = (categoryName, categoryLabel = null) => {
  if (!categoryName && !categoryLabel) {
    return CATEGORY_ICONS.default;
  }
  
  // Try with category name first
  const normalizedName = categoryName?.toLowerCase().trim();
  let IconComponent = CATEGORY_ICONS[normalizedName];
  
  // If not found, try with category label
  if (!IconComponent && categoryLabel) {
    const normalizedLabel = categoryLabel.toLowerCase().trim();
    IconComponent = CATEGORY_ICONS[normalizedLabel];
  }
  
  // Try partial matches for compound names
  if (!IconComponent) {
    const searchTerm = normalizedName || categoryLabel?.toLowerCase();
    if (searchTerm) {
      for (const [key, icon] of Object.entries(CATEGORY_ICONS)) {
        if (searchTerm.includes(key) || key.includes(searchTerm)) {
          IconComponent = icon;
          break;
        }
      }
    }
  }
  
  // Return found icon or default
  return IconComponent || CATEGORY_ICONS.default;
};

/**
 * Get category icon with styling props
 * @param {string} categoryName - The category name
 * @param {string} categoryLabel - Optional category label
 * @param {object} props - Additional props for the icon
 * @returns {React.Element} - Rendered icon with props
 */
export const CategoryIcon = ({ 
  categoryName, 
  categoryLabel = null, 
  className = "w-6 h-6", 
  color = "currentColor",
  ...props 
}) => {
  const IconComponent = getCategoryIcon(categoryName, categoryLabel);
  
  return React.createElement(IconComponent, {
    className,
    color,
    ...props
  });
};

/**
 * Check if a category has a specific icon (not default)
 * @param {string} categoryName - The category name
 * @param {string} categoryLabel - Optional category label
 * @returns {boolean} - True if category has a specific icon
 */
export const hasSpecificIcon = (categoryName, categoryLabel = null) => {
  const IconComponent = getCategoryIcon(categoryName, categoryLabel);
  return IconComponent !== CATEGORY_ICONS.default;
};

/**
 * Get all available category mappings
 * @returns {object} - Object with category names as keys and icon components as values
 */
export const getAllCategoryIcons = () => {
  return { ...CATEGORY_ICONS };
};

/**
 * Add or update a category icon mapping
 * @param {string} categoryName - The category name
 * @param {React.Component} IconComponent - The icon component
 */
export const addCategoryIcon = (categoryName, IconComponent) => {
  CATEGORY_ICONS[categoryName.toLowerCase()] = IconComponent;
};