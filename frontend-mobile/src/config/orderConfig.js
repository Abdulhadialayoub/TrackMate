// Order Status Definitions
export const ORDER_STATUSES = {
  DRAFT: { value: 0, label: 'Draft', stringValue: 'Draft' },
  PENDING: { value: 1, label: 'Pending', stringValue: 'Pending' },
  CONFIRMED: { value: 2, label: 'Confirmed', stringValue: 'Confirmed' },
  SHIPPED: { value: 3, label: 'Shipped', stringValue: 'Shipped' },
  DELIVERED: { value: 4, label: 'Delivered', stringValue: 'Delivered' },
  CANCELLED: { value: 5, label: 'Cancelled', stringValue: 'Cancelled' },
  COMPLETED: { value: 6, label: 'Completed', stringValue: 'Completed' }
};

// Order Status Utilities
export const getStatusStringFromValue = (statusValue) => {
  if (typeof statusValue === 'string') {
    // Check if it's a numeric string
    if (!isNaN(parseInt(statusValue, 10))) {
      const numStatus = parseInt(statusValue, 10);
      return Object.values(ORDER_STATUSES).find(s => s.value === numStatus)?.stringValue || 'Draft';
    }
    return statusValue; // Return the string as is
  }
  
  // If it's a number, convert to string representation
  return Object.values(ORDER_STATUSES).find(s => s.value === statusValue)?.stringValue || 'Draft';
};

export const getStatusValueFromString = (statusString) => {
  if (typeof statusString === 'number') {
    return statusString; // Already a number, return as is
  }
  
  // Check if it's a numeric string
  if (!isNaN(parseInt(statusString, 10))) {
    return parseInt(statusString, 10);
  }
  
  // Look up the status value by string
  const status = Object.values(ORDER_STATUSES).find(
    s => s.stringValue.toLowerCase() === statusString.toLowerCase()
  );
  return status ? status.value : 0; // Default to Draft (0)
};

// Currency Options
export const CURRENCIES = [
  { value: 'USD', label: 'USD ($)', symbol: '$' },
  { value: 'EUR', label: 'EUR (€)', symbol: '€' },
  { value: 'GBP', label: 'GBP (£)', symbol: '£' },
  { value: 'TRY', label: 'TRY (₺)', symbol: '₺' }
];

// Default Values
export const DEFAULT_ORDER = {
  customerId: null,
  companyId: 2, // Default company ID
  orderDate: new Date().toISOString(),
  dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from today
  status: "Draft", // Always use string value for API
  shippingCost: 0,
  taxRate: 0,
  currency: 'USD',
  notes: '',
  items: []
};

// Field Validation Rules
export const VALIDATION_RULES = {
  customerId: { required: true, type: 'number' },
  companyId: { required: true, type: 'number' },
  orderDate: { required: true, type: 'date' },
  dueDate: { required: true, type: 'date' },
  status: { required: true, type: 'string' },
  shippingCost: { required: false, type: 'number', min: 0 },
  taxRate: { required: false, type: 'number', min: 0, max: 100 },
  currency: { required: true, type: 'string' },
  items: { required: true, minLength: 1 }
};

// API Field Mappings (from form fields to API expected fields)
export const API_FIELD_MAPPING = {
  status: (value) => getStatusStringFromValue(value),
  customerId: (value) => parseInt(value, 10),
  companyId: (value) => parseInt(value, 10),
  shippingCost: (value) => parseFloat(value || 0),
  taxRate: (value) => parseFloat(value || 0)
};

export default {
  ORDER_STATUSES,
  getStatusStringFromValue,
  getStatusValueFromString,
  CURRENCIES,
  DEFAULT_ORDER,
  VALIDATION_RULES,
  API_FIELD_MAPPING
}; 