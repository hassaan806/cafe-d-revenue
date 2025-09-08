import api from './api';

// Types for API responses
export interface LoginRequest {
  username_or_email: string;
  password: string;
}

export interface LoginResponse {
  auth_token: string;
  token_type: string;
}

export interface User {
  username: string;
  email: string;
  id: number;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApiError {
  detail: Array<{
    loc: (string | number)[];
    msg: string;
    type: string;
  }>;
}

// Test API connection
export const testApiConnection = async (): Promise<boolean> => {
  try {
    console.log('Testing API connection through proxy: /api/health');
  
    const response = await api.get('/health');
    console.log('API connection test response:', response.status);
    return true;
  } catch (error: any) {
    console.error('API connection test failed:', error);
    console.error('Error details:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    return false;
  }
};

// Test login 
export const testLoginEndpoint = async (): Promise<boolean> => {
  try {
    console.log('Testing login endpoint...');
    // to see if the endpoint responds
    const response = await api.post('/auth/login', {
      username_or_email: 'test',
      password: 'test'
    });
    console.log('Login endpoint test response:', response.status);
    return true;
  } catch (error: any) {
    console.error('Login endpoint test failed:', error);
    console.error('Error details:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      code: error.code
    });
    return false;
  }
};

// Test login function
export const testLogin = async (username: string, password: string) => {
  try {
    console.log('Testing login with:', username);
    const result = await authService.login({ username_or_email: username, password });
    console.log('Test login result:', result);
    return result;
  } catch (error: any) {
    console.error('Test login failed:', error);
    return null;
  }
};

// Authentication service functions
export const authService = {
  // Login user
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      console.log('🔐 Starting login request...');
      console.log('📍 Login endpoint: /auth/login');
      console.log('👤 Username:', credentials.username_or_email);
      console.log('🌐 Base URL will be: /api (through proxy)');
      
      const response = await api.post<LoginResponse>('/auth/login', credentials);
      console.log('✅ Login response received:');
      console.log('  - Status:', response.status);
      console.log('  - Token received:', response.data.auth_token ? '✓ YES' : '✗ NO');
      console.log('  - Token length:', response.data.auth_token?.length || 0);
      
      return response.data;
    } catch (error: any) {
      console.error('❌ Login request failed:');
      console.error('  - Status:', error.response?.status);
      console.error('  - Status Text:', error.response?.statusText);
      console.error('  - Response Data:', error.response?.data);
      console.error('  - Error Message:', error.message);
      console.error('  - Error Code:', error.code);
      console.error('  - Full Error Object:', error);
      
      // Handle different error types
      if (error.response?.status === 422) {
        const errorMsg = error.response?.data?.detail?.[0]?.msg || 'Validation error';
        throw new Error(`Validation Error: ${errorMsg}`);
      } else if (error.response?.status === 401) {
        throw new Error('Invalid username or password');
      } else if (error.code === 'NETWORK_ERROR' || !error.response) {
        throw new Error('Network error. Please check your connection and try again.');
      } else {
        throw new Error(
          error.response?.data?.detail?.[0]?.msg || 
          'Login failed. Please check your credentials.'
        );
      }
    }
  },

  async getCurrentUser(): Promise<User> {
    try {
      console.log('Making getCurrentUser request to:', '/auth/me');
      const response = await api.get<User>('/auth/me', { timeout: 10000 }); // 10 second timeout
      console.log('GetCurrentUser response received:', response.status, response.data);
      return response.data;
    } catch (error: any) {
      console.error('GetCurrentUser request failed:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      throw new Error(
        error.response?.data?.detail?.[0]?.msg || 
        'Failed to fetch user information.'
      );
    }
  },

  // Logout user
  logout(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  },

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const token = localStorage.getItem('authToken');
    return !!token;
  },

  // Get stored token
  getToken(): string | null {
    return localStorage.getItem('authToken');
  },

  // Store authentication data
  storeAuthData(token: string, user: User): void {
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(user));
  },

  //  stored user data
  getStoredUser(): User | null {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  }
};

// Make functions available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).testApiConnection = testApiConnection;
  (window as any).testLoginEndpoint = testLoginEndpoint;
  (window as any).testLogin = testLogin;
  (window as any).authService = authService;
}
