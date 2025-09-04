import api from './api';

// Types for Product Management API
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
}

export interface CreateProductRequest {
  name: string;
  description: string;
  price: number;
  stock: number;
  image_url?: string;
  category_id: number;
}

export interface UpdateProductRequest {
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
  image_url?: string;
  category_id?: number;
}

// Product Management Service
export const productService = {
  // Get all products
  async getProducts(): Promise<Product[]> {
    try {
      console.log('Fetching products...');
      const response = await api.get<Product[]>('/products/');
      console.log('Products fetched successfully:', response.data.length, 'products');
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch products:', error);
      throw new Error(
        error.response?.data?.detail?.[0]?.msg || 
        'Failed to fetch products. Please try again.'
      );
    }
  },

  // Get a single product by ID
  async getProduct(productId: number): Promise<Product> {
    try {
      console.log('Fetching product:', productId);
      const response = await api.get<Product>(`/products/${productId}`);
      console.log('Product fetched successfully:', response.data.name);
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch product:', error);
      throw new Error(
        error.response?.data?.detail?.[0]?.msg || 
        'Failed to fetch product. Please try again.'
      );
    }
  },

  // Create a new product
  async createProduct(productData: CreateProductRequest): Promise<Product> {
    try {
      console.log('Creating product:', { name: productData.name, price: productData.price });
      const response = await api.post<Product>('/products/', productData);
      console.log('Product created successfully:', response.data.name);
      return response.data;
    } catch (error: any) {
      console.error('Failed to create product:', error);
      throw new Error(
        error.response?.data?.detail?.[0]?.msg || 
        'Failed to create product. Please check the information and try again.'
      );
    }
  },

  // Update a product
  async updateProduct(productId: number, productData: UpdateProductRequest): Promise<Product> {
    try {
      console.log('Updating product:', productId, productData);
      const response = await api.put<Product>(`/products/${productId}`, productData);
      console.log('Product updated successfully:', response.data.name);
      return response.data;
    } catch (error: any) {
      console.error('Failed to update product:', error);
      throw new Error(
        error.response?.data?.detail?.[0]?.msg || 
        'Failed to update product. Please try again.'
      );
    }
  },

  // Delete a product
  async deleteProduct(productId: number): Promise<string> {
    try {
      console.log('Deleting product:', productId);
      const response = await api.delete<string>(`/products/${productId}`);
      console.log('Product deleted successfully');
      return response.data;
    } catch (error: any) {
      console.error('Failed to delete product:', error);
      throw new Error(
        error.response?.data?.detail?.[0]?.msg || 
        'Failed to delete product. Please try again.'
      );
    }
  },

  // Upload product image
  async uploadProductImage(productId: number, file: File): Promise<Product> {
    try {
      console.log('Uploading image for product:', productId);
      
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await api.post<Product>(`/products/${productId}/upload-image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('Image uploaded successfully for product:', response.data.name);
      return response.data;
    } catch (error: any) {
      console.error('Failed to upload product image:', error);
      throw new Error(
        error.response?.data?.detail?.[0]?.msg || 
        'Failed to upload image. Please try again.'
      );
    }
  }
};

// Make functions available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).productService = productService;
}
