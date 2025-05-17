import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { BASE_URL, STORAGE_KEYS } from '../config/constants';

// Simple logger
const logger = {
  debug: console.log,
  info: console.log,
  warn: console.warn,
  error: console.error
};

// API configuration
const API_CONFIG = {
  // Current API URL
  URL: BASE_URL,
  
  // Request timeout in milliseconds (15 seconds)
  TIMEOUT: 15000,
  
  // Whether to verify SSL certificates (set to false for dev environments with self-signed certs)
  VERIFY_SSL: false
};

// Create axios instance
const api = axios.create({
  baseURL: API_CONFIG.URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Client-Platform': Platform.OS,
    'X-Client-Version': '1.0.0'
  },
  // SSL certificate validation setting
  httpsAgent: API_CONFIG.VERIFY_SSL ? undefined : {
    rejectUnauthorized: false
  }
});

// Log each request for debugging
api.interceptors.request.use(
  config => {
    console.log(
      `API Request: ${config.method.toUpperCase()} ${config.url}`,
      JSON.stringify({
        headers: config.headers,
        data: config.data
      }, null, 2)
    );
    
    // Add request timestamp for tracking
    config.metadata = { startTime: new Date().getTime() };
    
    // Log full URL for better debugging
    console.log(`Full request URL: ${config.baseURL}${config.url}`);
    
    return config;
  },
  error => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Log each response for debugging
api.interceptors.response.use(
  response => {
    // Calculate request duration
    const endTime = new Date().getTime();
    const startTime = response.config.metadata?.startTime || endTime;
    const duration = endTime - startTime;
    
    console.log(
      `API Response (${duration}ms): ${response.status} ${response.config.method.toUpperCase()} ${response.config.url}`,
      typeof response.data === 'object' ? JSON.stringify(response.data, null, 2).substring(0, 500) : 'Non-JSON response'
    );
    return response;
  },
  error => {
    // Calculate request duration even for errors
    const endTime = new Date().getTime();
    const startTime = error.config?.metadata?.startTime || endTime;
    const duration = endTime - startTime;
    
    if (error.response) {
      console.error(
        `API Error Response (${duration}ms): ${error.response.status} ${error.config?.method?.toUpperCase()} ${error.config?.url}`,
        error.response.data
      );
      
      // Enhanced error logging for specific status codes
      if (error.response.status === 500) {
        console.error('INTERNAL SERVER ERROR DETAILS:', {
          url: error.config?.url,
          method: error.config?.method,
          requestData: error.config?.data,
          responseData: error.response.data,
          headers: error.response.headers
        });
      } else if (error.response.status === 400) {
        console.error('BAD REQUEST DETAILS:', {
          url: error.config?.url,
          method: error.config?.method,
          requestData: error.config?.data,
          responseData: error.response.data,
          validation: error.response.data.errors || error.response.data.validationErrors
        });
      } else if (error.response.status === 401) {
        console.error('UNAUTHORIZED ACCESS:', {
          url: error.config?.url,
          token: error.config?.headers?.Authorization ? 'Present' : 'Missing'
        });
      }
    } else if (error.request) {
      console.error(`API Request Failed (${duration}ms, No Response):`, {
        url: error.config?.url,
        method: error.config?.method,
        requestData: error.config?.data,
        error: error.message,
        request: error.request._response || '[Request object]'
      });
    } else {
      console.error(`API Error (${duration}ms):`, {
        message: error.message,
        stack: error.stack
      });
    }
    return Promise.reject(error);
  }
);

// Add auth token from storage
api.interceptors.request.use(
  async config => {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    } catch (error) {
      console.error('Error setting auth token:', error);
      return config;
    }
  },
  error => {
    return Promise.reject(error);
  }
);

// Export the api client for use by other services
export { api };

// Also export as default for backward compatibility
export default api;

// Function to update the API base URL (useful for dynamic endpoints)
export const updateApiBaseUrl = (newUrl) => {
  if (newUrl && typeof newUrl === 'string') {
    api.defaults.baseURL = newUrl;
    API_CONFIG.URL = newUrl;
    logger.info('API', `Base URL updated to: ${newUrl}`);
    return true;
  }
  return false;
};

// Helper function to handle API responses with $values format
const handleApiResponse = (response) => {
  if (response && response.data) {
    // Check if data is in ReferenceHandler.Preserve format with $values
    if (typeof response.data === 'object' && response.data.$values) {
      console.log('Found $values array in response');
      return response.data.$values;
    }
    return response.data;
  }
  return [];
};

// Helper function to convert an ArrayBuffer to a base64 string (for PDF handling)
const arrayBufferToBase64 = (buffer) => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

// ============= AUTH SERVICE =============
export const authService = {
  login: async (email, password) => {
    try {
      logger.debug('authService', 'Attempting login', { email });
      const response = await api.post('/Auth/login', { email, password });
      return response.data;
    } catch (error) {
      logger.error('authService', 'Login failed', error);
      throw error;
    }
  },
  
  register: async (userData) => {
    try {
      logger.debug('authService', 'Registering new user', { email: userData.email });
      const response = await api.post('/Auth/register', userData);
      return response.data;
    } catch (error) {
      logger.error('authService', 'Registration failed', error);
      throw error;
    }
  },
  
  forgotPassword: async (email) => {
    try {
      logger.debug('authService', 'Password reset requested', { email });
      const response = await api.post('/Auth/forgot-password', { email });
      return response.data;
    } catch (error) {
      logger.error('authService', 'Password reset request failed', error);
      throw error;
    }
  },
  
  resetPassword: async (token, newPassword) => {
    try {
      logger.debug('authService', 'Resetting password with token');
      const response = await api.post('/Auth/reset-password', { token, newPassword });
      return response.data;
    } catch (error) {
      logger.error('authService', 'Password reset failed', error);
      throw error;
    }
  },
  
  validateToken: async () => {
    try {
      logger.debug('authService', 'Validating token');
      const response = await api.get('/Auth/validate-token');
      return response.data;
    } catch (error) {
      logger.error('authService', 'Token validation failed', error);
      throw error;
    }
  }
};

// ============= USER SERVICE =============
export const userService = {
  getProfile: async () => {
    try {
      logger.debug('userService', 'Getting user profile');
      const response = await api.get('/User/profile');
      return response.data;
    } catch (error) {
      logger.error('userService', 'Failed to get profile', error);
      throw error;
    }
  },
  
  updateProfile: async (userData) => {
    try {
      logger.debug('userService', 'Updating user profile');
      const response = await api.put('/User/profile', userData);
      return response.data;
    } catch (error) {
      logger.error('userService', 'Failed to update profile', error);
      throw error;
    }
  },
  
  changePassword: async (currentPassword, newPassword) => {
    try {
      logger.debug('userService', 'Changing password');
      const response = await api.post('/User/change-password', { 
        currentPassword, 
        newPassword 
      });
      return response.data;
    } catch (error) {
      logger.error('userService', 'Failed to change password', error);
      throw error;
    }
  }
};

// ============= PRODUCT SERVICE =============
export const productService = {
  getAll: async () => {
    try {
      console.log('Requesting all products');
      const response = await api.get('/Product');
      
      // Check for different response formats
      let productsData = response.data;
      
      // Handle ReferenceHandler.Preserve format with $values
      if (response.data && typeof response.data === 'object' && response.data.$values) {
        console.log(`Extracted ${response.data.$values.length} products from $values property`);
        productsData = response.data.$values;
      }
      
      return {
        success: true,
        data: productsData
      };
    } catch (error) {
      console.error('Error getting products:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get products',
        error: error.response?.data
      };
    }
  },

  getById: async (id) => {
    try {
      console.log(`Requesting product with ID: ${id}`);
      
      if (!id) {
        throw new Error('Product ID is required');
      }
      
      // Ensure id is a string
      const productId = id.toString();
      
      const response = await api.get(`/Product/${productId}`);
      console.log(`Product data received for ID ${id}`);
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error(`Error getting product by ID: ${id}`, error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get product',
        error: error.response?.data
      };
    }
  },

  getByCompanyId: async (companyId) => {
    try {
      console.log(`Requesting products for company ID: ${companyId}`);
      
      // Validate companyId
      if (!companyId) {
        throw new Error('Company ID is required');
      }
      
      const response = await api.get(`/Product/company/${companyId}`);
      
      // Handle ReferenceHandler.Preserve format with $values
      let productsData = response.data;
      if (response.data && typeof response.data === 'object' && response.data.$values) {
        console.log(`Extracted ${response.data.$values.length} products from $values property`);
        productsData = response.data.$values;
      }
      
      return {
        success: true,
        data: productsData
      };
    } catch (error) {
      console.error(`Error getting products for company: ${companyId}`, error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get company products',
        error: error.response?.data
      };
    }
  },

  create: async (productData) => {
    try {
      console.log('Creating new product', productData);
      
      // Validate required fields
      if (!productData.name) {
        return {
          success: false,
          message: 'Product name is required'
        };
      }
      
      // Validate categoryId - ensure it's not empty and is a valid number
      if (productData.categoryId === undefined || productData.categoryId === null || productData.categoryId === '') {
        return {
          success: false,
          message: 'Category is required'
        };
      }
      
      // Ensure categoryId is a valid number
      const categoryId = Number(productData.categoryId);
      if (isNaN(categoryId) || categoryId <= 0) {
        return {
          success: false,
          message: 'Invalid category ID'
        };
      }
      
      // Remove any properties that might cause issues with the API
      const cleanedData = { ...productData };
      if (cleanedData.id === null || cleanedData.id === undefined || cleanedData.id === '') {
        delete cleanedData.id;
      }
      
      // Similar to web implementation, ensure we have clean numeric data
      cleanedData.unitPrice = Number(cleanedData.unitPrice);
      cleanedData.stockQuantity = Number(cleanedData.stockQuantity);
      cleanedData.categoryId = Number(cleanedData.categoryId);
      
      if (cleanedData.companyId) {
        cleanedData.companyId = Number(cleanedData.companyId);
      }
      
      if (cleanedData.status !== undefined) {
        cleanedData.status = Number(cleanedData.status);
      }
      
      // Create a fresh object with explicit typing to match API expectations exactly
      // This is a more drastic approach that ensures the data format matches exactly what the backend expects
      const apiPayload = {
        name: String(cleanedData.name || ''),
        description: String(cleanedData.description || ''),
        code: String(cleanedData.code || ''),
        unitPrice: Number(cleanedData.unitPrice || 0),
        unit: String(cleanedData.unit || ''),
        weight: Number(cleanedData.weight || 0),
        quantity: Number(cleanedData.quantity || 0),
        stockQuantity: Number(cleanedData.stockQuantity || 0),
        category: String(cleanedData.categoryId || ''),
        brand: String(cleanedData.brand || ''),
        model: String(cleanedData.model || ''),
        currency: String(cleanedData.currency || 'USD'),
        status: Number(cleanedData.status || 0),
        sku: String(cleanedData.sku || ''),
        isActive: Boolean(cleanedData.isActive)
      };
      
      // Add companyId if present
      if (cleanedData.companyId) {
        apiPayload.companyId = Number(cleanedData.companyId);
      }
      
      // Add creator information
      if (cleanedData.createdBy) {
        apiPayload.createdBy = String(cleanedData.createdBy);
      }
      
      console.log('Sending cleaned product data to API:', JSON.stringify(apiPayload, null, 2));
      const response = await api.post('/Product', apiPayload);
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error creating product', error);
      
      // Enhanced error reporting
      let errorMessage = 'Failed to create product';
      if (error.response) {
        // We have a response from the server with an error
        if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.status === 400) {
          errorMessage = 'Invalid product data. Please check all fields.';
        } else if (error.response.status === 500) {
          errorMessage = 'Server error while creating product. Please try again later.';
        }
        
        console.error('API Error Details:', {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        });
      } else if (error.request) {
        // Request was made but no response received
        errorMessage = 'No response from server. Please check your connection.';
      }
      
      return {
        success: false,
        message: errorMessage,
        error: error.response?.data
      };
    }
  },

  update: async (id, productData) => {
    try {
      console.log(`Updating product ID: ${id}`, productData);
      
      // Validate required fields
      if (!productData.name) {
        return {
          success: false,
          message: 'Product name is required'
        };
      }
      
      // Validate categoryId - ensure it's not empty and is a valid number
      if (productData.categoryId === undefined || productData.categoryId === null || productData.categoryId === '') {
        return {
          success: false,
          message: 'Category is required'
        };
      }
      
      // Ensure categoryId is a valid number
      const categoryId = Number(productData.categoryId);
      if (isNaN(categoryId) || categoryId <= 0) {
        return {
          success: false,
          message: 'Invalid category ID'
        };
      }
      
      // Make sure id is a number
      const productId = typeof id === 'string' ? parseInt(id, 10) : id;
      
      // Remove any properties that might cause issues with the API
      const cleanedData = { ...productData };
      delete cleanedData.id; // Remove ID from body as it's in the URL
      
      // Similar to web implementation, ensure we have clean numeric data
      cleanedData.unitPrice = Number(cleanedData.unitPrice);
      cleanedData.stockQuantity = Number(cleanedData.stockQuantity);
      cleanedData.categoryId = Number(cleanedData.categoryId);
      
      if (cleanedData.companyId) {
        cleanedData.companyId = Number(cleanedData.companyId);
      }
      
      if (cleanedData.status !== undefined) {
        cleanedData.status = Number(cleanedData.status);
      }
      
      // Create a fresh object with explicit typing to match API expectations exactly
      // This is a more drastic approach that ensures the data format matches exactly what the backend expects
      const apiPayload = {
        name: String(cleanedData.name || ''),
        description: String(cleanedData.description || ''),
        code: String(cleanedData.code || ''),
        unitPrice: Number(cleanedData.unitPrice || 0),
        unit: String(cleanedData.unit || ''),
        weight: Number(cleanedData.weight || 0),
        quantity: Number(cleanedData.quantity || 0),
        stockQuantity: Number(cleanedData.stockQuantity || 0),
        category: String(cleanedData.categoryId || ''),
        brand: String(cleanedData.brand || ''),
        model: String(cleanedData.model || ''),
        currency: String(cleanedData.currency || 'USD'),
        status: Number(cleanedData.status || 0),
        sku: String(cleanedData.sku || ''),
        isActive: Boolean(cleanedData.isActive)
      };
      
      // Add companyId if present
      if (cleanedData.companyId) {
        apiPayload.companyId = Number(cleanedData.companyId);
      }
      
      // Add updater information
      if (cleanedData.updatedBy) {
        apiPayload.updatedBy = String(cleanedData.updatedBy);
      }
      
      console.log(`Sending cleaned product data to API for ID ${productId}:`, JSON.stringify(apiPayload, null, 2));
      const response = await api.put(`/Product/${productId}`, apiPayload);
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error(`Error updating product ID: ${id}`, error);
      
      // Enhanced error reporting
      let errorMessage = 'Failed to update product';
      if (error.response) {
        // We have a response from the server with an error
        if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.status === 400) {
          errorMessage = 'Invalid product data. Please check all fields.';
        } else if (error.response.status === 404) {
          errorMessage = 'Product not found.';
        } else if (error.response.status === 500) {
          errorMessage = 'Server error while updating product. Please try again later.';
        }
        
        console.error('API Error Details:', {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        });
      } else if (error.request) {
        // Request was made but no response received
        errorMessage = 'No response from server. Please check your connection.';
      }
      
      return {
        success: false,
        message: errorMessage,
        error: error.response?.data
      };
    }
  },

  delete: async (id) => {
    try {
      console.log(`Deleting product ID: ${id}`);
      const response = await api.delete(`/Product/${id}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error(`Error deleting product ID: ${id}`, error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to delete product',
        error: error.response?.data
      };
    }
  },

  updateStatus: async (id, status) => {
    try {
      console.log(`Updating product ${id} status to ${status}`);
      const response = await api.put(`/Product/${id}/status`, { status });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error(`Error updating product status ${id}`, error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update product status',
        error: error.response?.data
      };
    }
  },

  updateStock: async (id, quantity) => {
    try {
      console.log(`Updating product ${id} stock to ${quantity}`);
      const response = await api.put(`/Product/${id}/stock`, { quantity });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error(`Error updating product stock ${id}`, error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update product stock',
        error: error.response?.data
      };
    }
  },
  
  getProductsByCategory: async (categoryId) => {
    try {
      console.log(`Getting products for category ${categoryId}`);
      const response = await api.get(`/Product/category/${categoryId}`);
      
      // Handle ReferenceHandler.Preserve format with $values
      let productsData = response.data;
      if (response.data && typeof response.data === 'object' && response.data.$values) {
        console.log(`Extracted ${response.data.$values.length} products from $values property`);
        productsData = response.data.$values;
      }
      
      return {
        success: true,
        data: productsData
      };
    } catch (error) {
      console.error(`Error getting products for category ${categoryId}`, error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get products by category',
        error: error.response?.data
      };
    }
  },
  
  searchProducts: async (query) => {
    try {
      console.log(`Searching products with query "${query}"`);
      const response = await api.get(`/Product/search?query=${encodeURIComponent(query)}`);
      
      // Handle ReferenceHandler.Preserve format with $values
      let productsData = response.data;
      if (response.data && typeof response.data === 'object' && response.data.$values) {
        console.log(`Extracted ${response.data.$values.length} products from $values property`);
        productsData = response.data.$values;
      }
      
      return {
        success: true,
        data: productsData
      };
    } catch (error) {
      console.error(`Error searching products with query "${query}"`, error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to search products',
        error: error.response?.data
      };
    }
  }
};

// ============= CATEGORY SERVICE =============
export const categoryService = {
  getAll: async () => {
    try {
      console.log('Requesting all categories');
      const response = await api.get('/Category');
      
      // Handle ReferenceHandler.Preserve format with $values
      let categoriesData = response.data;
      if (response.data && typeof response.data === 'object' && response.data.$values) {
        console.log(`Extracted ${response.data.$values.length} categories from $values property`);
        categoriesData = response.data.$values;
      }
      
      return {
        success: true,
        data: categoriesData
      };
    } catch (error) {
      console.error('Error getting categories:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get categories',
        error: error.response?.data
      };
    }
  },

  getById: async (id) => {
    try {
      console.log(`Requesting category with ID: ${id}`);
      const response = await api.get(`/Category/${id}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error(`Error getting category ${id}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get category',
        error: error.response?.data
      };
    }
  },

  create: async (categoryData) => {
    try {
      console.log('Creating new category', categoryData);
      const response = await api.post('/Category', categoryData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error creating category:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to create category',
        error: error.response?.data
      };
    }
  },

  update: async (id, categoryData) => {
    try {
      console.log(`Updating category ${id}:`, categoryData);
      const response = await api.put(`/Category/${id}`, categoryData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error(`Error updating category ${id}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update category',
        error: error.response?.data
      };
    }
  },

  delete: async (id) => {
    try {
      console.log(`Deleting category ${id}`);
      const response = await api.delete(`/Category/${id}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error(`Error deleting category ${id}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to delete category',
        error: error.response?.data
      };
    }
  }
};

// ============= CUSTOMER SERVICE =============
export const customerService = {
  getAll: async () => {
    try {
      console.log('Requesting all customers');
      const response = await api.get('/Customer');
      
      // Handle ReferenceHandler.Preserve format with $values
      let customersData = response.data;
      if (response.data && typeof response.data === 'object' && response.data.$values) {
        console.log(`Extracted ${response.data.$values.length} customers from $values property`);
        customersData = response.data.$values;
      }
      
      return {
        success: true,
        data: customersData
      };
    } catch (error) {
      console.error('Error getting customers:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get customers',
        error: error.response?.data
      };
    }
  },

  getById: async (id) => {
    try {
      console.log(`Requesting customer with ID: ${id}`);
      const response = await api.get(`/Customer/${id}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error(`Error getting customer ${id}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get customer',
        error: error.response?.data
      };
    }
  },
  
  // Method to get customer by ID - Alias for getById to match the function name used in CustomerDetailsScreen
  getCustomerById: async (id) => {
    try {
      console.log(`Requesting customer with ID: ${id}`);
      const response = await api.get(`/Customer/${id}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error(`Error getting customer ${id}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get customer details',
        error: error.response?.data
      };
    }
  },

  // Method to delete customer - Alias for delete method to match the function name used in CustomerDetailsScreen
  deleteCustomer: async (id) => {
    try {
      console.log(`Deleting customer with ID: ${id}`);
      const response = await api.delete(`/Customer/${id}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error(`Error deleting customer ${id}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to delete customer',
        error: error.response?.data
      };
    }
  },

  getByCompanyId: async (companyId) => {
    try {
      console.log(`Requesting customers for company ID: ${companyId}`);
      
      // Validate companyId
      if (!companyId) {
        throw new Error('Company ID is required');
      }
      
      const response = await api.get(`/Customer/company/${companyId}`);
      
      // Handle ReferenceHandler.Preserve format with $values
      let customersData = response.data;
      if (response.data && typeof response.data === 'object' && response.data.$values) {
        console.log(`Extracted ${response.data.$values.length} customers from $values property`);
        customersData = response.data.$values;
      }
      
      return {
        success: true,
        data: customersData
      };
    } catch (error) {
      console.error(`Error getting customers for company ${companyId}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get company customers',
        error: error.response?.data
      };
    }
  },

  create: async (customerData) => {
    try {
      console.log('Creating new customer', JSON.stringify(customerData, null, 2));
      
      // Ensure companyId is an integer and valid
      if (!customerData.companyId) {
        console.error('CompanyId is missing from customer data');
        return {
          success: false,
          message: 'Company ID is required',
          error: 'MISSING_COMPANY_ID'
        };
      }
      
      if (typeof customerData.companyId === 'string') {
        customerData.companyId = parseInt(customerData.companyId, 10);
      }
      
      // Verify that companyId is a valid positive integer
      if (isNaN(customerData.companyId) || customerData.companyId <= 0) {
        console.error('Invalid companyId value:', customerData.companyId);
        return {
          success: false,
          message: 'Invalid Company ID format',
          error: 'INVALID_COMPANY_ID'
        };
      }
      
      // Make sure status is provided and is a number
      if (customerData.status === undefined || customerData.status === null) {
        customerData.status = 0; // Set default status
      }
      
      // Sanitize the data - convert empty strings to null
      const sanitizedData = Object.keys(customerData).reduce((acc, key) => {
        const value = customerData[key];
        acc[key] = (value === '' || value === undefined) ? null : value;
        return acc;
      }, {});
      
      console.log('Sanitized customer data:', JSON.stringify(sanitizedData, null, 2));
      
      const response = await api.post('/Customer', sanitizedData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error creating customer:', error);
      
      // Detailed error logging
      if (error.response) {
        console.error('API Error Response:', {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        });
        
        // More specific error handling based on error type
        if (error.response.status === 500) {
          const errorData = error.response.data;
          // Check if it's a foreign key constraint error
          if (errorData && errorData.message && 
              (errorData.message.includes('FK_Customers_Companies_CompanyId') || 
               errorData.message.includes('foreign key constraint'))) {
            return {
              success: false,
              message: 'The company ID you provided does not exist in the system',
              error: 'INVALID_COMPANY_REFERENCE',
              status: error.response.status
            };
          }
        }
      } else if (error.request) {
        console.error('No response received:', error.request);
      } else {
        console.error('Error setting up request:', error.message);
      }
      
      // Prepare a more detailed error response
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to create customer',
        error: error.response?.data || error.message,
        status: error.response?.status
      };
    }
  },

  update: async (id, customerData) => {
    try {
      console.log(`Updating customer ${id}:`, JSON.stringify(customerData, null, 2));
      
      // Ensure id is valid
      if (!id) {
        console.error('Customer ID is missing for update');
        return {
          success: false,
          message: 'Customer ID is required for update',
          error: 'MISSING_CUSTOMER_ID'
        };
      }
      
      // Ensure companyId is an integer and valid
      if (!customerData.companyId) {
        console.error('CompanyId is missing from customer data');
        return {
          success: false,
          message: 'Company ID is required',
          error: 'MISSING_COMPANY_ID'
        };
      }
      
      if (typeof customerData.companyId === 'string') {
        customerData.companyId = parseInt(customerData.companyId, 10);
      }
      
      // Verify that companyId is a valid positive integer
      if (isNaN(customerData.companyId) || customerData.companyId <= 0) {
        console.error('Invalid companyId value:', customerData.companyId);
        return {
          success: false,
          message: 'Invalid Company ID format',
          error: 'INVALID_COMPANY_ID'
        };
      }
      
      // Ensure ID is an integer
      const customerId = typeof id === 'string' ? parseInt(id, 10) : id;
      
      if (isNaN(customerId) || customerId <= 0) {
        console.error('Invalid customer ID value:', id);
        return {
          success: false,
          message: 'Invalid Customer ID format',
          error: 'INVALID_CUSTOMER_ID'
        };
      }
      
      // Make sure status is provided and is a number
      if (customerData.status === undefined || customerData.status === null) {
        customerData.status = 0; // Set default status
      }
      
      // Sanitize the data - convert empty strings to null
      const sanitizedData = Object.keys(customerData).reduce((acc, key) => {
        const value = customerData[key];
        acc[key] = (value === '' || value === undefined) ? null : value;
        return acc;
      }, {});
      
      console.log('Sanitized customer data for update:', JSON.stringify(sanitizedData, null, 2));
      
      const response = await api.put(`/Customer/${customerId}`, sanitizedData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error(`Error updating customer ${id}:`, error);
      
      // Detailed error logging
      if (error.response) {
        console.error('API Error Response:', {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        });
        
        // More specific error handling based on error type
        if (error.response.status === 500) {
          const errorData = error.response.data;
          // Check if it's a foreign key constraint error
          if (errorData && errorData.message && 
              (errorData.message.includes('FK_Customers_Companies_CompanyId') || 
               errorData.message.includes('foreign key constraint'))) {
            return {
              success: false,
              message: 'The company ID you provided does not exist in the system',
              error: 'INVALID_COMPANY_REFERENCE',
              status: error.response.status
            };
          }
        } else if (error.response.status === 404) {
          return {
            success: false,
            message: 'Customer not found',
            error: 'CUSTOMER_NOT_FOUND',
            status: 404
          };
        }
      } else if (error.request) {
        console.error('No response received:', error.request);
      } else {
        console.error('Error setting up request:', error.message);
      }
      
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update customer',
        error: error.response?.data || error.message,
        status: error.response?.status
      };
    }
  },

  delete: async (id) => {
    try {
      console.log(`Deleting customer ${id}`);
      const response = await api.delete(`/Customer/${id}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error(`Error deleting customer ${id}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to delete customer',
        error: error.response?.data
      };
    }
  },

  updateStatus: async (id, status) => {
    try {
      console.log(`Updating customer status ${id} to ${status}`);
      const response = await api.put(`/Customer/${id}/status`, { status });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error(`Error updating customer status ${id}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update customer status',
        error: error.response?.data
      };
    }
  },

  getCustomerOrders: async (id) => {
    try {
      console.log(`Getting orders for customer ${id}`);
      const response = await api.get(`/Customer/${id}/orders`);
      
      // Handle ReferenceHandler.Preserve format with $values
      let ordersData = response.data;
      if (response.data && typeof response.data === 'object' && response.data.$values) {
        console.log(`Extracted ${response.data.$values.length} orders from $values property`);
        ordersData = response.data.$values;
      }
      
      return {
        success: true,
        data: ordersData
      };
    } catch (error) {
      console.error(`Error getting orders for customer ${id}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get customer orders',
        error: error.response?.data
      };
    }
  },

  getCustomerInvoices: async (id) => {
    try {
      console.log(`Getting invoices for customer ${id}`);
      const response = await api.get(`/Customer/${id}/invoices`);
      
      // Handle ReferenceHandler.Preserve format with $values
      let invoicesData = response.data;
      if (response.data && typeof response.data === 'object' && response.data.$values) {
        console.log(`Extracted ${response.data.$values.length} invoices from $values property`);
        invoicesData = response.data.$values;
      }
      
      return {
        success: true,
        data: invoicesData
      };
    } catch (error) {
      console.error(`Error getting invoices for customer ${id}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get customer invoices',
        error: error.response?.data
      };
    }
  }
};

// ============= ORDER SERVICE =============
export const orderService = {
  // Define order statuses for conversion
  statuses: [
    { value: 0, label: 'Draft', stringValue: 'Draft' },
    { value: 1, label: 'Pending', stringValue: 'Pending' },
    { value: 2, label: 'Confirmed', stringValue: 'Confirmed' },
    { value: 3, label: 'Shipped', stringValue: 'Shipped' },
    { value: 4, label: 'Delivered', stringValue: 'Delivered' },
    { value: 5, label: 'Cancelled', stringValue: 'Cancelled' },
    { value: 6, label: 'Completed', stringValue: 'Completed' }
  ],

  getAll: async () => {
    try {
      console.log('Requesting all orders');
      
      const response = await api.get('/Order');
      console.log(`Response status: ${response.status}`);
      console.log('Response data structure:', typeof response.data);
      
      // Check for different response formats
      let ordersData = [];
      
      if (Array.isArray(response.data)) {
        console.log(`Received ${response.data.length} orders from API`);
        ordersData = response.data;
      } else if (response.data && typeof response.data === 'object') {
        // Handle ReferenceHandler.Preserve format with $values
        if (response.data.$values && Array.isArray(response.data.$values)) {
          console.log(`Extracted ${response.data.$values.length} orders from $values property`);
          ordersData = response.data.$values;
        }
        
        // Handle case where data might be nested in a property
        else if (response.data.data && Array.isArray(response.data.data)) {
          console.log(`Extracted ${response.data.data.length} orders from data property`);
          ordersData = response.data.data;
        } else {
          // Try to extract all possible array properties
          const possibleArrayProperties = Object.entries(response.data)
            .filter(([_, value]) => Array.isArray(value))
            .map(([key, value]) => ({ key, length: value.length }));
          
          if (possibleArrayProperties.length > 0) {
            // Use the array property with the most items
            const bestProperty = possibleArrayProperties.sort((a, b) => b.length - a.length)[0];
            console.log(`Found array property '${bestProperty.key}' with ${bestProperty.length} items`);
            ordersData = response.data[bestProperty.key];
          }
        }
      }
      
      // Process each order to ensure it has the expected structure
      const processedOrders = ordersData.map(order => {
        // Skip null objects
        if (!order) {
          return {
            id: `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            orderNumber: `ORD-GEN-${Date.now().toString().slice(-8)}`,
            customerId: null,
            customerName: 'Unknown Customer',
            status: 0, // Draft
            orderDate: new Date().toISOString(),
            hasTemporaryId: true,
            isPlaceholder: true,
            items: []
          };
        }
        
        // Check if this is a reference to another order in the same result set
        if (order.$ref) {
          // Try to find the original order this references
          const refId = order.$ref;
          const originalOrder = ordersData.find(o => o.$id === refId);
          
          if (originalOrder) {
            // This is a duplicate reference to an order we already have
            console.log(`Found reference to existing order: ${refId}`);
            return {
              id: `ref-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
              orderNumber: originalOrder.orderNumber || `ORD-REF-${Date.now().toString().slice(-8)}`,
              customerId: originalOrder.customerId,
              customerName: originalOrder.customerName || originalOrder.customer?.name || 'Referenced Customer',
              status: originalOrder.status || 0,
              orderDate: originalOrder.orderDate || new Date().toISOString(),
              totalAmount: originalOrder.totalAmount || originalOrder.total || 0,
              currency: originalOrder.currency || 'USD',
              isReference: true,
              originalOrderId: originalOrder.id
            };
          }
        }
        
        // Ensure items array exists and is properly formatted
        const items = Array.isArray(order.items) ? order.items : 
                     (order.items && order.items.$values ? order.items.$values : []);
        
        // Process each item to ensure it has the expected properties
        const processedItems = items.map(item => ({
          id: item.id,
          productId: item.productId,
          productName: item.productName || item.name || 'Unknown Product',
          quantity: item.quantity || 0,
          unitPrice: item.unitPrice || item.price || 0,
          total: item.total || (item.quantity * item.unitPrice) || 0
        }));
        
        // Calculate order total if not present
        const subtotal = processedItems.reduce((sum, item) => sum + item.total, 0);
        
        // Format the customer name
        const customerName = order.customerName || 
                            (order.customer ? order.customer.name : 'Unknown Customer');
        
        // Format the order number
        const orderNumber = order.orderNumber || `Order #${order.id}`;
        
        return {
          ...order,
          items: processedItems,
          subtotal: order.subtotal || subtotal,
          total: order.total || subtotal + (order.shippingCost || 0) + (order.tax || 0) - (order.discount || 0),
          customerName,
          orderNumber
        };
      });
      
      console.log(`Retrieved and processed ${processedOrders.length} orders`);
      return {
        success: true,
        data: processedOrders
      };
    } catch (error) {
      console.error('Error getting orders:', error);
      
      // Add more detailed logging for the error
      if (error.response) {
        console.error('Error response status:', error.response.status);
        console.error('Error response data:', error.response.data);
      }
      
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to fetch orders',
        error: error.response?.data || error
      };
    }
  },
  
  getById: async (id) => {
    try {
      console.log(`Requesting order details for ID: ${id}`);
      
      const response = await api.get(`/Order/${id}`);
      console.log('Order details response status:', response.status);
      
      // Handle direct object and Preserve reference object
      const orderData = (response.data && response.data.$ref) ? 
        response.data : response.data;
      
      if (!orderData) {
        throw new Error('Order not found');
      }
      
      // Ensure items array exists and is properly formatted
      const items = Array.isArray(orderData.items) ? orderData.items : 
                   (orderData.items && orderData.items.$values ? orderData.items.$values : []);
      
      // Process each item to ensure it has the expected properties
      const processedItems = items.map(item => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName || item.name || 'Unknown Product',
        quantity: item.quantity || 0,
        unitPrice: item.unitPrice || item.price || 0,
        total: item.total || (item.quantity * item.unitPrice) || 0
      }));
      
      // Calculate order total if not present
      const subtotal = processedItems.reduce((sum, item) => sum + item.total, 0);
      
      // Format the customer name
      const customerName = orderData.customerName || 
                          (orderData.customer ? orderData.customer.name : 'Unknown Customer');
      
      // Format the order number
      const orderNumber = orderData.orderNumber || `Order #${orderData.id}`;
      
      const processedOrder = {
        ...orderData,
        items: processedItems,
        subtotal: orderData.subtotal || subtotal,
        total: orderData.total || subtotal + (orderData.shippingCost || 0) + (orderData.tax || 0) - (orderData.discount || 0),
        customerName,
        orderNumber
      };
      
      console.log('Processed order details:', processedOrder);
      return {
        success: true,
        data: processedOrder
      };
    } catch (error) {
      console.error(`Error getting order ${id}:`, error);
      
      // Add more detailed logging for the error
      if (error.response) {
        console.error('Error response status:', error.response.status);
        console.error('Error response data:', error.response.data);
      }
      
      return {
        success: false,
        message: error.response?.data?.message || error.message || `Failed to fetch order ${id}`,
        error: error.response?.data || error
      };
    }
  },
  
  getByCompanyId: async (companyId) => {
    try {
      console.log(`Requesting orders for company ID: ${companyId}`);
      
      // Validate and normalize companyId
      if (!companyId || companyId === 'null' || companyId === 'undefined') {
        console.error('Invalid company ID provided:', companyId);
        return {
          success: false,
          message: 'Invalid company ID',
          data: []
        };
      }
      
      // Ensure companyId is a valid number
      const companyIdInt = parseInt(companyId, 10);
      if (isNaN(companyIdInt) || companyIdInt <= 0) {
        console.error('Company ID is not a valid positive number:', companyId);
        return {
          success: false,
          message: 'Company ID must be a valid positive number',
          data: []
        };
      }
      
      console.log(`Making request to /Order/company/${companyIdInt}`);
      const response = await api.get(`/Order/company/${companyIdInt}`);
      
      console.log(`Response status: ${response.status}`);
      
      // Check for different response formats and process data
      let ordersData = [];
      
      if (Array.isArray(response.data)) {
        ordersData = response.data;
      } else if (response.data && typeof response.data === 'object') {
        // Handle different response formats
        if (response.data.$values && Array.isArray(response.data.$values)) {
          ordersData = response.data.$values;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          ordersData = response.data.data;
        } else {
          // Extract all possible array properties
          const possibleArrayProps = Object.entries(response.data)
            .filter(([_, val]) => Array.isArray(val))
            .map(([key, val]) => ({ key, length: val.length }));
          
          if (possibleArrayProps.length > 0) {
            const bestProp = possibleArrayProps.sort((a, b) => b.length - a.length)[0];
            ordersData = response.data[bestProp.key];
          }
        }
      }
      
      // Process each order to ensure it has the expected structure
      const processedOrders = ordersData.map(order => {
        // Skip null objects
        if (!order) {
          return {
            id: `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            orderNumber: `ORD-GEN-${Date.now().toString().slice(-8)}`,
            customerId: null,
            customerName: 'Unknown Customer',
            status: 0, // Draft
            orderDate: new Date().toISOString(),
            hasTemporaryId: true,
            isPlaceholder: true,
            items: []
          };
        }
        
        // Ensure items array exists and is properly formatted
        const items = Array.isArray(order.items) ? order.items : 
                     (order.items && order.items.$values ? order.items.$values : []);
        
        // Process each item to ensure it has the expected properties
        const processedItems = items.map(item => ({
          id: item.id,
          productId: item.productId,
          productName: item.productName || item.name || 'Unknown Product',
          quantity: item.quantity || 0,
          unitPrice: item.unitPrice || item.price || 0,
          total: item.total || (item.quantity * item.unitPrice) || 0
        }));
        
        // Calculate order total if not present
        const subtotal = processedItems.reduce((sum, item) => sum + item.total, 0);
        
        // Format the customer name
        const customerName = order.customerName || 
                            (order.customer ? order.customer.name : 'Unknown Customer');
        
        // Format the order number
        const orderNumber = order.orderNumber || `Order #${order.id}`;
        
        return {
          ...order,
          items: processedItems,
          subtotal: order.subtotal || subtotal,
          total: order.total || subtotal + (order.shippingCost || 0) + (order.tax || 0) - (order.discount || 0),
          customerName,
          orderNumber
        };
      });
      
      console.log(`Retrieved and processed ${processedOrders.length} orders for company ${companyIdInt}`);
      return {
        success: true,
        data: processedOrders
      };
    } catch (error) {
      console.error(`Error getting orders for company ${companyId}:`, error);
      
      // Add more detailed logging for the error
      if (error.response) {
        console.error('Error response status:', error.response.status);
        console.error('Error response data:', error.response.data);
      }
      
      return {
        success: false,
        message: error.response?.data?.message || error.message || `Failed to fetch orders for company ${companyId}`,
        error: error.response?.data || error
      };
    }
  },
  
  create: async (orderData) => {
    try {
      const response = await api.post('/Order', orderData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error creating order:', error);
      return {
        success: false,
        message: error.message || 'Failed to create order',
        error
      };
    }
  },
  
  update: async (id, orderData) => {
    try {
      const response = await api.put(`/Order/${id}`, orderData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error(`Error updating order ${id}:`, error);
      return {
        success: false,
        message: error.message || `Failed to update order ${id}`,
        error
      };
    }
  },
  
  delete: async (id) => {
    try {
      const response = await api.delete(`/Order/${id}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error(`Error deleting order ${id}:`, error);
      return {
        success: false,
        message: error.message || `Failed to delete order ${id}`,
        error
      };
    }
  },
  
  updateStatus: async (id, status) => {
    try {
      // Convert status to numeric value if it's a string
      const numericStatus = typeof status === 'string' && !isNaN(parseInt(status)) ? 
                            parseInt(status) : 
                            status;
                            
      const response = await api.put(`/Order/${id}/status`, { statusDto: { Status: numericStatus } });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error(`Error updating order status ${id}:`, error);
      return {
        success: false,
        message: error.message || `Failed to update order status ${id}`,
        error
      };
    }
  }
};

// ============= INVOICE SERVICE =============
export const invoiceService = {
  getAll: async () => {
    try {
      const response = await api.get('/Invoice');
      return handleApiResponse(response);
    } catch (error) {
      logger.error('invoiceService', 'Error getting invoices:', error);
      throw error;
    }
  },

  getById: async (id) => {
    try {
      const response = await api.get(`/Invoice/${id}`);
      return response.data;
    } catch (error) {
      logger.error('invoiceService', `Error getting invoice ${id}:`, error);
      throw error;
    }
  },

  getByCompanyId: async (companyId) => {
    try {
      const response = await api.get(`/Invoice/company/${companyId}`);
      return handleApiResponse(response);
    } catch (error) {
      logger.error('invoiceService', `Error getting invoices for company ${companyId}:`, error);
      throw error;
    }
  },

  create: async (invoiceData) => {
    try {
      const response = await api.post('/Invoice', invoiceData);
      return response.data;
    } catch (error) {
      logger.error('invoiceService', 'Error creating invoice:', error);
      throw error;
    }
  },

  createFromOrder: async (orderId) => {
    try {
      const response = await api.post(`/Invoice/from-order/${orderId}`);
      return response.data;
    } catch (error) {
      logger.error('invoiceService', `Error creating invoice from order ${orderId}:`, error);
      throw error;
    }
  },

  update: async (id, invoiceData) => {
    try {
      const response = await api.put(`/Invoice/${id}`, invoiceData);
      return response.data;
    } catch (error) {
      logger.error('invoiceService', `Error updating invoice ${id}:`, error);
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const response = await api.delete(`/Invoice/${id}`);
      return response.data;
    } catch (error) {
      logger.error('invoiceService', `Error deleting invoice ${id}:`, error);
      throw error;
    }
  },

  updateStatus: async (id, status) => {
    try {
      const response = await api.put(`/Invoice/${id}/status`, { status });
      return response.data;
    } catch (error) {
      logger.error('invoiceService', `Error updating invoice status ${id}:`, error);
      throw error;
    }
  },

  getInvoicePdf: async (id) => {
    try {
      console.log(`Getting PDF for invoice ${id}`);
      
      if (!id) {
        console.error('Invoice ID is required');
        return {
          success: false,
          message: 'Invoice ID is required'
        };
      }
      
      // Create a specific request with responseType blob or arraybuffer
      const response = await api.get(`/Invoice/${id}/pdf`, {
        responseType: 'arraybuffer'
      });
      
      // Convert ArrayBuffer to base64
      const base64 = arrayBufferToBase64(response.data);
      
      return {
        success: true,
        blob: base64,
        message: 'PDF fetched successfully'
      };
    } catch (error) {
      console.error(`Error getting PDF for invoice ${id}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get invoice PDF',
        error: error.response?.data
      };
    }
  }
};

// ============= DASHBOARD SERVICE =============
export const dashboardService = {
  getSummary: async () => {
    try {
      const response = await api.get('/Dashboard/summary');
      return response.data;
    } catch (error) {
      logger.error('dashboardService', 'Error getting dashboard summary:', error);
      throw error;
    }
  },

  getDashboardStats: async () => {
    try {
      const response = await api.get('/Dashboard/stats');
      return response.data;
    } catch (error) {
      logger.error('dashboardService', 'Error getting dashboard statistics:', error);
      throw error;
    }
  },

  getRecentOrders: async (limit = 5) => {
    try {
      const response = await api.get(`/Dashboard/recent-orders?limit=${limit}`);
      return handleApiResponse(response);
    } catch (error) {
      logger.error('dashboardService', 'Error getting recent orders:', error);
      throw error;
    }
  },

  getRecentCustomers: async (limit = 5) => {
    try {
      const response = await api.get(`/Dashboard/recent-customers?limit=${limit}`);
      return handleApiResponse(response);
    } catch (error) {
      logger.error('dashboardService', 'Error getting recent customers:', error);
      throw error;
    }
  },
  
  getTopProducts: async (limit = 5) => {
    try {
      const response = await api.get(`/Dashboard/top-products?limit=${limit}`);
      return handleApiResponse(response);
    } catch (error) {
      logger.error('dashboardService', 'Error getting top products:', error);
      throw error;
    }
  }
};

// ============= DEV PANEL SERVICE =============
export const devPanelService = {
  // Users
  getUsers: async () => {
    try {
      logger.debug('devPanelService', 'Getting all users');
      const response = await api.get('/User');
      return response.data;
    } catch (error) {
      logger.error('devPanelService', 'Failed to get users', error);
      throw error;
    }
  },
  
  addUser: async (userData) => {
    try {
      logger.debug('devPanelService', 'Adding user');
      const response = await api.post('/User', userData);
      return response.data;
    } catch (error) {
      logger.error('devPanelService', 'Failed to add user', error);
      throw error;
    }
  },
  
  updateUser: async (userId, userData) => {
    try {
      logger.debug('devPanelService', `Updating user ${userId}`);
      const response = await api.put(`/User/${userId}`, userData);
      return response.data;
    } catch (error) {
      logger.error('devPanelService', `Failed to update user ${userId}`, error);
      throw error;
    }
  },
  
  deleteUser: async (userId) => {
    try {
      logger.debug('devPanelService', `Deleting user ${userId}`);
      const response = await api.delete(`/User/${userId}`);
      return response.data;
    } catch (error) {
      logger.error('devPanelService', `Failed to delete user ${userId}`, error);
      throw error;
    }
  },
  
  // Companies
  getCompanies: async () => {
    try {
      logger.debug('devPanelService', 'Getting all companies');
      const response = await api.get('/Company');
      return response.data;
    } catch (error) {
      logger.error('devPanelService', 'Failed to get companies', error);
      throw error;
    }
  },
  
  addCompany: async (companyData) => {
    try {
      logger.debug('devPanelService', 'Adding company');
      const response = await api.post('/Company', companyData);
      return response.data;
    } catch (error) {
      logger.error('devPanelService', 'Failed to add company', error);
      throw error;
    }
  },
  
  updateCompany: async (companyId, companyData) => {
    try {
      logger.debug('devPanelService', `Updating company ${companyId}`);
      const response = await api.put(`/Company/${companyId}`, companyData);
      return response.data;
    } catch (error) {
      logger.error('devPanelService', `Failed to update company ${companyId}`, error);
      throw error;
    }
  },
  
  deleteCompany: async (companyId) => {
    try {
      logger.debug('devPanelService', `Deleting company ${companyId}`);
      const response = await api.delete(`/Company/${companyId}`);
      return response.data;
    } catch (error) {
      logger.error('devPanelService', `Failed to delete company ${companyId}`, error);
      throw error;
    }
  },
  
  // SMTP Settings
  getSmtpSettings: async () => {
    try {
      logger.debug('devPanelService', 'Getting SMTP settings');
      const response = await api.get('/Configuration/smtp');
      return response.data;
    } catch (error) {
      logger.error('devPanelService', 'Failed to get SMTP settings', error);
      throw error;
    }
  },
  
  updateSmtpSettings: async (smtpData) => {
    try {
      logger.debug('devPanelService', 'Updating SMTP settings');
      const response = await api.post('/Configuration/smtp', smtpData);
      return response.data;
    } catch (error) {
      logger.error('devPanelService', 'Failed to update SMTP settings', error);
      throw error;
    }
  },
  
  sendTestEmail: async (recipient) => {
    try {
      logger.debug('devPanelService', `Sending test email to ${recipient}`);
      const response = await api.post('/Configuration/test-email', { recipient });
      return response.data;
    } catch (error) {
      logger.error('devPanelService', 'Failed to send test email', error);
      throw error;
    }
  },
  
  // Database Backups
  getBackups: async () => {
    try {
      logger.debug('devPanelService', 'Getting database backups');
      const response = await api.get('/Database/backup/list');
      return response.data;
    } catch (error) {
      logger.error('devPanelService', 'Failed to get database backups', error);
      throw error;
    }
  },
  
  createBackup: async () => {
    try {
      logger.debug('devPanelService', 'Creating database backup');
      const response = await api.post('/Database/backup');
      return response.data;
    } catch (error) {
      logger.error('devPanelService', 'Failed to create database backup', error);
      throw error;
    }
  },
  
  downloadBackup: async (fileName) => {
    try {
      logger.debug('devPanelService', `Downloading backup: ${fileName}`);
      const response = await api.get(`/Database/backup/download/${fileName}`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      logger.error('devPanelService', `Failed to download backup: ${fileName}`, error);
      throw error;
    }
  },
  
  restoreDatabase: async (formData) => {
    try {
      logger.debug('devPanelService', 'Restoring database from backup');
      const response = await api.post('/Database/restore', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      logger.error('devPanelService', 'Failed to restore database', error);
      throw error;
    }
  },
  
  resetDatabase: async () => {
    try {
      logger.debug('devPanelService', 'Resetting database');
      const response = await api.post('/Database/reset');
      return response.data;
    } catch (error) {
      logger.error('devPanelService', 'Failed to reset database', error);
      throw error;
    }
  },
  
  // Backward compatibility method - will be removed in future versions
  restoreBackup: async (fileName) => {
    try {
      logger.debug('devPanelService', 'Restoring backup (deprecated method)');
      logger.warn('devPanelService', 'restoreBackup is deprecated, use restoreDatabase instead');
      
      // Create form data to match the expected format
      const formData = new FormData();
      formData.append('backupFile', fileName);
      
      // Delegate to the new implementation by directly calling the API
      const response = await api.post('/Database/restore', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      logger.error('devPanelService', `Failed to restore backup: ${fileName}`, error);
      throw error;
    }
  }
};

// ============= MESSAGE SERVICE =============
export const messageService = {
  // Send invoice via email with PDF attachment (matches web implementation)
  sendInvoiceEmail: async (invoiceId, to, subject, body) => {
    try {
      console.log(`Sending invoice ${invoiceId} via email to ${to}`);
      
      // Get company ID from storage
      const companyId = await AsyncStorage.getItem(STORAGE_KEYS.COMPANY_ID);
      
      // Create the email data matching the web implementation
      const emailData = {
        invoiceId: parseInt(invoiceId),
        to: to,
        subject: subject || 'Your Invoice',
        body: body || 'Please find attached invoice.',
        includeAttachment: true, // Make sure to include the PDF attachment
        companyId: parseInt(companyId)
      };
      
      console.log('Sending invoice email with attachment:', emailData);
      const response = await api.post('/email/send-invoice', emailData);
      
      return {
        success: true,
        data: response.data,
        message: 'Invoice sent via email successfully'
      };
    } catch (error) {
      console.error(`Error sending invoice ${invoiceId} email:`, error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to send invoice email',
        error: error.response?.data
      };
    }
  },
  
  // Direct email sending function
  sendDirectEmail: async (to, subject, body, customerId = null) => {
    try {
      // Get company ID from storage
      const companyId = await AsyncStorage.getItem(STORAGE_KEYS.COMPANY_ID);
      
      const emailData = {
        to,
        subject,
        body,
        companyId: parseInt(companyId),
        customerId: customerId ? parseInt(customerId) : null
      };
      
      console.log('Sending direct email:', emailData);
      const response = await api.post('/email/send', emailData);
      
      return {
        success: true,
        message: 'Email sent successfully',
        data: response.data
      };
    } catch (error) {
      console.error('Error sending direct email:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to send email',
        error: error.response?.data
      };
    }
  }
};