import { X, DollarSign, CreditCard, Calendar, Clock, Loader2 } from 'lucide-react';
import { Customer, RechargeTransaction } from '../../types';
import { useEffect, useState } from 'react';
import { rechargeService } from '../../services/rechargeService';

interface RechargeHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  transactions: RechargeTransaction[];
}

export function RechargeHistory({ isOpen, onClose, customer, transactions }: RechargeHistoryProps) {
  const [customerTransactions, setCustomerTransactions] = useState<RechargeTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch customer-specific recharge history when modal opens
  useEffect(() => {
    if (isOpen && customer) {
      fetchCustomerRechargeHistory();
    }
  }, [isOpen, customer]);
  
  const fetchCustomerRechargeHistory = async () => {
    if (!customer) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const apiRecharges = await rechargeService.getRechargeHistory(customer.id);
      // Convert API format to app format
      const appRecharges: RechargeTransaction[] = apiRecharges.map(recharge => ({
        id: recharge.id,
        customer_id: recharge.customer_id,
        customerId: recharge.customer_id.toString(),
        amount: recharge.amount,
        timestamp: new Date(recharge.recharge_date),
        recharge_date: recharge.recharge_date,
        previousBalance: 0, // Not provided by API
        newBalance: 0 // Not provided by API
      }));
      setCustomerTransactions(appRecharges);
    } catch (err: any) {
      console.error('Failed to fetch customer recharge history:', err);
      setError(err.message || 'Failed to fetch recharge history');
    } finally {
      setLoading(false);
    }
  };
  
  if (!isOpen || !customer) return null;

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-900">Recharge History</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {/* Customer Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-3">
              <div className="bg-slate-700 p-2 rounded-lg">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{customer.name}</p>
                <p className="text-sm text-gray-600">{customer.cardRefId || customer.card_number}</p>
                <p className="text-sm text-gray-600">Current Balance: PKR {customer.balance.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Transactions List */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recharge Transactions</h3>
            
            {loading ? (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-slate-600" />
                <p className="text-gray-500">Loading recharge history...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 font-medium">Failed to load recharge history</p>
                  <p className="text-red-600 text-sm mt-1">{error}</p>
                  <button
                    onClick={fetchCustomerRechargeHistory}
                    className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                  >
                    Retry
                  </button>
                </div>
              </div>
            ) : customerTransactions.length === 0 ? (
              <div className="text-center py-8">
                <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No recharge transactions found</p>
                <p className="text-sm text-gray-400">Recharge history will appear here after the first transaction</p>
              </div>
            ) : (
              <div className="space-y-3">
                {customerTransactions
                  .sort((a, b) => {
                    const dateA = a.timestamp || new Date(a.recharge_date);
                    const dateB = b.timestamp || new Date(b.recharge_date);
                    return dateB.getTime() - dateA.getTime();
                  })
                  .map((transaction) => (
                    <div
                      key={transaction.id}
                      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="bg-green-100 p-2 rounded-lg">
                            <DollarSign className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">
                              +PKR {transaction.amount.toLocaleString()}
                            </p>
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <div className="flex items-center space-x-1">
                                <Calendar className="w-4 h-4" />
                                <span>{formatDate(transaction.timestamp || transaction.recharge_date)}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Clock className="w-4 h-4" />
                                <span>{formatTime(transaction.timestamp || transaction.recharge_date)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          {transaction.previousBalance && transaction.newBalance ? (
                            <>
                              <p className="text-sm text-gray-600">Previous: PKR {transaction.previousBalance.toLocaleString()}</p>
                              <p className="text-sm font-medium text-green-600">
                                New: PKR {transaction.newBalance.toLocaleString()}
                              </p>
                            </>
                          ) : (
                            <p className="text-sm text-gray-600">Recharge Amount</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* Summary */}
        {customerTransactions.length > 0 && (
          <div className="p-6 border-t border-gray-200 flex-shrink-0">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-800">Total Recharged</p>
                  <p className="text-lg font-bold text-blue-900">
                    PKR {customerTransactions.reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-blue-800">Transactions</p>
                  <p className="text-lg font-bold text-blue-900">{customerTransactions.length}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Close Button */}
        <div className="p-6 border-t border-gray-200 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
