import api from './api';

export const customerService = {
  getAll: async (retryCount = 1) => {
    try {
      const response = await api.get('/Customer');
      
      // Log the response structure to help with debugging
      console.log('Customer getAll response:', response.data);
      
      // Handle different data formats
      let customersData = response.data;
      
      // Check if data is in ReferenceHandler.Preserve format
      if (response.data && typeof response.data === 'object' && response.data.$values) {
        console.log('Found $values array in customer response');
        customersData = response.data.$values;
      }
      
      return {
        success: true,
        data: customersData
      };
    } catch (error) {
      console.error('Error getting customers:', error);
      
      // If we get a 400 or 401 error and we haven't tried too many times, retry after a delay
      if ((error.response?.status === 400 || error.response?.status === 401) && retryCount > 0) {
        console.log(`Retrying customer fetch. Attempts remaining: ${retryCount}`);
        // Wait 500ms before retrying to allow token to be properly loaded
        await new Promise(resolve => setTimeout(resolve, 500));
        return customerService.getAll(retryCount - 1);
      }
      
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get customers',
        error: error.response?.data
      };
    }
  },

  getById: async (id) => {
    try {
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
      const response = await api.get(`/Customer/company/${companyId}`);
      
      // Log the response structure to help with debugging
      console.log('Customer getByCompanyId response:', response.data);
      
      // Handle different data formats
      let customersData = response.data;
      
      // Check if data is in ReferenceHandler.Preserve format
      if (response.data && typeof response.data === 'object' && response.data.$values) {
        console.log('Found $values array in customer response');
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
      const response = await api.post('/Customer', customerData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error creating customer:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to create customer',
        error: error.response?.data
      };
    }
  },

  update: async (id, customerData) => {
    try {
      const response = await api.put(`/Customer/${id}`, customerData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error(`Error updating customer ${id}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update customer',
        error: error.response?.data
      };
    }
  },

  delete: async (id) => {
    try {
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
      const response = await api.get(`/Customer/${id}/orders`);
      
      // Handle different data formats
      let ordersData = response.data;
      
      // Check if data is in ReferenceHandler.Preserve format
      if (response.data && typeof response.data === 'object' && response.data.$values) {
        console.log('Found $values array in customer orders response');
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
      const response = await api.get(`/Customer/${id}/invoices`);
      
      // Handle different data formats
      let invoicesData = response.data;
      
      // Check if data is in ReferenceHandler.Preserve format
      if (response.data && typeof response.data === 'object' && response.data.$values) {
        console.log('Found $values array in customer invoices response');
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

export default customerService;
