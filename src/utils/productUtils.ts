import { Product } from '../types';

/**
 * Utility functions for product-related operations
 */

/**
 * Get product name by ID from products list
 * Falls back to "Product #ID" if not found
 */
export const getProductNameById = (productId: number, products: Product[]): string => {
  const product = products.find(p => p.id === productId);
  return product?.name || `Product #${productId}`;
};

/**
 * Get formatted product name with quantity for display
 */
export const getFormattedProductName = (productId: number, quantity: number, products: Product[]): string => {
  const productName = getProductNameById(productId, products);
  return `${productName} x${quantity}`;
};

/**
 * Extract product name from sale item with various fallback strategies
 * Handles inconsistent property naming between backend and frontend
 */
export const extractProductName = (item: any, products: Product[]): string => {
  // Try different property names that might contain the product name
  if (item.product_name) return item.product_name;
  if (item.productName) return item.productName;
  if (item.name) return item.name;
  
  // Fallback to looking up by product_id if available
  if (item.product_id && products?.length > 0) {
    return getProductNameById(item.product_id, products);
  }
  
  // Last resort fallback
  return `Product #${item.product_id || 'Unknown'}`;
};

/**
 * Calculate total price for a sale item with fallback strategies
 */
export const calculateItemTotal = (item: any, products?: Product[]): number => {
  // Try different ways the total might be stored
  if (item.total_price) return item.total_price;
  if (item.total) return item.total;
  if (item.unit_price && item.quantity) return item.unit_price * item.quantity;
  if (item.price && item.quantity) return item.price * item.quantity;
  
  // If no direct pricing, try to calculate from product lookup
  if (item.product_id && item.quantity && products && products.length > 0) {
    const product = products.find(p => p.id === item.product_id);
    if (product?.price) {
      return product.price * item.quantity;
    }
  }
  
  return 0;
};

/**
 * Get unit price for a sale item
 */
export const getItemUnitPrice = (item: any, products?: Product[]): number => {
  if (item.unit_price) return item.unit_price;
  if (item.price) return item.price;
  if (item.total && item.quantity && item.quantity > 0) return item.total / item.quantity;
  
  // If no direct pricing, try to get from product lookup
  if (item.product_id && products && products.length > 0) {
    const product = products.find(p => p.id === item.product_id);
    if (product?.price) {
      return product.price;
    }
  }
  
  return 0;
};