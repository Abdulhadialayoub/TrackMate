import api from './api';

export const productService = {
  getAll: async () => {
    try {
      const response = await api.get('/Product');
      return {
        success: true,
        data: response.data
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
      const response = await api.get(`/Product/${id}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error(`Error getting product ${id}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get product',
        error: error.response?.data
      };
    }
  },

  getByCompanyId: async (companyId) => {
    try {
      const response = await api.get(`/Product/company/${companyId}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error(`Error getting products for company ${companyId}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get company products',
        error: error.response?.data
      };
    }
  },

  create: async (productData) => {
    try {
      const response = await api.post('/Product', productData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error creating product:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to create product',
        error: error.response?.data
      };
    }
  },

  update: async (id, productData) => {
    try {
      const response = await api.put(`/Product/${id}`, productData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error(`Error updating product ${id}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update product',
        error: error.response?.data
      };
    }
  },

  delete: async (id) => {
    try {
      const response = await api.delete(`/Product/${id}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error(`Error deleting product ${id}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to delete product',
        error: error.response?.data
      };
    }
  },

  updateStatus: async (id, status) => {
    try {
      const response = await api.put(`/Product/${id}/status`, { status });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error(`Error updating product status ${id}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update product status',
        error: error.response?.data
      };
    }
  },

  updateStock: async (id, quantity) => {
    try {
      const response = await api.put(`/Product/${id}/stock`, { quantity });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error(`Error updating product stock ${id}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update product stock',
        error: error.response?.data
      };
    }
  }
};

export default productService;
