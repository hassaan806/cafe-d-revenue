import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Customer } from '../types';
import { customerService, CreateCustomerRequest, UpdateCustomerRequest } from '../services/customerService';

interface CustomerContextType {
  customers: Customer[];
  loading: boolean;
  error: string | null;
  addCustomer: (customerData: CreateCustomerRequest) => Promise<void>;
  updateCustomer: (customerId: number, customerData: UpdateCustomerRequest) => Promise<void>;
  deleteCustomer: (customerId: number) => Promise<void>;
  refreshCustomers: () => Promise<void>;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

export const useCustomers = () => {
  const context = useContext(CustomerContext);
  if (context === undefined) {
    throw new Error('useCustomers must be used within a CustomerProvider');
  }
  return context;
};

interface CustomerProviderProps {
  children: ReactNode;
}

export const CustomerProvider: React.FC<CustomerProviderProps> = ({ children }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Convert API customer to app customer format
  const convertApiCustomerToAppCustomer = (apiCustomer: any): Customer => {
    return {
      ...apiCustomer,
      // Map API fields to legacy fields for backward compatibility
      cardRefId: apiCustomer.card_number || '',
      rfId: apiCustomer.rfid_no || '',
      createdAt: apiCustomer.created_at ? new Date(apiCustomer.created_at) : new Date(),
      address: undefined, // Not provided by API
      // Handle discount field with proper default value
      card_discount: typeof apiCustomer.card_discount === 'number' ? apiCustomer.card_discount : 0
    };
  };

  // Convert app customer to API format
  const convertAppCustomerToApiCustomer = (appCustomer: Customer): any => {
    return {
      name: appCustomer.name,
      phone: appCustomer.phone,
      rfid_no: appCustomer.rfId || appCustomer.rfid_no || '',
      card_number: appCustomer.cardRefId || appCustomer.card_number || '',
      balance: appCustomer.balance || 0,
      // Always include card_discount field
      card_discount: typeof appCustomer.card_discount === 'number' ? appCustomer.card_discount : 0
    };
  };

  const refreshCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Refreshing customers...');
      const apiCustomers = await customerService.getCustomers();
      const appCustomers = apiCustomers.map(convertApiCustomerToAppCustomer);
      setCustomers(appCustomers);
      console.log('Customers refreshed successfully:', appCustomers.length);
    } catch (err: any) {
      console.error('Failed to refresh customers:', err);
      setError(err.message || 'Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  const addCustomer = async (customerData: CreateCustomerRequest) => {
    try {
      setLoading(true);
      setError(null);
      console.log('Adding customer:', customerData.name);
      const apiCustomer = await customerService.createCustomer(customerData);
      const appCustomer = convertApiCustomerToAppCustomer(apiCustomer);
      setCustomers(prev => [...prev, appCustomer]);
      console.log('Customer added successfully:', appCustomer.name);
    } catch (err: any) {
      console.error('Failed to add customer:', err);
      setError(err.message || 'Failed to add customer');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateCustomer = async (customerId: number, customerData: UpdateCustomerRequest) => {
    try {
      setLoading(true);
      setError(null);
      console.log('Updating customer:', customerId);
      const apiCustomer = await customerService.updateCustomer(customerId, customerData);
      const appCustomer = convertApiCustomerToAppCustomer(apiCustomer);
      setCustomers(prev => 
        prev.map(customer => 
          customer.id === customerId ? appCustomer : customer
        )
      );
      console.log('Customer updated successfully:', appCustomer.name);
    } catch (err: any) {
      console.error('Failed to update customer:', err);
      setError(err.message || 'Failed to update customer');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteCustomer = async (customerId: number) => {
    try {
      setLoading(true);
      setError(null);
      console.log('Deleting customer:', customerId);
      await customerService.deleteCustomer(customerId);
      setCustomers(prev => prev.filter(customer => customer.id !== customerId));
      console.log('Customer deleted successfully');
    } catch (err: any) {
      console.error('Failed to delete customer:', err);
      setError(err.message || 'Failed to delete customer');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Load customers on mount
  useEffect(() => {
    refreshCustomers();
  }, []);

  const value: CustomerContextType = {
    customers,
    loading,
    error,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    refreshCustomers
  };

  return (
    <CustomerContext.Provider value={value}>
      {children}
    </CustomerContext.Provider>
  );
};