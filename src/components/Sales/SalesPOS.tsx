import React, { useState } from 'react';
import { products, customers } from '../../data/mockData';
import { Product, SaleItem, PaymentMethod } from '../../types';
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard,
  Banknote,
  Smartphone,
  Clock,
  Search,
  Printer,
  Package
} from 'lucide-react';

export function SalesPOS() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cartItems, setCartItems] = useState<SaleItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [selectedCustomer, setSelectedCustomer] = useState('');

  const categories = ['all', ...new Set(products.map(p => p.category))];
  
  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const addToCart = (product: Product) => {
    const existingItem = cartItems.find(item => item.productId === product.id);
    
    if (existingItem) {
      setCartItems(cartItems.map(item =>
        item.productId === product.id
          ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.price }
          : item
      ));
    } else {
      setCartItems([...cartItems, {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        price: product.price,
        total: product.price
      }]);
    }
  };

  const updateQuantity = (productId: string, change: number) => {
    setCartItems(cartItems.map(item => {
      if (item.productId === productId) {
        const newQuantity = Math.max(0, item.quantity + change);
        return newQuantity === 0 
          ? null 
          : { ...item, quantity: newQuantity, total: newQuantity * item.price };
      }
      return item;
    }).filter(Boolean) as SaleItem[]);
  };

  const removeFromCart = (productId: string) => {
    setCartItems(cartItems.filter(item => item.productId !== productId));
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.total, 0);
  const total = subtotal; // Removed GST calculation

  const handleCheckout = () => {
    if (cartItems.length === 0) return;
    
    // Generate invoice
    const invoiceNumber = `INV-${Date.now()}`;
    
    // Here you would normally save to database
    console.log('Processing sale:', {
      items: cartItems,
      subtotal,
      total,
      paymentMethod,
      customerId: selectedCustomer,
      invoiceNumber
    });

    // Clear cart
    setCartItems([]);
    setSelectedCustomer('');
    
    alert(`Sale completed! Invoice: ${invoiceNumber}`);
  };

  const paymentIcons = {
    cash: Banknote,
    card: CreditCard,
    easypaisa: Smartphone,
    pending: Clock
  };

  return (
    <div className="h-full flex">
      {/* Products Section */}
      <div className="flex-1 p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Point of Sale</h1>
          
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>

          {/* Category Filter */}
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-amber-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category === 'all' ? 'All' : category}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-lg shadow-md border border-gray-200 p-4 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => addToCart(product)}
            >
              <div className="h-24 bg-gradient-to-br from-amber-100 to-orange-100 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                {product.imageUrl ? (
                  <img 
                    src={product.imageUrl} 
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling!.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div className={`w-full h-full flex items-center justify-center ${product.imageUrl ? 'hidden' : ''}`}>
                  <Package className="w-8 h-8 text-amber-700" />
                </div>
              </div>
              <h3 className="font-semibold text-gray-900 text-sm mb-1">{product.name}</h3>
              <p className="text-xs text-gray-600 mb-2">{product.category}</p>
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-amber-900">PKR {product.price}</span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  product.stock > 20 ? 'bg-green-100 text-green-800' :
                  product.stock > 5 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {product.stock} left
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cart Section */}
      <div className="w-96 bg-white border-l border-gray-200 p-6 flex flex-col">
        <div className="flex items-center space-x-2 mb-6">
          <ShoppingCart className="w-6 h-6 text-amber-900" />
          <h2 className="text-xl font-bold text-gray-900">Current Order</h2>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto mb-6">
          {cartItems.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
              <ShoppingCart className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p>No items in cart</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cartItems.map((item) => (
                <div key={item.productId} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium text-gray-900 text-sm">{item.productName}</span>
                    <button
                      onClick={() => removeFromCart(item.productId)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateQuantity(item.productId, -1)}
                        className="w-6 h-6 rounded-full bg-gray-300 hover:bg-gray-400 flex items-center justify-center"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.productId, 1)}
                        className="w-6 h-6 rounded-full bg-amber-900 hover:bg-amber-800 text-white flex items-center justify-center"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                    <span className="font-semibold text-gray-900">PKR {item.total}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Customer Selection */}
        {cartItems.length > 0 && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Customer (Optional)
            </label>
            <select
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
            >
              <option value="">Walk-in Customer</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} ({customer.cardRefId})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Payment Method */}
        {cartItems.length > 0 && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Payment Method
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(paymentIcons) as PaymentMethod[]).map((method) => {
                const Icon = paymentIcons[method];
                return (
                  <button
                    key={method}
                    onClick={() => setPaymentMethod(method)}
                    className={`flex items-center space-x-2 p-3 rounded-lg border transition-colors ${
                      paymentMethod === method
                        ? 'border-amber-900 bg-amber-50 text-amber-900'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon size={16} />
                    <span className="text-sm font-medium capitalize">{method}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Bill Summary */}
        {cartItems.length > 0 && (
          <>
            <div className="border-t border-gray-200 pt-4 space-y-2">
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span>PKR {total.toFixed(2)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-6">
              <button
                onClick={handleCheckout}
                className="bg-amber-900 text-white px-4 py-3 rounded-lg hover:bg-amber-800 transition-colors font-medium"
              >
                Process Sale
              </button>
              <button className="border border-gray-300 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center justify-center space-x-2">
                <Printer size={16} />
                <span>Print</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}