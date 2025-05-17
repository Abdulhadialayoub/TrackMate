import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/api';
import { STORAGE_KEYS, KEYS_TO_CLEAR_ON_LOGOUT } from '../config/constants';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  useEffect(() => {
    // Uygulama başladığında kullanıcı oturumunu kontrol et
    const checkUserSession = async () => {
      try {
        const userJson = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
        const storedToken = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
        
        if (userJson && storedToken) {
          setUser(JSON.parse(userJson));
          setToken(storedToken);
          
          // Token geçerliliğini kontrol et
          try {
            await authService.validateToken();
          } catch (error) {
            // Token geçersizse kullanıcıyı çıkış yaptır
            console.log('Token validation failed, logging out');
            await logout();
          }
        }
      } catch (error) {
        console.error('Failed to load user from storage', error);
      } finally {
        setLoading(false);
      }
    };

    checkUserSession();
  }, []);

  const login = async (email, password) => {
    try {
      setLoading(true);
      
      // API'ye login isteği gönder
      const data = await authService.login(email, password);
      
      // Token ve kullanıcı bilgilerini kaydet
      await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, data.token);
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(data.user));
      
      // Username and company ID için ayrıca sakla
      if (data.user.username || data.user.email) {
        await AsyncStorage.setItem(STORAGE_KEYS.USERNAME, data.user.username || data.user.email);
      }
      
      if (data.user.companyId) {
        await AsyncStorage.setItem(STORAGE_KEYS.COMPANY_ID, data.user.companyId.toString());
      }
      
      setToken(data.token);
      setUser(data.user);
      
      return data.user;
    } catch (error) {
      console.error('Login error', error.response?.data || error.message);
      throw error.response?.data?.message || 'Giriş başarısız oldu';
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      
      // API'ye register isteği gönder
      const data = await authService.register(userData);
      
      // Token ve kullanıcı bilgilerini kaydet
      await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, data.token);
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(data.user));
      
      // Username and company ID için ayrıca sakla
      if (data.user.username || data.user.email) {
        await AsyncStorage.setItem(STORAGE_KEYS.USERNAME, data.user.username || data.user.email);
      }
      
      if (data.user.companyId) {
        await AsyncStorage.setItem(STORAGE_KEYS.COMPANY_ID, data.user.companyId.toString());
      }
      
      setToken(data.token);
      setUser(data.user);
      
      return data.user;
    } catch (error) {
      console.error('Register error', error.response?.data || error.message);
      throw error.response?.data?.message || 'Kayıt başarısız oldu';
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      
      // Tüm gerekli verileri temizle
      for (const key of KEYS_TO_CLEAR_ON_LOGOUT) {
        await AsyncStorage.removeItem(key);
      }
      
      setToken(null);
      setUser(null);
    } catch (error) {
      console.error('Logout error', error);
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = async (email) => {
    try {
      setLoading(true);
      
      // API'ye şifre sıfırlama isteği gönder
      await authService.forgotPassword(email);
      
      return true;
    } catch (error) {
      console.error('Forgot password error', error.response?.data || error.message);
      throw error.response?.data?.message || 'Şifre sıfırlama isteği başarısız oldu';
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (token, newPassword) => {
    try {
      setLoading(true);
      
      // API'ye yeni şifre isteği gönder
      await authService.resetPassword(token, newPassword);
      
      return true;
    } catch (error) {
      console.error('Reset password error', error.response?.data || error.message);
      throw error.response?.data?.message || 'Şifre değiştirme başarısız oldu';
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        loading,
        login,
        register,
        logout,
        forgotPassword,
        resetPassword,
        isAuthenticated: !!user,
        token
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};