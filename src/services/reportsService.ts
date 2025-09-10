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

// Response interfaces for reports
export interface SalesByDateResponse {
  date_range: string;
  total_days: number;
  sales_by_date: Array<{
    date: string;
    transaction_count: number;
    total_sales: number;
    average_order_value: number;
  }>;
  summary: {
    total_sales: number;
    total_transactions: number;
    average_daily_sales: number;
  };
}

export interface SalesByProductResponse {
  date_range: string;
  total_products: number;
  products: Array<{
    product_id: number;
    product_name: string;
    quantity_sold: number;
    total_revenue: number;
    percentage_of_total: number;
  }>;
  summary: {
    total_revenue: number;
    total_quantity_sold: number;
  };
}

export interface PaymentBreakdownResponse {
  date_range: string;
  payment_methods: Array<{
    payment_method: string;
    transaction_count: number;
    total_amount: number;
    percentage_of_total: number;
  }>;
  summary: {
    total_amount: number;
    total_transactions: number;
  };
}

export interface SalesSummaryResponse {
  date_range: string;
  settled_sales: {
    count: number;
    total_amount: number;
    average_order_value: number;
  };
  pending_sales: {
    count: number;
    total_amount: number;
  };
  overall: {
    total_transactions: number;
    total_gross_sales: number;
    settlement_rate: number;
  };
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
  async getSalesByDate(startDate: string, endDate: string): Promise<SalesByDateResponse> {
    try {
      console.log('Fetching sales by date:', startDate, 'to', endDate);
      const response = await api.get<SalesByDateResponse>(`/reports/sales-by-date?from_date=${startDate}&to_date=${endDate}`);
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch sales by date:', error);
      throw new Error(
        error.response?.data?.detail || 
        'Failed to fetch sales by date. Please try again.'
      );
    }
  },

  // Get sales by product
  async getSalesByProduct(startDate: string, endDate: string): Promise<SalesByProductResponse> {
    try {
      console.log('Fetching sales by product:', startDate, 'to', endDate);
      const response = await api.get<SalesByProductResponse>(`/reports/sales-by-product?from_date=${startDate}&to_date=${endDate}`);
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch sales by product:', error);
      throw new Error(
        error.response?.data?.detail || 
        'Failed to fetch sales by product. Please try again.'
      );
    }
  },

  // Get sales by salesman
  async getSalesBySalesman(startDate: string, endDate: string): Promise<SalesSummaryResponse> {
    try {
      console.log('Fetching sales summary:', startDate, 'to', endDate);
      const response = await api.get<SalesSummaryResponse>(`/reports/sales-summary?from_date=${startDate}&to_date=${endDate}`);
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch sales summary:', error);
      throw new Error(
        error.response?.data?.detail || 
        'Failed to fetch sales summary. Please try again.'
      );
    }
  },

  // Get payment breakdown
  async getPaymentBreakdown(): Promise<PaymentBreakdownResponse> {
    try {
      console.log('Fetching payment breakdown');
      const response = await api.get<PaymentBreakdownResponse>('/reports/payment-breakdown');
      return response.data;
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