import api from './api';

// User interfaces
export interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'manager' | 'salesman';
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  role: 'admin' | 'manager' | 'salesman';
}

export interface UpdateUserRequest {
  username?: string;
  email?: string;
  password?: string;
  role?: 'admin' | 'manager' | 'salesman';
  is_active?: boolean;
}

export const userService = {
  // Get all users (admin and manager only)
  async getUsers(): Promise<User[]> {
    try {
      console.log('Fetching users...');
      const response = await api.get<User[]>('/users/');
      console.log('Users fetched successfully:', response.data.length, 'users');
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch users:', error);
      throw new Error(
        error.response?.data?.detail || 
        'Failed to fetch users. Please try again.'
      );
    }
  },

  // Create a new user (admin only)
  async createUser(userData: CreateUserRequest): Promise<User> {
    try {
      console.log('Creating user:', userData.username);
      const response = await api.post<User>('/users/', userData);
      console.log('User created successfully:', response.data.username);
      return response.data;
    } catch (error: any) {
      console.error('Failed to create user:', error);
      throw new Error(
        error.response?.data?.detail || 
        'Failed to create user. Please try again.'
      );
    }
  },

  // Update a user (admin only)
  async updateUser(userId: number, userData: UpdateUserRequest): Promise<User> {
    try {
      console.log('Updating user:', userId);
      const response = await api.put<User>(`/users/${userId}`, userData);
      console.log('User updated successfully:', response.data.username);
      return response.data;
    } catch (error: any) {
      console.error('Failed to update user:', error);
      throw new Error(
        error.response?.data?.detail || 
        'Failed to update user. Please try again.'
      );
    }
  },

  // Delete a user (admin only)
  async deleteUser(userId: number): Promise<void> {
    try {
      console.log('Deleting user:', userId);
      await api.delete(`/users/${userId}`);
      console.log('User deleted successfully');
    } catch (error: any) {
      console.error('Failed to delete user:', error);
      throw new Error(
        error.response?.data?.detail || 
        'Failed to delete user. Please try again.'
      );
    }
  }
};

// Make functions available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).userService = userService;
}