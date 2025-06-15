/**
 * Order-related utility functions
 */

// Order status mappings that match backend OrderStatus.cs enum
export const ORDER_STATUS = {
  DRAFT: 0,
  PENDING: 1,
  CONFIRMED: 2,
  SHIPPED: 3,
  DELIVERED: 4,
  CANCELLED: 5,
  COMPLETED: 6
};

// Order status name mapping
export const ORDER_STATUS_NAMES = {
  0: 'Draft',
  1: 'Pending',
  2: 'Confirmed',
  3: 'Shipped',
  4: 'Delivered',
  5: 'Cancelled',
  6: 'Completed'
};

// Order status color mapping for MUI
export const ORDER_STATUS_COLORS = {
  0: 'default', // Draft
  1: 'warning',  // Pending
  2: 'info',     // Confirmed
  3: 'primary',  // Shipped
  4: 'success',  // Delivered
  5: 'error',    // Cancelled
  6: 'secondary' // Completed
};

// Order status color mapping for CSS
export const ORDER_STATUS_HEX_COLORS = {
  0: '#9e9e9e', // Draft - Gray
  1: '#ff9800', // Pending - Amber
  2: '#2196f3', // Confirmed - Blue
  3: '#673ab7', // Shipped - Purple
  4: '#4caf50', // Delivered - Green
  5: '#f44336', // Cancelled - Red
  6: '#9c27b0'  // Completed - Purple
};

/**
 * Get the status name from a numerical status value
 * @param {number|string} status - The status value (number or string representation)
 * @returns {string} The status name
 */
export const getStatusName = (status) => {
  if (status === null || status === undefined) return 'Unknown';
  
  // Convert string status to number if needed
  const statusNum = typeof status === 'string' ? parseInt(status, 10) : status;
  
  // Return corresponding status name or Unknown if not found
  return ORDER_STATUS_NAMES[statusNum] || 'Unknown';
};

/**
 * Get the status color for MUI components
 * @param {number|string} status - The status value (number or string representation)
 * @returns {string} The MUI color name
 */
export const getStatusColor = (status) => {
  if (status === null || status === undefined) return 'default';
  
  // Convert string status to number if needed
  const statusNum = typeof status === 'string' ? parseInt(status, 10) : status;
  
  // Return corresponding color or default if not found
  return ORDER_STATUS_COLORS[statusNum] || 'default';
};

/**
 * Get the status hex color for custom styling
 * @param {number|string} status - The status value (number or string representation)
 * @returns {string} The color hex code
 */
export const getStatusHexColor = (status) => {
  if (status === null || status === undefined) return '#9e9e9e';
  
  // Convert string status to number if needed
  const statusNum = typeof status === 'string' ? parseInt(status, 10) : status;
  
  // Return corresponding color or default gray if not found
  return ORDER_STATUS_HEX_COLORS[statusNum] || '#9e9e9e';
};

export default {
  ORDER_STATUS,
  ORDER_STATUS_NAMES,
  ORDER_STATUS_COLORS,
  ORDER_STATUS_HEX_COLORS,
  getStatusName,
  getStatusColor,
  getStatusHexColor
}; 