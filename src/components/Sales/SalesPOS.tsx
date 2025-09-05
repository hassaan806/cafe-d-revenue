import { useState } from 'react';
import { Product, SaleItem, PaymentMethod } from '../../types';
import { useProducts } from '../../contexts/ProductContext';
import { useCustomers } from '../../contexts/CustomerContext';
import { useSales } from '../../contexts/SalesContext';
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
  Package,
  Loader2
} from 'lucide-react';

export function SalesPOS() {
  const { products } = useProducts();
  const { customers } = useCustomers();
  const { addSale } = useSales();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cartItems, setCartItems] = useState<SaleItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'success' | 'error'>('success');
  const [showBillModal, setShowBillModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentSale, setCurrentSale] = useState<{
    items: SaleItem[];
    subtotal: number;
    total: number;
    paymentMethod: PaymentMethod;
    customerId: string;
    invoiceNumber: string;
    paidAmount: number;
    change: number;
    roomNumber: string | null;
    createdAt: Date;
  } | null>(null);

  const categories = ['all', ...new Set(products.map(p => p.category).filter(Boolean))];
  
  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const addToCart = (product: Product) => {
    const existingItem = cartItems.find(item => item.product_id === product.id);
    
    if (existingItem) {
      setCartItems(cartItems.map(item =>
        item.product_id === product.id
          ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * (item.price || product.price) }
          : item
      ));
    } else {
      setCartItems([...cartItems, {
        product_id: product.id,
        productId: product.id.toString(),
        productName: product.name,
        quantity: 1,
        price: product.price,
        total: product.price
      }]);
    }
  };

  const updateQuantity = (productId: string, change: number) => {
    setCartItems(cartItems.map(item => {
      if (item.productId === productId || item.product_id === parseInt(productId)) {
        const newQuantity = Math.max(0, item.quantity + change);
        return newQuantity === 0 
          ? null 
          : { ...item, quantity: newQuantity, total: newQuantity * (item.price || 0) };
      }
      return item;
    }).filter(Boolean) as SaleItem[]);
  };

  const removeFromCart = (productId: string) => {
    setCartItems(cartItems.filter(item => item.productId !== productId && item.product_id !== parseInt(productId)));
  };

  const subtotal = cartItems.reduce((sum, item) => sum + (item.total || 0), 0);
  const total = subtotal; // Removed GST calculation
  const paid = parseFloat(paidAmount) || 0;
  const change = paid - total;

  const showAlert = (message: string, type: 'success' | 'error') => {
    setAlertMessage(message);
    setAlertType(type);
    setShowAlertModal(true);
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;
    
    // validation of  cash payment
    if (paymentMethod === 'cash' && paid < total) {
      showAlert('Insufficient payment amount. Please enter the correct amount.', 'error');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Generate invoice
      const invoiceNumber = `INV-${Date.now()}`;
      
      // Create sale data for API
      const saleData = {
        customer_id: selectedCustomer ? parseInt(selectedCustomer) : 0,
        room_no: roomNumber || '',
        payment_method: paymentMethod,
        items: cartItems.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity
        }))
      };
      
      // Create sale via API
      await addSale(saleData);
      
      // Create local sale data for display
      const localSaleData = {
        items: cartItems,
        subtotal,
        total,
        paymentMethod,
        customerId: selectedCustomer,
        invoiceNumber,
        paidAmount: paymentMethod === 'cash' ? paid : total,
        change: paymentMethod === 'cash' ? change : 0,
        roomNumber: paymentMethod === 'pending' ? roomNumber : null,
        createdAt: new Date()
      };
      
      // Set current sale and show bill
      setCurrentSale(localSaleData);
      setShowBillModal(true);
      
      showAlert('Sale processed successfully!', 'success');
    } catch (error) {
      console.error('Failed to process sale:', error);
      showAlert('Failed to process sale. Please try again.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrintBill = () => {
    window.print();
  };

  const handleCloseBill = () => {
    // Clear cart after bill is closed
    setCartItems([]);
    setSelectedCustomer('');
    setPaidAmount('');
    setRoomNumber('');
    setShowBillModal(false);
    setCurrentSale(null);
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
                onClick={() => setSelectedCategory(category || 'all')}
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
                      const target = e.currentTarget as HTMLImageElement;
                      target.style.display = 'none';
                      const nextElement = target.nextElementSibling as HTMLElement;
                      if (nextElement) {
                        nextElement.style.display = 'flex';
                      }
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
      <div className="w-96 bg-white border-l border-gray-200 flex flex-col h-full">
        {/* Header - Fixed */}
        <div className="flex items-center space-x-2 p-6 pb-4 border-b border-gray-200">
          <ShoppingCart className="w-6 h-6 text-amber-900" />
          <h2 className="text-xl font-bold text-gray-900">Current Order</h2>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 pt-4">
          {/* Cart Items */}
          <div className="mb-6">
            {cartItems.length === 0 ? (
              <div className="text-center text-gray-500 mt-8">
                <ShoppingCart className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p>No items in cart</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cartItems.map((item) => {
                  const productId = item.productId || item.product_id?.toString() || '';
                  return (
                    <div key={productId} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium text-gray-900 text-sm">{item.productName}</span>
                      <button
                          onClick={() => removeFromCart(productId)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <button
                            onClick={() => updateQuantity(productId, -1)}
                          className="w-6 h-6 rounded-full bg-gray-300 hover:bg-gray-400 flex items-center justify-center"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <button
                            onClick={() => updateQuantity(productId, 1)}
                          className="w-6 h-6 rounded-full bg-amber-900 hover:bg-amber-800 text-white flex items-center justify-center"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                        <span className="font-semibold text-gray-900">PKR {item.total || 0}</span>
                      </div>
                    </div>
                  );
                })}
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
                    {customer.name} ({customer.cardRefId || customer.card_number})
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

          {/* Cash Payment Input */}
          {cartItems.length > 0 && paymentMethod === 'cash' && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <label className="block text-sm font-medium text-amber-800 mb-2">
                Amount Paid
              </label>
              <input
                type="number"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                className="w-full px-3 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                placeholder="Enter amount received from customer"
                min="0"
                step="0.01"
              />
            </div>
          )}

          {/* Room Number Input for Pending Payment */}
          {cartItems.length > 0 && paymentMethod === 'pending' && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <label className="block text-sm font-medium text-amber-800 mb-2">
                Room Number
              </label>
              <input
                type="number"
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                className="w-full px-3 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                placeholder="Enter room number"
                min="1"
              />
            </div>
          )}

          {/* Bill Summary */}
          {cartItems.length > 0 && (
            <div className="border-t border-gray-200 pt-4 space-y-2">
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span>PKR {total.toFixed(2)}</span>
              </div>
              
              {paymentMethod === 'cash' && paidAmount && (
                <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">Paid:</span>
                    <span className="font-semibold">PKR {paid.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold">
                    <span>Change:</span>
                    <span className={change >= 0 ? 'text-green-600' : 'text-red-600'}>
                      PKR {change.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer - Fixed */}
        {cartItems.length > 0 && (
          <div className="p-6 pt-4 border-t border-gray-200 bg-white">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleCheckout}
                disabled={isProcessing}
                className="bg-amber-900 text-white px-4 py-3 rounded-lg hover:bg-amber-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isProcessing && <Loader2 size={16} className="animate-spin" />}
                <span>{isProcessing ? 'Processing...' : 'Process Sale'}</span>
              </button>
              <button className="border border-gray-300 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center justify-center space-x-2">
                <Printer size={16} />
                <span>Print</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Alert Modal */}
      {showAlertModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="text-center">
              <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full mb-4 ${
                alertType === 'success' ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {alertType === 'success' ? (
                  <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
              
              <h3 className={`text-lg font-medium mb-2 ${
                alertType === 'success' ? 'text-green-900' : 'text-red-900'
              }`}>
                {alertType === 'success' ? 'Success!' : 'Error!'}
              </h3>
              
              <p className="text-sm text-gray-600 mb-6">
                {alertMessage}
              </p>
              
              <button
                onClick={() => setShowAlertModal(false)}
                className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                  alertType === 'success' 
                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bill Modal */}
      {showBillModal && currentSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Cafe D Revenue</h2>
              <p className="text-sm text-gray-600">FBR Department</p>
              <p className="text-xs text-gray-500 mt-1">Invoice: {currentSale.invoiceNumber}</p>
            </div>
            
            <div className="border-t border-b border-gray-200 py-4">
              <div className="text-sm text-gray-600 mb-2">
                Date: {currentSale.createdAt.toLocaleDateString()}
              </div>
              <div className="text-sm text-gray-600 mb-2">
                Time: {currentSale.createdAt.toLocaleTimeString()}
              </div>
              {currentSale.roomNumber && (
                <div className="text-sm text-gray-600 mb-2">
                  Room: {currentSale.roomNumber}
                </div>
              )}
            </div>
            
            <div className="py-4">
              <h3 className="font-semibold text-gray-900 mb-3">Items:</h3>
              <div className="space-y-2">
                {currentSale.items.map((item) => (
                  <div key={item.productId} className="flex justify-between text-sm">
                    <span>{item.productName} x{item.quantity}</span>
                    <span>PKR {item.total}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="border-t border-gray-200 pt-4 space-y-2">
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span>PKR {currentSale.total.toFixed(2)}</span>
              </div>
              
              {currentSale.paymentMethod === 'cash' && (
                <>
                  <div className="flex justify-between text-sm">
                    <span>Paid:</span>
                    <span>PKR {currentSale.paidAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold">
                    <span>Change:</span>
                    <span className={currentSale.change >= 0 ? 'text-green-600' : 'text-red-600'}>
                      PKR {currentSale.change.toFixed(2)}
                    </span>
                  </div>
                </>
              )}
              
              <div className="flex justify-between text-sm">
                <span>Payment:</span>
                <span className="capitalize">{currentSale.paymentMethod}</span>
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                Thank you!
              </p>
            </div>
            
            <div className="flex space-x-3 mt-6 print:hidden">
              <button
                onClick={handlePrintBill}
                className="flex-1 bg-amber-900 text-white py-2 px-4 rounded-lg hover:bg-amber-800 transition-colors font-medium flex items-center justify-center space-x-2"
              >
                <Printer size={16} />
                <span>Print</span>
              </button>
              <button
                onClick={handleCloseBill}
                className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}