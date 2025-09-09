import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { RechargeTransaction } from '../types';
import { rechargeService, CreateRechargeRequest } from '../services/rechargeService';
import { useCustomers } from './CustomerContext';

interface RechargeContextType {
  recharges: RechargeTransaction[];
  loading: boolean;
  error: string | null;
  addRecharge: (rechargeData: CreateRechargeRequest) => Promise<void>;
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
  const { customers, updateCustomer } = useCustomers();
  const [recharges, setRecharges] = useState<RechargeTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Convert API recharge to app recharge format
  const convertApiRechargeToAppRecharge = (apiRecharge: any): RechargeTransaction => {
    return {
      ...apiRecharge,
      // Map API fields to legacy fields for backward compatibility
      customerId: apiRecharge.customer_id?.toString() || '0',
      timestamp: apiRecharge.recharge_date ? new Date(apiRecharge.recharge_date) : new Date(),
      previousBalance: 0, // Not provided by API
      newBalance: 0 // Not provided by API
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
      
      // Update customer balance and check for low balance
      const customer = customers.find(c => c.id === rechargeData.customer_id);
      if (customer) {
        const newBalance = customer.balance + rechargeData.amount;
        await updateCustomer(rechargeData.customer_id, { balance: newBalance });
        
        // Check for low balance (threshold: 100 PKR)
        if (newBalance < 100) {
          console.log(`Low balance SMS automatically sent by backend to customer ${customer.name}: PKR ${newBalance.toFixed(2)}`);
        }
      }
      
      console.log('Recharge added successfully:', appRecharge.id);
    } catch (err: any) {
      console.error('Failed to add recharge:', err);
      setError(err.message || 'Failed to add recharge');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getRechargesByCustomer = (customerId: number): RechargeTransaction[] => {
    return recharges.filter(recharge => 
      recharge.customer_id === customerId || 
      (recharge.customerId && parseInt(recharge.customerId) === customerId)
    );
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
    refreshRecharges,
    getRechargesByCustomer
  };

  return (
    <RechargeContext.Provider value={value}>
      {children}
    </RechargeContext.Provider>
  );
};