import api from './api';

// Recharge interfaces
export interface Recharge {
  id: number;
  amount: number;
  customer_id: number;
  recharge_date: string;
}

export interface CreateRechargeRequest {
  amount: number;
  customer_id: number;
}

export const rechargeService = {
  //  all recharges
  async getRecharges(): Promise<Recharge[]> {
    try {
      console.log('Fetching recharges...');
      const response = await api.get<Recharge[]>('/recharges/');
      console.log('Recharges fetched successfully:', response.data.length, 'recharges');
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch recharges:', error);
      throw new Error(
        error.response?.data?.detail?.[0]?.msg || 
        'Failed to fetch recharges. Please try again.'
      );
    }
  },

  // Get a single recharge by ID
  async getRecharge(rechargeId: number): Promise<Recharge> {
    try {
      console.log('Fetching recharge:', rechargeId);
      const response = await api.get<Recharge>(`/recharges/${rechargeId}`);
      console.log('Recharge fetched successfully:', response.data.id);
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch recharge:', error);
      throw new Error(
        error.response?.data?.detail?.[0]?.msg || 
        'Failed to fetch recharge. Please try again.'
      );
    }
  },

  //  new recharge
  async createRecharge(rechargeData: CreateRechargeRequest): Promise<Recharge> {
    try {
      console.log('Creating recharge:', rechargeData.amount, 'for customer:', rechargeData.customer_id);
      const response = await api.post<Recharge>('/recharges/', rechargeData);
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

  // del
  async deleteRecharge(rechargeId: number): Promise<string> {
    try {
      console.log('Deleting recharge:', rechargeId);
      const response = await api.delete<string>(`/recharges/${rechargeId}`);
      console.log('Recharge deleted successfully');
      return response.data;
    } catch (error: any) {
      console.error('Failed to delete recharge:', error);
      throw new Error(
        error.response?.data?.detail?.[0]?.msg || 
        'Failed to delete recharge. Please try again.'
      );
    }
  }
};
