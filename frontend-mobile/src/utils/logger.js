/**
 * Logger utility for debugging
 */

// Set this to false in production
const DEBUG_ENABLED = true;

/**
 * Log levels
 */
const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

// Current log level
const CURRENT_LOG_LEVEL = LOG_LEVELS.DEBUG;

/**
 * Format log message with timestamp and component name
 * @param {string} level - Log level
 * @param {string} component - Component name
 * @param {string} message - Log message
 * @returns {string} Formatted log message
 */
const formatLogMessage = (level, component, message) => {
  const timestamp = new Date().toISOString();
  return `[${timestamp}][${level}][${component}] ${message}`;
};

/**
 * Log debug message
 * @param {string} component - Component name
 * @param {string} message - Log message
 * @param {any} data - Additional data to log (optional)
 */
export const debug = (component, message, data) => {
  if (!DEBUG_ENABLED || CURRENT_LOG_LEVEL > LOG_LEVELS.DEBUG) return;
  const formattedMessage = formatLogMessage('DEBUG', component, message);
  console.log(formattedMessage);
  if (data !== undefined) {
    console.log(data);
  }
};

/**
 * Log info message
 * @param {string} component - Component name
 * @param {string} message - Log message
 * @param {any} data - Additional data to log (optional)
 */
export const info = (component, message, data) => {
  if (!DEBUG_ENABLED || CURRENT_LOG_LEVEL > LOG_LEVELS.INFO) return;
  const formattedMessage = formatLogMessage('INFO', component, message);
  console.log(formattedMessage);
  if (data !== undefined) {
    console.log(data);
  }
};

/**
 * Log warning message
 * @param {string} component - Component name
 * @param {string} message - Log message
 * @param {any} data - Additional data to log (optional)
 */
export const warn = (component, message, data) => {
  if (!DEBUG_ENABLED || CURRENT_LOG_LEVEL > LOG_LEVELS.WARN) return;
  const formattedMessage = formatLogMessage('WARN', component, message);
  console.warn(formattedMessage);
  if (data !== undefined) {
    console.warn(data);
  }
};

/**
 * Log error message
 * @param {string} component - Component name
 * @param {string} message - Log message
 * @param {Error|any} error - Error object or additional data
 */
export const error = (component, message, error) => {
  if (!DEBUG_ENABLED || CURRENT_LOG_LEVEL > LOG_LEVELS.ERROR) return;
  const formattedMessage = formatLogMessage('ERROR', component, message);
  console.error(formattedMessage);
  
  if (error) {
    // If error is an API error with response
    if (error.response) {
      console.error({
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
    } else if (error instanceof Error) {
      console.error(error.message);
      console.error(error.stack);
    } else {
      console.error(error);
    }
  }
};

/**
 * Get user-friendly error message
 * @param {Error} err - Error object
 * @param {string} defaultMessage - Default message if none can be extracted
 * @returns {string} User-friendly error message
 */
export const getUserFriendlyErrorMessage = (err, defaultMessage = 'An error occurred') => {
  if (!err) return defaultMessage;
  
  // API error with status code
  if (err.response) {
    const status = err.response.status;
    
    // Common HTTP status codes
    if (status === 400) return err.response.data?.message || 'Invalid request';
    if (status === 401) return 'Authentication error. Please log in again.';
    if (status === 403) return 'You don\'t have permission to access this resource.';
    if (status === 404) return 'The requested resource was not found.';
    if (status === 500) return 'Server error. Please try again later.';
    
    // Other status codes
    return err.response.data?.message || `Server error (${status})`;
  }
  
  // Network errors
  if (err.message === 'Network Error') {
    return 'Network error. Please check your internet connection.';
  }
  
  // Generic error
  return err.message || defaultMessage;
};

export default {
  debug,
  info,
  warn,
  error,
  getUserFriendlyErrorMessage
}; 