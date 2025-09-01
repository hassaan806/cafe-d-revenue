import React, { useState } from 'react';
import { customers } from '../../data/mockData';
import { 
  CreditCard, 
  Plus, 
  DollarSign, 
  Activity,
  TrendingUp,
  Search,
  Calendar
} from 'lucide-react';

export function CardManagement() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.cardRefId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalCards = customers.length;
  const totalBalance = customers.reduce((sum, customer) => sum + customer.balance, 0);
  const activeCards = customers.filter(c => c.balance > 0).length;

  const cardStats = [
    {
      title: 'Total Cards',
      value: totalCards.toString(),
      icon: CreditCard,
      color: 'bg-blue-500'
    },
    {
      title: 'Active Cards',
      value: activeCards.toString(),
      icon: Activity,
      color: 'bg-green-500'
    },
    {
      title: 'Total Balance',
      value: `PKR ${totalBalance.toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-purple-500'
    },
    {
      title: 'Avg Balance',
      value: `PKR ${Math.round(totalBalance / totalCards).toLocaleString()}`,
      icon: TrendingUp,
      color: 'bg-amber-500'
    }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Card Management</h1>
          <p className="text-gray-600">Monitor and manage customer prepaid cards</p>
        </div>
        <button className="bg-amber-900 text-white px-4 py-2 rounded-lg hover:bg-amber-800 transition-colors flex items-center space-x-2">
          <Plus size={20} />
          <span>New Card</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cardStats.map((stat, index) => (
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

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search by customer name or card ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
        />
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCustomers.map((customer) => (
          <div key={customer.id} className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
            {/* Card Design */}
            <div className="bg-gradient-to-br from-amber-900 to-orange-800 p-6 text-white">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-xs opacity-80">CAFE D REVENUE</p>
                  <p className="text-lg font-bold">{customer.cardRefId}</p>
                </div>
                <CreditCard className="w-8 h-8 opacity-80" />
              </div>
              <div className="space-y-1">
                <p className="text-xs opacity-80">CARDHOLDER</p>
                <p className="font-semibold">{customer.name.toUpperCase()}</p>
              </div>
              <div className="mt-4 flex justify-between items-end">
                <div>
                  <p className="text-xs opacity-80">BALANCE</p>
                  <p className="text-xl font-bold">PKR {customer.balance.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs opacity-80">MEMBER SINCE</p>
                  <p className="text-sm">{customer.createdAt.getFullYear()}</p>
                </div>
              </div>
            </div>
            
            {/* Card Info */}
            <div className="p-4">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                <span>Phone: {customer.phone}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  customer.balance > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {customer.balance > 0 ? 'Active' : 'Empty'}
                </span>
              </div>
              <div className="flex space-x-2">
                <button className="flex-1 bg-green-600 text-white py-2 px-3 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center justify-center space-x-1">
                  <DollarSign size={14} />
                  <span>Recharge</span>
                </button>
                <button className="flex-1 border border-gray-300 text-gray-700 py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
                  View History
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}