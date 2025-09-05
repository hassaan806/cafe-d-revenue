import api, { retryApiCall } from './api';

// Types for User Management API
export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  role: 'admin' | 'manager' | 'salesman';
  is_active?: boolean; 
}

export interface UpdateUserRequest {
  username?: string;
  email?: string;
  password?: string;
  role?: 'admin' | 'manager' | 'salesman';
  is_active?: boolean;
}

export interface UserResponse {
  username: string;
  email: string;
  id: number;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface GetUsersParams {
  skip?: number;
  limit?: number;
}

// User Management Service
export const userService = {
  // Get all users (Admin only)
  async getUsers(params: GetUsersParams = {}): Promise<UserResponse[]> {
    try {
      console.log('Fetching users with params:', params);
      const response = await api.get<UserResponse[]>('/users/', { 
        params,
        timeout: 5000 // 5 second timeout for users endpoint
      });
      console.log('Users fetched successfully:', response.data.length, 'users');
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch users:', error);
      throw new Error(
        error.response?.data?.detail?.[0]?.msg || 
        'Failed to fetch users. Please try again.'
      );
    }
  },

  // Create a new user
  async createUser(userData: CreateUserRequest): Promise<UserResponse> {
    try {
      const createData = {
        ...userData,
        is_active: userData.is_active !== undefined ? userData.is_active : true
      };
      
      console.log('Creating user:', { 
        username: createData.username, 
        email: createData.email, 
        role: createData.role,
        is_active: createData.is_active
      });
      
      const response = await api.post<UserResponse>('/users/', createData);
      console.log('User created successfully:', response.data.username);
      return response.data;
    } catch (error: any) {
      console.error('Failed to create user:', error);
      throw new Error(
        error.response?.data?.detail?.[0]?.msg || 
        'Failed to create user. Please check the information and try again.'
      );
    }
  },

  // Update a user 
  async updateUser(userId: number, userData: UpdateUserRequest): Promise<UserResponse> {
    try {
      console.log('Updating user:', userId, userData);
      const response = await api.put<UserResponse>(`/users/${userId}`, userData);
      console.log('User updated successfully:', response.data.username);
      return response.data;
    } catch (error: any) {
      console.error('Failed to update user:', error);
      throw new Error(
        error.response?.data?.detail?.[0]?.msg || 
        'Failed to update user. Please try again.'
      );
    }
  },

  // Delete a user 
  async deleteUser(userId: number): Promise<string> {
    try {
      console.log('Deleting user:', userId);
      const response = await api.delete<string>(`/users/${userId}`);
      console.log('User deleted successfully');
      return response.data;
    } catch (error: any) {
      console.error('Failed to delete user:', error);
      throw new Error(
        error.response?.data?.detail?.[0]?.msg || 
        'Failed to delete user. Please try again.'
      );
    }
  }
};

if (typeof window !== 'undefined') {
  (window as any).userService = userService;
}

