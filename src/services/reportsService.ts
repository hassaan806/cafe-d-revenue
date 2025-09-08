import api from './api';

// Reports interfaces matching the backend structure
export interface DateRange {
  start_date: string;
  end_date: string;
}

export interface PendingSalesSummary {
  total_pending_amount: number;
  pending_sales_count: number;
  sales: number[];
}

export const reportsService = {
  // Get pending sales summary
  async getPendingSalesSummary(customerId?: number): Promise<PendingSalesSummary> {
    try {
      console.log('Fetching pending sales summary for customer:', customerId);
      const url = customerId ? `/sales/pending?customer_id=${customerId}` : '/sales/pending';
      const response = await api.get<PendingSalesSummary>(url);
      console.log('Pending sales summary fetched successfully');
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch pending sales summary:', error);
      throw new Error(
        error.response?.data?.detail?.[0]?.msg || 
        'Failed to fetch pending sales summary. Please try again.'
      );
    }
  },

  // Get sales by date range
  async getSalesByDate(startDate: string, endDate: string): Promise<string> {
    try {
      console.log('Fetching sales by date:', startDate, 'to', endDate);
      const response = await api.get(`/reports/sales-by-date?from_date=${startDate}&to_date=${endDate}`);
      return JSON.stringify(response.data, null, 2);
    } catch (error: any) {
      console.error('Failed to fetch sales by date:', error);
      throw new Error(
        error.response?.data?.detail || 
        'Failed to fetch sales by date. Please try again.'
      );
    }
  },

  // Get sales by product
  async getSalesByProduct(startDate: string, endDate: string): Promise<string> {
    try {
      console.log('Fetching sales by product:', startDate, 'to', endDate);
      const response = await api.get(`/reports/sales-by-product?from_date=${startDate}&to_date=${endDate}`);
      return JSON.stringify(response.data, null, 2);
    } catch (error: any) {
      console.error('Failed to fetch sales by product:', error);
      throw new Error(
        error.response?.data?.detail || 
        'Failed to fetch sales by product. Please try again.'
      );
    }
  },

  // Get sales by salesman
  async getSalesBySalesman(startDate: string, endDate: string): Promise<string> {
    try {
      console.log('Fetching sales summary:', startDate, 'to', endDate);
      const response = await api.get(`/reports/sales-summary?from_date=${startDate}&to_date=${endDate}`);
      return JSON.stringify(response.data, null, 2);
    } catch (error: any) {
      console.error('Failed to fetch sales summary:', error);
      throw new Error(
        error.response?.data?.detail || 
        'Failed to fetch sales summary. Please try again.'
      );
    }
  },

  // Get payment breakdown
  async getPaymentBreakdown(): Promise<string> {
    try {
      console.log('Fetching payment breakdown');
      const response = await api.get('/reports/payment-breakdown');
      return JSON.stringify(response.data, null, 2);
    } catch (error: any) {
      console.error('Failed to fetch payment breakdown:', error);
      throw new Error(
        error.response?.data?.detail || 
        'Failed to fetch payment breakdown. Please try again.'
      );
    }
  },

  // Note: Additional reporting endpoints can be added here
  // when implemented in the backend
};

// Make functions available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).reportsService = reportsService;
}
