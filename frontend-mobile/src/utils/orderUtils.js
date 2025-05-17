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

// Order status color mapping for UI
export const ORDER_STATUS_COLORS = {
  0: '#9ca3af', // Draft - Gray
  1: '#f59e0b', // Pending - Amber
  2: '#3b82f6', // Confirmed - Blue
  3: '#8b5cf6', // Shipped - Purple
  4: '#10b981', // Delivered - Green
  5: '#ef4444', // Cancelled - Red
  6: '#059669'  // Completed - Emerald
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
 * Get the status color for UI elements
 * @param {number|string} status - The status value (number or string representation)
 * @returns {string} The color hex code
 */
export const getStatusColor = (status) => {
  if (status === null || status === undefined) return '#9ca3af'; // Default gray
  
  // Convert string status to number if needed
  const statusNum = typeof status === 'string' ? parseInt(status, 10) : status;
  
  // Return corresponding color or default gray if not found
  return ORDER_STATUS_COLORS[statusNum] || '#9ca3af';
};

export default {
  ORDER_STATUS,
  ORDER_STATUS_NAMES,
  ORDER_STATUS_COLORS,
  getStatusName,
  getStatusColor
}; 