import { Product, Category, Customer, Sale } from '../types';

export const categories: Category[] = [
  { id: '1', name: 'Hot Beverages', description: 'Coffee, Tea, Hot Chocolate' },
  { id: '2', name: 'Cold Beverages', description: 'Iced Drinks, Smoothies, Juices' },
  { id: '3', name: 'Pastries', description: 'Cakes, Cookies, Muffins' },
  { id: '4', name: 'Snacks', description: 'Sandwiches, Wraps, Light Meals' },
  { id: '5', name: 'Desserts', description: 'Ice Cream, Puddings, Sweet Treats' },
];

export const products: Product[] = [
  // Hot Beverages
  { id: '1', name: 'Espresso', category: 'Hot Beverages', price: 150, stock: 100, imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=200&h=200&fit=crop' },
  { id: '2', name: 'Cappuccino', category: 'Hot Beverages', price: 200, stock: 85, imageUrl: 'https://images.unsplash.com/photo-1572442388796-11668a64e546?w=200&h=200&fit=crop' },
  { id: '3', name: 'Latte', category: 'Hot Beverages', price: 220, stock: 92, imageUrl: 'https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?w=200&h=200&fit=crop' },
  { id: '4', name: 'Americano', category: 'Hot Beverages', price: 180, stock: 78, imageUrl: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=200&h=200&fit=crop' },
  { id: '5', name: 'Green Tea', category: 'Hot Beverages', price: 120, stock: 45, imageUrl: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=200&h=200&fit=crop' },
  
  // Cold Beverages
  { id: '6', name: 'Iced Coffee', category: 'Cold Beverages', price: 200, stock: 67, imageUrl: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=200&h=200&fit=crop' },
  { id: '7', name: 'Mango Smoothie', category: 'Cold Beverages', price: 300, stock: 34, imageUrl: 'https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=200&h=200&fit=crop' },
  { id: '8', name: 'Fresh Orange Juice', category: 'Cold Beverages', price: 250, stock: 28, imageUrl: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=200&h=200&fit=crop' },
  { id: '9', name: 'Iced Tea', category: 'Cold Beverages', price: 150, stock: 52, imageUrl: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=200&h=200&fit=crop' },
  
  // Pastries
  { id: '10', name: 'Chocolate Croissant', category: 'Pastries', price: 180, stock: 24, imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=200&h=200&fit=crop' },
  { id: '11', name: 'Blueberry Muffin', category: 'Pastries', price: 160, stock: 18, imageUrl: 'https://images.unsplash.com/photo-1607958996332-8c204a43951a?w=200&h=200&fit=crop' },
  { id: '12', name: 'Cheese Danish', category: 'Pastries', price: 200, stock: 15, imageUrl: 'https://images.unsplash.com/photo-1607478900766-efe42c0b1c8e?w=200&h=200&fit=crop' },
  
  // Snacks
  { id: '13', name: 'Club Sandwich', category: 'Snacks', price: 400, stock: 12, imageUrl: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=200&h=200&fit=crop' },
  { id: '14', name: 'Chicken Wrap', category: 'Snacks', price: 350, stock: 20, imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=200&h=200&fit=crop' },
  { id: '15', name: 'Veggie Burger', category: 'Snacks', price: 320, stock: 8, imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&h=200&fit=crop' },
  
  // Desserts
  { id: '16', name: 'Chocolate Cake', category: 'Desserts', price: 280, stock: 6, imageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=200&h=200&fit=crop' },
  { id: '17', name: 'Vanilla Ice Cream', category: 'Desserts', price: 120, stock: 35, imageUrl: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=200&h=200&fit=crop' },
];

export const customers: Customer[] = [
  { id: '1', name: 'Ahmed Ali', phone: '+92-300-1234567', cardRefId: 'CARD001', balance: 2500, createdAt: new Date('2024-01-15') },
  { id: '2', name: 'Fatima Khan', phone: '+92-301-2345678', cardRefId: 'CARD002', balance: 1800, createdAt: new Date('2024-01-20') },
  { id: '3', name: 'Muhammad Hassan', phone: '+92-302-3456789', cardRefId: 'CARD003', balance: 3200, createdAt: new Date('2024-02-01') },
  { id: '4', name: 'Sara Ahmed', phone: '+92-303-4567890', cardRefId: 'CARD004', balance: 950, createdAt: new Date('2024-02-10') },
];

export const sales: Sale[] = [
  {
    id: '1',
    items: [
      { productId: '1', productName: 'Espresso', quantity: 2, price: 150, total: 300 },
      { productId: '10', productName: 'Chocolate Croissant', quantity: 1, price: 180, total: 180 }
    ],
    subtotal: 480,
    tax: 77,
    total: 557,
    paymentMethod: 'cash',
    salesmanId: '3',
    createdAt: new Date('2024-12-15T10:30:00'),
    invoiceNumber: 'INV-001'
  },
  {
    id: '2',
    items: [
      { productId: '2', productName: 'Cappuccino', quantity: 1, price: 200, total: 200 },
    ],
    subtotal: 200,
    tax: 32,
    total: 232,
    paymentMethod: 'card',
    customerId: '1',
    salesmanId: '3',
    createdAt: new Date('2024-12-15T11:15:00'),
    invoiceNumber: 'INV-002'
  }
];