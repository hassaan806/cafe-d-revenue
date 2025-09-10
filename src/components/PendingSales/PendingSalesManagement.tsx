import React, { useState, useEffect } from 'react';
import { Clock, CreditCard, DollarSign, Smartphone, User, AlertCircle, CheckCircle2, RefreshCw, Filter, Search, Printer, Package, Eye } from 'lucide-react';
import { useSales } from '../../contexts/SalesContext';
import { useCustomers } from '../../contexts/CustomerContext';
import { useProducts } from '../../contexts/ProductContext';
import { Sale, Customer } from '../../types';
import { salesService, SettleSaleRequest, BatchSettleSaleRequest } from '../../services/salesService';
import { extractProductName, calculateItemTotal, getProductNameById, getItemUnitPrice } from '../../utils/productUtils';

export function PendingSalesManagement() {
  const { settleSale, loading, error } = useSales();
  const { customers, refreshCustomers } = useCustomers();
  const { products } = useProducts();
  const [pendingSales, setPendingSales] = useState<Sale[]>([]);
  const [filteredSales, setFilteredSales] = useState<Sale[]>([]);
  const [loadingPending, setLoadingPending] = useState(false);
  const [selectedSales, setSelectedSales] = useState<Set<number>>(new Set());
  const [settlingIds, setSettlingIds] = useState<Set<number>>(new Set());
  const [filterCustomer, setFilterCustomer] = useState<string>('');
  const [searchRoom, setSearchRoom] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [showBillModal, setShowBillModal] = useState(false);
  const [currentSettledSale, setCurrentSettledSale] = useState<{
    saleData: Sale;
    paymentMethod: string;
    customerName: string;
    settlementDate: Date;
  } | null>(null);
  const [showCardScanModal, setShowCardScanModal] = useState(false);
  const [selectedSaleForCard, setSelectedSaleForCard] = useState<Sale | null>(null);
  const [scannedCustomer, setScannedCustomer] = useState<Customer | null>(null);
  const [cardScanInput, setCardScanInput] = useState('');
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedSaleForView, setSelectedSaleForView] = useState<Sale | null>(null);
  const [showBatchCardScanModal, setShowBatchCardScanModal] = useState(false);
  const [batchScannedCustomer, setBatchScannedCustomer] = useState<Customer | null>(null);
  const [batchCardScanInput, setBatchCardScanInput] = useState('');
  
  // Settlement form state
  const [settlementData, setSettlementData] = useState<{
    payment_method: 'cash' | 'card' | 'easypaisa';
    customer_id: number;
  }>({
    payment_method: 'cash',
    customer_id: 0
  });

  const loadPendingSales = async () => {
    setLoadingPending(true);
    try {
      const sales = await salesService.getPendingSales();
      setPendingSales(sales);
      setFilteredSales(sales);
    } catch (err) {
      console.error('Error loading pending sales:', err);
      // Show error to user
      setSuccessMessage('Failed to load pending sales. Please try again.');
      setTimeout(() => setSuccessMessage(''), 3000);
    } finally {
      setLoadingPending(false);
    }
  };

  useEffect(() => {
    loadPendingSales();
    refreshCustomers();
  }, []);

  // Filter sales based on customer and room
  useEffect(() => {
    let filtered = pendingSales;

    if (filterCustomer) {
      const customerId = parseInt(filterCustomer);
      filtered = filtered.filter(sale => sale.customer_id === customerId);
    }

    if (searchRoom) {
      filtered = filtered.filter(sale => 
        sale.room_no.toLowerCase().includes(searchRoom.toLowerCase())
      );
    }

    setFilteredSales(filtered);
  }, [pendingSales, filterCustomer, searchRoom]);

  const getCustomerName = (customerId: number | null) => {
    if (!customerId) return 'Walk-in Customer';
    const customer = customers.find((c: Customer) => c.id === customerId);
    return customer?.name || `Customer #${customerId}`;
  };

  const getCustomerBalance = (customerId: number | null) => {
    if (!customerId) return 0;
    const customer = customers.find((c: Customer) => c.id === customerId);
    return customer?.balance || 0;
  };

  const handleSingleSettle = async (sale: Sale, paymentMethod: 'cash' | 'card' | 'easypaisa') => {
    if (settlingIds.has(sale.id)) return;
    
    // For card payments, show card scan modal first
    if (paymentMethod === 'card') {
      setSelectedSaleForCard(sale);
      setShowCardScanModal(true);
      return;
    }
    
    // For non-card payments, proceed directly
    await processSettlement(sale, paymentMethod, null);
  };

  const processSettlement = async (sale: Sale, paymentMethod: 'cash' | 'card' | 'easypaisa', customer: Customer | null) => {
    if (settlingIds.has(sale.id)) return;
    
    setSettlingIds(prev => new Set([...prev, sale.id]));
    
    try {
      const settleData: SettleSaleRequest = {
        payment_method: paymentMethod,
        customer_id: customer ? customer.id : sale.customer_id // Use scanned customer or original customer
      };

      await salesService.settleSale(sale.id, settleData);
      
      // Generate bill data for settled sale
      const customerName = customer ? customer.name : (sale.customer_id ? getCustomerName(sale.customer_id) : 'Walk-in Customer');
      
      setCurrentSettledSale({
        saleData: sale,
        paymentMethod,
        customerName,
        settlementDate: new Date()
      });
      
      // Show bill modal
      setShowBillModal(true);
      
      // Remove from pending sales
      setPendingSales(prev => prev.filter(s => s.id !== sale.id));
      setFilteredSales(prev => prev.filter(s => s.id !== sale.id));
      setSuccessMessage(`Sale #${sale.id} settled successfully!`);
      setTimeout(() => setSuccessMessage(''), 3000);
      
    } catch (err: any) {
      console.error('Error settling sale:', err);
      setSuccessMessage(`Error settling sale: ${err.message || 'Unknown error'}`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } finally {
      setSettlingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(sale.id);
        return newSet;
      });
    }
  };

  const handleCardScan = (input: string) => {
    if (!input.trim()) return;
    
    // Find customer by card number or RFID
    const customer = customers.find(c => 
      c.cardRefId === input || 
      c.card_number === input ||
      c.rfid_no === input
    );
    
    if (customer) {
      setScannedCustomer(customer);
      setCardScanInput('');
      // Success feedback
      setSuccessMessage(`Customer ${customer.name} found and selected!`);
      setTimeout(() => setSuccessMessage(''), 2000);
      return true;
    } else {
      setScannedCustomer(null);
      return false;
    }
  };

  const handleCardScanSubmit = async () => {
    if (!selectedSaleForCard || !scannedCustomer) return;
    
    // Check if customer has sufficient balance
    if (scannedCustomer.balance < selectedSaleForCard.total_price) {
      alert(`Insufficient balance! Customer has PKR ${scannedCustomer.balance.toFixed(2)} but needs PKR ${selectedSaleForCard.total_price.toFixed(2)}`);
      return;
    }
    
    // Close modal and process settlement
    setShowCardScanModal(false);
    setCardScanInput('');
    setScannedCustomer(null);
    
    await processSettlement(selectedSaleForCard, 'card', scannedCustomer);
    
    setSelectedSaleForCard(null);
  };

  const handleCardScanCancel = () => {
    setShowCardScanModal(false);
    setSelectedSaleForCard(null);
    setScannedCustomer(null);
    setCardScanInput('');
  };

  const handleViewSale = (sale: Sale) => {
    setSelectedSaleForView(sale);
    setShowViewModal(true);
  };

  const handleCloseViewModal = () => {
    setShowViewModal(false);
    setSelectedSaleForView(null);
  };

  const handleBatchSettle = async () => {
    if (selectedSales.size === 0) return;
    
    // For card payments, show card scan modal for batch settlement
    if (settlementData.payment_method === 'card') {
      setShowBatchCardScanModal(true);
      return;
    }
    
    // For non-card payments, proceed directly
    await processBatchSettlement(settlementData.payment_method, null);
  };

  const processBatchSettlement = async (paymentMethod: 'cash' | 'card' | 'easypaisa', customer: Customer | null) => {
    const selectedSalesArray = Array.from(selectedSales);
    
    try {
      // For card payments, validate that all selected sales can be paid by the scanned customer
      if (paymentMethod === 'card' && customer) {
        const totalAmount = selectedSalesArray.reduce((sum, saleId) => {
          const sale = pendingSales.find(s => s.id === saleId);
          return sum + (sale?.total_price || 0);
        }, 0);
        
        if (customer.balance < totalAmount) {
          setSuccessMessage('');
          alert(`Insufficient balance! Customer has PKR ${customer.balance.toFixed(2)} but needs PKR ${totalAmount.toFixed(2)} for all selected sales.`);
          return;
        }
      }
      
      const batchData: BatchSettleSaleRequest = {
        sale_ids: selectedSalesArray,
        payment_method: paymentMethod,
        customer_id: customer ? customer.id : undefined
      };
      
      const result = await salesService.batchSettleSales(batchData);
      
      // Remove settled sales from pending sales
      setPendingSales(prev => 
        prev.filter(sale => !result.settled_sales.includes(sale.id))
      );
      setFilteredSales(prev => 
        prev.filter(sale => !result.settled_sales.includes(sale.id))
      );
      
      // Clear selected sales
      setSelectedSales(new Set());
      
      setSuccessMessage(
        `Batch settlement completed: ${result.settled_count} settled, ${result.failed_count} failed`
      );
      
      // SMS notification for card payments is automatically sent by the backend
      if (paymentMethod === 'card' && customer) {
        console.log(`Batch settlement SMS automatically sent by backend to ${customer.name} (${customer.phone}) for ${result.settled_count} sales`);
      }
      
      if (result.failed_sales.length > 0) {
        console.warn('Failed settlements:', result.failed_sales);
        // Show detailed error message for failed sales
        const failedDetails = result.failed_sales.map(f => `Sale #${f.sale_id}: ${f.error}`).join('\n');
        alert(`Some sales failed to settle:\n${failedDetails}`);
      }
      
      setTimeout(() => setSuccessMessage(''), 5000);
      
    } catch (err: any) {
      console.error('Error in batch settlement:', err);
      setSuccessMessage(`Batch settlement failed: ${err.message || 'Unknown error'}`);
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  const handleBatchCardScan = (input: string) => {
    if (!input.trim()) return false;
    
    // Find customer by card number or RFID
    const customer = customers.find(c => 
      c.cardRefId === input || 
      c.card_number === input ||
      c.rfid_no === input
    );
    
    if (customer) {
      setBatchScannedCustomer(customer);
      setBatchCardScanInput('');
      setSuccessMessage(`Customer ${customer.name} found and selected for batch settlement!`);
      setTimeout(() => setSuccessMessage(''), 2000);
      return true;
    } else {
      setBatchScannedCustomer(null);
      return false;
    }
  };

  const handleBatchCardScanSubmit = async () => {
    if (!batchScannedCustomer || selectedSales.size === 0) return;
    
    // Calculate total amount for all selected sales
    const totalAmount = Array.from(selectedSales).reduce((sum, saleId) => {
      const sale = pendingSales.find(s => s.id === saleId);
      return sum + (sale?.total_price || 0);
    }, 0);
    
    // Check if customer has sufficient balance
    if (batchScannedCustomer.balance < totalAmount) {
      alert(`Insufficient balance! Customer has PKR ${batchScannedCustomer.balance.toFixed(2)} but needs PKR ${totalAmount.toFixed(2)} for all selected sales.`);
      return;
    }
    
    // Close modal and process batch settlement
    setShowBatchCardScanModal(false);
    setBatchCardScanInput('');
    setBatchScannedCustomer(null);
    
    await processBatchSettlement('card', batchScannedCustomer);
  };

  const handleBatchCardScanCancel = () => {
    setShowBatchCardScanModal(false);
    setBatchScannedCustomer(null);
    setBatchCardScanInput('');
  };

  const toggleSelectSale = (saleId: number) => {
    const newSelected = new Set(selectedSales);
    if (newSelected.has(saleId)) {
      newSelected.delete(saleId);
    } else {
      newSelected.add(saleId);
    }
    setSelectedSales(newSelected);
  };

  const selectAllSales = () => {
    if (selectedSales.size === filteredSales.length) {
      setSelectedSales(new Set());
    } else {
      setSelectedSales(new Set(filteredSales.map(s => s.id)));
    }
  };

  const getTotalPendingAmount = () => {
    return filteredSales.reduce((sum, sale) => sum + sale.total_price, 0);
  };

  const getSelectedTotalAmount = () => {
    return Array.from(selectedSales)
      .map(id => pendingSales.find(s => s.id === id))
      .filter(Boolean)
      .reduce((sum, sale) => sum + (sale?.total_price || 0), 0);
  };

  const paymentMethods = [
    { value: 'cash', label: 'Cash', icon: DollarSign, color: 'text-green-600' },
    { value: 'card', label: 'Card', icon: CreditCard, color: 'text-blue-600' },
    { value: 'easypaisa', label: 'EasyPaisa', icon: Smartphone, color: 'text-purple-600' }
  ];

  const handlePrintBill = () => {
    if (!currentSettledSale) return;
    
    try {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('Please allow popups to print the receipt.');
        return;
      }
      
      const printContent = generatePrintContent();
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
      printWindow.close();
    } catch (error) {
      console.error('Print error:', error);
      window.print();
    }
  };
  
  const generatePrintContent = () => {
    if (!currentSettledSale) return '';
    
    const { saleData, paymentMethod, customerName, settlementDate } = currentSettledSale;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Settlement Receipt - ${saleData.id}</title>
        <style>
          body { font-family: 'Courier New', monospace; width: 300px; margin: 0; padding: 10px; }
          .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 10px; }
          .logo { max-width: 80px; height: auto; margin: 0 auto 10px; }
          .item-row { display: flex; justify-content: space-between; margin: 5px 0; }
          .total-row { border-top: 1px dashed #000; padding-top: 10px; font-weight: bold; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="/logo.svg" alt="Cafe D Revenue Logo" class="logo" />
          <h2>Cafe D Revenue</h2>
          <p>FBR Department</p>
          <p>Settlement Receipt</p>
          <p>Sale ID: #${saleData.id}</p>
          <p>Settlement Date: ${settlementDate.toLocaleDateString()}</p>
          <p>Settlement Time: ${settlementDate.toLocaleTimeString()}</p>
          <p>Customer: ${customerName}</p>
          ${saleData.room_no ? `<p>Room: ${saleData.room_no}</p>` : ''}
        </div>
        
        <div class="items">
          ${saleData.items.map(item => `
            <div class="item-row">
              <span>${extractProductName(item, products)} x${item.quantity}</span>
              <span>PKR ${calculateItemTotal(item, products).toFixed(2)}</span>
            </div>
          `).join('')}
        </div>
        
        <div class="total-row">
          <div class="item-row">
            <span>Total:</span>
            <span>PKR ${saleData.total_price.toFixed(2)}</span>
          </div>
          <div class="item-row">
            <span>Payment Method:</span>
            <span>${paymentMethod.toUpperCase()}</span>
          </div>
          <div class="item-row">
            <span>Status:</span>
            <span>SETTLED</span>
          </div>
        </div>
        
        <div class="footer">
          <p>Thank you for your business!</p>
          <p>This sale has been settled</p>
        </div>
      </body>
      </html>
    `;
  };

  const handleCloseBill = () => {
    setShowBillModal(false);
    setCurrentSettledSale(null);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Pending Sales Management</h1>
          <p className="text-gray-600">Settle pending sales and manage outstanding transactions</p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2">
            <CheckCircle2 className="text-green-600" size={20} />
            <span className="text-green-800">{successMessage}</span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
            <AlertCircle className="text-red-600" size={20} />
            <span className="text-red-800">{error}</span>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center space-x-2">
              <Clock className="text-orange-600" size={20} />
              <div>
                <p className="text-sm text-gray-600">Total Pending</p>
                <p className="text-xl font-bold text-gray-900">{filteredSales.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center space-x-2">
              <DollarSign className="text-red-600" size={20} />
              <div>
                <p className="text-sm text-gray-600">Total Amount</p>
                <p className="text-xl font-bold text-gray-900">PKR {getTotalPendingAmount().toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="text-blue-600" size={20} />
              <div>
                <p className="text-sm text-gray-600">Selected</p>
                <p className="text-xl font-bold text-gray-900">{selectedSales.size}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center space-x-2">
              <CreditCard className="text-green-600" size={20} />
              <div>
                <p className="text-sm text-gray-600">Selected Amount</p>
                <p className="text-xl font-bold text-gray-900">PKR {getSelectedTotalAmount().toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Filters */}
            <div className="flex flex-wrap items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter size={16} className="text-gray-500" />
                <select
                  value={filterCustomer}
                  onChange={(e) => setFilterCustomer(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                >
                  <option value="">All Customers</option>
                  {customers.map((customer: Customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <Search size={16} className="text-gray-500" />
                <input
                  type="text"
                  value={searchRoom}
                  onChange={(e) => setSearchRoom(e.target.value)}
                  placeholder="Search by room..."
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                />
              </div>

              <button
                onClick={loadPendingSales}
                disabled={loadingPending}
                className="flex items-center space-x-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`${loadingPending ? 'animate-spin' : ''}`} size={16} />
                <span>Refresh</span>
              </button>
            </div>

            {/* Batch Actions */}
            {selectedSales.size > 0 && (
              <div className="flex items-center space-x-4">
                <select
                  value={settlementData.payment_method}
                  onChange={(e) => setSettlementData(prev => ({
                    ...prev,
                    payment_method: e.target.value as 'cash' | 'card' | 'easypaisa'
                  }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                >
                  {paymentMethods.map(method => (
                    <option key={method.value} value={method.value}>
                      {method.label}
                    </option>
                  ))}
                </select>

                <button
                  onClick={handleBatchSettle}
                  disabled={loading}
                  className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors disabled:opacity-50 flex items-center space-x-2"
                >
                  <CheckCircle2 size={16} />
                  <span>Settle Selected ({selectedSales.size})</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Pending Sales Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={filteredSales.length > 0 && selectedSales.size === filteredSales.length}
                      onChange={selectAllSales}
                      className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sale ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Room
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer Balance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loadingPending ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <RefreshCw className="animate-spin text-gray-400" size={20} />
                        <span className="text-gray-500">Loading pending sales...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredSales.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center">
                      <div className="text-gray-500">
                        <Clock className="mx-auto mb-2" size={48} />
                        <p className="text-lg font-medium">No pending sales found</p>
                        <p className="text-sm">All sales have been settled or no sales match your filters</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredSales.map((sale) => (
                    <tr key={sale.id} className={selectedSales.has(sale.id) ? 'bg-slate-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedSales.has(sale.id)}
                          onChange={() => toggleSelectSale(sale.id)}
                          className="rounded border-gray-300 text-slate-600 focus:ring-slate-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">#{sale.id}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <User className="text-gray-400" size={16} />
                          <span className="text-sm text-gray-900">{getCustomerName(sale.customer_id)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{sale.room_no}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">PKR {sale.total_price.toFixed(2)}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-500">
                          {new Date(sale.timestamp).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-500">{sale.items.length} items</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${
                          getCustomerBalance(sale.customer_id) >= sale.total_price 
                            ? 'text-green-600' 
                            : 'text-red-600'
                        }`}>
                          PKR {getCustomerBalance(sale.customer_id).toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-2">
                          {/* View Button */}
                          <button
                            onClick={() => handleViewSale(sale)}
                            className="p-2 rounded-lg transition-colors text-blue-600 bg-blue-50 hover:bg-blue-100"
                            title="View Sale Details"
                          >
                            <Eye size={16} />
                          </button>
                          
                          {/* Settlement Options */}
                          {paymentMethods.map(method => {
                            const Icon = method.icon;
                            return (
                              <button
                                key={method.value}
                                onClick={() => handleSingleSettle(sale, method.value as 'cash' | 'card' | 'easypaisa')}
                                disabled={settlingIds.has(sale.id)}
                                className={`p-2 rounded-lg transition-colors ${method.color} ${method.value === 'cash' ? 'bg-green-50 hover:bg-green-100' : method.value === 'card' ? 'bg-blue-50 hover:bg-blue-100' : 'bg-purple-50 hover:bg-purple-100'} disabled:opacity-50 disabled:cursor-not-allowed`}
                                title={`Settle with ${method.label}`}
                              >
                                {settlingIds.has(sale.id) && method.value === 'cash' ? (
                                  <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Icon size={16} />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* Card Scan Modal */}
      {showCardScanModal && selectedSaleForCard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CreditCard className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Card Payment Settlement</h2>
                <p className="text-gray-600">Scan customer card for Sale #{selectedSaleForCard.id}</p>
                <p className="text-sm text-slate-600 font-medium mt-2">
                  Amount: PKR {selectedSaleForCard.total_price.toFixed(2)}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  🔄 Same card scanning system as Sales POS
                </p>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Scan or Enter Card Details
                </label>
                <input
                  type="text"
                  value={cardScanInput}
                  onChange={(e) => setCardScanInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const success = handleCardScan(cardScanInput);
                      if (!success) {
                        alert('Card not found. Please try again or select from customer list.');
                      }
                    }
                  }}
                  placeholder="Tap/Scan customer card or enter card number..."
                  className="w-full px-3 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent bg-slate-50"
                  autoFocus
                />
                <p className="text-xs text-slate-700 mt-1">
                  💳 Scan customer card or enter card number, then press Enter
                </p>
              </div>
              
              {/* Scanned Customer Info */}
              {scannedCustomer && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-green-800">Customer Found!</span>
                  </div>
                  <div className="text-sm text-green-700">
                    <div className="font-medium">{scannedCustomer.name}</div>
                    <div>Card: {scannedCustomer.cardRefId || scannedCustomer.card_number || 'N/A'}</div>
                    <div className="font-medium mt-1">
                      Balance: PKR {scannedCustomer.balance.toFixed(2)}
                    </div>
                    {scannedCustomer.balance >= selectedSaleForCard.total_price ? (
                      <div className="text-green-600 font-medium mt-1">
                        ✅ Sufficient balance for this settlement
                      </div>
                    ) : (
                      <div className="text-red-600 font-medium mt-1">
                        ⚠️ Insufficient balance! Shortfall: PKR {(selectedSaleForCard.total_price - scannedCustomer.balance).toFixed(2)}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Manual Customer Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Or Select Customer Manually
                </label>
                <select
                  value={scannedCustomer?.id || ''}
                  onChange={(e) => {
                    const customerId = parseInt(e.target.value);
                    const customer = customers.find(c => c.id === customerId);
                    setScannedCustomer(customer || null);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                >
                  <option value="">Select a customer...</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} - Card: {customer.cardRefId || customer.card_number || 'No Card'} - Balance: PKR {customer.balance.toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleCardScanCancel}
                  className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCardScanSubmit}
                  disabled={!scannedCustomer || scannedCustomer.balance < selectedSaleForCard.total_price}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  <CreditCard size={16} />
                  <span>Settle with Card</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Settlement Bill Modal */}
      {showBillModal && currentSettledSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="text-center mb-6">
                <img 
                  src="/logo.svg" 
                  alt="Cafe D Revenue Logo" 
                  className="w-16 h-16 object-contain mx-auto mb-3"
                />
                <h2 className="text-xl font-bold text-gray-900 mb-2">Sale Settled Successfully!</h2>
                <p className="text-gray-600">Settlement receipt for Sale #{currentSettledSale.saleData.id}</p>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-4 mb-6 bg-gray-50">
                <div className="text-center mb-4">
                  <img 
                    src="/logo.svg" 
                    alt="Cafe D Revenue Logo" 
                    className="w-12 h-12 object-contain mx-auto mb-2"
                  />
                  <h3 className="font-bold text-lg">Cafe D Revenue</h3>
                  <p className="text-sm text-gray-600">FBR Department</p>
                  <p className="text-sm text-gray-600">Settlement Receipt</p>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Sale ID:</span>
                    <span className="font-medium">#{currentSettledSale.saleData.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Customer:</span>
                    <span className="font-medium">{currentSettledSale.customerName}</span>
                  </div>
                  {currentSettledSale.saleData.room_no && (
                    <div className="flex justify-between">
                      <span>Room:</span>
                      <span className="font-medium">{currentSettledSale.saleData.room_no}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Settlement Date:</span>
                    <span className="font-medium">{currentSettledSale.settlementDate.toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Settlement Time:</span>
                    <span className="font-medium">{currentSettledSale.settlementDate.toLocaleTimeString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Payment Method:</span>
                    <span className="font-medium capitalize">{currentSettledSale.paymentMethod}</span>
                  </div>
                </div>
                
                <div className="py-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Items:</h3>
                  <div className="space-y-2">
                    {currentSettledSale.saleData.items.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{extractProductName(item, products)} x{item.quantity}</span>
                        <span>PKR {calculateItemTotal(item, products).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="border-t border-gray-200 pt-4 space-y-2">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span>PKR {currentSettledSale.saleData.total_price.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span>Status:</span>
                    <span className="text-green-600 font-medium">SETTLED</span>
                  </div>
                </div>
                
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500 text-center">
                    Thank you! This sale has been settled.
                  </p>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={handlePrintBill}
                  className="flex-1 bg-slate-700 text-white py-2 px-4 rounded-lg hover:bg-slate-600 transition-colors font-medium flex items-center justify-center space-x-2"
                >
                  <Printer size={16} />
                  <span>Print Receipt</span>
                </button>
                <button
                  onClick={handleCloseBill}
                  className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Sale View Modal */}
      {showViewModal && selectedSaleForView && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Sale Details</h2>
                <p className="text-gray-600">Sale #{selectedSaleForView.id}</p>
              </div>
              
              <div className="space-y-6">
                {/* Sale Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-2">Sale Information</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Sale ID:</span>
                        <span className="font-medium">#{selectedSaleForView.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Date:</span>
                        <span className="font-medium">{new Date(selectedSaleForView.timestamp).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Time:</span>
                        <span className="font-medium">{new Date(selectedSaleForView.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <span className="font-medium text-orange-600">PENDING</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-2">Customer & Location</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Customer:</span>
                        <span className="font-medium">{getCustomerName(selectedSaleForView.customer_id)}</span>
                      </div>
                      {selectedSaleForView.room_no && (
                        <div className="flex justify-between">
                          <span>Room:</span>
                          <span className="font-medium">{selectedSaleForView.room_no}</span>
                        </div>
                      )}
                      {selectedSaleForView.customer_id && (
                        <div className="flex justify-between">
                          <span>Customer Balance:</span>
                          <span className={`font-medium ${
                            getCustomerBalance(selectedSaleForView.customer_id) >= selectedSaleForView.total_price 
                              ? 'text-green-600' 
                              : 'text-red-600'
                          }`}>
                            PKR {getCustomerBalance(selectedSaleForView.customer_id).toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Items List */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-4">Items Ordered</h3>
                  <div className="space-y-3">
                    {selectedSaleForView.items.map((item, index) => (
                      <div key={index} className="flex items-center justify-between bg-white p-3 rounded-lg border">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                            <img 
                              src="/logo.svg" 
                              alt="Cafe D Revenue Logo" 
                              className="w-6 h-6 object-contain opacity-60"
                            />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{extractProductName(item, products)}</p>
                            <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">PKR {calculateItemTotal(item, products).toFixed(2)}</p>
                          <p className="text-xs text-gray-600">PKR {getItemUnitPrice(item, products).toFixed(2)} each</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Total */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-amber-900">Total Amount:</span>
                    <span className="text-2xl font-bold text-amber-900">PKR {selectedSaleForView.total_price.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={handleCloseViewModal}
                  className="bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors font-medium"
                >
                  Close
                </button>
                
                {/* Settlement Options */}
                <div className="flex space-x-2">
                  {paymentMethods.map(method => {
                    const Icon = method.icon;
                    return (
                      <button
                        key={method.value}
                        onClick={() => {
                          handleCloseViewModal();
                          handleSingleSettle(selectedSaleForView, method.value as 'cash' | 'card' | 'easypaisa');
                        }}
                        disabled={settlingIds.has(selectedSaleForView?.id || 0)}
                        className={`flex-1 py-2 px-3 rounded-lg transition-colors ${method.color} bg-gray-50 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2`}
                        title={method.value === 'card' ? `Settle with ${method.label} (Card Scan Available)` : `Settle with ${method.label}`}
                      >
                        <Icon size={16} />
                        <span className="text-sm font-medium">{method.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Batch Card Scan Modal */}
      {showBatchCardScanModal && selectedSales.size > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CreditCard className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Batch Card Payment Settlement</h2>
                <p className="text-gray-600">Scan customer card for {selectedSales.size} selected sales</p>
                <p className="text-sm text-slate-600 font-medium mt-2">
                  Total Amount: PKR {getSelectedTotalAmount().toFixed(2)}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  🔄 Same card scanning system as Sales POS
                </p>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Scan or Enter Card Details
                </label>
                <input
                  type="text"
                  value={batchCardScanInput}
                  onChange={(e) => setBatchCardScanInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const success = handleBatchCardScan(batchCardScanInput);
                      if (!success) {
                        alert('Card not found. Please try again or select from customer list.');
                      }
                    }
                  }}
                  placeholder="Tap/Scan customer card or enter card number..."
                  className="w-full px-3 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent bg-slate-50"
                  autoFocus
                />
                <p className="text-xs text-slate-700 mt-1">
                  💳 Scan customer card or enter card number, then press Enter
                </p>
              </div>
              
              {/* Scanned Customer Info */}
              {batchScannedCustomer && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-green-800">Customer Found!</span>
                  </div>
                  <div className="text-sm text-green-700">
                    <div className="font-medium">{batchScannedCustomer.name}</div>
                    <div>Card: {batchScannedCustomer.cardRefId || batchScannedCustomer.card_number || 'N/A'}</div>
                    <div className="font-medium mt-1">
                      Balance: PKR {batchScannedCustomer.balance.toFixed(2)}
                    </div>
                    {batchScannedCustomer.balance >= getSelectedTotalAmount() ? (
                      <div className="text-green-600 font-medium mt-1">
                        ✅ Sufficient balance for batch settlement
                      </div>
                    ) : (
                      <div className="text-red-600 font-medium mt-1">
                        ⚠️ Insufficient balance! Shortfall: PKR {(getSelectedTotalAmount() - batchScannedCustomer.balance).toFixed(2)}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Manual Customer Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Or Select Customer Manually
                </label>
                <select
                  value={batchScannedCustomer?.id || ''}
                  onChange={(e) => {
                    const customerId = parseInt(e.target.value);
                    const customer = customers.find(c => c.id === customerId);
                    setBatchScannedCustomer(customer || null);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                >
                  <option value="">Select a customer...</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} - Card: {customer.cardRefId || customer.card_number || 'No Card'} - Balance: PKR {customer.balance.toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleBatchCardScanCancel}
                  className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBatchCardScanSubmit}
                  disabled={!batchScannedCustomer || batchScannedCustomer.balance < getSelectedTotalAmount()}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  <CreditCard size={16} />
                  <span>Settle All with Card</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}