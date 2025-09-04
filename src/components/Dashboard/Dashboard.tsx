import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useSales } from '../../contexts/SalesContext';
import { useCustomers } from '../../contexts/CustomerContext';
import { useProducts } from '../../contexts/ProductContext';
import { dashboardService } from '../../services/dashboardService';
import { 
  TrendingUp, 
  Users, 
  Package, 
  CreditCard,
  ShoppingCart,
  DollarSign,
  Loader2,
  RefreshCw,
  BarChart3
} from 'lucide-react';

interface DashboardProps {
  onViewChange: (view: string) => void;
}

export function Dashboard({ onViewChange }: DashboardProps) {
  const { user } = useAuth();
  const { sales } = useSales();
  const { customers } = useCustomers();
  const { products } = useProducts();
  
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [trendsData, setTrendsData] = useState<any>(null);
  const [customerInsights, setCustomerInsights] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState('today');
  const [customDateRange, setCustomDateRange] = useState({
    fromDate: '',
    toDate: ''
  });
  
  // Calculate local stats as fallback
  const totalSales = sales.reduce((sum, sale) => sum + (sale.total || sale.total_price), 0);
  const todaySales = sales.filter(sale => {
    const today = new Date();
    const saleDate = new Date(sale.timestamp || sale.createdAt || new Date());
    return saleDate.toDateString() === today.toDateString();
  });
  const todayRevenue = todaySales.reduce((sum, sale) => sum + (sale.total || sale.total_price), 0);
  
  const lowStockProducts = products.filter(p => p.stock < 20);
  const totalCustomerBalance = customers.reduce((sum, customer) => sum + customer.balance, 0);

  // Helper function to get date range
  const getDateRange = () => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    switch (dateRange) {
      case 'today':
        return {
          fromDate: today.toISOString().split('T')[0],
          toDate: today.toISOString().split('T')[0]
        };
      case 'week':
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return {
          fromDate: weekAgo.toISOString().split('T')[0],
          toDate: today.toISOString().split('T')[0]
        };
      case 'month':
        return {
          fromDate: startOfMonth.toISOString().split('T')[0],
          toDate: today.toISOString().split('T')[0]
        };
      case 'custom':
        return {
          fromDate: customDateRange.fromDate,
          toDate: customDateRange.toDate
        };
      default:
        return {
          fromDate: startOfMonth.toISOString().split('T')[0],
          toDate: today.toISOString().split('T')[0]
        };
    }
  };

  // Fetch dashboard data from API
  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { fromDate, toDate } = getDateRange();
      
      // Fetch all dashboard data in parallel
      const [overview, trends, insights] = await Promise.all([
        dashboardService.getOverview(fromDate, toDate),
        dashboardService.getSalesTrends(30),
        dashboardService.getCustomerInsights(5)
      ]);
      
      setDashboardData(overview);
      setTrendsData(trends);
      setCustomerInsights(insights);
    } catch (error: any) {
      console.error('Failed to fetch dashboard data:', error);
      setError(error.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Load dashboard data on mount and when date range changes
  useEffect(() => {
    fetchDashboardData();
  }, [dateRange, customDateRange.fromDate, customDateRange.toDate]);

  const stats = [
    {
      title: 'Today\'s Sales',
      value: `PKR ${todayRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-green-500',
      change: '+12%'
    },
    {
      title: 'Total Revenue',
      value: `PKR ${totalSales.toLocaleString()}`,
      icon: TrendingUp,
      color: 'bg-blue-500',
      change: '+8%'
    },
    {
      title: 'Active Customers',
      value: customers.length.toString(),
      icon: Users,
      color: 'bg-purple-500',
      change: '+3%'
    },
    {
      title: 'Card Balance',
      value: `PKR ${totalCustomerBalance.toLocaleString()}`,
      icon: CreditCard,
      color: 'bg-amber-500',
      change: '+15%'
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user?.name || user?.username}</p>
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
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="bg-amber-900 text-white px-4 py-2 rounded-lg hover:bg-amber-800 transition-colors disabled:opacity-50 flex items-center space-x-2"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
          <div className="bg-amber-900 text-white px-4 py-2 rounded-lg">
            <span className="text-sm font-medium capitalize">{user?.role}</span>
          </div>
        </div>
      </div>

      {/* Custom Date Range Input */}
      {dateRange === 'custom' && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
              <input
                type="date"
                value={customDateRange.fromDate}
                onChange={(e) => setCustomDateRange(prev => ({ ...prev, fromDate: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
              <input
                type="date"
                value={customDateRange.toDate}
                onChange={(e) => setCustomDateRange(prev => ({ ...prev, toDate: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                <p className="text-sm text-green-600 mt-1">{stat.change} from last week</p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => onViewChange('sales')}
              className="flex items-center space-x-2 bg-amber-900 text-white px-4 py-3 rounded-lg hover:bg-amber-800 transition-colors"
            >
              <ShoppingCart size={16} />
              <span className="text-sm">New Sale</span>
            </button>
            {user?.role !== 'salesman' && (
              <>
                <button 
                  onClick={() => onViewChange('products')}
                  className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Package size={16} />
                  <span className="text-sm">Add Product</span>
                </button>
                <button 
                  onClick={() => onViewChange('customers')}
                  className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Users size={16} />
                  <span className="text-sm">Add Customer</span>
                </button>
                <button 
                  onClick={() => onViewChange('cards')}
                  className="flex items-center space-x-2 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors"
                >
                  <CreditCard size={16} />
                  <span className="text-sm">Recharge Card</span>
                </button>
              </>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Alerts & Notifications</h3>
          <div className="space-y-3">
            {lowStockProducts.length > 0 && (
              <div className="bg-red-50 border-l-4 border-red-400 p-3 rounded">
                <p className="text-sm font-medium text-red-800">Low Stock Alert</p>
                <p className="text-sm text-red-700">{lowStockProducts.length} products running low</p>
              </div>
            )}
            <div className="bg-green-50 border-l-4 border-green-400 p-3 rounded">
              <p className="text-sm font-medium text-green-800">System Status</p>
              <p className="text-sm text-green-700">All systems operational</p>
            </div>
            <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded">
              <p className="text-sm font-medium text-blue-800">Today's Performance</p>
              <p className="text-sm text-blue-700">{todaySales.length} transactions completed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Sales */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Sales</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 font-medium text-gray-700">Invoice #</th>
                <th className="text-left py-2 font-medium text-gray-700">Items</th>
                <th className="text-left py-2 font-medium text-gray-700">Payment</th>
                <th className="text-left py-2 font-medium text-gray-700">Total</th>
                <th className="text-left py-2 font-medium text-gray-700">Time</th>
              </tr>
            </thead>
            <tbody>
              {sales.slice(-5).reverse().map((sale) => (
                <tr key={sale.id} className="border-b border-gray-100">
                  <td className="py-3 font-medium">{sale.invoiceNumber}</td>
                  <td className="py-3 text-gray-600">{sale.items.length} items</td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      sale.payment_method === 'cash' ? 'bg-green-100 text-green-800' :
                      sale.payment_method === 'card' ? 'bg-blue-100 text-blue-800' :
                      sale.payment_method === 'easypaisa' ? 'bg-purple-100 text-purple-800' :
                      'bg-orange-100 text-orange-800'
                    }`}>
                      {sale.payment_method.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 font-semibold">PKR {sale.total || sale.total_price}</td>
                  <td className="py-3 text-gray-500">
                    {new Date(sale.createdAt || sale.timestamp || new Date()).toLocaleTimeString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* API Dashboard Data */}
      {dashboardData && (
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Dashboard Overview (API Data)
          </h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <pre className="text-sm text-gray-700 whitespace-pre-wrap overflow-x-auto">
              {dashboardData}
            </pre>
          </div>
        </div>
      )}

      {/* Sales Trends */}
      {trendsData && (
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Sales Trends (Last 30 Days)
          </h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <pre className="text-sm text-gray-700 whitespace-pre-wrap overflow-x-auto">
              {trendsData}
            </pre>
          </div>
        </div>
      )}

      {/* Customer Insights */}
      {customerInsights && (
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Customer Insights (Top 5)
          </h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <pre className="text-sm text-gray-700 whitespace-pre-wrap overflow-x-auto">
              {customerInsights}
            </pre>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-amber-600" />
              <p className="text-gray-600">Loading dashboard data...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}