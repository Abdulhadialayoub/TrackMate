// Export all services from api.js
import api, {
  authService,
  userService,
  productService,
  customerService,
  categoryService,
  dashboardService,
  devPanelService,
  messageService,
  updateApiBaseUrl
} from './api';

// Import our standalone services
import { orderService, getStatusStringFromValue } from './orderService';
import { invoiceService } from './invoiceService';
import {aiService} from './aiService';
// Export everything
export {
  api,
  authService,
  aiService,
  userService,
  productService,
  customerService,
  orderService,
  getStatusStringFromValue,
  invoiceService,
  categoryService,
  dashboardService,
  devPanelService,
  messageService,
  updateApiBaseUrl
};

