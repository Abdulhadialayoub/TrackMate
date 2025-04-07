import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import * as Network from 'expo-network';
import { Platform } from 'react-native';
import API_CONFIG from '../config/api';

// Helper function to check network connectivity
const checkNetworkConnectivity = async () => {
  try {
    const networkState = await Network.getNetworkStateAsync();
    return networkState.isConnected && networkState.isInternetReachable;
  } catch (error) {
    console.warn('Failed to check network connectivity:', error);
    return true; // Assume connected if we can't check
  }
};

// Create axios instance with base URL
const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Client-Platform': Platform.OS,
    'X-Client-Version': Platform.Version.toString(),
  },
  // Set timeout to avoid hanging requests
  timeout: 15000, // 15 seconds
  // Allow a wider range of status codes in development
  validateStatus: (status) => status >= 200 && status < 500,
});

// Log the base URL on initialization
console.log(`API Client initialized with base URL: ${API_CONFIG.BASE_URL}`);

// Add request interceptor to add auth token to requests and check connectivity
apiClient.interceptors.request.use(
  async (config) => {
    try {
      // Check network connectivity first
      const isConnected = await checkNetworkConnectivity();
      if (!isConnected) {
        throw new Error('No internet connection available');
      }
      
      // Add authentication token if available
      const token = await SecureStore.getItemAsync('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      // For debugging
      console.log(`Making ${config.method?.toUpperCase()} request to: ${config.baseURL}${config.url}`);
      if (config.data) {
        console.log('Request payload:', JSON.stringify(config.data, null, 2));
      }
      
      return config;
    } catch (error) {
      console.error('Error in request interceptor:', error);
      return Promise.reject(error);
    }
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor to handle token refresh and better error handling
apiClient.interceptors.response.use(
  (response) => {
    // For debugging
    console.log(`Response from ${response.config.url}: Status ${response.status}`);
    return response;
  },
  async (error) => {
    // Enhanced error logging
    console.error('API Error Details:', {
      url: error.config?.url,
      baseURL: error.config?.baseURL,
      method: error.config?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      name: error.name,
      code: error.code
    });

    // Detailed network error logging
    if (error.message === 'Network Error') {
      console.error(`Network Error: Unable to connect to ${error.config?.baseURL}${error.config?.url}`);
      console.error('Please check:');
      console.error('1. Server is running and accessible');
      console.error('2. Device and server are on same network');
      console.error('3. Firewall is not blocking the connection');
      console.error('4. API URL is correct:', API_CONFIG.BASE_URL);
    }
    else if (error.code === 'ECONNABORTED') {
      console.error(`Request timeout when connecting to ${error.config?.url}`);
    }
    else if (error.code === 'ERR_CONNECTION_REFUSED') {
      console.error(`Connection refused to ${error.config?.baseURL}${error.config?.url}`);
      console.error('The server may not be running or the port may be blocked.');
    }

    const originalRequest = error.config;

    // If error is 401 and we haven't tried to refresh token yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await SecureStore.getItemAsync('refresh_token');
        if (!refreshToken) {
          // No refresh token, user needs to login again
          await SecureStore.deleteItemAsync('auth_token');
          return Promise.reject(error);
        }

        // Try to refresh the token
        const response = await axios.post(
          `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.REFRESH_TOKEN}`,
          { refreshToken },
          {
            headers: {
              'Content-Type': 'application/json',
            },
            timeout: 10000,
            validateStatus: (status) => status >= 200 && status < 500,
          }
        );

        const { token } = response.data;
        await SecureStore.setItemAsync('auth_token', token);

        // Retry the original request with new token
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh token failed, clear tokens and reject
        await SecureStore.deleteItemAsync('auth_token');
        await SecureStore.deleteItemAsync('refresh_token');
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient; 