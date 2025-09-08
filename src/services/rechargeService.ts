import api from './api';

// Recharge interfaces matching backend API
export interface Recharge {
  id: number;
  customer_id: number;
  amount: number;
  recharge_date: string;
}

export interface CreateRechargeRequest {
  customer_id: number;
  amount: number;
}

export const rechargeService = {
  // Create new recharge (matches backend /sales/recharge endpoint)
  async createRecharge(rechargeData: CreateRechargeRequest): Promise<Recharge> {
    try {
      console.log('Creating recharge:', rechargeData.amount, 'for customer:', rechargeData.customer_id);
      const response = await api.post<Recharge>('/sales/recharge', rechargeData);
      console.log('Recharge created successfully:', response.data.id);
      return response.data;
    } catch (error: any) {
      console.error('Failed to create recharge:', error);
      throw new Error(
        error.response?.data?.detail?.[0]?.msg || 
        'Failed to create recharge. Please try again.'
      );
    }
  },

  // Get all recharges (for admin/manager)
  async getRecharges(): Promise<Recharge[]> {
    try {
      console.log('Fetching all recharges...');
      const response = await api.get<Recharge[]>('/sales/recharge');
      console.log('All recharges fetched successfully:', response.data.length, 'recharges');
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch recharges:', error);
      throw new Error(
        error.response?.data?.detail?.[0]?.msg || 
        'Failed to fetch recharges. Please try again.'
      );
    }
  },

  // Get recharge history for a customer
  async getRechargeHistory(customerId: number): Promise<Recharge[]> {
    try {
      console.log('Fetching recharge history for customer:', customerId);
      const response = await api.get<Recharge[]>(`/sales/recharge/history/${customerId}`);
      console.log('Recharge history fetched successfully:', response.data.length, 'recharges');
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch recharge history:', error);
      throw new Error(
        error.response?.data?.detail?.[0]?.msg || 
        'Failed to fetch recharge history. Please try again.'
      );
    }
  }
};

// Make functions available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).rechargeService = rechargeService;
}
