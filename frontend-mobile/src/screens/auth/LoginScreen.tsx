import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { TextInput, Button, Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import authService from '../../services/authService';
import { LoginRequest } from '../../types/AuthTypes';
import axios from 'axios';
import API_CONFIG from '../../config/api';

const LoginScreen = ({ navigation }: any) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const theme = useTheme();

  const handleLogin = async () => {
    if (!username || !password) {
      setError('Username and password are required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('Attempting login with authService...');
      await authService.login({ username, password });
      console.log('Login successful!');
      // Navigation will be handled by the navigator
    } catch (error: any) {
      console.error('Login failed', error);
      
      // Show a more specific error message based on the type of error
      if (error.message === 'Network Error') {
        setError('Network connection error. Please check your internet connection and try again.');
      } else if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        const serverError = error.response.data?.message || `Server error: ${error.response.status}`;
        setError(serverError);
      } else if (error.request) {
        // The request was made but no response was received
        setError('No response from server. Please try again later.');
      } else {
        // Something happened in setting up the request that triggered an Error
        setError(error.message || 'An error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Function to test API connectivity
  const testApiConnection = async () => {
    try {
      setLoading(true);
      setError('');
      Alert.alert('Testing Connection', `Connecting to: ${API_CONFIG.BASE_URL}`);
      
      // Try a simple GET request to the API base URL
      const response = await axios.get(API_CONFIG.BASE_URL.replace('/api', '/swagger'), {
        timeout: 5000,
      });
      
      Alert.alert('Connection Successful', `Status: ${response.status}`);
    } catch (error: any) {
      console.error('API test failed:', error);
      Alert.alert(
        'Connection Failed', 
        `Error: ${error.message}\nPlease check server URL and make sure backend is running.`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <View style={styles.content}>
          <Text variant="headlineMedium" style={styles.title}>
            Welcome to TrackMate
          </Text>
          
          {error ? (
            <Text style={[styles.error, { color: theme.colors.error }]}>
              {error}
            </Text>
          ) : null}

          <TextInput
            label="Username"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            style={styles.input}
          />

          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
          />

          <Button
            mode="contained"
            onPress={handleLogin}
            loading={loading}
            disabled={loading}
            style={styles.button}
          >
            Login
          </Button>

          <Button
            mode="text"
            onPress={() => navigation.navigate('Register')}
            style={styles.linkButton}
          >
            Don't have an account? Register
          </Button>
          
          <Button
            mode="outlined"
            onPress={testApiConnection}
            style={styles.testButton}
          >
            Test API Connection
          </Button>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: 30,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
    padding: 4,
  },
  linkButton: {
    marginTop: 16,
  },
  error: {
    textAlign: 'center',
    marginBottom: 16,
  },
  testButton: {
    marginTop: 16,
  },
});

export default LoginScreen; 