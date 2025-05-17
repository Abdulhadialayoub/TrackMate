import api from './api';
import { ORDER_STATUS_NAMES } from '../utils/orderUtils';

// Define order status definitions to be sent with AI requests
const ORDER_STATUS_DEFINITIONS = ORDER_STATUS_NAMES;

export const aiService = {
  /**
   * Analyze an order and get AI-generated feedback or recommendations
   * @param {Object} orderData - The order data to analyze
   * @returns {Promise<Object>} The analysis results
   */
  analyzeOrder: async (orderData) => {
    try {
      // Add status definitions to the payload
      const requestData = {
        ...orderData,
        statusDefinitions: ORDER_STATUS_DEFINITIONS,
        statusName: ORDER_STATUS_DEFINITIONS[orderData.status]
      };
      
      console.log('Sending order data to AI for analysis:', requestData);
      
      const response = await api.post('/AI/analyze-order', requestData);
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error analyzing order:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to analyze order',
        error: error.response?.data
      };
    }
  },
  
  /**
   * Analyze multiple orders in bulk and get comprehensive business insights
   * @param {Array<Object>} ordersData - Array of orders to analyze
   * @returns {Promise<Object>} The bulk analysis results
   */
  analyzeOrders: async (ordersData) => {
    try {
      // Add status definitions to the payload
      const requestData = {
        orders: ordersData.map(order => ({
          ...order,
          statusName: ORDER_STATUS_DEFINITIONS[order.status]
        })),
        statusDefinitions: ORDER_STATUS_DEFINITIONS
      };
      
      console.log(`Sending ${ordersData.length} orders for bulk analysis`);
      
      const response = await api.post('/AI/analyze-orders', requestData);
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error analyzing orders in bulk:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to analyze orders',
        error: error.response?.data
      };
    }
  },
  
  /**
   * Analyze customer feedback
   * @param {String} feedback - Customer feedback text
   * @returns {Promise<Object>} Analysis of the feedback
   */
  analyzeCustomerFeedback: async (feedback) => {
    try {
      const response = await api.post('/AI/analyze-feedback', { feedback });
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error analyzing customer feedback:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to analyze feedback',
        error: error.response?.data
      };
    }
  }
};

export default aiService; 