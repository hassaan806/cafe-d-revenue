import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for demo
const mockUsers: (User & { password: string })[] = [
  { 
    id: '1', 
    username: 'admin', 
    password: 'admin123', 
    role: 'admin', 
    name: 'Admin User',
    email: 'admin@cafed.com',
    phone: '+92-300-1234567',
    isActive: true,
    createdAt: new Date('2024-01-01')
  },
  { 
    id: '2', 
    username: 'manager', 
    password: 'manager123', 
    role: 'manager', 
    name: 'Manager User',
    email: 'manager@cafed.com',
    phone: '+92-301-2345678',
    isActive: true,
    createdAt: new Date('2024-01-15')
  },
  { 
    id: '3', 
    username: 'sales', 
    password: 'sales123', 
    role: 'salesman', 
    name: 'Sales Person',
    email: 'sales@cafed.com',
    phone: '+92-302-3456789',
    isActive: true,
    createdAt: new Date('2024-02-01')
  },
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('cafe_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    const foundUser = mockUsers.find(
      u => u.username === username && u.password === password
    );

    if (foundUser) {
      const { password: _, ...userWithoutPassword } = foundUser;
      setUser(userWithoutPassword);
      localStorage.setItem('cafe_user', JSON.stringify(userWithoutPassword));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('cafe_user');
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      isAuthenticated: !!user
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