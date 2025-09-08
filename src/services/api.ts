import axios from 'axios';

const api = axios.create({
  baseURL: '/api', // Use proxy path instead of direct backend URL
  timeout: 30000, // Increased timeout to 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// token management
api.interceptors.request.use(
  (config: any) => {
    console.log('Making API request:', config.method?.toUpperCase(), config.url);
    console.log('Full URL:', config.baseURL + config.url);
    const token = localStorage.getItem('authToken');
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
  (error: any) => {
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
    return Promise.reject(error);
  }
);

export default api;
