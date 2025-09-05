import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '../types';
import { authService, User as ApiUser } from '../services/authService';

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const convertApiUserToAppUser = (apiUser: ApiUser): User => ({
  id: apiUser.id,
  username: apiUser.username,
  role: apiUser.role as User['role'],
  name: apiUser.username, 
  email: apiUser.email,
  phone: undefined, // API doesn't provide phone
  is_active: apiUser.is_active,
  created_at: apiUser.created_at,
  updated_at: apiUser.updated_at,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  //  user state changes
  useEffect(() => {
    console.log('User state changed:', user?.username || 'null');
  }, [user]);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('Initializing auth...');
        if (authService.isAuthenticated()) {
          console.log('User is authenticated, getting stored user...');
          const storedUser = authService.getStoredUser();
          if (storedUser) {
            console.log('Found stored user:', storedUser.username);
            const appUser = convertApiUserToAppUser(storedUser);
            setUser(appUser);
          } else {
            console.log('No stored user found');
          }
        } else {
          console.log('User is not authenticated');
        }
      } catch (error) {
        console.error('Error during auth initialization:', error);
        // Clear storage on error
        authService.logout();
      } finally {
        console.log('Auth initialization complete, setting loading to false');
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      
      console.log('Starting login process...');
      
      // Call login API
      const loginResponse = await authService.login({
        username_or_email: username,
        password: password,
      });
      
      console.log('Login API successful, got token:', loginResponse.auth_token ? 'YES' : 'NO');

      // Store token first
      localStorage.setItem('authToken', loginResponse.auth_token);
      console.log('Token stored in localStorage');
      
      // Get user data from /auth/me endpoint
      try {
        const userData = await authService.getCurrentUser();
        console.log('Got user data:', userData);
        
        const appUser = convertApiUserToAppUser(userData);
        authService.storeAuthData(loginResponse.auth_token, userData);
        setUser(appUser);
        console.log('Set user in state:', appUser.username);
      } catch (userError: any) {
        console.error('Failed to get user data:', userError);
        // Create a default user object if /auth/me fails
        const defaultUser: User = {
          id: 1,
          username: username,
          role: 'admin' as UserRole,
          name: username,
          email: `${username}@example.com`,
          phone: undefined,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        authService.storeAuthData(loginResponse.auth_token, defaultUser);
        setUser(defaultUser);
        console.log('Set default user in state:', defaultUser.username);
      }
      
      return { success: true };
    } catch (error: any) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: error.message || 'Login failed. Please try again.' 
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      isAuthenticated: !!user,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}