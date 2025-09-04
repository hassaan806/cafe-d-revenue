import React, { useState, useEffect } from 'react';
import { useSales } from '../../contexts/SalesContext';
import { useProducts } from '../../contexts/ProductContext';
import { reportsService } from '../../services/reportsService';
import { 
  BarChart3, 
  TrendingUp, 
  Calendar,
  Download,
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  Loader2,
  FileText,
  PieChart,
  BarChart
} from 'lucide-react';

export function Reports() {
  const { sales, loading, error } = useSales();
  const { products } = useProducts();
  const [dateRange, setDateRange] = useState('today');
  const [selectedReport, setSelectedReport] = useState('overview');
  const [reportData, setReportData] = useState<any>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [customDateRange, setCustomDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  
  let filteredSales = sales;
  if (dateRange === 'today') {
    filteredSales = sales.filter(sale => {
      const saleDate = new Date(sale.timestamp || sale.createdAt);
      return saleDate.toDateString() === today.toDateString();
    });
  } else if (dateRange === 'week') {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    filteredSales = sales.filter(sale => new Date(sale.timestamp || sale.createdAt) >= weekAgo);
  } else if (dateRange === 'month') {
    filteredSales = sales.filter(sale => new Date(sale.timestamp || sale.createdAt) >= startOfMonth);
  }

  const totalRevenue = filteredSales.reduce((sum, sale) => sum + (sale.total || sale.total_price), 0);
  const totalTransactions = filteredSales.length;
  const averageOrderValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

  // Payment method breakdown
  const paymentBreakdown = filteredSales.reduce((acc, sale) => {
    const paymentMethod = sale.payment_method || sale.paymentMethod;
    const total = sale.total || sale.total_price;
    acc[paymentMethod] = (acc[paymentMethod] || 0) + total;
    return acc;
  }, {} as Record<string, number>);

  // Top selling products
  const productSales = filteredSales.flatMap(sale => sale.items).reduce((acc, item) => {
    const key = item.productName || `Product ${item.product_id}`;
    if (!acc[key]) {
      acc[key] = { quantity: 0, revenue: 0 };
    }
    acc[key].quantity += item.quantity;
    acc[key].revenue += item.total || 0;
    return acc;
  }, {} as Record<string, { quantity: number; revenue: number }>);

  const topProducts = Object.entries(productSales)
    .sort(([,a], [,b]) => b.revenue - a.revenue)
    .slice(0, 5);

  // Helper function to get date range
  const getDateRange = () => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    switch (dateRange) {
      case 'today':
        return {
          startDate: today.toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0]
        };
      case 'week':
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return {
          startDate: weekAgo.toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0]
        };
      case 'month':
        return {
          startDate: startOfMonth.toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0]
        };
      case 'custom':
        return {
          startDate: customDateRange.startDate,
          endDate: customDateRange.endDate
        };
      default:
        return {
          startDate: startOfMonth.toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0]
        };
    }
  };

  // Fetch reports from API
  const fetchReport = async (reportType: string) => {
    setReportLoading(true);
    setReportError(null);
    
    try {
      const { startDate, endDate } = getDateRange();
      let data: string;
      
      switch (reportType) {
        case 'sales_by_date':
          data = await reportsService.getSalesByDate(startDate, endDate);
          break;
        case 'sales_by_product':
          data = await reportsService.getSalesByProduct(startDate, endDate);
          break;
        case 'sales_by_salesman':
          data = await reportsService.getSalesBySalesman(startDate, endDate);
          break;
        case 'payment_breakdown':
          data = await reportsService.getPaymentBreakdown();
          break;
        default:
          throw new Error('Invalid report type');
      }
      
      setReportData(data);
    } catch (error: any) {
      console.error('Failed to fetch report:', error);
      setReportError(error.message || 'Failed to fetch report');
    } finally {
      setReportLoading(false);
    }
  };

  // Handle report selection
  const handleReportSelect = (reportType: string) => {
    setSelectedReport(reportType);
    if (reportType !== 'overview') {
      fetchReport(reportType);
    }
  };

  const reportStats = [
    {
      title: 'Total Revenue',
      value: `PKR ${totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-green-500'
    },
    {
      title: 'Transactions',
      value: totalTransactions.toString(),
      icon: ShoppingCart,
      color: 'bg-blue-500'
    },
    {
      title: 'Avg Order Value',
      value: `PKR ${Math.round(averageOrderValue).toLocaleString()}`,
      icon: TrendingUp,
      color: 'bg-purple-500'
    },
    {
      title: 'Products Sold',
      value: Object.values(productSales).reduce((sum, p) => sum + p.quantity, 0).toString(),
      icon: Package,
      color: 'bg-amber-500'
    }
  ];

  if (loading && sales.length === 0) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-amber-600" />
          <p className="text-gray-600">Loading sales data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales Reports</h1>
          <p className="text-gray-600">Analyze your business performance</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="custom">Custom Range</option>
          </select>
          <button className="bg-amber-900 text-white px-4 py-2 rounded-lg hover:bg-amber-800 transition-colors flex items-center space-x-2">
            <Download size={16} />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Custom Date Range Input */}
      {dateRange === 'custom' && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={customDateRange.startDate}
                onChange={(e) => setCustomDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={customDateRange.endDate}
                onChange={(e) => setCustomDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      )}

      {/* Report Type Selection */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Report Type</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => handleReportSelect('overview')}
            className={`p-4 rounded-lg border transition-colors ${
              selectedReport === 'overview'
                ? 'border-amber-900 bg-amber-50 text-amber-900'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <BarChart3 className="w-6 h-6 mx-auto mb-2" />
            <span className="text-sm font-medium">Overview</span>
          </button>
          <button
            onClick={() => handleReportSelect('sales_by_date')}
            className={`p-4 rounded-lg border transition-colors ${
              selectedReport === 'sales_by_date'
                ? 'border-amber-900 bg-amber-50 text-amber-900'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Calendar className="w-6 h-6 mx-auto mb-2" />
            <span className="text-sm font-medium">Sales by Date</span>
          </button>
          <button
            onClick={() => handleReportSelect('sales_by_product')}
            className={`p-4 rounded-lg border transition-colors ${
              selectedReport === 'sales_by_product'
                ? 'border-amber-900 bg-amber-50 text-amber-900'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Package className="w-6 h-6 mx-auto mb-2" />
            <span className="text-sm font-medium">Sales by Product</span>
          </button>
          <button
            onClick={() => handleReportSelect('sales_by_salesman')}
            className={`p-4 rounded-lg border transition-colors ${
              selectedReport === 'sales_by_salesman'
                ? 'border-amber-900 bg-amber-50 text-amber-900'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Users className="w-6 h-6 mx-auto mb-2" />
            <span className="text-sm font-medium">Sales by Salesman</span>
          </button>
          <button
            onClick={() => handleReportSelect('payment_breakdown')}
            className={`p-4 rounded-lg border transition-colors ${
              selectedReport === 'payment_breakdown'
                ? 'border-amber-900 bg-amber-50 text-amber-900'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <PieChart className="w-6 h-6 mx-auto mb-2" />
            <span className="text-sm font-medium">Payment Breakdown</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {reportError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{reportError}</p>
        </div>
      )}

      {/* Report Content */}
      {selectedReport === 'overview' ? (
        <>
          {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {reportStats.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Methods */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Methods</h3>
          <div className="space-y-3">
            {Object.entries(paymentBreakdown).map(([method, amount]) => {
              const percentage = totalRevenue > 0 ? (amount / totalRevenue * 100) : 0;
              return (
                <div key={method} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="capitalize font-medium">{method}</span>
                    <span>PKR {amount.toLocaleString()} ({percentage.toFixed(1)}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-amber-900 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Selling Products</h3>
          <div className="space-y-3">
            {topProducts.map(([productName, data], index) => (
              <div key={productName} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-amber-900 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{productName}</p>
                    <p className="text-sm text-gray-600">{data.quantity} units sold</p>
                  </div>
                </div>
                <span className="font-semibold text-amber-900">PKR {data.revenue}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 font-medium text-gray-700">Invoice</th>
                <th className="text-left py-3 font-medium text-gray-700">Items</th>
                <th className="text-left py-3 font-medium text-gray-700">Payment</th>
                <th className="text-left py-3 font-medium text-gray-700">Amount</th>
                <th className="text-left py-3 font-medium text-gray-700">Date & Time</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.slice(-10).reverse().map((sale) => (
                <tr key={sale.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 font-medium">{sale.invoiceNumber}</td>
                  <td className="py-3 text-gray-600">
                    {sale.items.map(item => item.productName).join(', ')}
                  </td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      sale.paymentMethod === 'cash' ? 'bg-green-100 text-green-800' :
                      sale.paymentMethod === 'card' ? 'bg-blue-100 text-blue-800' :
                      sale.paymentMethod === 'easypaisa' ? 'bg-purple-100 text-purple-800' :
                      'bg-orange-100 text-orange-800'
                    }`}>
                      {sale.paymentMethod.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 font-semibold">PKR {sale.total}</td>
                  <td className="py-3 text-gray-500">
                    {new Date(sale.createdAt).toLocaleDateString()} {new Date(sale.createdAt).toLocaleTimeString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
        </>
      ) : (
        /* API Report Display */
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {selectedReport === 'sales_by_date' && 'Sales by Date Report'}
              {selectedReport === 'sales_by_product' && 'Sales by Product Report'}
              {selectedReport === 'sales_by_salesman' && 'Sales by Salesman Report'}
              {selectedReport === 'payment_breakdown' && 'Payment Breakdown Report'}
            </h2>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">
                {getDateRange().startDate} to {getDateRange().endDate}
              </span>
              <button
                onClick={() => fetchReport(selectedReport)}
                disabled={reportLoading}
                className="px-3 py-1 text-sm bg-amber-900 text-white rounded hover:bg-amber-800 disabled:opacity-50"
              >
                Refresh
              </button>
            </div>
          </div>

          {reportLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-amber-600" />
                <p className="text-gray-600">Loading report data...</p>
              </div>
            </div>
          ) : reportData ? (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Report Data</h3>
                <pre className="text-sm text-gray-700 whitespace-pre-wrap overflow-x-auto">
                  {reportData}
                </pre>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center space-x-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    const blob = new Blob([reportData], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${selectedReport}_${getDateRange().startDate}_to_${getDateRange().endDate}.txt`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                >
                  <Download size={16} />
                  <span>Download Report</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
                >
                  <FileText size={16} />
                  <span>Print Report</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No report data available</p>
              <p className="text-sm text-gray-400">Select a report type and date range to generate a report</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}