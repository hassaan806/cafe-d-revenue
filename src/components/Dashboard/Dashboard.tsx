import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useSales } from '../../contexts/SalesContext';
import { useCustomers } from '../../contexts/CustomerContext';
import { useProducts } from '../../contexts/ProductContext';
import { dashboardService } from '../../services/dashboardService';
import { extractProductName, calculateItemTotal, getProductNameById } from '../../utils/productUtils';
import { 
  TrendingUp, 
  Users, 
  Package, 
  CreditCard,
  ShoppingCart,
  Loader2,
  RefreshCw
} from 'lucide-react';

interface DashboardProps {
  onViewChange: (view: string) => void;
}

export function Dashboard({ onViewChange }: DashboardProps) {
  const { user } = useAuth();
  const { sales } = useSales();
  const { customers } = useCustomers();
  const { products } = useProducts();
  
  const [trendsData, setTrendsData] = useState<any>(null);
  const [customerInsights, setCustomerInsights] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Calculate local stats focusing on sales tracking (not revenue)
  const totalSalesCount = sales.length;
  const todaySales = sales.filter(sale => {
    const today = new Date();
    const saleDate = new Date(sale.timestamp || sale.createdAt || new Date());
    return saleDate.toDateString() === today.toDateString();
  });
  const todaySalesCount = todaySales.length;
  const todayTotal = todaySales.reduce((sum, sale) => sum + (sale.total || sale.total_price), 0);
  
  const lowStockProducts = products.filter(p => p.stock < 20);
  const totalCustomerBalance = customers.reduce((sum, customer) => sum + customer.balance, 0);

  // Fetch dashboard data from API
  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch dashboard data in parallel
      const [trends, insights] = await Promise.all([
        dashboardService.getSalesTrends(30),
        dashboardService.getCustomerInsights(5)
      ]);
      
      setTrendsData(trends);
      setCustomerInsights(insights);
    } catch (error: any) {
      console.error('Failed to fetch dashboard data:', error);
      setError(error.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Load dashboard data on mount
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const stats = [
    {
      title: 'Today\'s Sales',
      value: `${todaySalesCount} transactions`,
      icon: ShoppingCart,
      color: 'bg-green-500',
      change: `PKR ${todayTotal.toLocaleString()}`
    },
    {
      title: 'Total Sales',
      value: `${totalSalesCount} completed`,
      icon: TrendingUp,
      color: 'bg-blue-500',
      change: 'All time'
    },
    {
      title: 'Active Customers',
      value: customers.length.toString(),
      icon: Users,
      color: 'bg-purple-500',
      change: 'Registered users'
    },
    {
      title: 'Products in Stock',
      value: products.length.toString(),
      icon: Package,
      color: 'bg-slate-500',
      change: `${lowStockProducts.length} low stock`
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <img 
            src="/logo.svg" 
            alt="Cafe D Revenue Logo" 
            className="w-16 h-16 object-contain"
          />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">Welcome back, {user?.name || user?.username}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="bg-slate-700 text-white px-4 py-2 rounded-lg hover:bg-slate-600 transition-colors disabled:opacity-50 flex items-center space-x-2"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
          <div className="bg-slate-700 text-white px-4 py-2 rounded-lg">
            <span className="text-sm font-medium capitalize">{user?.role}</span>
          </div>
        </div>
      </div>

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
                <p className="text-sm text-gray-500 mt-1">{stat.change}</p>
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
              className="flex items-center space-x-2 bg-slate-700 text-white px-4 py-3 rounded-lg hover:bg-slate-600 transition-colors"
            >
              <ShoppingCart size={16} />
              <span className="text-sm">New Sale</span>
            </button>
            {user?.role !== 'salesman' && (
              <>
                <button 
                  onClick={() => onViewChange('products')}
                  className="flex items-center space-x-2 bg-slate-600 text-white px-4 py-3 rounded-lg hover:bg-slate-700 transition-colors"
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
                  className="flex items-center space-x-2 bg-slate-700 text-white px-4 py-3 rounded-lg hover:bg-slate-600 transition-colors"
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
              <p className="text-sm font-medium text-blue-800">Today's Activity</p>
              <p className="text-sm text-blue-700">{todaySalesCount} sales completed today</p>
            </div>
            <div className="bg-purple-50 border-l-4 border-purple-400 p-3 rounded">
              <p className="text-sm font-medium text-purple-800">Customer Cards</p>
              <p className="text-sm text-purple-700">PKR {totalCustomerBalance.toLocaleString()} total balance</p>
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
                <th className="text-left py-2 font-medium text-gray-700">Customer</th>
                <th className="text-left py-2 font-medium text-gray-700">Items</th>
                <th className="text-left py-2 font-medium text-gray-700">Payment</th>
                <th className="text-left py-2 font-medium text-gray-700">Total</th>
                <th className="text-left py-2 font-medium text-gray-700">Time</th>
              </tr>
            </thead>
            <tbody>
              {sales.slice(-5).reverse().map((sale) => {
                const customer = sale.customer_id ? customers.find(c => c.id === sale.customer_id) : null;
                return (
                  <tr key={sale.id} className="border-b border-gray-100">
                    <td className="py-3 font-medium">{sale.invoiceNumber}</td>
                    <td className="py-3 text-gray-600">
                      {customer ? (
                        <div>
                          <div className="font-medium text-gray-900">{customer.name}</div>
                          <div className="text-xs text-gray-500">
                            {customer.cardRefId || customer.card_number || 'No Card'}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">Walk-in Customer</span>
                      )}
                    </td>
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
                    <td className="py-3 font-semibold">{(sale.total || sale.total_price).toLocaleString()} PKR</td>
                    <td className="py-3 text-gray-500">
                      {new Date(sale.createdAt || sale.timestamp || new Date()).toLocaleTimeString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sales Trends */}
      {trendsData && trendsData.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Sales Trends (Last 30 Days)
          </h3>
          <div className="space-y-3">
            {trendsData.slice(0, 10).map((trend: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{new Date(trend.date).toLocaleDateString()}</p>
                  <p className="text-sm text-gray-600">{trend.transactions} transactions</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-600">{trend.sales?.toLocaleString() || '0'} PKR</p>
                </div>
              </div>
            ))}
          </div>
          {trendsData.length === 0 && (
            <p className="text-gray-500 text-center py-8">No trend data available for the selected period</p>
          )}
        </div>
      )}

      {/* Customer Insights */}
      {customerInsights && customerInsights.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Top Customer Insights
          </h3>
          <div className="space-y-3">
            {customerInsights.map((customer: any, index: number) => (
              <div key={customer.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{customer.name}</p>
                    <p className="text-sm text-gray-600">{customer.transaction_count} transactions</p>
                    <p className="text-xs text-gray-500">Last purchase: {new Date(customer.last_purchase).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-purple-600">{customer.total_spent?.toLocaleString() || '0'} PKR</p>
                </div>
              </div>
            ))}
          </div>
          {customerInsights.length === 0 && (
            <p className="text-gray-500 text-center py-8">No customer insights available</p>
          )}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-600" />
              <p className="text-gray-600">Loading dashboard data...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}