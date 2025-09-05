import api from './api';

// Dashboard interfaces
export interface DashboardOverview {
  total_customers: number;
  total_sales: number;
  total_revenue: number;
  total_pending_amount: number;
  total_recharges: number;
  top_products: Array<{
    product_name: string;
    quantity_sold: number;
  }>;
  sales_today: {
    count: number;
    revenue: number;
  };
  monthly_trends: Array<{
    month: string;
    sales_count: number;
    revenue: number;
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

  async getOverview(fromDate?: string, toDate?: string): Promise<DashboardOverview> {
    try {
      console.log('Fetching dashboard overview:', fromDate, 'to', toDate);
      const params: any = {};
      if (fromDate) params.from_date = fromDate;
      if (toDate) params.to_date = toDate;
      
      const response = await api.get<DashboardOverview>('/dashboard/overview', { params });
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
  async getSalesTrends(days: number = 30): Promise<any> {
    try {
      console.log('Fetching sales trends for', days, 'days');
      const response = await api.get<any>('/dashboard/trends', {
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

  async getCustomerInsights(limit: number = 5): Promise<any> {
    try {
      console.log('Fetching customer insights from overview data');
      const response = await api.get<any>('/dashboard/overview');
      console.log('Customer insights fetched successfully');

      return {
        top_customers: [],
        recent_activity: [],
        customer_growth: []
      };
    } catch (error: any) {
      console.error('Failed to fetch customer insights:', error);
      throw new Error(
        error.response?.data?.detail?.[0]?.msg || 
        'Failed to fetch customer insights. Please try again.'
      );
    }
  }
};
