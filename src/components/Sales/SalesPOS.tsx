import { useState } from 'react';
import { Product, SaleItem, PaymentMethod } from '../../types';
import { useProducts } from '../../contexts/ProductContext';
import { useCustomers } from '../../contexts/CustomerContext';
import { useSales } from '../../contexts/SalesContext';
import { extractProductName, calculateItemTotal, getProductNameById } from '../../utils/productUtils';
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
  const { addSale, loading } = useSales();
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
    customerName: string;
    invoiceNumber: string;
    paidAmount: number;
    change: number;
    roomNumber: string | null;
    createdAt: Date;
    saleId: number | string;
  } | null>(null);

  const categories = ['all', ...new Set(products.map(p => p.category))];
  
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
    if (cartItems.length === 0) {
      showAlert('Cannot process empty cart. Please add items first.', 'error');
      return;
    }
    
    // Validation for cash payment (ensure paid amount is valid number and sufficient)
    if (paymentMethod === 'cash') {
      const paidAmountNumber = parseFloat(paidAmount);
      if (!paidAmount || isNaN(paidAmountNumber) || paidAmountNumber <= 0) {
        showAlert('Please enter a valid cash amount.', 'error');
        return;
      }
      if (paidAmountNumber < total) {
        showAlert('Insufficient payment amount. Please enter the correct amount.', 'error');
        return;
      }
    }
    
    // Validation for pending payment (only room number required, customer optional)
    if (paymentMethod === 'pending' && !roomNumber.trim()) {
      showAlert('Room number is required for pending payments.', 'error');
      return;
    }
    
    // Validation for card payment (customer selection required)
    if (paymentMethod === 'card') {
      if (!selectedCustomer) {
        showAlert('Please select a customer for card payment.', 'error');
        return;
      }
      // Check customer balance
      const customer = customers.find(c => c.id.toString() === selectedCustomer);
      if (customer) {
        const customerBalance = customer.balance || 0;
        // Calculate discounted price if customer has a discount
        const discount = customer.card_discount || 0;
        const discountedTotal = discount > 0 ? total * (1 - discount / 100) : total;
        
        if (customerBalance < discountedTotal) {
          showAlert(`Insufficient balance! Customer has PKR ${customerBalance.toFixed(2)} but needs PKR ${discountedTotal.toFixed(2)}${discount > 0 ? ` (after ${discount}% discount)` : ''}`, 'error');
          return;
        }
      }
    }
    
    setIsProcessing(true);
    
    try {
      // Create sale data for API - Handle customer ID based on payment method
      let customerId = null;
      
      if (paymentMethod === 'card' || paymentMethod === 'pending') {
        // Card and pending payments require customer
        customerId = selectedCustomer ? parseInt(selectedCustomer) : null;
      } else {
        // Cash and easypaisa are walk-in (no customer required)
        customerId = selectedCustomer ? parseInt(selectedCustomer) : null;
      }
      
      const saleData = {
        customer_id: customerId,
        room_no: roomNumber || '',
        payment_method: paymentMethod,
        items: cartItems.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity
        }))
      };
      
      console.log('Processing sale:', saleData);
      
      // Create sale via API
      const createdSale = await addSale(saleData);
      
      // Generate invoice number
      const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
      
      // Get customer name for display
      const customerName = selectedCustomer ? 
        customers.find(c => c.id.toString() === selectedCustomer)?.name || 'Unknown Customer' : 
        'Walk-in Customer';
      
      // Create local sale data for display with proper product names
      const localSaleData = {
        items: cartItems.map(item => ({
          ...item,
          productName: getProductNameById(item.product_id, products)
        })),
        subtotal,
        total,
        paymentMethod,
        customerId: selectedCustomer,
        customerName,
        invoiceNumber,
        paidAmount: paymentMethod === 'cash' ? paid : total,
        change: paymentMethod === 'cash' ? change : 0,
        roomNumber: paymentMethod === 'pending' ? roomNumber : null,
        createdAt: new Date(),
        saleId: (createdSale as any)?.id || Date.now()
      };
      
      // Set current sale and show bill
      setCurrentSale(localSaleData);
      setShowBillModal(true);
      
      showAlert('Sale processed successfully!', 'success');
    } catch (error: any) {
      console.error('Failed to process sale:', error);
      const errorMessage = error.message || 'Failed to process sale. Please try again.';
      showAlert(errorMessage, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrintBill = () => {
    try {
      // Create a custom print window with better formatting
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        showAlert('Please allow popups to print the receipt.', 'error');
        return;
      }
      
      const printContent = generatePrintContent();
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
      printWindow.close();
    } catch (error) {
      console.error('Print error:', error);
      // Fallback to browser print
      window.print();
    }
  };
  
  const generatePrintContent = () => {
    if (!currentSale) return '';
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt - ${currentSale.invoiceNumber}</title>
        <style>
          body { 
            font-family: 'Courier New', monospace; 
            margin: 0; 
            padding: 20px;
            display: flex;
            justify-content: center;
            align-items: flex-start;
            min-height: 100vh;
            background-color: #f5f5f5;
          }
          .receipt-container {
            width: 300px;
            background-color: white;
            padding: 15px;
            border: 1px solid #ddd;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header { 
            text-align: center; 
            border-bottom: 1px dashed #000; 
            padding-bottom: 10px; 
            margin-bottom: 15px;
          }
          .logo { 
            max-width: 80px; 
            height: auto; 
            margin: 0 auto 10px; 
          }
          .item-row { 
            display: flex; 
            justify-content: space-between; 
            margin: 5px 0; 
          }
          .total-row { 
            border-top: 1px dashed #000; 
            padding-top: 10px; 
            margin-top: 15px;
            font-weight: bold; 
          }
          .footer { 
            text-align: center; 
            margin-top: 20px; 
            font-size: 12px; 
          }
          @media print {
            body {
              background-color: white;
              padding: 0;
              margin: 0;
              display: flex;
              justify-content: center;
              align-items: flex-start;
            }
            .receipt-container {
              border: none;
              box-shadow: none;
              border-radius: 0;
              margin: 20px auto;
            }
          }
        </style>
      </head>
      <body>
        <div class="receipt-container">
          <div class="header">
            <img src="/logo.svg" alt="Cafe D Revenue Logo" class="logo" />
            <h2>Cafe D Revenue</h2>
            <p>FBR Department</p>
            <p>Invoice: ${currentSale.invoiceNumber}</p>
            <p>Date: ${currentSale.createdAt.toLocaleDateString()}</p>
            <p>Time: ${currentSale.createdAt.toLocaleTimeString()}</p>
            ${currentSale.customerName ? `<p>Customer: ${currentSale.customerName}</p>` : ''}
            ${currentSale.roomNumber ? `<p>Room: ${currentSale.roomNumber}</p>` : ''}
          </div>
          
          <div class="items">
            ${currentSale.items.map(item => `
              <div class="item-row">
                <span>${item.productName} x${item.quantity}</span>
                <span>PKR ${item.total}</span>
              </div>
            `).join('')}
          </div>
          
          <div class="total-row">
            <div class="item-row">
              <span>Subtotal:</span>
              <span>PKR ${currentSale.subtotal.toFixed(2)}</span>
            </div>
            ${currentSale.customerId && customers.find(c => c.id === parseInt(currentSale.customerId))?.card_discount ? `
            <div class="item-row">
              <span>Discount (${customers.find(c => c.id === parseInt(currentSale.customerId))?.card_discount}%):</span>
              <span>-PKR ${(currentSale.subtotal * (customers.find(c => c.id === parseInt(currentSale.customerId))?.card_discount || 0) / 100).toFixed(2)}</span>
            </div>
            ` : ''}
            <div class="item-row">
              <span>Total:</span>
              <span>PKR ${currentSale.total.toFixed(2)}</span>
            </div>
            ${currentSale.paymentMethod === 'cash' ? `
              <div class="item-row">
                <span>Paid:</span>
                <span>PKR ${currentSale.paidAmount.toFixed(2)}</span>
              </div>
              <div class="item-row">
                <span>Change:</span>
                <span>PKR ${currentSale.change.toFixed(2)}</span>
              </div>
            ` : ''}
            <div class="item-row">
              <span>Payment:</span>
              <span>${currentSale.paymentMethod.toUpperCase()}</span>
            </div>
          </div>
          
          <div class="footer">
            <p>Thank you for your business!</p>
            <p>Visit us again soon</p>
          </div>
        </div>
      </body>
      </html>
    `;
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
    <div className="h-full flex flex-col lg:flex-row">
      {/* Products Section - Enhanced Layout */}
      <div className="flex-1 p-4 lg:p-6 bg-gray-50 order-2 lg:order-1">
        <div className="mb-4 lg:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Point of Sale</h1>
              <p className="text-sm text-gray-600 mt-1">Select products to add to cart</p>
            </div>
            {cartItems.length > 0 && (
              <div className="mt-2 sm:mt-0 flex items-center space-x-2">
                <div className="bg-slate-100 text-slate-800 px-3 py-1 rounded-full text-sm font-medium">
                  {cartItems.reduce((sum, item) => sum + item.quantity, 0)} items in cart
                </div>
                <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                  PKR {total.toFixed(2)}
                </div>
              </div>
            )}
          </div>
          
          {/* Search and Filter Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
            {/* Search */}
            <div className="lg:col-span-2 relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search products by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
              />
            </div>
            
            {/* Category Filter */}
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm appearance-none bg-white"
              >
                <option value="all">All Categories</option>
                {categories.filter(cat => cat !== 'all').map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Products Grid - Enhanced (4 products per row) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-4">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 lg:p-4 cursor-pointer hover:shadow-lg hover:border-slate-300 transition-all duration-200 group"
              onClick={() => addToCart(product)}
            >
              {/* Product Image */}
              <div className="h-20 lg:h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg mb-3 flex items-center justify-center overflow-hidden relative">
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
                  <img 
                    src="/logo.svg" 
                    alt="Cafe D Revenue Logo" 
                    className="w-12 h-12 object-contain opacity-60"
                  />
                </div>
                
                {/* Add to Cart Overlay */}
                <div className="absolute inset-0 bg-slate-700/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div className="text-white text-center">
                    <Plus className="w-6 h-6 mx-auto mb-1" />
                    <span className="text-xs font-medium">Add to Cart</span>
                  </div>
                </div>
              </div>
              
              {/* Product Info */}
              <div className="space-y-1">
                <h3 className="font-semibold text-gray-900 text-xs lg:text-sm truncate" title={product.name}>
                  {product.name}
                </h3>
                <p className="text-xs text-gray-500 truncate">{product.category}</p>
                
                {/* Price and Stock */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-sm lg:text-base font-bold text-slate-700">
                    PKR {product.price}
                  </span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                    product.stock > 20 ? 'bg-green-100 text-green-700' :
                    product.stock > 5 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {product.stock}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Empty State */}
        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-500">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>

      {/* Cart Section - Enhanced */}
      <div className="w-full lg:w-80 xl:w-96 bg-white border-t lg:border-t-0 lg:border-l border-gray-200 flex flex-col h-auto lg:h-full shadow-lg order-1 lg:order-2 max-h-[40vh] lg:max-h-none">
        {/* Cart Header */}
        <div className="flex items-center justify-between p-4 lg:p-6 border-b border-gray-200 bg-gradient-to-r from-slate-50 to-slate-100 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <ShoppingCart className="w-5 lg:w-6 h-5 lg:h-6 text-slate-700" />
            <h2 className="text-lg lg:text-xl font-bold text-gray-900">Cart</h2>
          </div>
          {cartItems.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="bg-slate-700 text-white text-xs px-2 py-1 rounded-full font-medium">
                {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
              <button
                onClick={() => setCartItems([])}
                className="text-red-600 hover:text-red-800 text-sm font-medium"
                title="Clear Cart"
              >
                Clear
              </button>
            </div>
          )}
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
                {cartItems.map((item) => (
                  <div key={item.productId} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium text-gray-900 text-sm">{item.productName}</span>
                      <button
                        onClick={() => removeFromCart(item.productId || item.product_id.toString())}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateQuantity(item.productId || item.product_id.toString(), -1)}
                          className="w-6 h-6 rounded-full bg-gray-300 hover:bg-gray-400 flex items-center justify-center"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.productId || item.product_id.toString(), 1)}
                          className="w-6 h-6 rounded-full bg-slate-700 hover:bg-slate-600 text-white flex items-center justify-center"
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
                Customer 
                {paymentMethod === 'card' && <span className="text-red-600">(Required for Card Payment)</span>}
                {paymentMethod === 'pending' && <span className="text-gray-500">(Optional)</span>}
                {(paymentMethod === 'cash' || paymentMethod === 'easypaisa') && <span className="text-gray-500">(Optional)</span>}
              </label>
              
              {/* Card Scan Input for Card Payment */}
              {paymentMethod === 'card' && (
                <div className="mb-3">
                  <input
                    type="text"
                    placeholder="Tap/Scan customer card or enter card number..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent text-sm bg-slate-50"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const cardInput = e.currentTarget.value.trim();
                        if (cardInput) {
                          // Find customer by card number or RFID
                          const customer = customers.find(c => 
                            c.cardRefId === cardInput || 
                            c.card_number === cardInput ||
                            c.rfid_no === cardInput
                          );
                          if (customer) {
                            setSelectedCustomer(customer.id.toString());
                            e.currentTarget.value = '';
                            showAlert(`Customer ${customer.name} selected successfully!`, 'success');
                          } else {
                            showAlert('Card not found. Please select from the list below.', 'error');
                          }
                        }
                      }
                    }}
                  />
                  <p className="text-xs text-slate-700 mt-1">
                    💳 Scan customer card or enter card number, then press Enter
                  </p>
                </div>
              )}
              
              <select
                value={selectedCustomer}
                onChange={(e) => setSelectedCustomer(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent text-sm ${
                  paymentMethod === 'card'
                    ? 'border-slate-300 bg-slate-50' 
                    : 'border-gray-300'
                }`}
                required={paymentMethod === 'card'}
              >
                <option value="">
                  {paymentMethod === 'card' 
                    ? 'Select a customer for card payment' 
                    : paymentMethod === 'pending'
                    ? 'Select customer (optional)'
                    : 'Walk-in Customer (No customer required)'
                  }
                </option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
              
              {/* Display selected customer info for card payment */}
              {paymentMethod === 'card' && selectedCustomer && (
                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm">
                  {(() => {
                    const customer = customers.find(c => c.id.toString() === selectedCustomer);
                    if (customer) {
                      const hasEnoughBalance = (customer.balance || 0) >= total;
                      return (
                        <div className={hasEnoughBalance ? 'text-green-800' : 'text-red-800'}>
                          <div className="flex items-center space-x-2">
                            <CreditCard className="w-4 h-4" />
                            <span className="font-medium">{customer.name}</span>
                          </div>
                          {!hasEnoughBalance && (
                            <div className="text-red-600 font-medium mt-1">
                              ⚠️ Insufficient balance for this purchase
                            </div>
                          )}
                          {hasEnoughBalance && (
                            <div className="text-green-600 font-medium mt-1">
                              ✅ Card balance is sufficient for this purchase
                            </div>
                          )}
                        </div>
                      );
                    }
                    return null;
                  })()} 
                </div>
              )}
              
              {/* Display selected customer info for pending payment */}
              {paymentMethod === 'pending' && selectedCustomer && (
                <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded text-sm">
                  {(() => {
                    const customer = customers.find(c => c.id.toString() === selectedCustomer);
                    if (customer) {
                      return (
                        <div className="text-orange-800">
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4" />
                            <span className="font-medium">{customer.name}</span>
                          </div>
                          <div>This will be recorded as a pending payment</div>
                        </div>
                      );
                    }
                    return null;
                  })()} 
                </div>
              )}
              
              {/* Info for pending payment when no customer selected */}
              {paymentMethod === 'pending' && !selectedCustomer && (
                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                  <div className="text-blue-800">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4" />
                      <span className="font-medium">Room Service (No Customer)</span>
                    </div>
                    <div>Pending payment will be tracked by room number only</div>
                  </div>
                </div>
              )}
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
                          ? 'border-slate-700 bg-slate-50 text-slate-700'
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
            <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <label className="block text-sm font-medium text-slate-800 mb-2">
                Amount Paid (PKR)
              </label>
              <input
                type="number"
                value={paidAmount}
                onChange={(e) => {
                  const value = e.target.value;
                  // Allow empty string, numbers, and decimal points
                  if (value === '' || /^\d*\.?\d*$/.test(value)) {
                    setPaidAmount(value);
                  }
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent text-sm"
                placeholder="Enter amount received from customer"
                min="0"
                step="0.01"
              />
              {paidAmount && (
                <div className="mt-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total: PKR {total.toFixed(2)}</span>
                    <span>Paid: PKR {parseFloat(paidAmount || '0').toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Change:</span>
                    <span className={change >= 0 ? 'text-green-600' : 'text-red-600'}>
                      PKR {change.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Room Number Input for Pending Payment */}
          {cartItems.length > 0 && paymentMethod === 'pending' && (
            <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <label className="block text-sm font-medium text-slate-800 mb-2">
                Room Number <span className="text-red-600">(Required)</span>
              </label>
              <input
                type="text"
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent text-sm"
                placeholder="Enter room number (e.g., 101, 205)"
                required
              />
              <p className="text-xs text-slate-700 mt-1">
                Room number is required to track pending payments
              </p>
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
          <div className="p-4 lg:p-6 pt-3 lg:pt-4 border-t border-gray-200 bg-white">
            <button
              onClick={handleCheckout}
              disabled={isProcessing}
              className="w-full bg-slate-700 text-white px-4 py-2.5 lg:py-3 rounded-lg hover:bg-slate-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm lg:text-base"
            >
              {isProcessing && <Loader2 size={16} className="animate-spin" />}
              <span>{isProcessing ? 'Processing...' : 'Process Sale'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Alert Modal */}
      {showAlertModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-4 lg:p-6 w-full max-w-sm lg:max-w-md">
            <div className="text-center">
              <div className={`mx-auto flex items-center justify-center h-10 lg:h-12 w-10 lg:w-12 rounded-full mb-3 lg:mb-4 ${
                alertType === 'success' ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {alertType === 'success' ? (
                  <svg className="h-5 lg:h-6 w-5 lg:w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="h-5 lg:h-6 w-5 lg:w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
              
              <h3 className={`text-base lg:text-lg font-medium mb-2 ${
                alertType === 'success' ? 'text-green-900' : 'text-red-900'
              }`}>
                {alertType === 'success' ? 'Success!' : 'Error!'}
              </h3>
              
              <p className="text-sm text-gray-600 mb-4 lg:mb-6">
                {alertMessage}
              </p>
              
              <button
                onClick={() => setShowAlertModal(false)}
                className={`w-full px-4 py-2 rounded-lg font-medium transition-colors text-sm lg:text-base ${
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-4 lg:p-6 w-full max-w-sm lg:max-w-md max-h-[90vh] overflow-y-auto">
            <div className="text-center mb-4 lg:mb-6">
              <img 
                src="/logo.svg" 
                alt="Cafe D Revenue Logo" 
                className="w-16 h-16 object-contain mx-auto mb-3"
              />
              <h2 className="text-xl lg:text-2xl font-bold text-gray-900">Cafe D Revenue</h2>
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
              {currentSale.customerName && (
                <div className="text-sm text-gray-600 mb-2">
                  Customer: {currentSale.customerName}
                </div>
              )}
              {currentSale.roomNumber && (
                <div className="text-sm text-gray-600 mb-2">
                  Room: {currentSale.roomNumber}
                </div>
              )}
              <div className="text-sm text-gray-600">
                Payment: <span className="capitalize font-medium">{currentSale.paymentMethod}</span>
              </div>
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
            
            <div className="flex space-x-2 lg:space-x-3 mt-4 lg:mt-6 print:hidden">
              <button
                onClick={handlePrintBill}
                className="flex-1 bg-slate-700 text-white py-2 px-3 lg:px-4 rounded-lg hover:bg-slate-600 transition-colors font-medium flex items-center justify-center space-x-2 text-sm lg:text-base"
              >
                <Printer size={16} />
                <span>Print</span>
              </button>
              <button
                onClick={handleCloseBill}
                className="flex-1 border border-gray-300 text-gray-700 py-2 px-3 lg:px-4 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm lg:text-base"
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