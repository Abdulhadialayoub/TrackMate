import axios from 'axios';

// API Configuration
const API_CONFIG = {
  // Base URL for API requests
  //https://localhost:7092/api
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

// Helper function to normalize data from ReferenceHandler.Preserve format
export const normalizeJsonResponse = (data) => {
  // If it's null or undefined, return as is
  if (data == null) return data;
  
  // If it's an array, normalize each item
  if (Array.isArray(data)) {
    return data.map(item => normalizeJsonResponse(item));
  }
  
  // If it's not an object, return as is
  if (typeof data !== 'object') return data;
  
  // Track objects by $id to resolve references
  const objectsById = new Map();
  
  // First pass: collect all objects with $id
  const collectObjectsById = (obj) => {
    if (obj == null || typeof obj !== 'object') return;
    
    // Store object by its $id if it has one
    if (obj.$id && typeof obj.$id === 'string') {
      objectsById.set(obj.$id, obj);
    }
    
    // Process arrays
    if (Array.isArray(obj)) {
      obj.forEach(item => collectObjectsById(item));
      return;
    }
    
    // Process object properties
    for (const key in obj) {
      if (key !== '$ref' && typeof obj[key] === 'object' && obj[key] !== null) {
        collectObjectsById(obj[key]);
      }
    }
  };
  
  // Process an object, resolving references and removing circular references
  const processObject = (obj, objectsById, visited = new Set()) => {
    // Handle null/undefined
    if (obj == null) return obj;
    
    // Handle primitive values
    if (typeof obj !== 'object') return obj;
    
    // Prevent circular references
    if (visited.has(obj)) {
      return { __circular: true };
    }
    
    // Mark this object as visited
    visited.add(obj);
    
    // Handle $ref references
    if (obj.$ref && typeof obj.$ref === 'string') {
      const referenced = objectsById.get(obj.$ref);
      if (referenced) {
        // Process the referenced object with a new visited set to avoid interference
        const processedRef = processObject(referenced, objectsById, new Set([...visited]));
        
        // Special handling for customer references
        if (processedRef && obj.$ref.includes('Customer')) {
          // Ensure customer name is available
          if (!processedRef.name && !processedRef.Name) {
            processedRef.name = "Unknown Customer";
          }
        }
        
        return processedRef;
      }
      return {}; // Referenced object not found
    }
    
    // Handle arrays
    if (Array.isArray(obj)) {
      return obj.map(item => processObject(item, objectsById, new Set([...visited])));
    }
    
    // Handle regular objects
    const result = {};
    for (const key in obj) {
      // Skip special properties used for reference tracking
      if (key === '$id' || key === '$ref') continue;
      
      // Handle $values array - return its contents processed directly
      if (key === '$values' && Array.isArray(obj.$values)) {
        result[key] = obj.$values.map(item => processObject(item, objectsById, new Set([...visited])));
        continue;
      }
      
      // Process nested properties
      result[key] = processObject(obj[key], objectsById, new Set([...visited]));
    }
    
    // Special handling for customer/order objects
    if (result.customerId && !result.customerName && !result.customer) {
      // Add a minimal customer object if missing
      result.customerName = `Customer #${result.customerId}`;
    }
    
    return result;
  };
  
  try {
    // Collect all objects with $id references first
    collectObjectsById(data);
    
    // If the object has $values property (common in ASP.NET Core)
    if (data.$values && Array.isArray(data.$values)) {
      console.log('Found $values array with', data.$values.length, 'items');
      
      // Process and return the array
      return data.$values.map(item => processObject(item, objectsById));
    }
    
    // Handle case where we have an object with a single property called 'data'
    if (data.data && (Array.isArray(data.data) || typeof data.data === 'object') 
        && Object.keys(data).length === 1) {
      console.log('Unwrapping data property with direct access');
      return processObject(data.data, objectsById);
    }
    
    // For regular objects
    return processObject(data, objectsById);
  } catch (error) {
    console.error('Error normalizing JSON response:', error);
    
    // Fallback: try simpler approach - just extract $values if present
    if (data.$values && Array.isArray(data.$values)) {
      return data.$values;
    }
    
    // If all else fails, return the original data
    return data;
  }
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

// Add better debugging for API requests and responses
const handleApiError = (error, endpoint) => {
  console.error(`API Error for ${endpoint}:`, error);
  
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    console.error(`Status: ${error.response.status}`);
    console.error(`Headers:`, error.response.headers);
    console.error(`Data:`, error.response.data);
    
    // Log validation errors in a more readable format
    if (error.response.status === 400 && error.response.data?.errors) {
      console.error("Validation Errors:");
      Object.entries(error.response.data.errors).forEach(([field, messages]) => {
        console.error(`- ${field}: ${messages.join(', ')}`);
      });
    }
  } else if (error.request) {
    // The request was made but no response was received
    console.error(`No response received for request:`, error.request);
  } else {
    // Something happened in setting up the request that triggered an Error
    console.error(`Error setting up request:`, error.message);
  }
  
  return error;
};

// Add response interceptor to handle token refresh and normalize JSON responses
api.interceptors.response.use(
  (response) => {
    console.log(`Response from ${response.config.url}:`, `Status ${response.status}`);
    
    // Normalize the response data to handle ReferenceHandler.Preserve format
    if (response.data) {
      try {
        // Only apply normalization for successful responses
        if (response.status >= 200 && response.status < 300) {
          // Add some safety checks
          if (response.data && typeof response.data === 'object') {
            // Check if we need normalization (has special properties)
            const hasReferenceFormat = response.data.$values || response.data.$id || 
              Object.values(response.data).some(v => v && typeof v === 'object' && v.$ref);
              
            if (hasReferenceFormat) {
              console.log('Detected circular reference format, normalizing data for', response.config.url);
              try {
                const normalizedData = normalizeJsonResponse(response.data);
                if (normalizedData !== response.data) {
                  console.log('Successfully normalized response data');
                  response.data = normalizedData;
                }
              } catch (normalizationError) {
                console.error('Error normalizing response data:', normalizationError);
                
                // Use simplified approach when main approach fails
                console.warn('Falling back to simple JSON sanitization');
                try {
                  // Try to sanitize using simpler approach - stringify and parse with circular reference handling
                  const simplifiedData = JSON.parse(
                    JSON.stringify(response.data, (key, value) => {
                      // Skip special properties
                      if (key === '$id' || key === '$ref') return undefined;
                      
                      // Handle $values array - return its contents directly
                      if (key === '$values' && Array.isArray(value)) return value;
                      
                      return value;
                    })
                  );
                  
                  // If we have a $values property at the top level, use that as the data
                  if (simplifiedData && simplifiedData.$values && Array.isArray(simplifiedData.$values)) {
                    response.data = simplifiedData.$values;
                  } else {
                    response.data = simplifiedData;
                  }
                  
                  console.log('Successfully sanitized data using simplified approach');
                } catch (fallbackError) {
                  console.error('Even fallback sanitization failed:', fallbackError);
                  // Keep the original data if all else fails
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('Error in response interceptor while normalizing data:', error);
        // Continue with the original data to prevent API failures
      }
    }
    
    return response;
  },
  (error) => {
    handleApiError(error, error.config?.url || 'unknown endpoint');
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
        
        // Store user name consistently
        localStorage.setItem('user_name', response.data.user.name || response.data.user.fullName || 
          `${response.data.user.firstName || ''} ${response.data.user.lastName || ''}`.trim() || 
          response.data.user.username || response.data.user.email);
          
        // Store username separately
        localStorage.setItem('username', response.data.user.username || response.data.user.email);
        
        // Store full name if available
        if (response.data.user.firstName || response.data.user.lastName) {
          localStorage.setItem('fullname', `${response.data.user.firstName || ''} ${response.data.user.lastName || ''}`.trim());
        }
        
        // Log stored user info for debugging
        console.log('Stored user info:', {
          user_id: localStorage.getItem('user_id'),
          user_role: localStorage.getItem('user_role'),
          user_name: localStorage.getItem('user_name'),
          username: localStorage.getItem('username'),
          fullname: localStorage.getItem('fullname')
        });
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
      console.log('Registration data received:', userData);
      
      // Convert to API format - based on the expected API schema
      const registerData = {
        companyName: userData.companyName || `${userData.firstName}'s Company`,
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        password: userData.password
      };
      
      console.log('Sending registration data:', registerData);
      
      const response = await api.post(
        API_CONFIG.ENDPOINTS.AUTH.REGISTER, 
        registerData
      );
      
      console.log('Registration response:', response.data);
      
      // Store tokens
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('refresh_token', response.data.refreshToken);
        localStorage.setItem('user_id', response.data.user?.id?.toString() || '');
        localStorage.setItem('user_role', response.data.user?.role || '');
        localStorage.setItem('username', response.data.user?.username || response.data.user?.email || '');
        localStorage.setItem('company_id', response.data.user?.companyId?.toString() || '');
      }
      
      return {
        success: true,
        message: 'Registration successful',
        data: response.data
      };
    } catch (error) {
      console.error('Registration error:', error);
      console.error('Error details:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      if (error.response) {
        // Log more details for debugging
        console.error('Error headers:', error.response.headers);
        console.error('Error config:', error.config);
      }
      
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Registration failed',
        error: error.response?.data || error
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
      
      // Clear all user data from storage
      localStorage.removeItem('token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_id');
      localStorage.removeItem('user_role');
      localStorage.removeItem('user_name');
      localStorage.removeItem('username');
      localStorage.removeItem('fullname');
      localStorage.removeItem('company_id');
      localStorage.removeItem('user_email');
      
      window.location.href = '/login';
    } catch (error) {
      console.error('Error during logout:', error);
      // Still clear tokens and redirect even if API call fails
      localStorage.removeItem('token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_id');
      localStorage.removeItem('user_role');
      localStorage.removeItem('user_name');
      localStorage.removeItem('username');
      localStorage.removeItem('fullname');
      localStorage.removeItem('company_id');
      localStorage.removeItem('user_email');
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