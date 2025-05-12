// Export all services from api.js
import api, {
  authService,
  userService,
  productService,
  customerService,
  invoiceService,
  categoryService,
  dashboardService,
  devPanelService,
  updateApiBaseUrl
} from './api';

// Import our standalone orderService
import { orderService, getStatusStringFromValue } from './orderService';

// Export everything
export {
  api,
  authService,
  userService,
  productService,
  customerService,
  orderService,
  getStatusStringFromValue,
  invoiceService,
  categoryService,
  dashboardService,
  devPanelService,
  updateApiBaseUrl
};