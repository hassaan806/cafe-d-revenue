import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { RechargeTransaction } from '../types';
import { rechargeService, CreateRechargeRequest } from '../services/rechargeService';

interface RechargeContextType {
  recharges: RechargeTransaction[];
  loading: boolean;
  error: string | null;
  addRecharge: (rechargeData: CreateRechargeRequest) => Promise<void>;
  deleteRecharge: (rechargeId: number) => Promise<void>;
  refreshRecharges: () => Promise<void>;
  getRechargesByCustomer: (customerId: number) => RechargeTransaction[];
}

const RechargeContext = createContext<RechargeContextType | undefined>(undefined);

export const useRecharges = () => {
  const context = useContext(RechargeContext);
  if (context === undefined) {
    throw new Error('useRecharges must be used within a RechargeProvider');
  }
  return context;
};

interface RechargeProviderProps {
  children: ReactNode;
}

export const RechargeProvider: React.FC<RechargeProviderProps> = ({ children }) => {
  const [recharges, setRecharges] = useState<RechargeTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const convertApiRechargeToAppRecharge = (apiRecharge: any): RechargeTransaction => {
    return {
      ...apiRecharge,
      // Map API fields to legacy fields for backward compatibility
      customerId: apiRecharge.customer_id?.toString() || '0',
      timestamp: apiRecharge.recharge_date ? new Date(apiRecharge.recharge_date) : new Date(),
      previousBalance: 0,
      newBalance: 0 
    };
  };

  const refreshRecharges = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Refreshing recharges...');
      const apiRecharges = await rechargeService.getRecharges();
      const appRecharges = apiRecharges.map(convertApiRechargeToAppRecharge);
      setRecharges(appRecharges);
      console.log('Recharges refreshed successfully:', appRecharges.length);
    } catch (err: any) {
      console.error('Failed to refresh recharges:', err);
      setError(err.message || 'Failed to fetch recharges');
    } finally {
      setLoading(false);
    }
  };

  const addRecharge = async (rechargeData: CreateRechargeRequest) => {
    try {
      setLoading(true);
      setError(null);
      console.log('Adding recharge:', rechargeData.amount, 'for customer:', rechargeData.customer_id);
      const apiRecharge = await rechargeService.createRecharge(rechargeData);
      const appRecharge = convertApiRechargeToAppRecharge(apiRecharge);
      setRecharges(prev => [...prev, appRecharge]);
      console.log('Recharge added successfully:', appRecharge.id);
    } catch (err: any) {
      console.error('Failed to add recharge:', err);
      setError(err.message || 'Failed to add recharge');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteRecharge = async (rechargeId: number) => {
    try {
      setLoading(true);
      setError(null);
      console.log('Deleting recharge:', rechargeId);
      await rechargeService.deleteRecharge(rechargeId);
      setRecharges(prev => prev.filter(recharge => recharge.id !== rechargeId));
      console.log('Recharge deleted successfully');
    } catch (err: any) {
      console.error('Failed to delete recharge:', err);
      setError(err.message || 'Failed to delete recharge');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getRechargesByCustomer = (customerId: number): RechargeTransaction[] => {
    return recharges.filter(recharge => recharge.customer_id === customerId);
  };

  // Load recharges on mount
  useEffect(() => {
    refreshRecharges();
  }, []);

  const value: RechargeContextType = {
    recharges,
    loading,
    error,
    addRecharge,
    deleteRecharge,
    refreshRecharges,
    getRechargesByCustomer
  };

  return (
    <RechargeContext.Provider value={value}>
      {children}
    </RechargeContext.Provider>
  );
};
