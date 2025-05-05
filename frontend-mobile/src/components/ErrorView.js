import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

/**
 * A reusable error display component
 * 
 * @param {Object} props
 * @param {string} props.message - Error message to display
 * @param {Function} props.onRetry - Function to call when retry button is pressed
 * @param {string} props.retryButtonText - Text for the retry button (default: "Retry")
 * @param {string} props.icon - Icon name to display (default: "alert-circle-outline")
 * @param {string} props.iconColor - Color of the icon (default: "#ef4444")
 * @param {Object} props.style - Additional styles for the container
 */
const ErrorView = ({ 
  message,
  onRetry,
  retryButtonText = "Retry",
  icon = "alert-circle-outline",
  iconColor = "#ef4444",
  style
}) => {
  return (
    <View style={[styles.container, style]}>
      <MaterialCommunityIcons name={icon} size={50} color={iconColor} />
      <Text style={styles.errorText}>{message}</Text>
      {onRetry && (
        <Button 
          mode="contained" 
          onPress={onRetry}
          style={styles.retryButton}
          color="#0284c7"
        >
          {retryButtonText}
        </Button>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f9fafb',
  },
  errorText: {
    marginTop: 10,
    marginBottom: 20,
    fontSize: 16,
    color: '#4b5563',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 10,
  },
});

export default ErrorView; 