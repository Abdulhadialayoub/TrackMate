import apiClient from './apiClient';
import { UserInfo } from '../types/AuthTypes';
import API_CONFIG from '../config/api';

class UserService {
  // Get all users (requires Dev or Admin role)
  async getUsers(): Promise<UserInfo[]> {
    try {
      const response = await apiClient.get<UserInfo[]>('/User');
      return response.data;
    } catch (error) {
      console.error('Error getting users:', error);
      throw error;
    }
  }

  // Get users by company ID (requires Admin role)
  async getUsersByCompanyId(companyId: number): Promise<UserInfo[]> {
    try {
      const response = await apiClient.get<UserInfo[]>(`/User/company/${companyId}`);
      return response.data;
    } catch (error) {
      console.error(`Error getting users for company ${companyId}:`, error);
      throw error;
    }
  }

  // Get user by ID
  async getUserById(id: number): Promise<UserInfo> {
    try {
      const response = await apiClient.get<UserInfo>(
        API_CONFIG.ENDPOINTS.USER.GET_BY_ID(id)
      );
      return response.data;
    } catch (error) {
      console.error(`Error getting user with ID ${id}:`, error);
      throw error;
    }
  }

  // Create new user (requires Dev or Admin role)
  async createUser(userData: Omit<UserInfo, 'id'>): Promise<UserInfo> {
    try {
      const response = await apiClient.post<UserInfo>('/User', userData);
      return response.data;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  // Update user profile
  async updateUser(id: number, userData: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  }): Promise<UserInfo> {
    try {
      const response = await apiClient.put<UserInfo>(
        API_CONFIG.ENDPOINTS.USER.UPDATE(id),
        userData
      );
      return response.data;
    } catch (error) {
      console.error(`Error updating user with ID ${id}:`, error);
      throw error;
    }
  }

  // Update user password
  async updatePassword(id: number, currentPassword: string, newPassword: string): Promise<void> {
    try {
      await apiClient.put(
        API_CONFIG.ENDPOINTS.USER.UPDATE_PASSWORD(id),
        {
          currentPassword,
          newPassword
        }
      );
    } catch (error) {
      console.error(`Error updating password for user with ID ${id}:`, error);
      throw error;
    }
  }

  // Get company information
  async getCompanyInfo(companyId: number): Promise<any> {
    try {
      const response = await apiClient.get(
        API_CONFIG.ENDPOINTS.COMPANY.GET_BY_ID(companyId)
      );
      return response.data;
    } catch (error) {
      console.error(`Error getting company with ID ${companyId}:`, error);
      throw error;
    }
  }

  // Delete user (soft delete, requires Dev role)
  async deleteUser(userId: number): Promise<boolean> {
    try {
      await apiClient.delete(`/User/${userId}`);
      return true;
    } catch (error) {
      console.error(`Error deleting user ${userId}:`, error);
      throw error;
    }
  }
}

export default new UserService(); 