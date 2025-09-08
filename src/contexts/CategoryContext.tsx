import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Category } from '../types';
import { categoryService, Category as ApiCategory } from '../services/categoryService';

// Helper function to convert API category to app category
const convertApiCategoryToAppCategory = (apiCategory: ApiCategory): Category => ({
  id: apiCategory.id,
  name: apiCategory.name,
  created_at: apiCategory.created_at,
  updated_at: apiCategory.updated_at,
});

interface CategoryContextType {
  categories: Category[];
  loading: boolean;
  error: string | null;
  addCategory: (categoryData: { name: string }) => Promise<void>;
  updateCategory: (id: number, categoryData: { name: string }) => Promise<void>;
  deleteCategory: (id: number) => Promise<void>;
  refreshCategories: () => Promise<void>;
}

const CategoryContext = createContext<CategoryContextType | undefined>(undefined);

export function CategoryProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('CategoryContext: Fetching categories from API...');
        const apiCategories = await categoryService.getCategories();
        const appCategories = apiCategories.map(convertApiCategoryToAppCategory);
        setCategories(appCategories);
        console.log('CategoryContext: Successfully loaded', appCategories.length, 'categories');
      } catch (err: any) {
        console.warn('CategoryContext: API not available, using empty data:', err.message);
        setError(err.message || 'Failed to fetch categories');
        setCategories([]); // Use empty array as fallback
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const addCategory = async (categoryData: { name: string }) => {
    try {
      setError(null);
      const apiCategory = await categoryService.createCategory(categoryData);
      const appCategory = convertApiCategoryToAppCategory(apiCategory);
      setCategories(prev => [...prev, appCategory]);
    } catch (err: any) {
      setError(err.message || 'Failed to create category');
      throw err;
    }
  };

  const updateCategory = async (id: number, categoryData: { name: string }) => {
    try {
      setError(null);
      const apiCategory = await categoryService.updateCategory(id, categoryData);
      const appCategory = convertApiCategoryToAppCategory(apiCategory);
      setCategories(prev => prev.map(c => c.id === id ? appCategory : c));
    } catch (err: any) {
      setError(err.message || 'Failed to update category');
      throw err;
    }
  };

  const deleteCategory = async (id: number) => {
    try {
      setError(null);
      await categoryService.deleteCategory(id);
      setCategories(prev => prev.filter(c => c.id !== id));
    } catch (err: any) {
      setError(err.message || 'Failed to delete category');
      throw err;
    }
  };

  const refreshCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const apiCategories = await categoryService.getCategories();
      const appCategories = apiCategories.map(convertApiCategoryToAppCategory);
      setCategories(appCategories);
    } catch (err: any) {
      setError(err.message || 'Failed to refresh categories');
      console.error('Error refreshing categories:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <CategoryContext.Provider value={{
      categories,
      loading,
      error,
      addCategory,
      updateCategory,
      deleteCategory,
      refreshCategories
    }}>
      {children}
    </CategoryContext.Provider>
  );
}

export function useCategories() {
  const context = useContext(CategoryContext);
  if (context === undefined) {
    throw new Error('useCategories must be used within a CategoryProvider');
  }
  return context;
}
