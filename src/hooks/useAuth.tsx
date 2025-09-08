import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
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

      // Store token FIRST before making authenticated requests
      localStorage.setItem('authToken', loginResponse.auth_token);
      console.log('Token stored in localStorage');

      try {
        // Try to get user information, but don't fail login if this times out
        const userInfo = await authService.getCurrentUser();
        console.log('Got user info:', userInfo.username);
        
        // Store complete authentication data
        authService.storeAuthData(loginResponse.auth_token, userInfo);
        console.log('Stored complete auth data in localStorage');
        
        // Convert and set user
        const appUser = convertApiUserToAppUser(userInfo);
        setUser(appUser);
        console.log('Set user in state:', appUser.username);
      } catch (userInfoError: any) {
        console.warn('Failed to fetch user info, using fallback user data:', userInfoError.message);
        
        // Fallback: Create a basic user object from the username
        const fallbackUser: User = {
          id: 1, // Default ID
          username: username,
          role: 'admin', // Default to admin for now
          name: username,
          email: `${username}@example.com`, // Fallback email
          phone: undefined,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        // Store fallback authentication data
        authService.storeAuthData(loginResponse.auth_token, fallbackUser);
        console.log('Stored fallback auth data in localStorage');
        
        setUser(fallbackUser);
        console.log('Set fallback user in state:', fallbackUser.username);
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