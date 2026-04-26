import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '../store/useStore';
import { captureException } from '@sentry/react';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/',
  timeout: 10000,
});

// Request Interceptor: Attach Auth Token
api.interceptors.request.use(
  config => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Track retry count
    config._retryCount = config._retryCount || 0;
    return config;
  },
  error => Promise.reject(error)
);

// Response Interceptor: Standardized Data Extraction & Error Handling
api.interceptors.response.use(
  response => {
    // If the response follows our standard {success, message, data} format
    if (response.data && response.data.success === true) {
      return {
        ...response,
        data: response.data.data !== undefined ? response.data.data : response.data
      };
    }
    return response;
  },
  async error => {
    const config = error.config;
    const status = error.response?.status;
    
    // Improved Error Extraction
    let message = "An unexpected error occurred";
    if (error.response?.data) {
      if (typeof error.response.data.message === 'string') {
        message = error.response.data.message;
      } else if (typeof error.response.data.detail === 'string') {
        message = error.response.data.detail;
      } else if (Array.isArray(error.response.data.detail)) {
        // Handle FastAPI validation error list
        const first = error.response.data.detail[0];
        message = first.msg ? `${first.loc.join('.')}: ${first.msg}` : "Validation failed";
      }
    } else if (error.request && !error.response) {
      message = "Connection failure. Please check your internet.";
    }

    // implement controlled retry logic (max 2 times) for transient errors (502, 503, 504)
    if ((status === 502 || status === 503 || status === 504 || !status) && config._retryCount < 2) {
      config._retryCount += 1;
      const delay = config._retryCount * 1500;
      toast.loading(`Connection glitch. Retrying... (Attempt ${config._retryCount})`, { id: 'retry-toast', duration: 2000 });
      await new Promise(resolve => setTimeout(resolve, delay));
      return api(config);
    }

    // Track error in Sentry
    if (status >= 400) {
      captureException(error, { 
        url: config?.url,
        status: status,
        message: message
      });
    }
    
    const isLoginRequest = config?.url?.includes('auth/login');
    const isMeRequest = config?.url?.includes('auth/me');
    
    if (status === 401 && !isLoginRequest && !isMeRequest) {
      toast.error("Session expired. Please log in again.", { id: 'auth-error' });
      useAuthStore.getState().logout();
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    } else if (status === 403) {
      toast.error("Access denied. Admin privileges required.", { id: 'forbidden-error' });
    } else if (status >= 500) {
      toast.error("Server is currently busy. Please try again later.", { id: 'server-error' });
    } else if ((status !== 401 || !isLoginRequest) && !isMeRequest) {
      // Use message as toast ID to prevent duplicates of the same error
      toast.error(message, { id: message });
    }
    
    return Promise.reject(error);
  }
);

export const authService = {
  login: (credentials) => api.post('auth/login', credentials),
  register: (userData) => api.post('auth/register', userData),
  getMe: () => api.get('auth/me'),
  changePassword: (passwordData) => api.put('auth/change-password', passwordData)
};

export const userService = {
  getAddresses: () => api.get('user/addresses'),
  addAddress: (address) => api.post('user/address', address),
  updateAddress: (id, address) => api.put(`user/address/${id}`, address),
  deleteAddress: (id) => api.delete(`user/address/${id}`),
  setDefaultAddress: (id) => api.patch(`user/address/${id}/default`)
};

export const productService = {
  getProducts: () => api.get('products/'),
  createProduct: (formData) => api.post('products/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteProduct: (id) => api.delete(`products/${id}`)
};

export const orderService = {
  createOrder: (orderData) => api.post('orders/', orderData),
  getOrders: () => api.get('orders/'),
  getMyOrders: () => api.get('orders/my-orders'),
  getMetrics: () => api.get('orders/metrics'),
  exportOrders: () => api.get('orders/export', { responseType: 'blob' }),
  updateStatus: (id, status) => api.patch(`orders/${id}/status?status=${status}`),
  trackOrder: (id, phone) => api.get(`orders/track/${id}?phone=${phone}`),
  cancelOrder: (id) => api.post(`orders/${id}/cancel`),
  reorder: (orderId) => api.post(`orders/reorder/${orderId}`)
};

export const contactService = {
  sendEnquiry: (formData) => api.post('enquiry/', formData)
};

export default api;
