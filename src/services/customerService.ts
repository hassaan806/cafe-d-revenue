import api from './api';

// Customer interfaces based on backend API
export interface Customer {
  id: number;
  name: string;
  phone: string;
  rfid_no: string;
  card_number: string;
  balance: number;
  created_at: string;
  updated_at: string;
}

export interface CreateCustomerRequest {
  name: string;
  phone: string;
  rfid_no: string;
  card_number: string;
  balance: number;
}

export interface UpdateCustomerRequest {
  name?: string;
  phone?: string;
  rfid_no?: string;
  card_number?: string;
  balance?: number;
}

export const customerService = {
  // Get all customers
  async getCustomers(): Promise<Customer[]> {
    try {
      console.log('Fetching customers...');
      const response = await api.get<Customer[]>('/customers/');
      console.log('Customers fetched successfully:', response.data.length, 'customers');
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch customers:', error);
      throw new Error(
        error.response?.data?.detail?.[0]?.msg || 
        'Failed to fetch customers. Please try again.'
      );
    }
  },

  // Get a single customer by ID
  async getCustomer(customerId: number): Promise<Customer> {
    try {
      console.log('Fetching customer:', customerId);
      const response = await api.get<Customer>(`/customers/${customerId}`);
      console.log('Customer fetched successfully:', response.data.name);
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch customer:', error);
      throw new Error(
        error.response?.data?.detail?.[0]?.msg || 
        'Failed to fetch customer. Please try again.'
      );
    }
  },

  // Create a new customer
  async createCustomer(customerData: CreateCustomerRequest): Promise<Customer> {
    try {
      console.log('Creating customer:', customerData.name);
      const response = await api.post<Customer>('/customers/', customerData);
      console.log('Customer created successfully:', response.data.name);
      return response.data;
    } catch (error: any) {
      console.error('Failed to create customer:', error);
      throw new Error(
        error.response?.data?.detail?.[0]?.msg || 
        'Failed to create customer. Please try again.'
      );
    }
  },

  // Update a customer
  async updateCustomer(customerId: number, customerData: UpdateCustomerRequest): Promise<Customer> {
    try {
      console.log('Updating customer:', customerId);
      const response = await api.put<Customer>(`/customers/${customerId}`, customerData);
      console.log('Customer updated successfully:', response.data.name);
      return response.data;
    } catch (error: any) {
      console.error('Failed to update customer:', error);
      throw new Error(
        error.response?.data?.detail?.[0]?.msg || 
        'Failed to update customer. Please try again.'
      );
    }
  },

  // Delete a customer
  async deleteCustomer(customerId: number): Promise<string> {
    try {
      console.log('Deleting customer:', customerId);
      const response = await api.delete<string>(`/customers/${customerId}`);
      console.log('Customer deleted successfully');
      return response.data;
    } catch (error: any) {
      console.error('Failed to delete customer:', error);
      throw new Error(
        error.response?.data?.detail?.[0]?.msg || 
        'Failed to delete customer. Please try again.'
      );
    }
  },

  // Get customer by card number
  async getCustomerByCard(cardNumber: string): Promise<Customer> {
    try {
      console.log('Fetching customer by card:', cardNumber);
      const response = await api.get<Customer>(`/customers/search/by-card/${cardNumber}`);
      console.log('Customer fetched successfully:', response.data.name);
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch customer by card:', error);
      throw new Error(
        error.response?.data?.detail?.[0]?.msg || 
        'Failed to fetch customer. Please try again.'
      );
    }
  },

  // Get customer by RFID
  async getCustomerByRfid(rfidNo: string): Promise<Customer> {
    try {
      console.log('Fetching customer by RFID:', rfidNo);
      const response = await api.get<Customer>(`/customers/search/by-rfid/${rfidNo}`);
      console.log('Customer fetched successfully:', response.data.name);
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch customer by RFID:', error);
      throw new Error(
        error.response?.data?.detail?.[0]?.msg || 
        'Failed to fetch customer. Please try again.'
      );
    }
  }
};
