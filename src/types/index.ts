export type UserRole = 'admin' | 'manager' | 'salesman';

export interface User {
  id: number;
  username: string;
  role: UserRole;
  name?: string; // Optional since API doesn't return name
  email: string;
  phone?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  image_url: string;
  category_id: number;
  created_at: string;
  updated_at: string;
  // Legacy fields for backward compatibility
  category?: string;
  imageUrl?: string;
}

export interface Category {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
  // Legacy fields for backward compatibility
  description?: string;
}

export interface RechargeTransaction {
  id: number;
  customer_id: number;
  amount: number;
  recharge_date: string;
  // Legacy fields for backward compatibility
  customerId?: string;
  previousBalance?: number;
  newBalance?: number;
  timestamp?: Date;
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
  rfid_no: string;
  card_number: string;
  balance: number;
  created_at: string;
  updated_at: string;
  // New field for card discount with proper typing
  card_discount: number;
  // Legacy fields for backward compatibility
  address?: string;
  cardRefId?: string;
  rfId?: string;
  createdAt?: Date;
}

export interface SaleItem {
  product_id: number;
  quantity: number;
  // Legacy fields for backward compatibility
  productId?: string;
  productName?: string;
  price?: number;
  total?: number;
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
  // Legacy fields for backward compatibility
  subtotal?: number;
  tax?: number;
  total?: number;
  customerId?: string;
  salesmanId?: string;
  createdAt?: Date;
  invoiceNumber?: string;
}

export type PaymentMethod = 'card' | 'cash' | 'easypaisa' | 'pending';