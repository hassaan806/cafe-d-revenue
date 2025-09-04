import api from './api';

// Dashboard interfaces
export interface DashboardOverview {
  total_revenue: number;
  total_sales: number;
  total_customers: number;
  active_customers: number;
  pending_sales: number;
  pending_amount: number;
  average_order_value: number;
  top_products: Array<{
    product_id: number;
    product_name: string;
    total_sold: number;
    revenue: number;
  }>;
  recent_sales: Array<{
    id: number;
    customer_name: string;
    total_amount: number;
    payment_method: string;
    timestamp: string;
  }>;
}

export interface SalesTrend {
  date: string;
  revenue: number;
  sales_count: number;
  payment_breakdown: {
    cash: number;
    card: number;
    easypaisa: number;
    pending: number;
  };
}

export interface CustomerInsight {
  customer_id: number;
  customer_name: string;
  total_spent: number;
  pending_balance: number;
  total_orders: number;
  last_order_date: string;
}

export const dashboardService = {

  async getOverview(fromDate?: string, toDate?: string): Promise<string> {
    try {
      console.log('Fetching dashboard overview:', fromDate, 'to', toDate);
      const params: any = {};
      if (fromDate) params.from_date = fromDate;
      if (toDate) params.to_date = toDate;
      
      const response = await api.get<string>('/dashboard/overview', { params });
      console.log('Dashboard overview fetched successfully');
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch dashboard overview:', error);
      throw new Error(
        error.response?.data?.detail?.[0]?.msg || 
        'Failed to fetch dashboard overview. Please try again.'
      );
    }
  },

  // Get sales trends
  async getSalesTrends(days: number = 30): Promise<string> {
    try {
      console.log('Fetching sales trends for', days, 'days');
      const response = await api.get<string>('/dashboard/trends', {
        params: { days }
      });
      console.log('Sales trends fetched successfully');
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch sales trends:', error);
      throw new Error(
        error.response?.data?.detail?.[0]?.msg || 
        'Failed to fetch sales trends. Please try again.'
      );
    }
  },

  // Get customer insights
  async getCustomerInsights(limit: number = 5): Promise<string> {
    try {
      console.log('Fetching customer insights, limit:', limit);
      const response = await api.get<string>('/dashboard/customers/insights', {
        params: { limit }
      });
      console.log('Customer insights fetched successfully');
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch customer insights:', error);
      throw new Error(
        error.response?.data?.detail?.[0]?.msg || 
        'Failed to fetch customer insights. Please try again.'
      );
    }
  }
};
