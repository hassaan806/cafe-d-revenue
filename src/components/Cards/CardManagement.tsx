import { useState } from 'react';
import { useCustomers } from '../../contexts/CustomerContext';
import { 
  CreditCard, 
  Plus, 
  DollarSign, 
  Activity,
  TrendingUp,
  Search,
  Percent
} from 'lucide-react';
import { NewCardForm } from './NewCardForm';
import { RechargeForm } from './RechargeForm';
import { RechargeHistory } from './RechargeHistory';
import { Customer, RechargeTransaction } from '../../types';

export function CardManagement() {
  const { customers: customersList, addCustomer, updateCustomer, refreshCustomers } = useCustomers();
  const [searchTerm, setSearchTerm] = useState('');
  const [isNewCardFormOpen, setIsNewCardFormOpen] = useState(false);
  const [isRechargeFormOpen, setIsRechargeFormOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [globalDiscount, setGlobalDiscount] = useState(0);
  const [isSettingDiscount, setIsSettingDiscount] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const filteredCustomers = customersList.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (customer.cardRefId || customer.card_number).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalCards = customersList.length;
  const totalBalance = customersList.reduce((sum, customer) => sum + customer.balance, 0);
  const activeCards = customersList.filter(c => c.balance > 0).length;
  const customersWithDiscount = customersList.filter(c => (c.card_discount || 0) > 0).length;

  const handleSaveNewCard = async (newCustomer: Omit<Customer, 'id' | 'createdAt'>) => {
    try {
      await addCustomer({
        name: newCustomer.name,
        phone: newCustomer.phone,
        rfid_no: newCustomer.rfId || '',
        card_number: newCustomer.cardRefId || '',
        balance: newCustomer.balance || 0,
        // Ensure card_discount is properly handled
        card_discount: typeof newCustomer.card_discount === 'number' ? newCustomer.card_discount : 0
      });
    } catch (error) {
      console.error('Failed to create customer:', error);
      // Error is handled by the context
    }
  };

  const handleRechargeClick = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsRechargeFormOpen(true);
  };

  const handleViewHistoryClick = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsHistoryOpen(true);
  };

  const handleSetGlobalDiscount = async () => {
    if (globalDiscount < 0 || globalDiscount > 100) {
      alert('Discount must be between 0 and 100');
      return;
    }

    if (window.confirm(`Apply ${globalDiscount}% discount to all card transactions?`)) {
      setIsSettingDiscount(true);
      try {
        // Update all customers with the new discount
        const updatePromises = customersList.map(customer => 
          updateCustomer(customer.id, { card_discount: globalDiscount })
        );
        await Promise.all(updatePromises);
        alert(`Successfully applied ${globalDiscount}% discount to all cards`);
      } catch (error) {
        console.error('Failed to set global discount:', error);
        alert('Failed to apply discount to all cards');
      } finally {
        setIsSettingDiscount(false);
      }
    }
  };

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
      title: 'Cards with Discount',
      value: customersWithDiscount.toString(),
      icon: Percent,
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
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={globalDiscount}
              onChange={(e) => setGlobalDiscount(parseFloat(e.target.value) || 0)}
              className="w-20 px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="0"
            />
            <span className="text-gray-600">%</span>
            <button 
              onClick={handleSetGlobalDiscount}
              disabled={isSettingDiscount}
              className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-1 rounded-lg transition-colors flex items-center text-sm disabled:opacity-50"
            >
              {isSettingDiscount ? 'Setting...' : 'Set All'}
            </button>
          </div>
          <button 
            onClick={() => setIsNewCardFormOpen(true)}
            className="bg-slate-700 text-white px-4 py-2 rounded-lg hover:bg-slate-600 transition-colors flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>New Card</span>
          </button>
        </div>
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
          placeholder="Search by customer name, card ID, or RF ID..."
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
                  <p className="text-lg font-bold">{customer.cardRefId || customer.card_number}</p>
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
                  <p className="text-sm">{customer.createdAt ? customer.createdAt.getFullYear() : new Date(customer.created_at).getFullYear()}</p>
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
              
              {/* Discount Info */}
              {(customer.card_discount || 0) > 0 && (
                <div className="mb-3">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                    <Percent size={12} className="mr-1" />
                    {customer.card_discount}% Discount
                  </span>
                </div>
              )}
              
              <div className="flex space-x-2">
                <button 
                  onClick={() => handleRechargeClick(customer)}
                  className="flex-1 bg-green-600 text-white py-2 px-3 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center justify-center space-x-1"
                >
                  <DollarSign size={14} />
                  <span>Recharge</span>
                </button>
                <button 
                  onClick={() => handleViewHistoryClick(customer)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  View History
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* New Card Form Modal */}
      <NewCardForm
        isOpen={isNewCardFormOpen}
        onClose={() => setIsNewCardFormOpen(false)}
        onSave={handleSaveNewCard}
        existingCustomers={customersList}
      />

      {/* Recharge Form Modal */}
      <RechargeForm
        isOpen={isRechargeFormOpen}
        onClose={() => {
          setIsRechargeFormOpen(false);
          setSelectedCustomer(null);
        }}
        onRecharge={undefined} // No callback needed, form handles everything internally
        customer={selectedCustomer}
      />

      {/* Recharge History Modal */}
      <RechargeHistory
        isOpen={isHistoryOpen}
        onClose={() => {
          setIsHistoryOpen(false);
          setSelectedCustomer(null);
        }}
        customer={selectedCustomer}
        transactions={[]} // No longer using local transactions
      />
    </div>
  );
}