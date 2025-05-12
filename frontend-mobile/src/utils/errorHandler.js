import { Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';

// Utility to log errors to file for debugging
export const logErrorToFile = async (error, context = 'general') => {
  try {
    const timestamp = new Date().toISOString();
    const logDir = `${FileSystem.documentDirectory}logs/`;
    const logFile = `${logDir}error_log.txt`;
    
    // Create logs directory if it doesn't exist
    const dirInfo = await FileSystem.getInfoAsync(logDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(logDir, { intermediates: true });
    }
    
    // Format error details
    let errorDetails = '';
    
    // Add context and timestamp
    errorDetails += `[${timestamp}] [${context}]\n`;
    
    // Add error message and stack trace
    if (typeof error === 'object') {
      errorDetails += `Message: ${error.message || 'Unknown error'}\n`;
      if (error.stack) {
        errorDetails += `Stack: ${error.stack}\n`;
      }
      
      // Add axios response data if available
      if (error.response) {
        errorDetails += `Status: ${error.response.status}\n`;
        errorDetails += `Data: ${JSON.stringify(error.response.data, null, 2)}\n`;
      }
      
      // Add other properties
      errorDetails += `Details: ${JSON.stringify(error, (key, value) => {
        // Skip circular references and verbose properties
        if (key === 'stack' || key === 'response' || key === 'request') return undefined;
        return value;
      }, 2)}\n`;
    } else {
      errorDetails += `Error: ${error}\n`;
    }
    
    // Add separator
    errorDetails += '-------------------------------------------\n';
    
    // Check if file exists
    const fileInfo = await FileSystem.getInfoAsync(logFile);
    
    if (fileInfo.exists) {
      // Append to existing log file
      await FileSystem.writeAsStringAsync(
        logFile,
        errorDetails,
        { encoding: FileSystem.EncodingType.UTF8, append: true }
      );
    } else {
      // Create new log file
      await FileSystem.writeAsStringAsync(
        logFile,
        errorDetails,
        { encoding: FileSystem.EncodingType.UTF8 }
      );
    }
    
    console.log(`Error logged to file: ${logFile}`);
    return true;
  } catch (logError) {
    console.error('Failed to log error to file:', logError);
    return false;
  }
};

// Handle API errors with user-friendly messages
export const handleApiError = (error, context = 'API Request') => {
  // Log error to file
  logErrorToFile(error, context);
  
  // Determine user-friendly message based on error
  let userMessage = 'An unexpected error occurred. Please try again.';
  
  if (error.response) {
    // Server responded with error
    switch (error.response.status) {
      case 400:
        userMessage = 'The request was invalid. Please check your input and try again.';
        
        // Check for validation errors
        if (error.response.data && error.response.data.errors) {
          const errorMessages = Object.values(error.response.data.errors)
            .flat()
            .join('\n• ');
          
          if (errorMessages) {
            userMessage = `Validation errors:\n• ${errorMessages}`;
          }
        }
        break;
        
      case 401:
        userMessage = 'Your session has expired. Please log in again.';
        break;
        
      case 403:
        userMessage = 'You do not have permission to perform this action.';
        break;
        
      case 404:
        userMessage = 'The requested resource was not found.';
        break;
        
      case 500:
        userMessage = 'A server error occurred. Our team has been notified.';
        
        // Special handling for order creation
        if (context === 'Order Creation') {
          userMessage = 'Failed to create order due to a server error. Please verify all order details and try again.';
        }
        break;
        
      default:
        userMessage = `Server error (${error.response.status}). Please try again later.`;
    }
  } else if (error.request) {
    // Request made but no response
    userMessage = 'Network connection issue. Please check your internet connection and try again.';
  } else {
    // Error in setting up request
    userMessage = `Request failed: ${error.message}`;
  }
  
  return {
    show: (title = 'Error') => {
      Alert.alert(
        title,
        userMessage,
        [{ text: 'OK' }],
        { cancelable: true }
      );
    },
    message: userMessage,
    error
  };
};

// Specialized error handler for order errors
export const handleOrderError = (error) => {
  return handleApiError(error, 'Order Creation');
};

export default {
  logErrorToFile,
  handleApiError,
  handleOrderError
}; 