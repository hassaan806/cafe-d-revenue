import React, { useState } from 'react';
import { sales, products } from '../../data/mockData';
import { 
  BarChart3, 
  TrendingUp, 
  Calendar,
  Download,
  DollarSign,
  ShoppingCart,
  Package,
  Users
} from 'lucide-react';

export function Reports() {
  const [dateRange, setDateRange] = useState('today');
  
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  
  let filteredSales = sales;
  if (dateRange === 'today') {
    filteredSales = sales.filter(sale => {
      const saleDate = new Date(sale.createdAt);
      return saleDate.toDateString() === today.toDateString();
    });
  } else if (dateRange === 'week') {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    filteredSales = sales.filter(sale => new Date(sale.createdAt) >= weekAgo);
  } else if (dateRange === 'month') {
    filteredSales = sales.filter(sale => new Date(sale.createdAt) >= startOfMonth);
  }

  const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
  const totalTransactions = filteredSales.length;
  const averageOrderValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

  // Payment method breakdown
  const paymentBreakdown = filteredSales.reduce((acc, sale) => {
    acc[sale.paymentMethod] = (acc[sale.paymentMethod] || 0) + sale.total;
    return acc;
  }, {} as Record<string, number>);

  // Top selling products
  const productSales = filteredSales.flatMap(sale => sale.items).reduce((acc, item) => {
    const key = item.productName;
    if (!acc[key]) {
      acc[key] = { quantity: 0, revenue: 0 };
    }
    acc[key].quantity += item.quantity;
    acc[key].revenue += item.total;
    return acc;
  }, {} as Record<string, { quantity: number; revenue: number }>);

  const topProducts = Object.entries(productSales)
    .sort(([,a], [,b]) => b.revenue - a.revenue)
    .slice(0, 5);

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
            <option value="all">All Time</option>
          </select>
          <button className="bg-amber-900 text-white px-4 py-2 rounded-lg hover:bg-amber-800 transition-colors flex items-center space-x-2">
            <Download size={16} />
            <span>Export</span>
          </button>
        </div>
      </div>

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
    </div>
  );
}