import api from './api';

// Dashboard interfaces
export interface TrendData {
  date: string;
  sales: number;
  transactions: number;
}

export interface CustomerInsight {
  id: number;
  name: string;
  total_spent: number;
  transaction_count: number;
  last_purchase: string;
}

export const dashboardService = {
  // Get sales trends
  async getSalesTrends(days: number = 30): Promise<TrendData[]> {
    try {
      console.log('Fetching sales trends for', days, 'days');
      const response = await api.get<TrendData[]>(`/dashboard/trends?days=${days}`);
      console.log('Sales trends fetched successfully:', response.data.length, 'data points');
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch sales trends:', error);
      return [];
    }
  },

  // Alias for backward compatibility
  async getTrends(days: number = 30): Promise<TrendData[]> {
    return this.getSalesTrends(days);
  },

  // Get customer insights
  async getCustomerInsights(limit: number = 5): Promise<CustomerInsight[]> {
    try {
      console.log('Fetching customer insights...');
      const response = await api.get<CustomerInsight[]>(`/dashboard/customers/insights?limit=${limit}`);
      console.log('Customer insights fetched successfully:', response.data.length, 'customers');
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch customer insights:', error);
      return [];
    }
  }
};

// Make functions available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).dashboardService = dashboardService;
}
