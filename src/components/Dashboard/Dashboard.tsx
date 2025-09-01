import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { 
  TrendingUp, 
  Users, 
  Package, 
  CreditCard,
  ShoppingCart,
  DollarSign
} from 'lucide-react';
import { sales, customers, products } from '../../data/mockData';

export function Dashboard() {
  const { user } = useAuth();
  
  const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0);
  const todaySales = sales.filter(sale => {
    const today = new Date();
    const saleDate = new Date(sale.createdAt);
    return saleDate.toDateString() === today.toDateString();
  });
  const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.total, 0);
  
  const lowStockProducts = products.filter(p => p.stock < 20);
  const totalCustomerBalance = customers.reduce((sum, customer) => sum + customer.balance, 0);

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
          <p className="text-gray-600">Welcome back, {user?.name}</p>
        </div>
        <div className="bg-amber-900 text-white px-4 py-2 rounded-lg">
          <span className="text-sm font-medium capitalize">{user?.role}</span>
        </div>
      </div>

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
            <button className="flex items-center space-x-2 bg-amber-900 text-white px-4 py-3 rounded-lg hover:bg-amber-800 transition-colors">
              <ShoppingCart size={16} />
              <span className="text-sm">New Sale</span>
            </button>
            {user?.role !== 'salesman' && (
              <>
                <button className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors">
                  <Package size={16} />
                  <span className="text-sm">Add Product</span>
                </button>
                <button className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 transition-colors">
                  <Users size={16} />
                  <span className="text-sm">Add Customer</span>
                </button>
                <button className="flex items-center space-x-2 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors">
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
                    {new Date(sale.createdAt).toLocaleTimeString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}