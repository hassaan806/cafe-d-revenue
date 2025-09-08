import React, { useState } from 'react';
import { useCustomers } from '../../contexts/CustomerContext';
import { Customer } from '../../types';
import { 
  Users, 
  Plus, 
  Edit3, 
  Trash2,
  Search,
  Phone,
  Calendar,
  CreditCard,
  Wifi,
  Loader2
} from 'lucide-react';

export function CustomerManagement() {
  const { customers, loading, error, addCustomer, updateCustomer, deleteCustomer: deleteCustomerAPI } = useCustomers();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    cardRefId: '',
    rfId: ''
  });
  const [showDeleteModal, setShowDeleteModal] = useState<Customer | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm) ||
    (customer.cardRefId || customer.card_number).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (editingCustomer) {
        await updateCustomer(editingCustomer.id, {
          name: formData.name,
          phone: formData.phone,
          rfid_no: formData.rfId,
          card_number: formData.cardRefId,
          balance: editingCustomer.balance
        });
        setEditingCustomer(null);
      } else {
        await addCustomer({
          name: formData.name,
          phone: formData.phone,
          rfid_no: formData.rfId,
          card_number: formData.cardRefId,
          balance: 0
        });
      }
      
      setFormData({ name: '', phone: '', address: '', cardRefId: '', rfId: '' });
      setShowAddForm(false);
    } catch (error) {
      console.error('Failed to save customer:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      phone: customer.phone,
      address: customer.address || '',
      cardRefId: customer.cardRefId || customer.card_number,
      rfId: customer.rfId || customer.rfid_no || ''
    });
    setShowAddForm(true);
  };

  const handleDeleteCustomer = async (customerId: number) => {
    try {
      await deleteCustomerAPI(customerId);
      setShowDeleteModal(null);
    } catch (error) {
      console.error('Failed to delete customer:', error);
      // Error handled by the context
    }
  };

  const confirmDelete = (customer: Customer) => {
    setShowDeleteModal(customer);
  };



  if (loading && customers.length === 0) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-slate-600" />
          <p className="text-gray-600">Loading customers...</p>
        </div>
      </div>
    );
  }

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
            setFormData({ name: '', phone: '', address: '', cardRefId: '', rfId: '' });
          }}
          className="bg-slate-700 text-white px-4 py-2 rounded-lg hover:bg-slate-600 transition-colors flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>Add Customer</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search customers by name, phone, card ID, or RF ID..."
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Card Details</th>
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
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <CreditCard size={14} className="text-slate-600" />
                        <span className="px-2 py-1 bg-slate-100 text-slate-800 rounded text-xs font-medium">
                          {customer.cardRefId || customer.card_number}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <Calendar size={12} className="mr-1" />
                      {customer.createdAt ? customer.createdAt.toLocaleDateString() : new Date(customer.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => startEdit(customer)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={() => confirmDelete(customer)}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] flex flex-col">
            <div className="flex-shrink-0 p-6 pb-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone No.</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="Enter customer address"
                  rows={3}
                />
              </div>
              
              {/* Card Details Section */}
              <div className="border-t pt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                  <CreditCard size={16} className="mr-2 text-slate-600" />
                  Card Details
                </h3>
                
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Card Reference ID
                    </label>
                    <input
                      type="text"
                      value={formData.cardRefId}
                      onChange={(e) => setFormData({ ...formData, cardRefId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      placeholder="CARD001 or leave empty for auto-generation"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Leave empty to auto-generate: CARD001, CARD002, etc.
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      RF ID (Optional)
                    </label>
                    <input
                      type="text"
                      value={formData.rfId}
                      onChange={(e) => setFormData({ ...formData, rfId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      placeholder="RF123456789"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      RFID tag number for contactless payments
                    </p>
                  </div>
                </div>
              </div>
              </form>
            </div>
            <div className="flex-shrink-0 p-6 pt-4 border-t border-gray-200">
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1 bg-slate-700 text-white py-2 px-4 rounded-lg hover:bg-slate-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                  <span>{editingCustomer ? 'Update' : 'Add'} Customer</span>
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
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Delete Customer</h2>
            </div>
            
            <p className="text-gray-700 mb-6">
              Do you want to delete this customer?
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={() => handleDeleteCustomer(showDeleteModal.id)}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center justify-center space-x-2"
              >
                <Trash2 size={16} />
                <span>Delete</span>
              </button>
              <button
                onClick={() => setShowDeleteModal(null)}
                className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}