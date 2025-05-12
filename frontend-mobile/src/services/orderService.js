import { api } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getStatusStringFromValue, ORDER_STATUSES, DEFAULT_ORDER } from '../config/orderConfig';
import { extractUsernameFromToken, getFullUsernameFromStorage } from '../utils/tokenUtils';

// Utility for handling JSON references
const JsonRefResolver = {
  // Store refs between calls
  refStore: {},
  
  // For tracking visited objects to prevent circular references
  visited: new Set(),
  
  // Reset refs
  reset() {
    this.refStore = {};
    this.visited = new Set();
  },
  
  // Collect all references from the JSON object
  collectRefs(obj) {
    if (!obj || typeof obj !== 'object') return;
    
    // If it has an ID, store it
    if (obj.$id) {
      this.refStore[obj.$id] = obj;
    }
    
    // Process each property of the object
    if (Array.isArray(obj)) {
      obj.forEach(item => this.collectRefs(item));
    } else {
      Object.values(obj).forEach(val => {
        if (val && typeof val === 'object') {
          this.collectRefs(val);
        }
      });
    }
  },
  
  // Resolve all references in the object
  resolveRefs(obj, circularGuard = new Set()) {
    if (!obj || typeof obj !== 'object') return obj;
    
    // Prevent circular references
    if (circularGuard.has(obj)) {
      console.log('Prevented circular reference');
      return { circular: true };
    }
    
    // Add to circular reference guard
    circularGuard.add(obj);
    
    // Special handling for $id and $values
    if (obj.$id && obj.$values) {
      console.log(`Processing object with $id: ${obj.$id}`);
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.resolveRefs(item, new Set(circularGuard)));
    }
    
    // If it's a reference, resolve it
    if (obj.$ref && this.refStore[obj.$ref]) {
      console.log(`Resolving reference: ${obj.$ref}`);
      
      // Check for circular reference
      if (circularGuard.has(this.refStore[obj.$ref])) {
        console.log(`Detected circular reference to ${obj.$ref}, returning placeholder`);
        return { 
          resolvedRef: obj.$ref,
          circular: true
        };
      }
      
      return this.resolveRefs(this.refStore[obj.$ref], new Set(circularGuard));
    }
    
    // Otherwise process each property
    const result = {};
    Object.entries(obj).forEach(([key, val]) => {
      // Preserve $id property
      if (key === '$id') {
        result.$id = val;
        return;
      }
      
      // Handle $values arrays - preserve the property name
      if (key === '$values' && Array.isArray(val)) {
        result.$values = val.map(item => this.resolveRefs(item, new Set(circularGuard)));
        return;
      }
      
      // Skip $ref property to avoid circular refs
      if (key === '$ref') {
        result.$ref = val;
        return;
      }
      
      // Handle normal properties
      if (val && typeof val === 'object') {
        result[key] = this.resolveRefs(val, new Set(circularGuard));
      } else {
        result[key] = val;
      }
    });
    
    return result;
  },
  
  // Process a full JSON response with references
  process(jsonData) {
    console.log('Starting JSON reference processing');
    
    if (!jsonData) {
      console.error('No data provided to JsonRefResolver');
      return {};
    }
    
    console.log('Input data type:', typeof jsonData);
    console.log('Input data keys:', Object.keys(jsonData).join(', '));
    
    // Special handling for the data structure we're seeing
    if (jsonData.$id && jsonData.$values && Array.isArray(jsonData.$values)) {
      console.log(`Found $values array with ${jsonData.$values.length} items`);
      // This is likely the main data structure we want to process
    } 

    this.reset();
    this.collectRefs(jsonData);
    console.log(`Collected ${Object.keys(this.refStore).length} references from response`);
    
    // Use simplified approach for circular references
    let result;
    try {
      // Use a more conservative approach first
      result = this.safeExtractOrders(jsonData);
      if (result && result.length > 0) {
        console.log(`Successfully extracted ${result.length} orders with safe method`);
        
        // Web version approach: Return all orders including temporary ones
        console.log(`Returning all ${result.length} orders (web version approach)`);
        return result;
      }
      
      // Fall back to the original method
      result = this.resolveRefs(jsonData);
    } catch (error) {
      console.error('Error during reference resolution:', error);
      // Fall back to a simple extraction of the main data
      result = this.safeExtractOrders(jsonData) || jsonData;
    }
    
    // Additional validation to ensure we properly extracted the data
    if (result.$values && Array.isArray(result.$values)) {
      console.log(`Result contains $values array with ${result.$values.length} items`);
      return result; // Return the full object with $values
    } else if (Array.isArray(result)) {
      console.log(`Result is an array with ${result.length} items`);
      return result;
    } else if (Object.keys(result).length === 0) {
      console.error('Result is empty object, returning original data');
      return jsonData; // Return original data if resolution failed
    }
    
    return result;
  },
  
  // A safer method to extract orders that avoids circular references entirely
  safeExtractOrders(jsonData) {
    console.log('Using safe extraction method');
    
    // Handle data.values format
    if (jsonData.$values && Array.isArray(jsonData.$values)) {
      return jsonData.$values.map(item => this.flattenOrder(item));
    }
    
    // Handle array format
    if (Array.isArray(jsonData)) {
      return jsonData.map(item => this.flattenOrder(item));
    }
    
    return null;
  },
  
  // Flatten an order object without resolving references
  flattenOrder(order) {
    if (!order || typeof order !== 'object') return order;
    
    // Web version approach: Generate unique timestamp and random ID
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 9);
    
    // Create a basic order object with only essential properties
    const result = { 
      ...order,
      // Ensure we always have an ID even if the original doesn't
      id: order.id || `temp-${timestamp}-${randomId}`,
      // Ensure we always have an order number even if the original doesn't
      // Generate it like the web version does with timestamp and randomness
      orderNumber: order.orderNumber || `ORD-TEMP-${timestamp.toString().substring(6)}-${randomId}`
    };
    
    // Enhanced customer name extraction with multiple fallbacks
    // First try to get it from order.customerName if it exists
    if (order.customerName) {
      result.customerName = order.customerName;
    }
    // Otherwise try to extract from customer object
    else if (order.customer && typeof order.customer === 'object') {
      // If it's a direct object, extract name
      if (order.customer.name) {
        result.customerName = order.customer.name;
      }
      // If it's a reference and we have it in our store
      else if (order.customer.$ref && this.refStore[order.customer.$ref]) {
        const customerRef = this.refStore[order.customer.$ref];
        if (customerRef.name) {
          result.customerName = customerRef.name;
        }
      }
      
      // Store the complete customer object if available
      result.customer = {
        id: order.customer.id || (order.customerId || 0),
        name: order.customer.name || result.customerName || 'Unknown Customer',
        email: order.customer.email || '',
        phone: order.customer.phone || '',
        address: order.customer.address || ''
      };
    }
    // Last resort - use customerId to create a fallback name
    else if (order.customerId) {
      result.customerName = `Customer #${order.customerId}`;
      // Create a minimal customer object
      result.customer = {
        id: order.customerId,
        name: result.customerName
      };
    }
    // If all else fails, set as Unknown Customer
    else {
      result.customerName = 'Unknown Customer';
      result.customer = {
        id: 0,
        name: 'Unknown Customer'
      };
    }
    
    // Ensure financial values are properly set as numbers
    result.total = parseFloat(order.totalAmount || order.total || 0);
    result.totalAmount = parseFloat(order.totalAmount || order.total || 0);
    result.subTotal = parseFloat(order.subTotal || 0);
    result.taxRate = parseFloat(order.taxRate || 0);
    result.taxAmount = parseFloat(order.taxAmount || 0);
    result.shippingCost = parseFloat(order.shippingCost || 0);
    result.currency = order.currency || 'USD';
    
    // Handle items - enhanced approach
    if (order.items) {
      let items = [];
      
      // Extract from $values format
      if (order.items.$values && Array.isArray(order.items.$values)) {
        items = order.items.$values.map((item, index) => {
          // Enhanced item with more properties
          return {
            id: item.id || `item-${result.id}-${index}-${randomId}`,
            productId: item.productId,
            description: item.description || '',
            productName: item.productName || item.description || 
                      (item.product && item.product.name ? item.product.name : 'Unknown Product'),
            quantity: parseInt(item.quantity) || 0,
            unitPrice: parseFloat(item.unitPrice) || 0,
            discount: parseFloat(item.discount) || 0,
            taxRate: parseFloat(item.taxRate) || 0,
            taxAmount: parseFloat(item.taxAmount) || 0,
            totalAmount: parseFloat(item.totalAmount) || 0,
            total: parseFloat(item.totalAmount || item.total || (item.quantity * item.unitPrice)) || 0
          };
        });
      } 
      // Extract from array format
      else if (Array.isArray(order.items)) {
        items = order.items.map((item, index) => {
          return {
            id: item.id || `item-${result.id}-${index}-${randomId}`,
            productId: item.productId,
            description: item.description || '',
            productName: item.productName || item.description || 
                      (item.product && item.product.name ? item.product.name : 'Unknown Product'),
            quantity: parseInt(item.quantity) || 0,
            unitPrice: parseFloat(item.unitPrice) || 0,
            discount: parseFloat(item.discount) || 0,
            taxRate: parseFloat(item.taxRate) || 0,
            taxAmount: parseFloat(item.taxAmount) || 0,
            totalAmount: parseFloat(item.totalAmount) || 0,
            total: parseFloat(item.totalAmount || item.total || (item.quantity * item.unitPrice)) || 0
          };
        });
      }
      
      result.items = items;
    }
    
    return result;
  }
};

// Create a global reference store (outside window)
const referenceStore = {};

// Define order statuses for conversion - use constants from orderConfig.js
const orderStatuses = Object.values(ORDER_STATUSES);

// Helper function to convert status value to string - available for other components
export { getStatusStringFromValue };

// Web versiyonundan alınan referans çözümleme fonksiyonu
const resolveReferences = (json) => {
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
};

// Web versiyonu yaklaşımı ile güncellenen temizleme fonksiyonu
export const cleanupOrders = (orders) => {
  if (!Array.isArray(orders)) return [];
  
  console.log(`Processing ${orders.length} orders (web version approach)`);
  
  // Handle duplicate IDs only (like web version)
  const seenIds = new Set();
  const result = [];
  
  orders.forEach(order => {
    // Skip null or invalid orders
    if (!order || typeof order !== 'object') return;
    
    // Web version approach: Only filter exact same IDs
    if (order.id && seenIds.has(order.id)) {
      console.log(`Skipping duplicate order with same ID: ${order.id}`);
      return;
    }
    
    // Record ID if it exists
    if (order.id) {
      seenIds.add(order.id);
    }
    
    // Add to result
    result.push(order);
  });
  
  console.log(`After processing: ${result.length} orders (web version approach)`);
  return result;
};

export const orderService = {
  getAll: async () => {
    try {
      console.log('Requesting all orders');
      
      const response = await api.get('/Order');
      console.log('API Response:', response.status, '/Order', JSON.stringify(response.data).substring(0, 150) + '...');
      
      if (!response.data) {
        console.error('No data in response');
        return {
          success: false,
          message: 'No data received from server',
          data: []
        };
      }
      
      // Handle the data wrapper if present
      const rawData = response.data.data || response.data;
      console.log('Raw data structure:', Object.keys(rawData).join(', '));
      
      // Extract orders with web version approach
      let ordersArray = [];
      
      try {
        // Process the complex JSON data with references using web version approach
          if (rawData.$values && Array.isArray(rawData.$values)) {
          console.log(`Found $values array with ${rawData.$values.length} items`);
          ordersArray = resolveReferences(rawData);
          console.log(`Resolved ${ordersArray.length} orders with reference resolution`);
        } else if (Array.isArray(rawData)) {
          ordersArray = rawData;
          console.log(`Using direct array with ${ordersArray.length} orders`);
        } else if (rawData && typeof rawData === 'object') {
          // Extract any possible orders array
          for (const key in rawData) {
            if (Array.isArray(rawData[key]) && rawData[key].length > 0) {
              ordersArray = rawData[key];
              console.log(`Found orders array in property ${key} with ${ordersArray.length} items`);
              break;
            }
          }
        }
      } catch (processingError) {
        console.error('Error during order data processing:', processingError);
        
        // Try direct extraction as fallback
        if (rawData.$values && Array.isArray(rawData.$values)) {
          console.log('Processing error, falling back to raw data $values');
          ordersArray = rawData.$values;
        } else if (Array.isArray(rawData)) {
          ordersArray = rawData;
        } else {
          return {
            success: false,
            message: 'Failed to process order data',
            data: []
          };
        }
      }
      
      // Safety check for ordersArray
      if (!ordersArray || !Array.isArray(ordersArray)) {
        console.error('Orders array is not valid:', ordersArray);
        return {
          success: true,
          message: 'No orders found',
          data: []
        };
      }
      
      // Map orders to a simplified format like web version
      const orders = ordersArray
        .filter(order => order && typeof order === 'object') // Filter out invalid entries
        .map(order => {
          try {
            // Extract customer name with comprehensive approach like web version
            const customerName = 
              order.customerName || 
              (order.customer ? 
                (typeof order.customer === 'object' ? 
                  (order.customer.name || null) : 
                  order.customer) : 
                (order.customerId ? `Customer #${order.customerId}` : 'Unknown Customer'));
            
            // Create a minimal customer object if needed
            const customer = order.customer || 
              (order.customerId ? { id: order.customerId, name: customerName } : null);
            
            // Extract status in the correct format
            let statusValue = order.status;
            let statusLabel = '';
            
            // Convert status to number if it's a string number
            if (typeof statusValue === 'string' && !isNaN(parseInt(statusValue))) {
              statusValue = parseInt(statusValue);
            }
            
            // Find status label
            const statusInfo = orderStatuses.find(s => s.value === statusValue);
            if (statusInfo) {
              statusLabel = statusInfo.label;
            } else {
              statusLabel = typeof statusValue === 'string' ? statusValue : 'Unknown';
            }
            
            // Build a cleaned order object with all required properties 
            return {
              id: order.id,
              orderNumber: order.orderNumber || 'Unknown',
              customerName: customerName,
              customerId: order.customerId,
              customer: customer,
              orderDate: order.orderDate,
              dueDate: order.dueDate,
              status: statusValue,
              statusLabel: statusLabel,
              notes: order.notes || '',
              currency: order.currency || 'USD',
              // Ensure all numerical values are properly processed
              total: parseFloat(order.totalAmount || order.total || 0),
              totalAmount: parseFloat(order.totalAmount || order.total || 0),
              subTotal: parseFloat(order.subTotal || 0),
              taxRate: parseFloat(order.taxRate || 0),
              taxAmount: parseFloat(order.taxAmount || 0),
              shippingCost: parseFloat(order.shippingCost || 0),
              shippingAddress: order.shippingAddress || '',
              shippingMethod: order.shippingMethod || '',
              trackingNumber: order.trackingNumber || ''
            };
          } catch (itemError) {
            console.error('Error processing individual order:', itemError);
            // Return a minimal valid order object for this item
            return {
              id: order.id || `unknown-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
              orderNumber: order.orderNumber || `Unknown-${Date.now()}`,
              customerName: 'Error Processing Order',
              status: 0,
              statusLabel: 'Draft',
              total: 0,
              currency: 'USD'
            };
          }
        });
      
      // Apply web version cleanup approach
      const cleanedOrders = cleanupOrders(orders);
      
      console.log(`Processed ${cleanedOrders.length} orders`);
      return {
        success: true,
        message: 'Orders retrieved successfully',
        data: cleanedOrders
      };
    } catch (error) {
      console.error('Error getting all orders:', error);
      return {
        success: false,
        message: error.message || 'Failed to get orders',
        data: []
      };
    }
  },

  getById: async (id) => {
    try {
      console.log(`Requesting order details for ID: ${id}`);
      
      const response = await api.get(`/Order/${id}`);
      console.log('API Response:', response.status, `/Order/${id}`, JSON.stringify(response).substring(0, 150) + '...');
      
      if (!response.data) {
        throw new Error('Order not found');
      }
      
      // Handle the data wrapper if present
      const rawData = response.data.data || response.data;
      console.log('Raw data structure:', Object.keys(rawData).join(', '));
      
      // Process the complex JSON data with references
      const processedData = JsonRefResolver.process(rawData);
      console.log('Order details JSON data processed with resolved references');
      
      try {
        // Extract order data - fallback to raw data if processing failed
        const orderData = (Object.keys(processedData).length > 0) ? processedData : rawData;
        
        // Create a sanitized order object
        const sanitizedOrder = {
          id: orderData.id || id,
          companyId: orderData.companyId || parseInt(await AsyncStorage.getItem('company_id') || '1'),
          customerId: orderData.customerId || null,
          orderNumber: orderData.orderNumber || `ORD-DETAIL-${Date.now()}`,
          orderDate: orderData.orderDate || new Date().toISOString(),
          dueDate: orderData.dueDate || null,
          status: typeof orderData.status === 'number' ? orderData.status : 
                (typeof orderData.status === 'string' && !isNaN(parseInt(orderData.status))) ? 
                parseInt(orderData.status) : 0, // Default to Draft (0)
          notes: orderData.notes || '',
          currency: orderData.currency || 'USD',
          shippingAddress: orderData.shippingAddress || '',
          shippingMethod: orderData.shippingMethod || '',
          trackingNumber: orderData.trackingNumber || ''
        };
        
        // Extract customer info
        if (orderData.customer) {
          sanitizedOrder.customerName = orderData.customer.name || orderData.customerName || 'Unknown Customer';
          sanitizedOrder.customer = {
            id: orderData.customer.id || orderData.customerId,
            name: orderData.customer.name || 'Unknown Customer',
            email: orderData.customer.email || '',
            phone: orderData.customer.phone || '',
            address: orderData.customer.address || ''
          };
        } else {
          sanitizedOrder.customerName = orderData.customerName || 'Unknown Customer';
          sanitizedOrder.customer = {
            id: orderData.customerId,
            name: orderData.customerName || 'Unknown Customer'
          };
        }
        
        // Handle financial values
        sanitizedOrder.subTotal = parseFloat(orderData.subTotal || 0);
        sanitizedOrder.taxRate = parseFloat(orderData.taxRate || 0);
        sanitizedOrder.taxAmount = parseFloat(orderData.taxAmount || 0);
        sanitizedOrder.shippingCost = parseFloat(orderData.shippingCost || 0);
        sanitizedOrder.totalAmount = parseFloat(orderData.totalAmount || 0);
        sanitizedOrder.total = parseFloat(orderData.totalAmount || orderData.total || 0);
        
        // Process order items
        const items = [];
        if (orderData.items && orderData.items.$values && Array.isArray(orderData.items.$values)) {
          orderData.items.$values.forEach((item, index) => {
            items.push({
              id: item.id || `item-${id}-${index}-${Date.now()}`,
              productId: parseInt(item.productId) || 0,
              productName: item.description || 
                        (item.product ? item.product.name : 'Unknown Product'),
              quantity: parseInt(item.quantity) || 0,
              unitPrice: parseFloat(item.unitPrice || 0),
              discount: parseFloat(item.discount || 0),
              taxRate: parseFloat(item.taxRate || 0),
              taxAmount: parseFloat(item.taxAmount || 0),
              totalAmount: parseFloat(item.totalAmount || 0),
              total: parseFloat(item.totalAmount || item.total || (item.quantity * item.unitPrice)) || 0
            });
          });
        } else if (orderData.items && Array.isArray(orderData.items)) {
          orderData.items.forEach((item, index) => {
            items.push({
              id: item.id || `item-${id}-${index}-${Date.now()}`,
              productId: parseInt(item.productId) || 0,
              productName: item.description || 
                        (item.product ? item.product.name : 'Unknown Product'),
              quantity: parseInt(item.quantity) || 0,
              unitPrice: parseFloat(item.unitPrice || 0),
              discount: parseFloat(item.discount || 0),
              taxRate: parseFloat(item.taxRate || 0),
              taxAmount: parseFloat(item.taxAmount || 0),
              totalAmount: parseFloat(item.totalAmount || 0),
              total: parseFloat(item.totalAmount || item.total || (item.quantity * item.unitPrice)) || 0
            });
          });
        }
        
        sanitizedOrder.items = items;
        
        console.log('Processed order details:', {
          id: sanitizedOrder.id,
          orderNumber: sanitizedOrder.orderNumber,
          customerName: sanitizedOrder.customerName,
          total: sanitizedOrder.total,
          itemCount: sanitizedOrder.items.length
        });
      
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
          message: 'Invalid company ID format',
          data: []
        };
      }
      
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
      
      // Process the response data and resolve references - WEB VERSION APPROACH
      if (response.data) {
        console.log('Raw API Response first sample:', JSON.stringify(response.data).substring(0, 150) + '...');
        
        // Try to resolve references using web version approach
        let ordersArray = [];
        try {
          console.log('Processing API response with web version reference resolution');
          
          // Check for different data structures
            if (response.data.$values && Array.isArray(response.data.$values)) {
            // Process with reference resolution
            ordersArray = resolveReferences(response.data);
            console.log(`Resolved ${ordersArray.length} orders with reference resolution`);
            } else if (Array.isArray(response.data)) {
              ordersArray = response.data;
            console.log(`Using direct array with ${ordersArray.length} orders`);
            } else if (response.data && typeof response.data === 'object') {
            // If it's a single object, wrap it in an array
              ordersArray = [response.data];
            console.log('Using single order object');
          }
        } catch (processingError) {
          console.error('Error during reference resolution:', processingError);
          
          // Direct fallback to raw data if processing fails
          if (response.data.$values && Array.isArray(response.data.$values)) {
            console.log('Processing error, falling back to raw data $values');
            ordersArray = response.data.$values;
          } else if (Array.isArray(response.data)) {
            ordersArray = response.data;
          } else if (response.data && typeof response.data === 'object') {
            ordersArray = [response.data];
          } else {
            return {
              success: false,
              message: 'Failed to process company order data',
              data: []
            };
          }
        }
        
        // Safety check for ordersArray
        if (!ordersArray || !Array.isArray(ordersArray)) {
          console.error('Company orders array is not valid:', ordersArray);
          return {
            success: true,
            message: 'No orders found for this company',
            data: []
          };
        }
        
        // Extra check - filter out null/undefined items
        ordersArray = ordersArray.filter(item => item);
        
        // Map orders to a simplified format - with error handling for each item
        const orders = ordersArray
          .filter(order => order && typeof order === 'object') // Filter out invalid entries
          .map(order => {
            try {
              // Extract customer name with comprehensive approach like web version
              const customerName = 
                order.customerName || 
                (order.customer ? 
                  (typeof order.customer === 'object' ? 
                    (order.customer.name || null) : 
                    order.customer) : 
                  (order.customerId ? `Customer #${order.customerId}` : 'Unknown Customer'));
              
              // Create a minimal customer object if needed
              const customer = order.customer || 
                (order.customerId ? { id: order.customerId, name: customerName } : null);
                
              // Extract status in the correct format
              let statusValue = order.status;
              let statusLabel = '';
              
              // Convert status to number if it's a string number
              if (typeof statusValue === 'string' && !isNaN(parseInt(statusValue))) {
                statusValue = parseInt(statusValue);
              }
              
              // Find status label
              const statusInfo = orderStatuses.find(s => s.value === statusValue);
              if (statusInfo) {
                statusLabel = statusInfo.label;
              } else {
                statusLabel = typeof statusValue === 'string' ? statusValue : 'Unknown';
              }
              
              // Extract order items
              let orderItems = [];
              
              // Handle different item structures
              if (order.items && order.items.$values && Array.isArray(order.items.$values)) {
                  orderItems = order.items.$values;
              } else if (order.items && Array.isArray(order.items)) {
                  orderItems = order.items;
              } else if (order.orderItems) {
                orderItems = Array.isArray(order.orderItems) 
                  ? order.orderItems 
                  : (order.orderItems.$values || []);
              }
              
              // Process each item to ensure consistent format
              const processedItems = orderItems.map(item => ({
                id: item.id || `item-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                productId: item.productId,
                productName: item.productName || 
                          (item.product ? item.product.name : item.description) || 'Unknown Product',
                quantity: parseInt(item.quantity) || 0,
                unitPrice: parseFloat(item.unitPrice) || 0,
                discount: parseFloat(item.discount) || 0,
                total: parseFloat(item.totalAmount || item.total || (item.quantity * item.unitPrice)) || 0
              }));
              
              // Build a cleaned order object with all required properties 
              return {
                id: order.id || `order-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                orderNumber: order.orderNumber || `Order-${Date.now()}`,
                customerName: customerName,
                customerId: order.customerId,
                customer: customer,
                orderDate: order.orderDate || new Date().toISOString(),
                dueDate: order.dueDate || null,
                status: statusValue,
                statusLabel: statusLabel,
                notes: order.notes || '',
                currency: order.currency || 'USD',
                items: processedItems,
                // Ensure all numerical values are properly processed
                total: typeof order.totalAmount !== 'undefined' ? parseFloat(order.totalAmount || 0) : 
                                      (typeof order.total !== 'undefined' ? parseFloat(order.total || 0) : 0),
                totalAmount: typeof order.totalAmount !== 'undefined' ? parseFloat(order.totalAmount || 0) : 
                            (typeof order.total !== 'undefined' ? parseFloat(order.total || 0) : 0),
                subTotal: parseFloat(order.subTotal || 0),
                taxRate: parseFloat(order.taxRate || 0),
                taxAmount: parseFloat(order.taxAmount || 0),
                shippingCost: parseFloat(order.shippingCost || 0),
                shippingAddress: order.shippingAddress || '',
                shippingMethod: order.shippingMethod || '',
                trackingNumber: order.trackingNumber || ''
              };
            } catch (itemError) {
              console.error('Error processing individual company order:', itemError);
              // Return a minimal valid order object for this item
              return {
                id: order.id || `unknown-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                orderNumber: order.orderNumber || `Unknown-${Date.now()}`,
                customerName: 'Error Processing Order',
                status: 0,
                statusLabel: 'Draft',
                total: 0,
                currency: 'USD'
              };
            }
          });
        
        // Apply web version cleanup approach
        const cleanedOrders = cleanupOrders(orders);
        
        console.log(`Processed ${cleanedOrders.length} company orders`);
        return {
          success: true,
          message: 'Company orders retrieved successfully',
          data: cleanedOrders
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
        message: error.message || 'Failed to get company orders',
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
      console.log('Creating order with data (before sanitization):', JSON.stringify(orderData, null, 2));
      
      // Pre-validation checks
      if (!orderData) {
        throw new Error("Order data is null or undefined");
      }
      
      if (!orderData.customerId) {
        throw new Error("Customer ID is required");
      }
      
      if (!orderData.companyId) {
        throw new Error("Company ID is required");
      }
      
      if (!Array.isArray(orderData.items) || orderData.items.length === 0) {
        throw new Error("At least one order item is required");
      }
      
      // Validate and clean date
      const validateDate = (dateInput) => {
        try {
          if (!dateInput) return new Date().toISOString();
          
          // Handle date strings
          if (typeof dateInput === 'string') {
            // Try parsing with Date
            const date = new Date(dateInput);
            if (!isNaN(date.getTime())) {
              return date.toISOString();
            }
            
            // If it's in YYYY-MM-DD format
            if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
              const [year, month, day] = dateInput.split('-').map(Number);
              const date = new Date(year, month - 1, day, 12, 0, 0);
              if (!isNaN(date.getTime())) {
                return date.toISOString();
              }
            }
            
            console.warn(`Invalid date string: ${dateInput}, using current date`);
            return new Date().toISOString();
          }
          
          // Handle Date objects
          if (dateInput instanceof Date) {
            if (!isNaN(dateInput.getTime())) {
              return dateInput.toISOString();
            }
          }
          
          console.warn(`Invalid date: ${dateInput}, using current date`);
          return new Date().toISOString();
        } catch (error) {
          console.error(`Error parsing date ${dateInput}:`, error);
          return new Date().toISOString();
        }
      };
      
      // Ensure numeric values are valid numbers
      const ensureNumber = (value, defaultValue = 0) => {
        if (value === null || value === undefined || value === '') return defaultValue;
        const num = parseFloat(value);
        return isNaN(num) ? defaultValue : num;
      };
      
      // Try to get a valid username from AsyncStorage or token
      // This should return a valid username that exists in the database
      const username = await AsyncStorage.getItem('username') || 'mobile_user';
      
      console.log('Using username for createdBy:', username);
      
      // Determine numeric status first
      let numericStatus;
      if (typeof orderData.status === 'number') {
        numericStatus = orderData.status;
      } else if (typeof orderData.status === 'string') {
        if (!isNaN(parseInt(orderData.status))) {
          numericStatus = parseInt(orderData.status);
        } else {
          const statusObj = Object.values(ORDER_STATUSES).find(s => s.label.toLowerCase() === orderData.status.toLowerCase());
          numericStatus = statusObj ? statusObj.value : ORDER_STATUSES.DRAFT.value; // Default to Draft's numeric value
        }
      } else {
        numericStatus = ORDER_STATUSES.DRAFT.value; // Default to Draft's numeric value
      }

      // Ensure the data structure is consistent before sending
      const sanitizedData = {
        // Make sure customerId is numeric
        customerId: ensureNumber(orderData.customerId, 0),
        // Make sure companyId is numeric
        companyId: ensureNumber(orderData.companyId, 0),
        // Ensure dates are valid ISO strings
        orderDate: validateDate(orderData.orderDate),
        dueDate: validateDate(orderData.dueDate),
        // Make sure taxRate and shippingCost are numeric
        taxRate: ensureNumber(orderData.taxRate, 0),
        shippingCost: ensureNumber(orderData.shippingCost, 0),
        // Convert numeric status to string value for API
        status: getStatusStringFromValue(numericStatus),
        // Ensure proper text fields
        notes: orderData.notes || '',
        shippingAddress: orderData.shippingAddress || '',
        shippingMethod: orderData.shippingMethod || '',
        trackingNumber: orderData.trackingNumber || '',
        currency: orderData.currency || 'USD',
        // Ensure items is always an array with required fields
        items: Array.isArray(orderData.items) ? orderData.items.map(item => {
          if (!item.productId) {
            console.error('Item missing productId:', item);
            throw new Error(`Order item missing required productId: ${JSON.stringify(item)}`);
          }
          
          return {
            // Ensure item productId and quantities are numeric
            productId: ensureNumber(item.productId, 0),
            quantity: ensureNumber(item.quantity, 1),
            unitPrice: ensureNumber(item.unitPrice, 0),
            discount: ensureNumber(item.discount, 0),
            // Ensure required fields are present
            description: item.description || item.name || `Product #${item.productId}`,
            taxRate: ensureNumber(item.taxRate, 0),
            createdBy: username
          };
        }) : [],
        // Use a validated username from token or AsyncStorage
        createdBy: username
      };
      
      // Final validation - check for invalid values
      if (sanitizedData.customerId <= 0) {
        throw new Error(`Invalid Customer ID: ${sanitizedData.customerId}`);
      }
      
      if (sanitizedData.companyId <= 0) {
        throw new Error(`Invalid Company ID: ${sanitizedData.companyId}`);
      }
      
      if (!Array.isArray(sanitizedData.items) || sanitizedData.items.length === 0) {
        throw new Error("Order items array is empty or invalid after sanitization");
      }
      
      // Validate items have required valid data
      sanitizedData.items.forEach((item, index) => {
        if (item.productId <= 0) {
          throw new Error(`Invalid Product ID for item at index ${index}: ${item.productId}`);
        }
        
        if (item.quantity <= 0) {
          throw new Error(`Invalid Quantity for item at index ${index}: ${item.quantity}`);
        }
      });
      
      console.log('Sending sanitized order data to API:', JSON.stringify(sanitizedData, null, 2));
      
      // Send the sanitized data to the API, wrapped in orderDto
      const response = await api.post('/Order', { orderDto: sanitizedData });
      
      console.log('API Response:', response.status, JSON.stringify(response.data).substring(0, 200));
      
      return {
        success: true,
        data: response.data,
        message: 'Order created successfully'
      };
    } catch (error) {
      console.error('Error creating order:', error);
      
      // Check specifically for the foreign key constraint error
      if (error.response && 
          error.response.status === 500 && 
          error.response.data && 
          error.response.data.message && 
          error.response.data.message.includes('FK_Orders_Users_CreatedBy')) {
        
        console.error('Foreign key constraint error on CreatedBy. The username does not exist in the database.');
        return {
          success: false,
          message: 'Error: The creator username is not valid in the system. Please log out and log back in.',
          error: {
            type: 'FOREIGN_KEY_CONSTRAINT',
            field: 'createdBy',
            details: 'The username does not exist in the database'
          }
        };
      }
      
      // Detailed error logging for better debugging
      let errorDetails = {
        message: error.message || 'Unknown error',
        stack: error.stack
      };
      
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        errorDetails.status = error.response.status;
        errorDetails.statusText = error.response.statusText;
        errorDetails.data = error.response.data;
        errorDetails.headers = error.response.headers;
        
        console.error('API Error Response:', 
          error.response.status,
          error.response.config?.url,
          JSON.stringify(error.response.data, null, 2)
        );
      } else if (error.request) {
        // The request was made but no response was received
        errorDetails.request = 'Request was made but no response received';
        console.error('API Request Error - No Response:',
          error.request._response || error.request
        );
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('API Request Setup Error:', error.message);
      }
      
      return {
        success: false,
        message: error.message || error.response?.data?.message || 'Failed to create order',
        error: error.response?.data || error.message,
        details: errorDetails
      };
    }
  },

  update: async (id, orderData) => {
    try {
      console.log('Updating order with data:', orderData);
      
      // Helper to convert status to string (same as in create method)
      const getStatusString = (status) => {
        if (typeof status === 'string') {
          return status;
        }
        
        const statusMap = {
          0: 'Draft',
          1: 'Pending',
          2: 'Confirmed',
          3: 'Shipped',
          4: 'Delivered',
          5: 'Cancelled',
          6: 'Completed'
        };
        
        return statusMap[status] || 'Draft';
      };
      
      // Format date properly to avoid Invalid Date errors
      const formatDate = (dateInput) => {
        if (!dateInput) return null;
        
        try {
          // If it's already in YYYY-MM-DD format
          if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
            // Return it in ISO format for the API
            const [year, month, day] = dateInput.split('-').map(Number);
            const date = new Date(year, month - 1, day, 12, 0, 0);
            if (!isNaN(date.getTime())) {
              return date.toISOString();
            }
          }
          
          // Try standard date parsing
          const date = new Date(dateInput);
          if (!isNaN(date.getTime())) {
            return date.toISOString();
          }
          
          return null;
        } catch (error) {
          console.error('Error formatting date:', error, dateInput);
          return null;
        }
      };
      
      // Get username (if available) for tracking
      const username = await AsyncStorage.getItem('username') || 'mobile_user';
      
      // Prepare the order items
      const prepareOrderItems = (items = []) => {
        return items.map(item => {
          return {
            id: item.id || null, // Include ID only if it exists
            productId: parseInt(item.productId) || 0,
            quantity: parseInt(item.quantity) || 1,
            unitPrice: parseFloat(item.unitPrice) || 0,
            description: item.description || item.name || item.productName || `Product #${item.productId}`,
            taxRate: parseFloat(item.taxRate) || 0,
            discount: parseFloat(item.discount) || 0,
            orderId: parseInt(id),
            updatedBy: username
          };
        });
      };
      
      // Process the order update with properly validated data
      const finalOrderData = {
        id: parseInt(id),
        customerId: parseInt(orderData.customerId),
        orderDate: formatDate(orderData.orderDate),
        dueDate: orderData.dueDate ? formatDate(orderData.dueDate) : null,
        // Convert status to numeric value for API enum
        status: typeof orderData.status === 'number' ? orderData.status :
               (typeof orderData.status === 'string' && !isNaN(parseInt(orderData.status))) ?
               parseInt(orderData.status) :
               (typeof orderData.status === 'string') ?
               Object.values(ORDER_STATUSES).find(s => s.label.toLowerCase() === orderData.status.toLowerCase())?.value || 0 : 0,
        notes: orderData.notes || '',
        shippingAddress: orderData.shippingAddress || '',
        shippingMethod: orderData.shippingMethod || '',
        shippingCost: parseFloat(orderData.shippingCost) || 0,
        trackingNumber: orderData.trackingNumber || '',
        currency: orderData.currency || 'USD',
        updatedBy: username,
        items: prepareOrderItems(orderData.items)
      };
      
      console.log('Sending update payload:', finalOrderData);
      
      const response = await api.put(`/Order/${id}`, finalOrderData);
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error(`Error updating order ${id}:`, error);
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
      // Use the getStatusStringFromValue helper just for logging
      const statusString = getStatusStringFromValue(status);
      
      // Convert to numeric status value for the API
      let numericStatus;
      
      if (typeof status === 'number') {
        numericStatus = status;
      } else if (typeof status === 'string') {
        if (!isNaN(parseInt(status))) {
          numericStatus = parseInt(status);
        } else {
          // Try to find the status by name
          const statusObj = Object.values(ORDER_STATUSES).find(s => 
            s.label.toLowerCase() === status.toLowerCase() || 
            s.stringValue.toLowerCase() === status.toLowerCase()
          );
          numericStatus = statusObj ? statusObj.value : 0;
        }
      } else {
        numericStatus = 0; // Default to Draft
      }
      
      console.log('Updating order status to:', {
        originalStatus: status,
        convertedStatus: statusString,
        numericValue: numericStatus
      });
      
      const response = await api.put(`/Order/${id}/status`, { statusDto: { Status: numericStatus } });
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
  },

  // Helper method to convert status value to string
  getStatusStringFromValue: (statusValue) => {
    return getStatusStringFromValue(statusValue);
  }
}; 