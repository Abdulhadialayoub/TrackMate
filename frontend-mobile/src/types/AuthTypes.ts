export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  expiresAt: string;
  user: UserInfo;
  permissions: string[];
}

export interface UserInfo {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  phone: string;
  companyId: number;
  role: string;
  isActive: boolean;
  company?: CompanyInfo;
}

export interface CompanyInfo {
  id: number;
  name: string;
  email: string;
  phone: string;
  website?: string;
  address?: string;
  taxNumber?: string;
  taxOffice?: string;
  isActive: boolean;
} 