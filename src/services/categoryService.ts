import api from './api';

// Types for Category Management API
export interface Category {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface CreateCategoryRequest {
  name: string;
}

export interface UpdateCategoryRequest {
  name: string;
}

// Category Management Service
export const categoryService = {
  // Get all categories
  async getCategories(): Promise<Category[]> {
    try {
      console.log('Fetching categories...');
      const response = await api.get<Category[]>('/categories/');
      console.log('Categories fetched successfully:', response.data.length, 'categories');
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch categories:', error);
      throw new Error(
        error.response?.data?.detail?.[0]?.msg || 
        'Failed to fetch categories. Please try again.'
      );
    }
  },

  // Get a single category by ID
  async getCategory(categoryId: number): Promise<Category> {
    try {
      console.log('Fetching category:', categoryId);
      const response = await api.get<Category>(`/categories/${categoryId}`);
      console.log('Category fetched successfully:', response.data.name);
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch category:', error);
      throw new Error(
        error.response?.data?.detail?.[0]?.msg || 
        'Failed to fetch category. Please try again.'
      );
    }
  },

  // Create a new category
  async createCategory(categoryData: CreateCategoryRequest): Promise<Category> {
    try {
      console.log('Creating category:', { name: categoryData.name });
      const response = await api.post<Category>('/categories/', categoryData);
      console.log('Category created successfully:', response.data.name);
      return response.data;
    } catch (error: any) {
      console.error('Failed to create category:', error);
      throw new Error(
        error.response?.data?.detail?.[0]?.msg || 
        'Failed to create category. Please check the information and try again.'
      );
    }
  },

  // Update a category
  async updateCategory(categoryId: number, categoryData: UpdateCategoryRequest): Promise<Category> {
    try {
      console.log('Updating category:', categoryId, categoryData);
      const response = await api.put<Category>(`/categories/${categoryId}`, categoryData);
      console.log('Category updated successfully:', response.data.name);
      return response.data;
    } catch (error: any) {
      console.error('Failed to update category:', error);
      throw new Error(
        error.response?.data?.detail?.[0]?.msg || 
        'Failed to update category. Please try again.'
      );
    }
  },

  // Delete a category
  async deleteCategory(categoryId: number): Promise<string> {
    try {
      console.log('Deleting category:', categoryId);
      const response = await api.delete<string>(`/categories/${categoryId}`);
      console.log('Category deleted successfully');
      return response.data;
    } catch (error: any) {
      console.error('Failed to delete category:', error);
      throw new Error(
        error.response?.data?.detail?.[0]?.msg || 
        'Failed to delete category. Please try again.'
      );
    }
  },

  // Seed default categories (for development)
  async seedCategories(): Promise<any> {
    try {
      console.log('Seeding default categories...');
      const response = await api.post('/categories/seed-categories');
      console.log('Categories seeded successfully:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Failed to seed categories:', error);
      throw new Error(
        error.response?.data?.detail?.[0]?.msg || 
        'Failed to seed categories. Please try again.'
      );
    }
  }
};

// Make functions available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).categoryService = categoryService;
}
