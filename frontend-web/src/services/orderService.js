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

  getOrdersByCompany: async (companyId) => {
    try {
      if (!companyId) {
        console.error('No company ID provided');
        return {
          success: false,
          message: 'Company ID is required',
          data: []
        };
      }
      
      console.log(`Requesting orders for company ID: ${companyId}`);
      
      const response = await api.get(`/Order/company/${companyId}`);
      console.log(`Response status: ${response.status}`);
      console.log('Response data structure:', typeof response.data);
      
      // Check for different response formats
      if (Array.isArray(response.data)) {
        console.log(`Received ${response.data.length} company orders from API`);
        return {
          success: true,
          data: response.data
        };
      } else if (response.data && typeof response.data === 'object') {
        // Handle ReferenceHandler.Preserve format with $values
        if (response.data.$values && Array.isArray(response.data.$values)) {
          console.log(`Extracted ${response.data.$values.length} company orders from $values property`);
          return {
            success: true,
            data: response.data.$values
          };
        }
        
        // Handle case where data might be nested in a property
        if (response.data.data && Array.isArray(response.data.data)) {
          console.log(`Extracted ${response.data.data.length} company orders from data property`);
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
      console.warn('Response did not contain company orders in expected format:', response.data);
      return {
        success: true,
        data: [], // Return empty array as no errors occurred, just no data
        message: 'No orders found for company'
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
        message: error.response?.data?.message || 'Failed to get company orders',
        error: error.response?.data
      };
    }
  },

  getById: async (id) => {
    try {
      console.log(`Requesting order details for ID: ${id}`);
      
      const response = await api.get(`/Order/${id}`);
      console.log('Order details response status:', response.status);
      
      // Extra safety check - if we get a completely unexpected format, attempt manual normalization
      if (response.data && typeof response.data === 'string') {
        console.warn('Received string data instead of object - attempting to parse');
        try {
          response.data = JSON.parse(response.data);
        } catch (parseError) {
          console.error('Failed to parse string response data:', parseError);
          return {
            success: false,
            message: 'Invalid response format from API',
            data: null
          };
        }
      }
      
      if (!response.data) {
        throw new Error('Order not found');
      }
      
      try {
        // Process the response data
        let orderData = response.data;
        
        // Create a sanitized order object
        const timestamp = new Date().toISOString().replace(/[-:.]/g, '').substring(0, 14);
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        
        // Create base order object with default values for any missing properties
        const sanitizedOrder = {
          id: orderData.id || `temp-${timestamp}-${randomSuffix}`,
          companyId: orderData.companyId || parseInt(localStorage.getItem('company_id') || '1'),
          customerId: orderData.customerId || null,
          orderNumber: orderData.orderNumber || `ORD-DETAIL-${timestamp}-${randomSuffix}`,
          orderDate: orderData.orderDate || new Date().toISOString(),
          dueDate: orderData.dueDate || null,
          status: typeof orderData.status === 'number' ? orderData.status : 
                (typeof orderData.status === 'string' && !isNaN(parseInt(orderData.status))) ? 
                parseInt(orderData.status) : 0, // Default to Draft (0)
          notes: orderData.notes || '',
          currency: orderData.currency || 'USD',
          customerName: orderData.customerName || (orderData.customer ? orderData.customer.name : null)
        };
        
        // Handle financial values with extra safety
        sanitizedOrder.subTotal = typeof orderData.subTotal !== 'undefined' ? parseFloat(orderData.subTotal || 0) : 0;
        sanitizedOrder.taxRate = typeof orderData.taxRate !== 'undefined' ? parseFloat(orderData.taxRate || 0) : 0;
        sanitizedOrder.taxAmount = typeof orderData.taxAmount !== 'undefined' ? parseFloat(orderData.taxAmount || 0) : 0;
        sanitizedOrder.shippingCost = typeof orderData.shippingCost !== 'undefined' ? parseFloat(orderData.shippingCost || 0) : 0;
        sanitizedOrder.totalAmount = typeof orderData.totalAmount !== 'undefined' ? parseFloat(orderData.totalAmount || 0) : 
                                   (typeof orderData.total !== 'undefined' ? parseFloat(orderData.total || 0) : 0);
        sanitizedOrder.total = typeof orderData.totalAmount !== 'undefined' ? parseFloat(orderData.totalAmount || 0) : 
                            (typeof orderData.total !== 'undefined' ? parseFloat(orderData.total || 0) : 0);
        
        // Handle shipping details
        sanitizedOrder.shippingAddress = typeof orderData.shippingAddress === 'string' ? orderData.shippingAddress : '';
        sanitizedOrder.shippingMethod = typeof orderData.shippingMethod === 'string' ? orderData.shippingMethod : '';
        sanitizedOrder.trackingNumber = typeof orderData.trackingNumber === 'string' ? orderData.trackingNumber : '';
        
        // Process customer information
        if (orderData.customer && typeof orderData.customer === 'object') {
          sanitizedOrder.customer = {
            id: orderData.customer.id,
            name: typeof orderData.customer.name === 'string' ? orderData.customer.name : 'Unknown Customer',
            email: typeof orderData.customer.email === 'string' ? orderData.customer.email : '',
            phone: typeof orderData.customer.phone === 'string' ? orderData.customer.phone : '',
            address: typeof orderData.customer.address === 'string' ? orderData.customer.address : ''
          };
          
          // Ensure customerName is set if available from customer object
          if (!sanitizedOrder.customerName && orderData.customer.name) {
            sanitizedOrder.customerName = typeof orderData.customer.name === 'string' ? orderData.customer.name : 'Unknown Customer';
          }
        }
        
        // If customerName is still not set, use a fallback
        if (!sanitizedOrder.customerName) {
          sanitizedOrder.customerName = sanitizedOrder.customerId ? 
            `Customer #${sanitizedOrder.customerId}` : 'Unknown Customer';
        }
        
        // Process order items safely
        let orderItems = [];
        
        // Handle different item structures
        if (orderData.items && orderData.items.$values && Array.isArray(orderData.items.$values)) {
          // Process items with $values structure
          orderItems = orderData.items.$values;
        } else if (orderData.items && Array.isArray(orderData.items)) {
          // Process items as regular array
          orderItems = orderData.items;
        } else if (orderData.orderItems) {
          // Handle if items are in orderItems property
          orderItems = Array.isArray(orderData.orderItems) 
            ? orderData.orderItems 
            : (orderData.orderItems.$values && Array.isArray(orderData.orderItems.$values)) 
              ? orderData.orderItems.$values 
              : [];
        }
        
        // Sanitize each item
        sanitizedOrder.items = orderItems.filter(item => item && typeof item === 'object').map(item => {
          try {
            return {
              id: item.id || `item-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
              productId: parseInt(item.productId) || 0,
              productName: item.productName || (item.product ? item.product.name : 'Unknown Product'),
              quantity: parseInt(item.quantity) || 0,
              unitPrice: parseFloat(item.unitPrice || 0),
              discount: parseFloat(item.discount || 0),
              taxRate: parseFloat(item.taxRate || 0),
              taxAmount: parseFloat(item.taxAmount || 0),
              totalAmount: parseFloat(item.totalAmount || 0),
              total: parseFloat(item.totalAmount || item.total || (item.quantity * item.unitPrice)) || 0
            };
          } catch (itemError) {
            console.error('Error processing order item:', itemError);
            return null;
          }
        }).filter(item => item !== null); // Remove null items
        
        console.log('Processed order details:', sanitizedOrder);
      
      return {
        success: true,
          data: sanitizedOrder
        };
      } catch (processingError) {
        console.error('Error processing order data:', processingError);
        return {
          success: false,
          message: 'Error processing order data: ' + processingError.message,
          error: processingError
        };
      }
    } catch (error) {
      console.error(`Error getting order ${id}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get order details',
        error: error.response?.data
      };
    }
  },

  // Add this helper function to resolve references in JSON data
  resolveReferences: (json) => {
    // If not an object or null, return as is
    if (!json || typeof json !== 'object') return json;

    // Create a map of objects by their $id
    const objectsById = new Map();
    
    // First pass - collect all objects with $id
    const collectObjectsByIds = (obj) => {
      if (!obj || typeof obj !== 'object') return;
      
      if (obj.$id) {
        objectsById.set(obj.$id, obj);
      }
      
      if (Array.isArray(obj)) {
        obj.forEach(item => collectObjectsByIds(item));
        return;
      }
      
      // Process object properties
      Object.values(obj).forEach(value => {
        if (value && typeof value === 'object') {
          collectObjectsByIds(value);
        }
      });
    };
    
    // Collect objects by ID
    if (json.$values && Array.isArray(json.$values)) {
      collectObjectsByIds(json);
      
      // Second pass - resolve references to actual objects
      const resolveRefs = (obj, visited = new Set()) => {
        if (!obj || typeof obj !== 'object') return obj;
        if (visited.has(obj)) return obj; // Avoid circular references
        
        visited.add(obj);
        
        // Handle $ref property
        if (obj.$ref) {
          const referencedObj = objectsById.get(obj.$ref);
          if (referencedObj) {
            // Special handling for customer references
            if (obj.$ref.includes('customer') || obj.$ref.includes('Customer')) {
              const processedCustomer = {...resolveRefs({...referencedObj}, visited)};
              // Ensure customer has a name
              if (!processedCustomer.name && !processedCustomer.Name) {
                processedCustomer.name = "Unknown Customer";
              }
              return processedCustomer;
            }
            
            // Return a copy of the referenced object to avoid circular issues
            return resolveRefs({...referencedObj}, visited);
          }
          return {}; // Referenced object not found
        }
        
        // Handle arrays
        if (Array.isArray(obj)) {
          return obj.map(item => resolveRefs(item, new Set(visited)));
        }
        
        // Process each property
        const result = {...obj};
        for (const key in result) {
          if (result[key] && typeof result[key] === 'object') {
            result[key] = resolveRefs(result[key], new Set(visited));
          }
        }
        
        // Add missing customer name if we have customer ID but no name
        if (result.customerId && !result.customerName && (!result.customer || !result.customer.name)) {
          result.customerName = `Customer #${result.customerId}`;
        }
        
        return result;
      };
      
      // Return the resolved array
      return json.$values.map(item => resolveRefs(item));
    }
    
    // For direct objects
    collectObjectsByIds(json);
    return resolveReferences(json, new Set());
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
      console.log('Response data type:', typeof response.data);
      
      // Extra safety check - if we get a completely unexpected format, attempt manual normalization
      if (response.data && typeof response.data === 'string') {
        console.warn('Received string data instead of object/array - attempting to parse');
        try {
          response.data = JSON.parse(response.data);
        } catch (parseError) {
          console.error('Failed to parse string response data:', parseError);
          return {
            success: false,
            message: 'Invalid response format from API',
            data: []
          };
        }
      }
      
      // Process the response data and resolve references
      if (response.data) {
        console.log('Raw API Response first sample:', {
          responseType: typeof response.data,
          hasValues: response.data.$values ? true : false,
          firstItem: response.data.$values ? response.data.$values[0] : (Array.isArray(response.data) ? response.data[0] : null)
        });
        
        // Try to resolve references
        let resolvedData = [];
        try {
          console.log('Attempting to resolve references in API response');
          
          // Check for different data structures
        if (response.data.$values && Array.isArray(response.data.$values)) {
            // First, try to resolve references if the data uses $ref and $id pattern
            resolvedData = orderService.resolveReferences(response.data);
            console.log(`Resolved ${resolvedData.length} orders with references`);
          } else if (Array.isArray(response.data)) {
            resolvedData = response.data;
            console.log(`Using ${resolvedData.length} orders from direct array`);
          } else if (response.data && typeof response.data === 'object') {
            // If it's a single object, wrap it in an array
            resolvedData = [response.data];
            console.log('Using single order object');
          }
          
          // Debug log first item to verify customer handling
          if (resolvedData.length > 0) {
            const sample = resolvedData[0];
            console.log('Sample order after reference resolution:', {
              id: sample.id,
              customerName: sample.customerName,
              customer: sample.customer ? {
                id: sample.customer.id,
                name: sample.customer.name
              } : 'No customer object'
            });
          }
        } catch (refError) {
          console.error('Error resolving references:', refError);
          // Fall back to original data structure
          resolvedData = Array.isArray(response.data) ? response.data : 
                        (response.data.$values && Array.isArray(response.data.$values)) ? 
                        response.data.$values : [response.data];
        }
        
        // Proceed with normal sanitization from here with the resolved data
        // Handle various response formats
        let ordersData = resolvedData.filter(item => item); // Filter out null/undefined
        
        // Extra check - if ordersData is not an array, force it to be one
        if (!Array.isArray(ordersData)) {
          console.warn('Orders data is not an array, converting to array:', ordersData);
          ordersData = ordersData ? [ordersData] : [];
        }
        
        // Process each order to sanitize data - with extra safety checks
        const sanitizedOrders = ordersData.map(order => {
          // Skip null or non-object orders
          if (!order || typeof order !== 'object') {
            console.warn('Skipping invalid order data:', order);
            return null;
          }
          
          try {
            // Generate a random suffix for uniqueness
            const randomSuffix = Math.random().toString(36).substring(2, 8);
            const timestamp = new Date().toISOString().replace(/[-:.]/g, '').substring(0, 14);
            
            // Create a sanitized order object with default values for missing properties
            const sanitizedOrder = {
              id: order.id || `temp-${timestamp}-${randomSuffix}`,
              companyId: order.companyId || companyIdInt,
              customerId: order.customerId || null,
              orderNumber: order.orderNumber || `ORD-${companyIdInt}-${timestamp}-${randomSuffix}`,
              orderDate: order.orderDate || new Date().toISOString(),
              dueDate: order.dueDate || null,
              status: typeof order.status === 'number' ? order.status : 
                    (typeof order.status === 'string' && !isNaN(parseInt(order.status))) ? 
                    parseInt(order.status) : 0, // Default to Draft (0)
              notes: order.notes || '',
              currency: order.currency || 'USD',
              customerName: order.customerName || (order.customer ? order.customer.name : null)
            };
            
            // Handle financial values with extra safety
            sanitizedOrder.subTotal = typeof order.subTotal !== 'undefined' ? parseFloat(order.subTotal || 0) : 0;
            sanitizedOrder.taxRate = typeof order.taxRate !== 'undefined' ? parseFloat(order.taxRate || 0) : 0;
            sanitizedOrder.taxAmount = typeof order.taxAmount !== 'undefined' ? parseFloat(order.taxAmount || 0) : 0;
            sanitizedOrder.shippingCost = typeof order.shippingCost !== 'undefined' ? parseFloat(order.shippingCost || 0) : 0;
            sanitizedOrder.totalAmount = typeof order.totalAmount !== 'undefined' ? parseFloat(order.totalAmount || 0) : 
                                        (typeof order.total !== 'undefined' ? parseFloat(order.total || 0) : 0);
            sanitizedOrder.total = typeof order.totalAmount !== 'undefined' ? parseFloat(order.totalAmount || 0) : 
                                  (typeof order.total !== 'undefined' ? parseFloat(order.total || 0) : 0);
            
            // Handle shipping details
            sanitizedOrder.shippingAddress = typeof order.shippingAddress === 'string' ? order.shippingAddress : '';
            sanitizedOrder.shippingMethod = typeof order.shippingMethod === 'string' ? order.shippingMethod : '';
            sanitizedOrder.trackingNumber = typeof order.trackingNumber === 'string' ? order.trackingNumber : '';
            
            // Process customer information
            if (order.customer && typeof order.customer === 'object') {
              sanitizedOrder.customer = {
                id: order.customer.id,
                name: typeof order.customer.name === 'string' ? order.customer.name : 'Unknown Customer',
                email: typeof order.customer.email === 'string' ? order.customer.email : '',
                phone: typeof order.customer.phone === 'string' ? order.customer.phone : '',
                address: typeof order.customer.address === 'string' ? order.customer.address : ''
              };
              
              // Ensure customerName is set if available from customer object
              if (!sanitizedOrder.customerName && order.customer.name) {
                sanitizedOrder.customerName = typeof order.customer.name === 'string' ? order.customer.name : 'Unknown Customer';
              }
            }
            
            // If customerName is still not set, use a fallback
            if (!sanitizedOrder.customerName) {
              sanitizedOrder.customerName = sanitizedOrder.customerId ? 
                `Customer #${sanitizedOrder.customerId}` : 'Unknown Customer';
            }
            
            // Process order items with extra safety
            let orderItems = [];
            
            // Handle different item structures
            if (order.items && order.items.$values && Array.isArray(order.items.$values)) {
              // Process items with $values structure
              orderItems = order.items.$values;
            } else if (order.items && Array.isArray(order.items)) {
              // Process items as regular array
              orderItems = order.items;
            } else if (order.orderItems) {
              // Handle if items are in orderItems property
              orderItems = Array.isArray(order.orderItems) 
                ? order.orderItems 
                : (order.orderItems.$values && Array.isArray(order.orderItems.$values)) 
                  ? order.orderItems.$values 
                  : [];
            }
            
            // Safely process order items
            sanitizedOrder.items = orderItems.filter(item => item && typeof item === 'object').map(item => {
              try {
                return {
                  id: item.id || `item-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                  productId: parseInt(item.productId) || 0,
                  productName: item.productName || (item.product ? item.product.name : 'Unknown Product'),
                  quantity: parseInt(item.quantity) || 0,
                  unitPrice: parseFloat(item.unitPrice || 0),
                  discount: parseFloat(item.discount || 0),
                  taxRate: parseFloat(item.taxRate || 0),
                  taxAmount: parseFloat(item.taxAmount || 0),
                  totalAmount: parseFloat(item.totalAmount || 0),
                  total: parseFloat(item.totalAmount || item.total || (item.quantity * item.unitPrice)) || 0
                };
              } catch (itemError) {
                console.error('Error processing order item:', itemError);
                return null;
              }
            }).filter(item => item !== null); // Remove null items
            
            return sanitizedOrder;
          } catch (orderError) {
            console.error('Error processing order:', orderError, order);
            return null;
          }
        }).filter(order => order !== null); // Remove null orders
        
        return {
          success: true,
          data: sanitizedOrders
        };
      }
      
      return {
        success: true,
        data: []
      };
    } catch (error) {
      console.error(`Error getting orders for company ${companyId}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get company orders',
        error: error.response?.data
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