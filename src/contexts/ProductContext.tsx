import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product } from '../types';
import { productService, Product as ApiProduct } from '../services/productService';
import { categoryService } from '../services/categoryService';

interface ProductContextType {
  products: Product[];
  loading: boolean;
  error: string | null;
  addProduct: (product: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateProduct: (id: number, product: Partial<Product>) => Promise<void>;
  deleteProduct: (id: number) => Promise<void>;
  refreshProducts: () => Promise<void>;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

// Helper function to convert API product to app product
const convertApiProductToAppProduct = async (apiProduct: ApiProduct): Promise<Product> => {
  let categoryName = 'General';
  
  try {
    // Try to fetch the category name for this product
    const categories = await categoryService.getCategories();
    const category = categories.find(cat => cat.id === apiProduct.category_id);
    if (category) {
      categoryName = category.name;
    }
  } catch (error) {
    console.warn('Could not fetch category name for product:', apiProduct.name);
  }
  
  return {
    id: apiProduct.id,
    name: apiProduct.name,
    description: apiProduct.description,
    price: apiProduct.price,
    stock: apiProduct.stock,
    image_url: apiProduct.image_url,
    category_id: apiProduct.category_id,
    created_at: apiProduct.created_at,
    updated_at: apiProduct.updated_at,
    // Legacy fields for backward compatibility
    category: categoryName,
    imageUrl: apiProduct.image_url,
  };
};

export function ProductProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch products on component mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('ProductContext: Fetching products from API...');
        const apiProducts = await productService.getProducts();
        const appProducts = await Promise.all(apiProducts.map(convertApiProductToAppProduct));
        setProducts(appProducts);
        console.log('ProductContext: Successfully loaded', appProducts.length, 'products');
      } catch (err: any) {
        console.warn('ProductContext: API not available, using empty data:', err.message);
        setError(err.message || 'Failed to fetch products');
        setProducts([]); // Use empty array as fallback
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const addProduct = async (productData: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setError(null);
      const apiProduct = await productService.createProduct({
        name: productData.name,
        description: productData.description,
        price: productData.price,
        stock: productData.stock,
        image_url: productData.image_url || '',
        category_id: productData.category_id || 1, // Default category ID
      });
      
      const appProduct = await convertApiProductToAppProduct(apiProduct);
      setProducts(prev => [...prev, appProduct]);
    } catch (err: any) {
      setError(err.message || 'Failed to create product');
      throw err;
    }
  };

  const updateProduct = async (id: number, productData: Partial<Product>) => {
    try {
      setError(null);
      const apiProduct = await productService.updateProduct(id, {
        name: productData.name,
        description: productData.description,
        price: productData.price,
        stock: productData.stock,
        image_url: productData.image_url,
        category_id: productData.category_id,
      });
      
      const appProduct = await convertApiProductToAppProduct(apiProduct);
      setProducts(prev => prev.map(p => p.id === id ? appProduct : p));
    } catch (err: any) {
      setError(err.message || 'Failed to update product');
      throw err;
    }
  };

  const deleteProduct = async (id: number) => {
    try {
      setError(null);
      await productService.deleteProduct(id);
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (err: any) {
      setError(err.message || 'Failed to delete product');
      throw err;
    }
  };

  const refreshProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const apiProducts = await productService.getProducts();
      const appProducts = await Promise.all(apiProducts.map(convertApiProductToAppProduct));
      setProducts(appProducts);
    } catch (err: any) {
      setError(err.message || 'Failed to refresh products');
      console.error('Error refreshing products:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProductContext.Provider value={{
      products,
      loading,
      error,
      addProduct,
      updateProduct,
      deleteProduct,
      refreshProducts
    }}>
      {children}
    </ProductContext.Provider>
  );
}

export function useProducts() {
  const context = useContext(ProductContext);
  if (context === undefined) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
}
