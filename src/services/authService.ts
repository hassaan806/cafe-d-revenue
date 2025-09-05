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

// Authentication service functions
export const authService = {
  // Login user
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      console.log('Making login request to:', '/auth/login');
      console.log('Request payload:', { username_or_email: credentials.username_or_email, password: '***' });
      
      const response = await api.post<LoginResponse>('/auth/login', credentials);
      console.log('Login response received:', response.status, response.data);
      return response.data;
    } catch (error: any) {
      console.error('Login request failed:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        code: error.code
      });
      
      // Handle different error types
      if (error.response?.status === 422) {
        const errorMsg = error.response?.data?.detail?.[0]?.msg || 'Validation error';
        throw new Error(errorMsg);
      } else if (error.response?.status === 401) {
        throw new Error('Invalid username or password');
      } else if (error.code === 'NETWORK_ERROR' || !error.response) {
        throw new Error(error.userMessage || 'Network error. Please check your connection and try again.');
      } else {
        throw new Error(
          error.response?.data?.detail?.[0]?.msg || 
          error.userMessage ||
          'Login failed. Please check your credentials.'
        );
      }
    }
  },

  async getCurrentUser(): Promise<User> {
    try {
      console.log('Making getCurrentUser request to:', '/auth/me');
      const response = await api.get<User>('/auth/me', { timeout: 5000 }); // 5 second timeout
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

// Make authService available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).authService = authService;
}
