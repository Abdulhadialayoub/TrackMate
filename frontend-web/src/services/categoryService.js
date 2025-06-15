import api from './api';

export const categoryService = {
  getAll: async () => {
    try {
      const response = await api.get('/Category');
      // Ensure data is always an array, even if API returns null/undefined
      const data = Array.isArray(response.data) ? response.data : [];
      return {
        success: true,
        data: data
      };
    } catch (error) {
      console.error('Error getting categories:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get categories',
        error: error.response?.data,
        data: [] // Return empty array on error
      };
    }
  },

  create: async (categoryData) => {
    try {
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
      await api.delete(`/Category/${id}`);
      return { success: true };
    } catch (error) {
      console.error(`Error deleting category ${id}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to delete category',
        error: error.response?.data
      };
    }
  }

  // Add other methods like getById later if needed
};

export default categoryService; 