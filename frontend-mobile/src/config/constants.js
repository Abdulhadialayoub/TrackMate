// API Configuration
//https://wren-integral-lionfish.ngrok-free.app/api
export const BASE_URL = 'http://192.168.122.28:5105/api';

// App Configuration
export const APP_VERSION = '1.0.0';
export const APP_PLATFORM = 'android';

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_DATA: 'user',
  COMPANY_ID: 'company_id',
  USERNAME: 'username',
  SETTINGS: 'app_settings',
  LAST_LOGIN: 'last_login',
  USER_PREFERENCES: 'user_preferences',
  CACHED_DATA: 'cached_data'
};

// Keys to clear on logout
export const KEYS_TO_CLEAR_ON_LOGOUT = [
  STORAGE_KEYS.AUTH_TOKEN,
  STORAGE_KEYS.USER_DATA,
  STORAGE_KEYS.COMPANY_ID,
  STORAGE_KEYS.USERNAME,
  STORAGE_KEYS.LAST_LOGIN,
  STORAGE_KEYS.CACHED_DATA
];

// Default Values
