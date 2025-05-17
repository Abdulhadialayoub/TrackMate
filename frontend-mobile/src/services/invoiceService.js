import { api } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../config/constants';

// Import the entire API module to access its internal functions without name conflicts
import * as apiModule from './api';

export const invoiceService = {
  // Get all invoices
  getAll: async (params = {}) => {
    try {
      const response = await api.get('/Invoice', { params });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error fetching invoices:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'An error occurred while fetching invoices'
      };
    }
  },

  // Get invoices by company ID
  getByCompanyId: async (companyId, params = {}) => {
    try {
      const response = await api.get(`/Invoice/company/${companyId}`, { params });
      // Eğer response.data.$values varsa onu kullan
      let data = response.data;
      if (data && data.$values) {
        data = data.$values;
      }
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error fetching invoices by company:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'An error occurred while fetching invoices by company'
      };
    }
  },

  // Get invoice by ID
  getById: async (id) => {
    try {
      const response = await api.get(`/Invoice/${id}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error(`Error fetching invoice ${id}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || 'An error occurred while fetching the invoice'
      };
    }
  },

  // Create new invoice
  create: async (invoiceData) => {
    try {
      // Sanitize the data to ensure proper format
      const sanitizedData = { ...invoiceData };
      
      // Get company ID from storage if not provided
      if (!sanitizedData.companyId) {
        const companyId = await AsyncStorage.getItem(STORAGE_KEYS.COMPANY_ID);
        if (companyId) {
          sanitizedData.companyId = parseInt(companyId, 10);
        }
      }
      
      console.log('Creating invoice with data:', JSON.stringify(sanitizedData, null, 2));
      
      const response = await api.post('/Invoice', sanitizedData);
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error creating invoice:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'An error occurred while creating the invoice'
      };
    }
  },

  // Update invoice
  update: async (id, invoiceData) => {
    try {
      const response = await api.put(`/Invoice/${id}`, invoiceData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error(`Error updating invoice ${id}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || 'An error occurred while updating the invoice'
      };
    }
  },

  // Delete invoice
  delete: async (id) => {
    try {
      await api.delete(`/Invoice/${id}`);
      return {
        success: true
      };
    } catch (error) {
      console.error(`Error deleting invoice ${id}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || 'An error occurred while deleting the invoice'
      };
    }
  },

  // Generate PDF for invoice
  generatePdf: async (id) => {
    try {
      const response = await api.get(`/Invoice/${id}/pdf`, {
        responseType: 'blob'
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error(`Error generating PDF for invoice ${id}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || 'An error occurred while generating the PDF'
      };
    }
  },

  // Send invoice by email
  sendByEmail: async (id, emailData) => {
    try {
      const response = await api.post(`/Invoice/${id}/email`, emailData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error(`Error sending invoice ${id} by email:`, error);
      return {
        success: false,
        message: error.response?.data?.message || 'An error occurred while sending the invoice'
      };
    }
  },

  // Create invoice from order
  createFromOrder: async (orderId) => {
    try {
      const response = await api.post(`/Invoice/fromOrder/${orderId}`);
      
      // Extract the data from the response, handling .NET format
      let invoiceData = response.data;
      
      // Add an id field if not present but $id is available
      if (invoiceData && invoiceData.$id && !invoiceData.id) {
        // In the web implementation, they treat $id as the actual ID
        invoiceData.id = invoiceData.$id;
      }
      
      // If the response has $id and potentially $values (typical .NET format)
      if (invoiceData && invoiceData.$values) {
        if (Array.isArray(invoiceData.$values) && invoiceData.$values.length > 0) {
          invoiceData = invoiceData.$values[0];
          
          // Add id field if missing but $id is available
          if (invoiceData.$id && !invoiceData.id) {
            invoiceData.id = invoiceData.$id;
          }
        }
      }
      
      console.log('Created invoice data:', invoiceData);
      
      return {
        success: true,
        data: invoiceData
      };
    } catch (error) {
      console.error(`Error creating invoice from order ${orderId}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || 'An error occurred while creating the invoice from order'
      };
    }
  },

  // Send invoice by email using order ID
  sendInvoiceByOrderId: async (orderId, emailData) => {
    try {
      // First, we need to find the invoice by order ID
      const response = await api.get(`/Invoice/byOrder/${orderId}`);
      
      if (!response.data) {
        return {
          success: false,
          message: 'Could not find invoice for the specified order'
        };
      }
      
      // Extract the invoice ID from the response
      let invoiceId;
      if (response.data.id) {
        invoiceId = response.data.id;
      } else if (response.data.$id && response.data.$values) {
        // Handle .NET format
        const invoices = response.data.$values;
        if (invoices && invoices.length > 0 && invoices[0].id) {
          invoiceId = invoices[0].id;
        }
      }
      
      if (!invoiceId) {
        return {
          success: false,
          message: 'Could not determine invoice ID from order'
        };
      }
      
      // Now send the email with the found invoice ID
      const emailResponse = await api.post(`/Invoice/${invoiceId}/email`, emailData);
      
      return {
        success: true,
        data: emailResponse.data
      };
    } catch (error) {
      console.error(`Error sending invoice by order ID ${orderId}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || 'An error occurred while sending the invoice'
      };
    }
  },
  
  // Send invoice by email using invoice number
  sendInvoiceByNumber: async (invoiceNumber, emailData) => {
    try {
      // First, we need to find the invoice by number
      const response = await api.get(`/Invoice/byNumber/${encodeURIComponent(invoiceNumber)}`);
      
      if (!response.data) {
        return {
          success: false,
          message: 'Could not find invoice with the specified number'
        };
      }
      
      // Extract the invoice ID from the response
      let invoiceId;
      if (response.data.id) {
        invoiceId = response.data.id;
      } else if (response.data.$id && response.data.$values) {
        // Handle .NET format
        const invoices = response.data.$values;
        if (invoices && invoices.length > 0 && invoices[0].id) {
          invoiceId = invoices[0].id;
        }
      }
      
      if (!invoiceId) {
        return {
          success: false,
          message: 'Could not determine invoice ID from invoice number'
        };
      }
      
      // Now send the email with the found invoice ID
      const emailResponse = await api.post(`/Invoice/${invoiceId}/email`, emailData);
      
      return {
        success: true,
        data: emailResponse.data
      };
    } catch (error) {
      console.error(`Error sending invoice by number ${invoiceNumber}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || 'An error occurred while sending the invoice'
      };
    }
  },

  // Get invoice by invoice number
  getByNumber: async (invoiceNumber) => {
    try {
      const response = await api.get(`/Invoice/byNumber/${encodeURIComponent(invoiceNumber)}`);
      
      // Process the response to handle different formats
      let invoiceData = response.data;
      
      // Add id field if not present but $id is available (like web)
      if (invoiceData && invoiceData.$id && !invoiceData.id) {
        invoiceData.id = invoiceData.$id;
      }
      
      // If we have a $values collection, extract the first item
      if (invoiceData && invoiceData.$values) {
        if (Array.isArray(invoiceData.$values) && invoiceData.$values.length > 0) {
          invoiceData = invoiceData.$values[0];
          
          // Add id field if missing but $id is available
          if (invoiceData.$id && !invoiceData.id) {
            invoiceData.id = invoiceData.$id;
          }
        }
      }
      
      return {
        success: true,
        data: invoiceData
      };
    } catch (error) {
      console.error(`Error fetching invoice by number ${invoiceNumber}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || 'An error occurred while fetching the invoice'
      };
    }
  },
  
  // Get invoice PDF as base64 - use the one from api.js
  getInvoicePdf: async (id) => {
    // Call the version in api.js to avoid duplication
    return await apiModule.invoiceService.getInvoicePdf(id);
  }
}; 