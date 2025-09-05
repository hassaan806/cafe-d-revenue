import axios from 'axios';

const api = axios.create({
  baseURL: 'https://03ksvhps-8000.inc1.devtunnels.ms',
  timeout: 10000, // 10 second timeout for better responsiveness
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false, // Disable credentials for CORS
});

// token management
api.interceptors.request.use(
  (config: any) => {
    console.log('Making API request:', config.method?.toUpperCase(), config.url);
    console.log('Full URL:', config.baseURL + config.url);
    const token = localStorage.getItem('authToken');
    console.log('Token from localStorage:', token ? 'FOUND' : 'NOT FOUND');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Token added to request');
    } else {
      console.log('No token found for request');
    }
    return config;
  },
  (error: any) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// error handling
api.interceptors.response.use(
  (response: any) => {
    console.log('API response received:', response.status, response.config.url);
    return response;
  },
  async (error: any) => {
    console.error('API response error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      data: error.response?.data,
      message: error.message
    });
    
    if (error.response?.status === 401) {
      //  redirect if not a login request
      if (error.config?.url !== '/auth/login') {
        console.log('401 error on non-login request, redirecting to login');
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        window.location.href = '/';
      } else {
        console.log('401 error on login request, not redirecting');
      }
    }
    
    //error messages for common issues
    if (error.code === 'ECONNABORTED') {
      error.userMessage = 'Request timed out. Please check your connection and try again.';
    } else if (!error.response) {
      error.userMessage = 'Network error. Please check your internet connection.';
    }
    
    return Promise.reject(error);
  }
);

// Aor failed requests
export const retryApiCall = async (apiCall: () => Promise<any>, retries = 1) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await apiCall();
    } catch (error: any) {
      if (i === retries - 1) throw error;
      console.log(`API call failed, retrying... (${i + 1}/${retries})`);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s only
    }
  }
};

// Standardized error handling
export const handleApiError = (error: any, defaultMessage: string): string => {
  if (error.response?.data?.detail?.[0]?.msg) {
    return error.response.data.detail[0].msg;
  }
  if (error.userMessage) {
    return error.userMessage;
  }
  if (error.message) {
    return error.message;
  }
  return defaultMessage;
};

export default api;
