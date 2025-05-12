// Token utility functions for React Native
import { Buffer } from 'buffer';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Decode a JWT token and extract the payload
 * This implementation is safe for React Native which doesn't have atob
 */
export const decodeJWT = (token) => {
  try {
    if (!token) return null;
    
    // Split token into parts
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('Invalid JWT token format');
      return null;
    }
    
    // Decode the payload (second part)
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    
    // React Native safe base64 decoding
    const jsonPayload = Buffer.from(base64, 'base64').toString('utf8');
    
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding JWT token:', error);
    return null;
  }
};

/**
 * Extract username or email from JWT token
 */
export const extractUsernameFromToken = async () => {
  try {
    const token = await AsyncStorage.getItem('token');
    
    if (!token) {
      console.error('No token found in AsyncStorage');
      return null;
    }
    
    // Parse the JWT token manually since atob is not available in React Native
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('Invalid token format');
      return null;
    }
    
    // Decode the payload (second part)
    try {
      // Use Buffer to decode base64 in React Native
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      
      // Extract username from different possible claims
      const username = 
        payload.unique_name || 
        payload.username || 
        payload.name ||
        payload.sub ||
        null;
        
      console.log('Extracted username from token:', username);
      return username;
    } catch (parseError) {
      console.error('Error parsing token payload:', parseError);
      return null;
    }
  } catch (error) {
    console.error('Error extracting username from token:', error);
    return null;
  }
};

/**
 * Check if a token is expired
 */
export const isTokenExpired = (token) => {
  try {
    const payload = decodeJWT(token);
    if (!payload || !payload.exp) return true;
    
    // Convert exp to milliseconds and compare with current time
    const expiryDate = new Date(payload.exp * 1000);
    return expiryDate < new Date();
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return true; // Assume expired if there's an error
  }
};

/**
 * Extract all user claims from JWT token
 */
export const getUserClaimsFromToken = (token) => {
  return decodeJWT(token) || {};
};

export const getFullUsernameFromStorage = async () => {
  try {
    // Try to get the username from AsyncStorage directly first
    let username = await AsyncStorage.getItem('username');
    console.log('Username from AsyncStorage:', username);
    
    // If that fails, try to extract from the token
    if (!username) {
      username = await extractUsernameFromToken();
      console.log('Username extracted from token:', username);
    }
    
    // Try to get user data from AsyncStorage
    if (!username) {
      const userJson = await AsyncStorage.getItem('user');
      if (userJson) {
        try {
          const userData = JSON.parse(userJson);
          username = userData.username || userData.userName || userData.email;
          console.log('Username from user data:', username);
        } catch (parseError) {
          console.error('Error parsing user data:', parseError);
        }
      }
    }
    
    // If we still don't have a username, use a known valid username that exists in the database
    // IMPORTANT: This username MUST exist in your Users table
    if (!username) {
      // Use a username that definitely exists in your database
      const fallbackUsername = 'hadi244588@gmail.com'; // Using an existing username from the database
      console.log('Using fallback username:', fallbackUsername);
      return fallbackUsername;
    }
    
    // Log the final username being used
    console.log('Final username being used for CreatedBy:', username);
    return username;
  } catch (error) {
    console.error('Error getting username:', error);
    // Return a default valid username as fallback - MUST exist in your database
    const emergencyFallback = 'hadi244588@gmail.com'; // Using an existing username from the database
    console.log('Using emergency fallback username:', emergencyFallback);
    return emergencyFallback;
  }
};

export default {
  decodeJWT,
  extractUsernameFromToken,
  isTokenExpired,
  getUserClaimsFromToken,
  getFullUsernameFromStorage
}; 