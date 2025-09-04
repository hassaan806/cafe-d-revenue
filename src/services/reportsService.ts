import api from './api';

// Reports interfaces
export interface DateRange {
  start_date: string;
  end_date: string;
}

export interface SalesByDateReport {
  date: string;
  total_sales: number;
  transaction_count: number;
}

export interface SalesByProductReport {
  product_id: number;
  product_name: string;
  total_quantity: number;
  total_revenue: number;
}

export interface SalesBySalesmanReport {
  salesman_id: number;
  salesman_name: string;
  total_sales: number;
  transaction_count: number;
}

export interface PaymentBreakdownReport {
  payment_method: string;
  total_amount: number;
  transaction_count: number;
  percentage: number;
}

export const reportsService = {
  // Get sales by date report
  async getSalesByDate(startDate: string, endDate: string): Promise<string> {
    try {
      console.log('Fetching sales by date report:', startDate, 'to', endDate);
      const response = await api.get<string>('/reports/sales_by_date', {
        params: { start_date: startDate, end_date: endDate }
      });
      console.log('Sales by date report fetched successfully');
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch sales by date report:', error);
      throw new Error(
        error.response?.data?.detail?.[0]?.msg || 
        'Failed to fetch sales by date report. Please try again.'
      );
    }
  },

  // Get sales by product report
  async getSalesByProduct(startDate?: string, endDate?: string): Promise<string> {
    try {
      console.log('Fetching sales by product report:', startDate, 'to', endDate);
      const params: any = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      
      const response = await api.get<string>('/reports/sales_by_product', { params });
      console.log('Sales by product report fetched successfully');
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch sales by product report:', error);
      throw new Error(
        error.response?.data?.detail?.[0]?.msg || 
        'Failed to fetch sales by product report. Please try again.'
      );
    }
  },

  // Get sales by salesman report
  async getSalesBySalesman(startDate?: string, endDate?: string): Promise<string> {
    try {
      console.log('Fetching sales by salesman report:', startDate, 'to', endDate);
      const params: any = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      
      const response = await api.get<string>('/reports/sales_by_salesman', { params });
      console.log('Sales by salesman report fetched successfully');
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch sales by salesman report:', error);
      throw new Error(
        error.response?.data?.detail?.[0]?.msg || 
        'Failed to fetch sales by salesman report. Please try again.'
      );
    }
  },

  // Get payment breakdown report
  async getPaymentBreakdown(): Promise<string> {
    try {
      console.log('Fetching payment breakdown report...');
      const response = await api.get<string>('/reports/payment_breakdown');
      console.log('Payment breakdown report fetched successfully');
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch payment breakdown report:', error);
      throw new Error(
        error.response?.data?.detail?.[0]?.msg || 
        'Failed to fetch payment breakdown report. Please try again.'
      );
    }
  }
};
