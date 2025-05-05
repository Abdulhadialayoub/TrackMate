import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

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
  URL: 'https://wren-integral-lionfish.ngrok-free.app/api',
  
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

// Request interceptor - adds auth token and logs requests
api.interceptors.request.use(
  async (config) => {
    try {
      // Add token if available
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      // Log request details
      logger.debug('API', `Request: ${config.method.toUpperCase()} ${config.url}`, {
        headers: config.headers,
        data: config.data,
        params: config.params
      });
      
      return config;
    } catch (error) {
      logger.error('API', 'Error in request interceptor', error);
      return Promise.reject(error);
    }
  },
  (error) => {
    logger.error('API', 'Request error in interceptor', error);
    return Promise.reject(error);
  }
);

// Response interceptor - handles auth errors and logs responses
api.interceptors.response.use(
  (response) => {
    // Log successful response (with truncated data to avoid excessive logging)
    logger.debug('API', `Response: ${response.status} ${response.config.url}`, {
      status: response.status,
      statusText: response.statusText,
      // Only log first 100 chars of response data if it's large
      data: typeof response.data === 'string' && response.data.length > 100 
        ? response.data.substring(0, 100) + '...' 
        : response.data
    });
    
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Log error details
    if (error.response) {
      // Server responded with error status
      logger.error('API', `Error Response: ${error.response.status} ${originalRequest?.url}`, {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: originalRequest?.headers
      });
      
      // Handle 401 Unauthorized errors
      if (error.response.status === 401 && !originalRequest._retry) {
        logger.warn('API', 'Authentication error - token expired or invalid');
        
        originalRequest._retry = true;
        
        try {
          // Clear auth tokens
          await AsyncStorage.removeItem('token');
          await AsyncStorage.removeItem('user');
          
          // Log user logout
          logger.info('API', 'User logged out due to auth error');
        } catch (err) {
          logger.error('API', 'Error during auth error handling', err);
        }
      }
    } else if (error.request) {
      // Request was made but no response received
      logger.error('API', 'No response received', {
        request: {
          url: originalRequest?.url,
          method: originalRequest?.method,
        },
        error: error.message
      });
    } else {
      // Error in setting up the request
      logger.error('API', 'Error setting up request', error.message);
    }
    
    return Promise.reject(error);
  }
);

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
      const response = await api.post('/Product', productData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error creating product', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to create product',
        error: error.response?.data
      };
    }
  },

  update: async (id, productData) => {
    try {
      console.log(`Updating product ID: ${id}`, productData);
      const response = await api.put(`/Product/${id}`, productData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error(`Error updating product ID: ${id}`, error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update product',
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
      const response = await api.put(`/Order/${id}/status`, { status });
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
  }
};

// Export the API instance
export default api;