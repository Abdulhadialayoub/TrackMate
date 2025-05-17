import apiClient from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define order status mappings to match backend enum
const ORDER_STATUS_DEFINITIONS = {
  0: 'Draft',
  1: 'Pending',
  2: 'Confirmed', 
  3: 'Shipped',
  4: 'Delivered',
  5: 'Cancelled',
  6: 'Completed'
};

export const aiService = {
  /**
   * Analyze a single order using AI
   * @param {Object} order - The order to analyze
   * @returns {Promise<Object>} - Result containing the AI analysis
   */
  async analyzeOrder(order) {
    try {
      // Add status definitions to the request
      const requestData = {
        ...order,
        statusDefinitions: ORDER_STATUS_DEFINITIONS,
        statusName: ORDER_STATUS_DEFINITIONS[order.status]
      };
      
      const response = await apiClient.post('/ai/analyze-order', requestData);
      
      console.log('AI response:', response.data);
      
      // Handle different response structures
      // If the response already has a success property, use it directly
      if (response.data && typeof response.data.success !== 'undefined') {
        return response.data;
      } 
      // Otherwise, wrap it in our standard response structure
      else {
        return {
          success: true,
          data: response.data
        };
      }
    } catch (error) {
      console.error('Error in analyzeOrder:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Error analyzing order'
      };
    }
  },

  /**
   * Analyze multiple orders using AI to look for patterns and insights
   * @param {Array} orders - Array of order objects to analyze
   * @returns {Promise<Object>} - Result containing the AI analysis
   */
  async analyzeOrders(orders) {
    try {
      // Add status definitions to the request
      const requestData = {
        orders: orders.map(order => ({
          ...order,
          statusName: ORDER_STATUS_DEFINITIONS[order.status]
        })),
        statusDefinitions: ORDER_STATUS_DEFINITIONS
      };
      
      const response = await apiClient.post('/ai/analyze-orders', requestData);
      
      console.log('AI bulk response:', response.data);
      
      // Handle different response structures
      // If the response already has a success property, use it directly
      if (response.data && typeof response.data.success !== 'undefined') {
        return response.data;
      } 
      // Otherwise, wrap it in our standard response structure
      else {
        return {
          success: true,
          data: response.data
        };
      }
    } catch (error) {
      console.error('Error in analyzeOrders:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Error analyzing orders'
      };
    }
  }
}; 