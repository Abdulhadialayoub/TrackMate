import apiClient from './apiClient';
import * as SecureStore from 'expo-secure-store';
import { LoginRequest, AuthResponse, UserInfo } from '../types/AuthTypes';
import API_CONFIG from '../config/api';

class AuthService {
  // Login user and store tokens
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      console.log(`Attempting login for user: ${credentials.username}`);
      console.log(`API endpoint: ${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.LOGIN}`);
      
      const response = await apiClient.post<AuthResponse>(
        API_CONFIG.ENDPOINTS.AUTH.LOGIN, 
        {
          email: credentials.username,
          password: credentials.password
        }
      );
      
      console.log('Login response status:', response.status);
      
      await this.storeTokens(response.data);
      return response.data;
    } catch (error: any) {
      console.error('Login error details:', error?.response?.data || error.message || 'Unknown error');
      throw error;
    }
  }

  // Register a new user
  async register(userData: {
    firstName: string;
    lastName: string;
    email: string;
    username: string;
    password: string;
    phone: string;
  }): Promise<AuthResponse> {
    try {
      // Convert to API format
      const registerData = {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        password: userData.password,
        companyName: `${userData.firstName}'s Company` // Default company name
      };
      
      const response = await apiClient.post<AuthResponse>(
        API_CONFIG.ENDPOINTS.AUTH.REGISTER, 
        registerData
      );
      await this.storeTokens(response.data);
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  // Store authentication tokens in secure storage
  private async storeTokens(authData: AuthResponse): Promise<void> {
    try {
      await SecureStore.setItemAsync('auth_token', authData.token);
      await SecureStore.setItemAsync('refresh_token', authData.refreshToken);
      await SecureStore.setItemAsync('user_id', authData.user.id.toString());
      await SecureStore.setItemAsync('user_role', authData.user.role);
    } catch (error) {
      console.error('Error storing auth tokens:', error);
      throw error;
    }
  }

  // Get current user info
  async getCurrentUser(): Promise<UserInfo | null> {
    try {
      const userId = await SecureStore.getItemAsync('user_id');
      if (!userId) return null;
      
      const response = await apiClient.get<UserInfo>(
        API_CONFIG.ENDPOINTS.USER.GET_BY_ID(parseInt(userId))
      );
      return response.data;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) return false;
      
      // Validate token with the backend
      const response = await apiClient.get<boolean>(
        API_CONFIG.ENDPOINTS.AUTH.VALIDATE_TOKEN
      );
      return response.data;
    } catch (error) {
      console.error('Error checking authentication status:', error);
      return false;
    }
  }

  // Get user role
  async getUserRole(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync('user_role');
    } catch (error) {
      console.error('Error getting user role:', error);
      return null;
    }
  }

  // Logout user and clear tokens
  async logout(): Promise<void> {
    try {
      // Call logout endpoint
      await apiClient.post(API_CONFIG.ENDPOINTS.AUTH.LOGOUT);
      
      // Clear tokens from secure storage
      await SecureStore.deleteItemAsync('auth_token');
      await SecureStore.deleteItemAsync('refresh_token');
      await SecureStore.deleteItemAsync('user_id');
      await SecureStore.deleteItemAsync('user_role');
    } catch (error) {
      console.error('Error during logout:', error);
      throw error;
    }
  }
}

export default new AuthService(); 