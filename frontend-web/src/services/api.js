import axios from 'axios';

// API Configuration
const API_CONFIG = {
  // Base URL for API requests
  BASE_URL: 'https://localhost:7092/api',
  
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
      GET_BY_ID: (id) => `/User/${id}`,
      UPDATE: (id) => `/User/${id}`,
      UPDATE_PASSWORD: (id) => `/User/${id}/password`,
    },
    COMPANY: {
      GET_BY_ID: (id) => `/Company/${id}`,
      UPDATE: (id) => `/Company/${id}`,
    },
  },
  
  // Token expiration times (in milliseconds)
  TOKEN_EXPIRY: {
    ACCESS_TOKEN: 120 * 60 * 1000, // 120 minutes
    REFRESH_TOKEN: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
};

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Set timeout to avoid hanging requests
  timeout: 10000, // 10 seconds
  // Allow a wider range of status codes in development
  validateStatus: (status) => status >= 200 && status < 500,
});

// Add request interceptor to add auth token to requests
api.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      // For debugging
      console.log(`Making ${config.method?.toUpperCase()} request to: ${config.baseURL}${config.url}`);
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

// Add response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => {
    // For debugging
    console.log(`Response from ${response.config.url}: Status ${response.status}`);
    return response;
  },
  async (error) => {
    // For debugging
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
      console.error('Please check server is running and accessible');
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
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          // No refresh token, user needs to login again
          localStorage.removeItem('token');
          window.location.href = '/login';
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
        localStorage.setItem('token', token);

        // Retry the original request with new token
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh token failed, clear tokens and redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export const authService = {
  // Login user and store tokens
  login: async (credentials) => {
    try {
      console.log(`Attempting login for user: ${credentials.username || credentials.email}`);
      
      const response = await api.post(
        API_CONFIG.ENDPOINTS.AUTH.LOGIN, 
        {
          email: credentials.username || credentials.email,
          password: credentials.password
        }
      );
      
      console.log('Login response status:', response.status);
      
      // Store tokens
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('refresh_token', response.data.refreshToken);
        localStorage.setItem('user_id', response.data.user.id.toString());
        localStorage.setItem('user_role', response.data.user.role);
      }
      
      return {
        success: true,
        message: 'Login successful',
        data: response.data
      };
    } catch (error) {
      console.error('Login error details:', error?.response?.data || error.message || 'Unknown error');
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed',
        error: error.response?.data
      };
    }
  },

  // Register a new user
  register: async (userData) => {
    try {
      // Convert to API format
      const registerData = {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        password: userData.password,
        companyName: userData.companyName || `${userData.firstName}'s Company` // Default company name
      };
      
      const response = await api.post(
        API_CONFIG.ENDPOINTS.AUTH.REGISTER, 
        registerData
      );
      
      // Store tokens
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('refresh_token', response.data.refreshToken);
        localStorage.setItem('user_id', response.data.user.id.toString());
        localStorage.setItem('user_role', response.data.user.role);
      }
      
      return {
        success: true,
        message: 'Registration successful',
        data: response.data
      };
    } catch (error) {
      console.error('Registration error:', error.response?.data);
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed',
        error: error.response?.data
      };
    }
  },

  // Get current user info
  getCurrentUser: async () => {
    try {
      const userId = localStorage.getItem('user_id');
      if (!userId) return null;
      
      const response = await api.get(
        API_CONFIG.ENDPOINTS.USER.GET_BY_ID(parseInt(userId))
      );
      return response.data;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  },

  // Check if user is authenticated
  isAuthenticated: async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return false;
      
      // Validate token with the backend
      const response = await api.get(
        API_CONFIG.ENDPOINTS.AUTH.VALIDATE_TOKEN
      );
      return response.data;
    } catch (error) {
      console.error('Error checking authentication status:', error);
      return false;
    }
  },

  // Get user role
  getUserRole: () => {
    try {
      return localStorage.getItem('user_role');
    } catch (error) {
      console.error('Error getting user role:', error);
      return null;
    }
  },

  // Logout user and clear tokens
  logout: async () => {
    try {
      // Call logout endpoint
      await api.post(API_CONFIG.ENDPOINTS.AUTH.LOGOUT);
      
      // Clear tokens from storage
      localStorage.removeItem('token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_id');
      localStorage.removeItem('user_role');
      
      window.location.href = '/login';
    } catch (error) {
      console.error('Error during logout:', error);
      // Still clear tokens and redirect even if API call fails
      localStorage.removeItem('token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_id');
      localStorage.removeItem('user_role');
      window.location.href = '/login';
    }
  },
};

export const companyService = {
  getAll: async () => {
    try {
      const response = await api.get('/Company');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error getting companies:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get companies',
        error: error.response?.data
      };
    }
  },

  getById: async (id) => {
    try {
      const response = await api.get(API_CONFIG.ENDPOINTS.COMPANY.GET_BY_ID(id));
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error(`Error getting company ${id}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get company',
        error: error.response?.data
      };
    }
  },

  create: async (companyData) => {
    try {
      const response = await api.post('/Company', companyData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error creating company:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to create company',
        error: error.response?.data
      };
    }
  },

  update: async (id, companyData) => {
    try {
      const response = await api.put(API_CONFIG.ENDPOINTS.COMPANY.UPDATE(id), companyData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error(`Error updating company ${id}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update company',
        error: error.response?.data
      };
    }
  },

  delete: async (id) => {
    try {
      const response = await api.delete(`/Company/${id}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error(`Error deleting company ${id}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to delete company',
        error: error.response?.data
      };
    }
  },
};

export const userService = {
  getCurrentUser: async () => {
    try {
      const userId = localStorage.getItem('user_id');
      if (!userId) return { success: false, message: 'User ID not found' };
      
      const response = await api.get(API_CONFIG.ENDPOINTS.USER.GET_BY_ID(parseInt(userId)));
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error getting current user:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get user information',
        error: error.response?.data
      };
    }
  },
  
  updateUser: async (userId, userData) => {
    try {
      const response = await api.put(API_CONFIG.ENDPOINTS.USER.UPDATE(userId), userData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error(`Error updating user ${userId}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update user',
        error: error.response?.data
      };
    }
  },
  
  updatePassword: async (userId, passwordData) => {
    try {
      const response = await api.put(API_CONFIG.ENDPOINTS.USER.UPDATE_PASSWORD(userId), passwordData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error(`Error updating password for user ${userId}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update password',
        error: error.response?.data
      };
    }
  },
};

export { API_CONFIG };
export default api;