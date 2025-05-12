import api from './api';

export const dashboardService = {
  getDashboardStats: async () => {
    try {
      const response = await api.get('/Dashboard/stats');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error getting dashboard statistics:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get dashboard statistics',
        error: error.response?.data
      };
    }
  },

  getRecentOrders: async (limit = 5) => {
    try {
      const response = await api.get(`/Dashboard/recent-orders?limit=${limit}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error getting recent orders:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get recent orders',
        error: error.response?.data
      };
    }
  },

  getTopProducts: async (limit = 5) => {
    try {
      const response = await api.get(`/Dashboard/top-products?limit=${limit}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error getting top products:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get top products',
        error: error.response?.data
      };
    }
  },

  updateCompanyRevenue: async (orderAmount) => {
    try {
      // Get the company ID from localStorage
      const companyId = localStorage.getItem('company_id');
      if (!companyId) {
        throw new Error('Company ID not found');
      }

      const response = await api.post('/Dashboard/update-revenue', {
        companyId: parseInt(companyId),
        amount: parseFloat(orderAmount) || 0
      });
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error updating company revenue:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update company revenue',
        error: error.response?.data
      };
    }
  }
};

export default dashboardService; 