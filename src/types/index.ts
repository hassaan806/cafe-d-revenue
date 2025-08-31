export type UserRole = 'admin' | 'manager' | 'salesman';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  name: string;
  email?: string;
  phone?: string;
  isActive: boolean;
  createdAt: Date;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  description?: string;
  image?: string;
  imageUrl?: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  cardRefId: string;
  balance: number;
  createdAt: Date;
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Sale {
  id: string;
  items: SaleItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: 'card' | 'cash' | 'easypaisa' | 'pending';
  customerId?: string;
  salesmanId: string;
  createdAt: Date;
  invoiceNumber: string;
}

export type PaymentMethod = 'card' | 'cash' | 'easypaisa' | 'pending';