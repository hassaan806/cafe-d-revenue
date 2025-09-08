import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { UserRole } from '../../types';

interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * RoleGuard component to conditionally render content based on user role
 * 
 * @param allowedRoles - Array of roles that can access the content
 * @param children - Content to render if user has required role
 * @param fallback - Optional content to render if user doesn't have required role
 */
export function RoleGuard({ allowedRoles, children, fallback = null }: RoleGuardProps) {
  const { user } = useAuth();

  if (!user) {
    return fallback as React.ReactElement;
  }

  if (!allowedRoles.includes(user.role)) {
    return fallback as React.ReactElement;
  }

  return <>{children}</>;
}

/**
 * Hook to check if current user has specific roles
 */
export function useRoleCheck() {
  const { user } = useAuth();

  const hasRole = (roles: UserRole | UserRole[]): boolean => {
    if (!user) return false;
    
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    return allowedRoles.includes(user.role);
  };

  const isAdmin = (): boolean => hasRole('admin');
  const isManager = (): boolean => hasRole('manager');
  const isSalesman = (): boolean => hasRole('salesman');
  const canManageSettings = (): boolean => hasRole('admin');
  const canManageCards = (): boolean => hasRole('admin');
  const canManageUsers = (): boolean => hasRole(['admin', 'manager']);
  const canAccessReports = (): boolean => hasRole(['admin', 'manager']);
  const canModifyData = (): boolean => hasRole(['admin', 'manager']);

  return {
    user,
    hasRole,
    isAdmin,
    isManager,
    isSalesman,
    canManageSettings,
    canManageCards,
    canManageUsers,
    canAccessReports,
    canModifyData
  };
}