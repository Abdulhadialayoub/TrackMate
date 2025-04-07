import apiClient from './apiClient';
import { CompanyInfo } from '../types/AuthTypes';

class CompanyService {
  // Get all companies (requires Dev role)
  async getCompanies(): Promise<CompanyInfo[]> {
    try {
      const response = await apiClient.get<CompanyInfo[]>('/Company');
      return response.data;
    } catch (error) {
      console.error('Error getting companies:', error);
      throw error;
    }
  }

  // Get company by ID
  async getCompanyById(companyId: number): Promise<CompanyInfo> {
    try {
      const response = await apiClient.get<CompanyInfo>(`/Company/${companyId}`);
      return response.data;
    } catch (error) {
      console.error(`Error getting company ${companyId}:`, error);
      throw error;
    }
  }

  // Create new company (requires Dev role)
  async createCompany(companyData: Omit<CompanyInfo, 'id'>): Promise<CompanyInfo> {
    try {
      const response = await apiClient.post<CompanyInfo>('/Company', companyData);
      return response.data;
    } catch (error) {
      console.error('Error creating company:', error);
      throw error;
    }
  }

  // Update company (requires Dev role)
  async updateCompany(companyId: number, companyData: Partial<CompanyInfo>): Promise<CompanyInfo> {
    try {
      const response = await apiClient.put<CompanyInfo>(`/Company/${companyId}`, companyData);
      return response.data;
    } catch (error) {
      console.error(`Error updating company ${companyId}:`, error);
      throw error;
    }
  }

  // Delete company (soft delete, requires Dev role)
  async deleteCompany(companyId: number): Promise<boolean> {
    try {
      await apiClient.delete(`/Company/${companyId}`);
      return true;
    } catch (error) {
      console.error(`Error deleting company ${companyId}:`, error);
      throw error;
    }
  }
}

export default new CompanyService(); 