import api from './api';

// Define order statuses for conversion
const orderStatuses = [
  { value: 0, label: 'Draft', stringValue: 'Draft' },
  { value: 1, label: 'Pending', stringValue: 'Pending' },
  { value: 2, label: 'Confirmed', stringValue: 'Confirmed' },
  { value: 3, label: 'Shipped', stringValue: 'Shipped' },
  { value: 4, label: 'Delivered', stringValue: 'Delivered' },
  { value: 5, label: 'Cancelled', stringValue: 'Cancelled' },
  { value: 6, label: 'Completed', stringValue: 'Completed' }
];

export const orderService = {
  getAll: async () => {
    try {
      console.log('Requesting all orders');
      
      const response = await api.get('/Order');
      console.log(`Response status: ${response.status}`);
      console.log('Response data structure:', typeof response.data);
      
      // Check for different response formats
      if (Array.isArray(response.data)) {
        console.log(`Received ${response.data.length} orders from API`);
        return {
          success: true,
          data: response.data
        };
      } else if (response.data && typeof response.data === 'object') {
        // Handle ReferenceHandler.Preserve format with $values
        if (response.data.$values && Array.isArray(response.data.$values)) {
          console.log(`Extracted ${response.data.$values.length} orders from $values property`);
          return {
            success: true,
            data: response.data.$values
          };
        }
        
        // Handle case where data might be nested in a property
        if (response.data.data && Array.isArray(response.data.data)) {
          console.log(`Extracted ${response.data.data.length} orders from data property`);
          return {
            success: true,
            data: response.data.data
          };
        } else {
          // Try to extract all possible array properties
          const possibleArrayProperties = Object.entries(response.data)
            .filter(([_, value]) => Array.isArray(value))
            .map(([key, value]) => ({ key, length: value.length }));
          
          if (possibleArrayProperties.length > 0) {
            // Use the array property with the most items
            const bestProperty = possibleArrayProperties.sort((a, b) => b.length - a.length)[0];
            console.log(`Found array property '${bestProperty.key}' with ${bestProperty.length} items`);
            return {
              success: true,
              data: response.data[bestProperty.key]
            };
          }
        }
      }
      
      // If we got here, we didn't find any orders in the expected format
      console.warn('Response did not contain orders in expected format:', response.data);
      return {
        success: true,
        data: [], // Return empty array as no errors occurred, just no data
        message: 'No orders found'
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
        message: error.response?.data?.message || 'Failed to get orders',
        error: error.response?.data
      };
    }
  },

  getById: async (id) => {
    try {
      const response = await api.get(`/Order/${id}`);
      
      // Handle direct object and Preserve reference object
      const orderData = (response.data && response.data.$ref) ? 
        response.data : response.data;
      
      return {
        success: true,
        data: orderData
      };
    } catch (error) {
      console.error(`Error getting order ${id}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get order',
        error: error.response?.data
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
      console.log('Response headers:', response.headers);
      console.log('Response data:', response.data);
      
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
      
      // Process and validate each order to ensure they have IDs and required properties
      const processedOrders = ordersData.map(order => {
        if (!order) return null;
        
        // If order is empty or just a reference, skip it
        if (order.$ref || Object.keys(order).length === 0) {
          return null;
        }
        
        // Ensure the order has a valid ID
        if (!order.id) {
          console.warn('Found order without ID:', order);
          // Generate a temporary ID with a consistent prefix for temporary orders
          order.id = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
          order.hasTemporaryId = true;
        }
        
        return order;
      }).filter(order => order !== null);
      
      console.log(`Processed ${processedOrders.length} valid orders out of ${ordersData.length} total`);
      
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
        
        // Special handling for 400 Bad Request errors
        if (error.response.status === 400) {
          console.error('Bad Request (400) error details:', error.response.data);
          return {
            success: false,
            message: 'Invalid request format or parameters. Please check company ID.',
            error: error.response.data,
            data: []
          };
        }
      }
      
      return {
        success: false,
        message: error.response?.data?.message || `Failed to get company orders for company ${companyId}`,
        error: error.response?.data,
        data: []
      };
    }
  },

  getByCustomerId: async (customerId) => {
    try {
      const response = await api.get(`/Order/customer/${customerId}`);
      
      // Check for different response formats
      if (Array.isArray(response.data)) {
        return {
          success: true,
          data: response.data
        };
      } else if (response.data && typeof response.data === 'object' && response.data.$values) {
        // Handle ReferenceHandler.Preserve format
        return {
          success: true,
          data: response.data.$values
        };
      }
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error(`Error getting orders for customer ${customerId}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get customer orders',
        error: error.response?.data
      };
    }
  },

  create: async (orderData) => {
    try {
      console.log('Creating order with data:', orderData);
      
      // Ensure the data structure is consistent before sending
      const sanitizedData = {
        ...orderData,
        // Make sure customerId is numeric
        customerId: parseInt(orderData.customerId),
        // Make sure taxRate and shippingCost are numeric
        taxRate: parseFloat(orderData.taxRate || 0),
        shippingCost: parseFloat(orderData.shippingCost || 0),
        // Ensure items is always an array
        items: Array.isArray(orderData.items) ? orderData.items.map(item => ({
          ...item,
          // Ensure item productId and quantities are numeric
          productId: parseInt(item.productId),
          quantity: parseInt(item.quantity),
          unitPrice: parseFloat(item.unitPrice),
          discount: parseFloat(item.discount || 0)
        })) : []
      };
      
      // Send the sanitized data to the API
      const response = await api.post('/Order', sanitizedData);
      
      // Response validation
      if (!response.data) {
        throw new Error('Empty response received from the server');
      }
      
      // Process the response to ensure we have a proper ID
      let orderResponse = response.data;
      
      // Check if we received a valid ID in the response
      if (!orderResponse.id && typeof orderResponse === 'object') {
        console.log('Order created successfully, but no ID returned. Fetching latest orders to find this order.');
        
        // If no ID returned but response was successful, try to fetch the latest orders
        try {
          // Short delay to make sure the order is registered in the database
          await new Promise(resolve => setTimeout(resolve, 800));
          
          // Get the company ID to fetch orders
          const companyId = orderData.companyId || localStorage.getItem('company_id');
          const ordersResponse = await api.get(`/Order/company/${companyId}`);
          
          if (Array.isArray(ordersResponse.data) && ordersResponse.data.length > 0) {
            // Find the most recently created order that matches our customer
            const matchingOrders = ordersResponse.data
              .filter(order => order.customerId === sanitizedData.customerId)
              .sort((a, b) => {
                // Sort by creation date, most recent first
                const dateA = new Date(b.createdAt || b.orderDate);
                const dateB = new Date(a.createdAt || a.orderDate);
                return dateA - dateB;
              });
            
            if (matchingOrders.length > 0) {
              // Try to find the exact match based on order items and details
              const exactMatch = matchingOrders.find(order => {
                // Check if order has matching items
                if (!order.items || !Array.isArray(order.items)) return false;
                
                // Check if item counts match
                if (order.items.length !== sanitizedData.items.length) return false;
                
                // Check order date
                const orderDate = new Date(order.orderDate).toDateString();
                const newOrderDate = new Date(sanitizedData.orderDate).toDateString();
                if (orderDate !== newOrderDate) return false;
                
                // Check notes
                if (order.notes !== sanitizedData.notes) return false;
                
                return true;
              });
              
              // Use exact match if found, otherwise most recent
              const matchedOrder = exactMatch || matchingOrders[0];
              
              console.log('Found the created order:', matchedOrder);
              return {
                success: true,
                data: matchedOrder,
                message: 'Order created successfully (ID retrieved from follow-up query)'
              };
            }
          }
          
          // If we still don't have an ID, create a temporary one
          if (!orderResponse.id) {
            console.warn('Could not find order ID through API, generating temporary ID');
            orderResponse.id = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
            orderResponse.hasTemporaryId = true;
          }
        } catch (err) {
          console.warn('Failed to fetch the created order ID, but order creation was successful:', err);
          // Generate a temporary ID if we couldn't find the real one
          orderResponse.id = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
          orderResponse.hasTemporaryId = true;
        }
      }
      
      // Validate the items array
      if (!orderResponse.items && orderData.items) {
        console.warn('Order created but items not included in response, adding them manually');
        orderResponse.items = orderData.items.map(item => ({
          ...item,
          orderId: orderResponse.id,
          // Calculate total
          totalAmount: item.quantity * item.unitPrice * (1 - (item.discount || 0) / 100)
        }));
      }
      
      // Make sure customer information is present
      if (!orderResponse.customer && orderData.customer) {
        console.warn('Order created but customer info not included in response, adding it manually');
        orderResponse.customer = orderData.customer;
        // CustomerName is a computed property, will be derived from customer.name
      }
      
      return {
        success: true,
        data: orderResponse,
        message: 'Order created successfully'
      };
    } catch (error) {
      console.error('Error creating order:', error);
      const errorMessage = error.response?.data?.message || 'Failed to create order';
      const errorDetails = error.response?.data?.errors || error.response?.data;
      return {
        success: false,
        message: errorMessage,
        error: errorDetails
      };
    }
  },

  update: async (id, orderData) => {
    try {
      console.log('Updating order with data:', JSON.stringify(orderData, null, 2));
      
      // Calculate correct subtotal, tax amount and total
      const subTotal = orderData.items?.reduce((total, item) => {
        const itemTotal = (parseFloat(item.quantity) || 1) * (parseFloat(item.unitPrice) || 0);
        return total + itemTotal;
      }, 0) || 0;
      
      const taxRate = parseFloat(orderData.taxRate || 0);
      const taxAmount = (subTotal * taxRate) / 100;
      const shippingCost = parseFloat(orderData.shippingCost || 0);
      const grandTotal = subTotal + taxAmount + shippingCost;
      
      console.log('Calculated values for update:', {
        subTotal,
        taxRate,
        taxAmount,
        shippingCost,
        grandTotal
      });
      
      // Format date properly to avoid Invalid Date errors
      const formatDate = (dateInput) => {
        if (!dateInput) return null;
        
        try {
          // If it's already in YYYY-MM-DD format
          if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
            // Return it in ISO format for the API
            const [year, month, day] = dateInput.split('-').map(Number);
            // Create a date at noon to avoid timezone issues
            const date = new Date(year, month - 1, day, 12, 0, 0);
            if (!isNaN(date.getTime())) {
              return date.toISOString();
            }
          }
          
          // Try standard date parsing
          const date = new Date(dateInput);
          if (!isNaN(date.getTime())) {
            // Format it to ensure consistent date format
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const isoDate = new Date(`${year}-${month}-${day}T12:00:00.000Z`);
            return isoDate.toISOString();
          }
          
          console.error('Unable to parse date:', dateInput);
          return null;
        } catch (error) {
          console.error('Error formatting date:', error, dateInput);
          return null;
        }
      };
      
      // Prepare the order items - backend expects certain format and properties
      const prepareOrderItems = (items = []) => {
        return items.map(item => {
          // Create a clean item object with only the properties backend expects
          return {
            id: item.id || null, // Include ID only if it exists
            productId: parseInt(item.productId) || 0,
            quantity: parseInt(item.quantity) || 1,
            unitPrice: parseFloat(item.unitPrice) || 0,
            description: item.description || item.productName || `Product #${item.productId}`,
            taxRate: parseFloat(item.taxRate) || 0,
            discount: parseFloat(item.discount) || 0,
            orderId: parseInt(id),
            updatedBy: orderData.updatedBy || localStorage.getItem('username') || 'system'
          };
        });
      };
      
      // Process the order update with properly validated data
      const finalOrderData = {
        id: parseInt(orderData.id),
        customerId: parseInt(orderData.customerId),
        orderDate: formatDate(orderData.orderDate),
        dueDate: orderData.dueDate ? formatDate(orderData.dueDate) : null,
        // For UpdateOrderDto we need to send a numeric value for the OrderStatus enum
        status: typeof orderData.status === 'number' ? 
          orderData.status : // Already a number
          !isNaN(parseInt(orderData.status)) ? 
            parseInt(orderData.status) : // Convert string number to number
            0, // Default to Draft (0) if we can't parse it
        notes: orderData.notes || '',
        shippingAddress: orderData.shippingAddress || '',
        shippingMethod: orderData.shippingMethod || '',
        shippingCost: parseFloat(orderData.shippingCost) || 0,
        trackingNumber: orderData.trackingNumber || '',
        taxRate: taxRate,
        taxAmount: taxAmount,
        subTotal: subTotal,
        grandTotal: grandTotal,
        // Include currency
        currency: orderData.currency || 'USD',
        updatedBy: orderData.updatedBy || localStorage.getItem('username') || 'system',
        items: prepareOrderItems(orderData.items)
      };
      
      console.log('Sending update payload:', JSON.stringify(finalOrderData, null, 2));
      console.log('IMPORTANT - Financial totals check for update:', {
        subTotal: finalOrderData.subTotal,
        taxAmount: finalOrderData.taxAmount,
        shippingCost: finalOrderData.shippingCost,
        calculatedTotal: finalOrderData.subTotal + finalOrderData.taxAmount + finalOrderData.shippingCost,
        sentTotal: finalOrderData.grandTotal
      });
      
      const response = await api.put(`/Order/${id}`, finalOrderData);
      
      // Check if response indicates an error
      if (response.status >= 400) {
        console.error('API Error Response:', response.status, response.data);
        return {
          success: false,
          message: typeof response.data === 'object' ? response.data?.title || 'Failed to update order' : 'Failed to update order',
          error: response.data
        };
      }
      
      console.log('Order update successful:', response.data);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error(`Error updating order ${id}:`, error);
      
      // Check for validation errors in the response
      if (error.response && error.response.status === 400) {
        console.error('API Error Response:', error.response.status, error.response.data);
        return {
          success: false,
          message: error.response.data?.title || 'Failed to update order',
          error: error.response.data
        };
      }
      
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update order',
        error: error.response?.data
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
        message: error.response?.data?.message || 'Failed to delete order',
        error: error.response?.data
      };
    }
  },

  updateStatus: async (id, status) => {
    try {
      // Convert status to numeric value for UpdateOrderStatusDto
      let numericStatus;
      
      if (typeof status === 'number') {
        numericStatus = status;
      } else if (typeof status === 'string') {
        if (!isNaN(parseInt(status))) {
          numericStatus = parseInt(status);
        } else {
          // Try to find the status by name
          const index = orderStatuses.findIndex(s => 
            s.label.toLowerCase() === status.toLowerCase() || 
            s.stringValue.toLowerCase() === status.toLowerCase()
          );
          numericStatus = index >= 0 ? index : 0;
        }
      } else {
        numericStatus = 0; // Default to Draft
      }
      
      console.log('Updating order status to:', {
        originalStatus: status,
        convertedStatus: numericStatus,
        statusName: orderStatuses.find(s => s.value === numericStatus)?.label || 'Unknown'
      });
      
      const response = await api.put(`/Order/${id}/status`, { status: numericStatus });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error(`Error updating order status ${id}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update order status',
        error: error.response?.data
      };
    }
  },

  addOrderItem: async (id, orderItemData) => {
    try {
      const response = await api.post(`/Order/${id}/items`, orderItemData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error(`Error adding order item to order ${id}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to add order item',
        error: error.response?.data
      };
    }
  },

  removeOrderItem: async (id, itemId) => {
    try {
      const response = await api.delete(`/Order/${id}/items/${itemId}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error(`Error removing order item ${itemId} from order ${id}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to remove order item',
        error: error.response?.data
      };
    }
  }
};

// Helper function to convert status numeric value to string
function getStatusStringFromValue(status) {
  // Convert to integer if it's a string
  const statusValue = typeof status === 'string' ? parseInt(status) : status;
  
  // Map of status values to string representations
  const statusMap = {
    0: 'Draft',
    1: 'Pending',
    2: 'Confirmed', 
    3: 'Shipped',
    4: 'Delivered',
    5: 'Cancelled',
    6: 'Completed'
  };
  
  // Return the string representation or the original value if not found
  return statusMap[statusValue] || status;
}

export default orderService;