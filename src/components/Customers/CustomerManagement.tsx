import React, { useState } from 'react';
import { customers as initialCustomers } from '../../data/mockData';
import { Customer } from '../../types';
import { 
  Users, 
  Plus, 
  CreditCard, 
  Edit3, 
  Trash2,
  Search,
  Phone,
  Calendar,
  DollarSign
} from 'lucide-react';

export function CustomerManagement() {
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [showRechargeModal, setShowRechargeModal] = useState<Customer | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    cardRefId: '',
    balance: ''
  });

  const [rechargeAmount, setRechargeAmount] = useState('');

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm) ||
    customer.cardRefId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingCustomer) {
      setCustomers(customers.map(c => 
        c.id === editingCustomer.id 
          ? { 
              ...c, 
              name: formData.name,
              phone: formData.phone,
              cardRefId: formData.cardRefId,
              balance: Number(formData.balance)
            }
          : c
      ));
      setEditingCustomer(null);
    } else {
      const newCustomer: Customer = {
        id: Date.now().toString(),
        name: formData.name,
        phone: formData.phone,
        cardRefId: formData.cardRefId,
        balance: Number(formData.balance),
        createdAt: new Date()
      };
      setCustomers([...customers, newCustomer]);
    }
    
    setFormData({ name: '', phone: '', cardRefId: '', balance: '' });
    setShowAddForm(false);
  };

  const startEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      phone: customer.phone,
      cardRefId: customer.cardRefId,
      balance: customer.balance.toString()
    });
    setShowAddForm(true);
  };

  const deleteCustomer = (customerId: string) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      setCustomers(customers.filter(c => c.id !== customerId));
    }
  };

  const handleRecharge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showRechargeModal) return;
    
    const amount = Number(rechargeAmount);
    setCustomers(customers.map(c => 
      c.id === showRechargeModal.id 
        ? { ...c, balance: c.balance + amount }
        : c
    ));
    
    setRechargeAmount('');
    setShowRechargeModal(null);
    alert(`Card recharged successfully! Added PKR ${amount}`);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer Management</h1>
          <p className="text-gray-600">Manage customer accounts and card balances</p>
        </div>
        <button
          onClick={() => {
            setShowAddForm(true);
            setEditingCustomer(null);
            setFormData({ name: '', phone: '', cardRefId: '', balance: '' });
          }}
          className="bg-amber-900 text-white px-4 py-2 rounded-lg hover:bg-amber-800 transition-colors flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>Add Customer</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search customers by name, phone, or card ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
        />
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Card ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mr-3">
                        <Users className="w-5 h-5 text-blue-700" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <Phone size={12} className="mr-1" />
                          {customer.phone}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-medium">
                      {customer.cardRefId}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-semibold ${
                      customer.balance > 1000 ? 'text-green-600' :
                      customer.balance > 500 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      PKR {customer.balance.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <Calendar size={12} className="mr-1" />
                      {customer.createdAt.toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => setShowRechargeModal(customer)}
                      className="text-green-600 hover:text-green-900 flex items-center space-x-1"
                    >
                      <CreditCard size={14} />
                      <span>Recharge</span>
                    </button>
                    <button
                      onClick={() => startEdit(customer)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={() => deleteCustomer(customer.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Customer Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="+92-300-1234567"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Card REF ID</label>
                <input
                  type="text"
                  value={formData.cardRefId}
                  onChange={(e) => setFormData({ ...formData, cardRefId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="CARD001"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Initial Balance (PKR)</label>
                <input
                  type="number"
                  value={formData.balance}
                  onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  required
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-amber-900 text-white py-2 px-4 rounded-lg hover:bg-amber-800 transition-colors font-medium"
                >
                  {editingCustomer ? 'Update' : 'Add'} Customer
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingCustomer(null);
                  }}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Recharge Modal */}
      {showRechargeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recharge Card</h2>
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="font-semibold text-gray-900">{showRechargeModal.name}</p>
              <p className="text-sm text-gray-600">{showRechargeModal.cardRefId}</p>
              <p className="text-sm text-gray-600">Current Balance: PKR {showRechargeModal.balance}</p>
            </div>
            <form onSubmit={handleRecharge} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Recharge Amount (PKR)</label>
                <input
                  type="number"
                  value={rechargeAmount}
                  onChange={(e) => setRechargeAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="Enter amount"
                  required
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center space-x-2"
                >
                  <DollarSign size={16} />
                  <span>Recharge</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowRechargeModal(null)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}