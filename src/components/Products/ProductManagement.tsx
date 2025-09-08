import React, { useState } from 'react';
import { Product, Category } from '../../types';
import { useProducts } from '../../contexts/ProductContext';
import { useCategories } from '../../contexts/CategoryContext';
import { 
  Package, 
  Plus, 
  Edit3, 
  Trash2, 
  AlertTriangle,
  Search,
  Filter,
  Loader2,
  AlertCircle,
  Upload,
  Tag,
  X
} from 'lucide-react';

export function ProductManagement() {
  const { products, loading, error, addProduct, updateProduct, deleteProduct } = useProducts();
  const { categories, loading: categoriesLoading, error: categoriesError, addCategory, deleteCategory } = useCategories();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [isSubmittingCategory, setIsSubmittingCategory] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    stock: '',
    description: '',
    imageUrl: ''
  });

  const filteredProducts = products.filter(product => {
    const productCategoryName = categories.find(cat => cat.id === product.category_id)?.name || 'General';
    const matchesCategory = selectedCategory === 'all' || productCategoryName === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const lowStockProducts = products.filter(p => p.stock < 20);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      
      // Find the category ID based on the selected category name
      const selectedCategory = categories.find(cat => cat.name === formData.category);
      if (!selectedCategory && formData.category) {
        throw new Error('Selected category not found');
      }
      
      const productData = {
        name: formData.name,
        description: formData.description,
        price: Number(formData.price),
        stock: Number(formData.stock),
        image_url: formData.imageUrl,
        category_id: selectedCategory ? selectedCategory.id : 1, // Use selected category ID or default to 1
      };
      
      if (editingProduct) {
        await updateProduct(editingProduct.id, productData);
        setEditingProduct(null);
      } else {
        await addProduct(productData);
    }
    
    setFormData({ name: '', category: '', price: '', stock: '', description: '', imageUrl: '' });
      setSelectedImage(null);
    setShowAddForm(false);
    } catch (err: any) {
      console.error('Error submitting product:', err);
      // Error is handled by the context
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEdit = (product: Product) => {
    setEditingProduct(product);
    // Find the category name based on the product's category_id
    const productCategory = categories.find(cat => cat.id === product.category_id);
    setFormData({
      name: product.name,
      category: productCategory ? productCategory.name : '',
      price: product.price.toString(),
      stock: product.stock.toString(),
      description: product.description || '',
      imageUrl: product.imageUrl || product.image_url || ''
    });
    setShowAddForm(true);
  };

  const handleDeleteProduct = async (productId: number) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteProduct(productId);
      } catch (err: any) {
        console.error('Error deleting product:', err);
        // Error is handled by the context
      }
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      // You could also preview the image here
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) return;

    try {
      setIsSubmittingCategory(true);
      await addCategory({ name: categoryName.trim() });
      setCategoryName('');
      setShowCategoryForm(false);
    } catch (err: any) {
      console.error('Error adding category:', err);
    } finally {
      setIsSubmittingCategory(false);
    }
  };

  const handleDeleteCategory = async (categoryId: number) => {
    if (window.confirm('Are you sure you want to delete this category? This will affect all products in this category.')) {
      try {
        await deleteCategory(categoryId);
      } catch (err: any) {
        console.error('Error deleting category:', err);
      }
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Product Management</h1>
          <p className="text-gray-600">Manage your cafe inventory and pricing</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => {
              setShowCategoryForm(true);
              setCategoryName('');
            }}
            className="bg-slate-600 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors flex items-center space-x-2"
          >
            <Tag size={20} />
            <span>Add Category</span>
          </button>
        <button
          onClick={() => {
            setShowAddForm(true);
            setEditingProduct(null);
            setFormData({ name: '', category: '', price: '', stock: '', description: '', imageUrl: '' });
          }}
          className="bg-slate-700 text-white px-4 py-2 rounded-lg hover:bg-slate-600 transition-colors flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>Add Product</span>
        </button>
      </div>
      </div>

      {/* Error Display */}
      {(error || categoriesError) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="text-red-400 mr-2" size={20} />
            <p className="text-red-800">{error || categoriesError}</p>
          </div>
        </div>
      )}

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h3 className="text-sm font-medium text-red-800">Low Stock Alert</h3>
          </div>
          <p className="text-sm text-red-700 mt-1">
            {lowStockProducts.length} products have stock below 20 units
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="flex space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-gray-500" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
            disabled={categoriesLoading}
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.name}>{cat.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-slate-600" size={32} />
            <span className="ml-2 text-gray-600">Loading products...</span>
          </div>
        ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {(product.imageUrl || product.image_url) ? (
                        <img 
                          src={product.imageUrl || product.image_url} 
                          alt={product.name}
                          className="h-10 w-10 rounded-lg object-cover mr-3"
                          onError={(e) => {
                            const target = e.currentTarget as HTMLImageElement;
                            target.style.display = 'none';
                            const nextElement = target.nextElementSibling as HTMLElement;
                            if (nextElement) {
                              nextElement.style.display = 'flex';
                            }
                          }}
                        />
                      ) : null}
                      <div className={`h-10 w-10 bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg flex items-center justify-center mr-3 ${(product.imageUrl || product.image_url) ? 'hidden' : ''}`}>
                        <img 
                          src="/logo.svg" 
                          alt="Cafe D Revenue Logo" 
                          className="w-6 h-6 object-contain opacity-60"
                        />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                        {product.description && (
                          <div className="text-sm text-gray-500">{product.description}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className="px-2 py-1 bg-slate-100 text-slate-800 rounded-full text-xs font-medium">
                      {categories.find(cat => cat.id === product.category_id)?.name || 'General'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    PKR {product.price}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      product.stock > 20 ? 'bg-green-100 text-green-800' :
                      product.stock > 5 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {product.stock} units
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => startEdit(product)}
                      className="text-slate-600 hover:text-slate-900"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </div>

      {/* Add/Edit Product Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] flex flex-col">
            <div className="flex-shrink-0 p-6 pb-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  required
                  disabled={categoriesLoading}
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (PKR)</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                    required
                  />

                  
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  />
                  {selectedImage && (
                    <p className="text-sm text-gray-600">Selected: {selectedImage.name}</p>
                  )}
                  <div className="text-sm text-gray-500">Or enter image URL:</div>
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  placeholder="https://example.com/image.jpg"
                />
                </div>
              </div>
              </form>
            </div>
            <div className="flex-shrink-0 p-6 pt-4 border-t border-gray-200">
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1 bg-slate-700 text-white py-2 px-4 rounded-lg hover:bg-slate-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin mr-2" size={16} />
                      {editingProduct ? 'Updating...' : 'Adding...'}
                    </>
                  ) : (
                    `${editingProduct ? 'Update' : 'Add'} Product`
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingProduct(null);
                  }}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {showCategoryForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] flex flex-col">
            <div className="flex-shrink-0 p-6 pb-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">Add New Category</h2>
                <button
                  onClick={() => {
                    setShowCategoryForm(false);
                    setCategoryName('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <form onSubmit={handleAddCategory} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category Name</label>
                <input
                  type="text"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  placeholder="Enter category name"
                  required
                />
              </div>
              </form>
            </div>
            <div className="flex-shrink-0 p-6 pt-4 border-t border-gray-200">
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={handleAddCategory}
                  disabled={isSubmittingCategory}
                  className="flex-1 bg-slate-600 text-white py-2 px-4 rounded-lg hover:bg-slate-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isSubmittingCategory ? (
                    <>
                      <Loader2 className="animate-spin mr-2" size={16} />
                      Adding...
                    </>
                  ) : (
                    'Add Category'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCategoryForm(false);
                    setCategoryName('');
                  }}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Categories List */}
      {categories.length > 0 && (
        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Categories</h3>
          </div>
          <div className="p-6">
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center space-x-2 bg-slate-100 text-slate-800 px-3 py-1 rounded-full text-sm font-medium"
                >
                  <Tag size={14} />
                  <span>{category.name}</span>
                  <button
                    onClick={() => handleDeleteCategory(category.id)}
                    className="text-blue-600 hover:text-blue-800 ml-1"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}