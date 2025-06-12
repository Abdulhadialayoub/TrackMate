import api from './api';

export const invoiceService = {
  getAll: async () => {
    try {
      const response = await api.get('/Invoice');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error getting invoices:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get invoices',
        error: error.response?.data
      };
    }
  },

  getById: async (id) => {
    try {
      const response = await api.get(`/Invoice/${id}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error(`Error getting invoice ${id}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get invoice',
        error: error.response?.data
      };
    }
  },

  getByCompanyId: async (companyId) => {
    try {
      const response = await api.get(`/Invoice/company/${companyId}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error(`Error getting invoices for company ${companyId}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get company invoices',
        error: error.response?.data
      };
    }
  },

  getByCustomerId: async (customerId) => {
    try {
      const response = await api.get(`/Invoice/customer/${customerId}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error(`Error getting invoices for customer ${customerId}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get customer invoices',
        error: error.response?.data
      };
    }
  },

  getByOrderId: async (orderId) => {
    try {
      const response = await api.get(`/Invoice/order/${orderId}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error(`Error getting invoice for order ${orderId}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get order invoice',
        error: error.response?.data
      };
    }
  },

  create: async (invoiceData) => {
    try {
      const response = await api.post('/Invoice', invoiceData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error creating invoice:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to create invoice',
        error: error.response?.data
      };
    }
  },

  createFromOrder: async (orderId) => {
    try {
      console.log(`Creating invoice from order ${orderId}`);
      const response = await api.post(`/Invoice/fromOrder/${orderId}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error(`Error creating invoice from order ${orderId}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to create invoice from order',
        error: error.response?.data
      };
    }
  },

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
        message: error.response?.data?.message || 'Failed to update invoice',
        error: error.response?.data
      };
    }
  },

  delete: async (id) => {
    try {
      const response = await api.delete(`/Invoice/${id}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error(`Error deleting invoice ${id}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to delete invoice',
        error: error.response?.data
      };
    }
  },

  updateStatus: async (id, status) => {
    try {
      const response = await api.put(`/Invoice/${id}/status`, status);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error(`Error updating invoice status ${id}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update invoice status',
        error: error.response?.data
      };
    }
  },

  addInvoiceItem: async (id, invoiceItemData) => {
    try {
      const response = await api.post(`/Invoice/${id}/items`, invoiceItemData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error(`Error adding invoice item to invoice ${id}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to add invoice item',
        error: error.response?.data
      };
    }
  },

  removeInvoiceItem: async (id, itemId) => {
    try {
      const response = await api.delete(`/Invoice/${id}/items/${itemId}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error(`Error removing invoice item ${itemId} from invoice ${id}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to remove invoice item',
        error: error.response?.data
      };
    }
  },

  getInvoicePdf: async (id, includeDebug = false) => {
    try {
      console.log(`Getting PDF for invoice ID: ${id}`);
      
      // First try debug mode if enabled
      if (includeDebug) {
        try {
          const debugResponse = await api.get(`/Invoice/${id}/pdf?debug=true`);
          console.log('PDF debug info:', debugResponse.data);
        } catch (debugError) {
          console.warn('Failed to get PDF debug info:', debugError);
        }
      }
      
      // Try to get PDF directly using fetch API instead of axios
      try {
        console.log(`Trying direct fetch for PDF of invoice ID: ${id}`);
        
        // Get the token for authorization
        const token = localStorage.getItem('token');
        
        // Create fetch request with proper headers
        const fetchResponse = await fetch(`${api.defaults.baseURL}/Invoice/${id}/pdf`, {
          method: 'GET',
          headers: {
            'Accept': 'application/pdf',
            'Authorization': token ? `Bearer ${token}` : ''
          }
        });
        
        if (!fetchResponse.ok) {
          console.error('Fetch request failed:', fetchResponse.status, fetchResponse.statusText);
          throw new Error(`HTTP error! Status: ${fetchResponse.status}`);
        }
        
        // Check content type
        const contentType = fetchResponse.headers.get('content-type');
        console.log('Fetch response content type:', contentType);
        
        // Get the blob directly
        const blob = await fetchResponse.blob();
        console.log('Fetched blob:', blob);
        
        if (blob.size === 0) {
          console.error('Fetched blob is empty');
          throw new Error('Received empty PDF');
        }
        
        // Create URL from blob
        const url = URL.createObjectURL(blob);
        
        // Get filename from content-disposition or use default
        const contentDisposition = fetchResponse.headers.get('content-disposition');
        let filename = `Invoice_${id}.pdf`;
        
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="(.+)"/);
          if (filenameMatch && filenameMatch[1]) {
            filename = filenameMatch[1];
          }
        }
        
        return {
          success: true,
          data: blob,
          blob: blob,
          url: url,
          filename: filename,
          method: 'fetch'
        };
      } catch (fetchError) {
        console.error('Error using fetch for PDF:', fetchError);
        // Continue to axios method if fetch fails
      }
      
      // Fallback to standard axios method
      console.log('Falling back to axios for PDF download');
      const response = await api.get(`/Invoice/${id}/pdf`, {
        responseType: 'blob'
      });
      
      console.log('Response received:', {
        status: response.status,
        headers: response.headers,
        contentType: response.headers['content-type'],
        size: response.data?.size || 'unknown'
      });
      
      // Verify we have a response and data
      if (!response.data) {
        console.error('No data received in response');
        return {
          success: false,
          message: 'No data received from server'
        };
      }
      
      // Check content type - accept any PDF-like content type
      const contentType = response.headers['content-type'];
      const isPdfContentType = contentType && 
        (contentType.includes('application/pdf') || 
         contentType.includes('binary/octet-stream') || 
         contentType.includes('application/octet-stream'));
         
      if (!isPdfContentType) {
        console.error('Unexpected content type:', contentType);
        return {
          success: false,
          message: `Server returned an invalid content type: ${contentType || 'undefined'}`
        };
      }
      
      // Create blob URL for viewing in browser
      try {
        const blob = new Blob([response.data], { type: 'application/pdf' });
        console.log('Created blob:', {
          size: blob.size,
          type: blob.type
        });
        
        // Ensure blob has data
        if (blob.size === 0) {
          console.error('Created blob has zero size');
          return {
            success: false,
            message: 'Received empty PDF document'
          };
        }
        
        const url = window.URL.createObjectURL(blob);
        console.log('Created blob URL:', url);
        
        // Get filename from content-disposition header or use default
        const contentDisposition = response.headers['content-disposition'];
        let filename = `Invoice_${id}.pdf`;
        
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="(.+)"/);
          if (filenameMatch && filenameMatch[1]) {
            filename = filenameMatch[1];
          }
        }
        
        return {
          success: true,
          data: response.data,
          blob: blob,
          url: url,
          filename: filename,
          method: 'axios'
        };
      } catch (blobError) {
        console.error('Error creating blob:', blobError);
        return {
          success: false,
          message: 'Error processing PDF data: ' + blobError.message
        };
      }
    } catch (error) {
      console.error(`Error getting PDF for invoice ${id}:`, error);
      
      // Provide more specific error messages based on the error
      if (error.response) {
        console.error('Error response:', {
          status: error.response.status,
          headers: error.response.headers,
          data: error.response.data
        });
        
        if (error.response.status === 404) {
          return {
            success: false,
            message: 'Invoice not found'
          };
        } else if (error.response.status === 500) {
          return {
            success: false,
            message: 'Server error generating PDF'
          };
        }
      }
      
      return {
        success: false,
        message: error.message || 'Failed to get invoice PDF',
        error: error
      };
    }
  },

  saveInvoicePdf: async (id) => {
    try {
      const response = await api.get(`/Invoice/${id}/pdf/save`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error(`Error saving PDF for invoice ${id}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to save invoice PDF',
        error: error.response?.data
      };
    }
  },

  saveInvoicePdfToDatabase: async (id, saveToDatabase = true, saveToFileSystem = true) => {
    try {
      const response = await api.post(`/Invoice/${id}/pdf/save-to-db`, null, {
        params: { saveToDatabase, saveToFileSystem }
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error(`Error saving PDF to database for invoice ${id}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to save invoice PDF to database',
        error: error.response?.data
      };
    }
  }
};

export default invoiceService;
