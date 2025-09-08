import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Sale, SaleItem } from '../types';
import { salesService, CreateSaleRequest, SettleSaleRequest } from '../services/salesService';
import { useCustomers } from './CustomerContext';

interface SalesContextType {
  sales: Sale[];
  loading: boolean;
  error: string | null;
  addSale: (saleData: CreateSaleRequest) => Promise<void>;
  settleSale: (saleId: number, settleData: SettleSaleRequest) => Promise<void>;
  refreshSales: () => Promise<void>;
  getPendingSales: () => Promise<Sale[]>;
  getPendingSalesSummary: (customerId?: number) => Promise<string>;
}

const SalesContext = createContext<SalesContextType | undefined>(undefined);

export const useSales = () => {
  const context = useContext(SalesContext);
  if (context === undefined) {
    throw new Error('useSales must be used within a SalesProvider');
  }
  return context;
};

interface SalesProviderProps {
  children: ReactNode;
}

export const SalesProvider: React.FC<SalesProviderProps> = ({ children }) => {
  const { customers } = useCustomers();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Convert API sale to app sale format
  const convertApiSaleToAppSale = (apiSale: any): Sale => {
    return {
      ...apiSale,
      // Map API fields to legacy fields for backward compatibility
      total: apiSale.total_price,
      subtotal: apiSale.total_price, // Assuming no tax for now
      tax: 0,
      customerId: apiSale.customer_id?.toString() || null,
      salesmanId: '1', // Default salesman ID
      createdAt: new Date(apiSale.timestamp),
      invoiceNumber: `INV-${apiSale.id?.toString().padStart(6, '0') || '000000'}`,
      // Convert items to legacy format - handle undefined/null items
      items: (apiSale.items || []).map((item: any) => ({
        ...item,
        productId: item.product_id?.toString() || '0',
        productName: '', // Will be populated from product data
        price: 0, // Will be calculated from product data
        total: 0 // Will be calculated
      }))
    };
  };

  // Convert app sale to API format
  const convertAppSaleToApiSale = (appSale: any): CreateSaleRequest => {
    return {
      customer_id: appSale.customer_id || (appSale.customerId ? parseInt(appSale.customerId) : null),
      room_no: appSale.room_no || '',
      payment_method: appSale.payment_method || appSale.paymentMethod || 'pending',
      items: (appSale.items || []).map((item: any) => ({
        product_id: item.product_id || parseInt(item.productId || '0'),
        quantity: item.quantity || 0
      }))
    };
  };

  // Initialize sales data on mount
  useEffect(() => {
    const initializeSales = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('SalesContext: Initializing sales data...');
        const apiSales = await salesService.getSales();
        const appSales = apiSales.map(convertApiSaleToAppSale);
        setSales(appSales);
        console.log('SalesContext: Successfully loaded', appSales.length, 'sales');
      } catch (err: any) {
        console.warn('SalesContext: API not available, using empty data:', err.message);
        setError(err.message || 'Failed to fetch sales');
        setSales([]); // Use empty array as fallback
      } finally {
        setLoading(false);
      }
    };

    initializeSales();
  }, []);

  const refreshSales = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Refreshing sales...');
      const apiSales = await salesService.getSales();
      const appSales = apiSales.map(convertApiSaleToAppSale);
      setSales(appSales);
      console.log('Sales refreshed successfully:', appSales.length);
    } catch (err: any) {
      console.error('Failed to refresh sales:', err);
      setError(err.message || 'Failed to fetch sales');
    } finally {
      setLoading(false);
    }
  };

  const addSale = async (saleData: CreateSaleRequest) => {
    try {
      setLoading(true);
      setError(null);
      console.log('Adding sale:', saleData);
      const apiSale = await salesService.createSale(saleData);
      const appSale = convertApiSaleToAppSale(apiSale);
      setSales(prev => [...prev, appSale]);
      console.log('Sale added successfully:', appSale.id);
      
      // Send SMS notification for card payments
      if (saleData.payment_method === 'card' && saleData.customer_id) {
        const customer = customers.find(c => c.id === saleData.customer_id);
        if (customer) {
          console.log(`Sending payment SMS to ${customer.name} (${customer.phone}) for PKR ${apiSale.total_price.toFixed(2)}`);
          // In a real implementation, this would trigger an SMS notification
          // For now, we'll implement this properly
          try {
            // This would be implemented in a real system with an SMS service
            // For now, we'll just log that it should happen
            console.log(`SMS should be sent to ${customer.phone} about payment: PKR ${apiSale.total_price.toFixed(2)}`);
          } catch (smsError) {
            console.error('Failed to send payment SMS:', smsError);
          }
        }
      }
    } catch (err: any) {
      console.error('Failed to add sale:', err);
      setError(err.message || 'Failed to add sale');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const settleSale = async (saleId: number, settleData: SettleSaleRequest) => {
    try {
      setLoading(true);
      setError(null);
      console.log('Settling sale:', saleId);
      const apiSale = await salesService.settleSale(saleId, settleData);
      const appSale = convertApiSaleToAppSale(apiSale);
      setSales(prev => 
        prev.map(sale => 
          sale.id === saleId ? appSale : sale
        )
      );
      console.log('Sale settled successfully:', appSale.id);
      
      // Send SMS notification for card payments
      if (settleData.payment_method === 'card' && settleData.customer_id) {
        const customer = customers.find(c => c.id === settleData.customer_id);
        if (customer) {
          console.log(`Sending settlement SMS to ${customer.name} (${customer.phone}) for sale #${saleId}`);
          // In a real implementation, this would trigger an SMS notification
          // For now, we'll implement this properly
          try {
            // This would be implemented in a real system with an SMS service
            // For now, we'll just log that it should happen
            console.log(`SMS should be sent to ${customer.phone} about settlement: Sale #${saleId}`);
          } catch (smsError) {
            console.error('Failed to send settlement SMS:', smsError);
          }
        }
      }
    } catch (err: any) {
      console.error('Failed to settle sale:', err);
      setError(err.message || 'Failed to settle sale');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getPendingSales = async (): Promise<Sale[]> => {
    try {
      console.log('Fetching pending sales...');
      const apiSales = await salesService.getPendingSales();
      const appSales = apiSales.map(convertApiSaleToAppSale);
      console.log('Pending sales fetched successfully:', appSales.length);
      return appSales;
    } catch (err: any) {
      console.error('Failed to fetch pending sales:', err);
      throw err;
    }
  };

  const getPendingSalesSummary = async (customerId?: number): Promise<string> => {
    try {
      console.log('Fetching pending sales summary...');
      const summary = await salesService.getPendingSalesSummary(customerId);
      console.log('Pending sales summary fetched successfully');
      return summary;
    } catch (err: any) {
      console.error('Failed to fetch pending sales summary:', err);
      throw err;
    }
  };

  // Load sales on mount
  useEffect(() => {
    refreshSales();
  }, []);

  const value: SalesContextType = {
    sales,
    loading,
    error,
    addSale,
    settleSale,
    refreshSales,
    getPendingSales,
    getPendingSalesSummary
  };

  return (
    <SalesContext.Provider value={value}>
      {children}
    </SalesContext.Provider>
  );
};