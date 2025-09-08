import api from './api';

// Sales interfaces 
export interface SaleItem {
  product_id: number;
  quantity: number;
}

export interface Sale {
  id: number;
  total_price: number;
  payment_method: 'cash' | 'card' | 'easypaisa' | 'pending';
  is_settled: boolean;
  timestamp: string;
  room_no: string;
  customer_id: number | null;
  items: SaleItem[];
  payments: any[]; 
}

export interface CreateSaleRequest {
  customer_id: number | null;
  room_no: string;
  payment_method: 'cash' | 'card' | 'easypaisa' | 'pending';
  items: SaleItem[];
}

export interface SettleSaleRequest {
  payment_method: 'cash' | 'card' | 'easypaisa';
  customer_id: number | null;
}

export interface BatchSettleSaleRequest {
  sale_ids: number[];
  payment_method: 'cash' | 'card' | 'easypaisa';
  customer_id?: number;
}

export interface BatchSettleResponse {
  settled_count: number;
  failed_count: number;
  settled_sales: number[];
  failed_sales: { sale_id: number; error: string }[];
}

export const salesService = {
  // Get all sales
  async getSales(): Promise<Sale[]> {
    try {
      console.log('Fetching sales...');
      const response = await api.get<Sale[]>('/sales/');
      console.log('Sales fetched successfully:', response.data.length, 'sales');
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch sales:', error);
      throw new Error(
        error.response?.data?.detail?.[0]?.msg || 
        'Failed to fetch sales. Please try again.'
      );
    }
  },

  // by id
  async getSale(saleId: number): Promise<Sale> {
    try {
      console.log('Fetching sale:', saleId);
      const response = await api.get<Sale>(`/sales/${saleId}`);
      console.log('Sale fetched successfully:', response.data.id);
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch sale:', error);
      throw new Error(
        error.response?.data?.detail?.[0]?.msg || 
        'Failed to fetch sale. Please try again.'
      );
    }
  },

  // new sale
  async createSale(saleData: CreateSaleRequest): Promise<Sale> {
    try {
      console.log('Creating sale:', saleData);
      const response = await api.post<Sale>('/sales/', saleData);
      console.log('Sale created successfully:', response.data.id);
      return response.data;
    } catch (error: any) {
      console.error('Failed to create sale:', error);
      throw new Error(
        error.response?.data?.detail?.[0]?.msg || 
        'Failed to create sale. Please try again.'
      );
    }
  },

  //  pending sales
  async getPendingSales(): Promise<Sale[]> {
    try {
      console.log('Fetching pending sales...');
      const response = await api.get<Sale[]>('/sales/reports/pending');
      console.log('Pending sales fetched successfully:', response.data.length, 'sales');
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch pending sales:', error);
      throw new Error(
        error.response?.data?.detail?.[0]?.msg || 
        'Failed to fetch pending sales. Please try again.'
      );
    }
  },

  //  pending sales summary for  customer
  async getPendingSalesSummary(customerId?: number): Promise<string> {
    try {
      console.log('Fetching pending sales summary for customer:', customerId);
      const url = customerId ? `/sales/pending?customer_id=${customerId}` : '/sales/pending';
      const response = await api.get<string>(url);
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

  // Settle a pending sale
  async settleSale(saleId: number, settleData: SettleSaleRequest): Promise<Sale> {
    try {
      console.log('Settling sale:', saleId);
      const response = await api.put<Sale>(`/sales/${saleId}/settle`, settleData);
      console.log('Sale settled successfully:', response.data.id);
      return response.data;
    } catch (error: any) {
      console.error('Failed to settle sale:', error);
      throw new Error(
        error.response?.data?.detail?.[0]?.msg || 
        'Failed to settle sale. Please try again.'
      );
    }
  },

  // Batch settle multiple pending sales
  async batchSettleSales(batchData: BatchSettleSaleRequest): Promise<BatchSettleResponse> {
    try {
      console.log('Batch settling sales:', batchData.sale_ids.length, 'sales');
      const response = await api.post<BatchSettleResponse>('/sales/settle-batch', batchData);
      console.log('Batch settlement completed:', response.data.settled_count, 'settled,', response.data.failed_count, 'failed');
      return response.data;
    } catch (error: any) {
      console.error('Failed to batch settle sales:', error);
      throw new Error(
        error.response?.data?.detail?.[0]?.msg || 
        'Failed to batch settle sales. Please try again.'
      );
    }
  }
};
