import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Detect if running in Expo Go or standalone app
const isExpo = Constants.appOwnership === 'expo';

// Get the local IP address from Expo Constants if available
const getLocalIpAddress = () => {
  if (Constants.expoConfig?.hostUri) {
    const hostUri = Constants.expoConfig.hostUri;
    const ipMatch = hostUri.match(/^([\d.]+):/);
    if (ipMatch && ipMatch[1]) {
      return ipMatch[1];
    }
  }
  return '192.168.1.1'; // Fallback IP - update this to your computer's IP
};

// Determine the appropriate base URL based on environment
const getBaseUrl = () => {
  // When running in development
  if (__DEV__) {
    // For Android emulator
    if (Platform.OS === 'android' && !isExpo) {
      return 'http://10.0.2.2:8081/api';
    }
    
    // For iOS simulator
    if (Platform.OS === 'ios' && !isExpo) {
      return 'http://localhost:8081/api';
    }
    
    // For Expo Go on physical device
    const localIp = getLocalIpAddress();
    return `http://${localIp}:8081/api`;
  }
  
  // For production builds
  return 'https://api.trackmate.com/api'; // Update with your production API URL
};

// API Configuration
const API_CONFIG = {
  // Base URL for API requests - dynamically determined
  BASE_URL: getBaseUrl(),
  
  // API Endpoints
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/Auth/login',
      REGISTER: '/Auth/register',
      REFRESH_TOKEN: '/Auth/refresh-token',
      LOGOUT: '/Auth/logout',
      VALIDATE_TOKEN: '/Auth/validate-token',
    },
    USER: {
      GET_CURRENT: '/User/me',
      GET_BY_ID: (id: number) => `/User/${id}`,
      UPDATE: (id: number) => `/User/${id}`,
      UPDATE_PASSWORD: (id: number) => `/User/${id}/password`,
    },
    COMPANY: {
      GET_BY_ID: (id: number) => `/Company/${id}`,
      UPDATE: (id: number) => `/Company/${id}`,
    },
  },
  
  // Token expiration times (in milliseconds)
  TOKEN_EXPIRY: {
    ACCESS_TOKEN: 120 * 60 * 1000, // 120 minutes
    REFRESH_TOKEN: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
};

export default API_CONFIG; 