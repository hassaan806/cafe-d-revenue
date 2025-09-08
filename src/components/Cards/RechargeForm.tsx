import React, { useState } from 'react';
import { X, DollarSign, CreditCard, User, Loader2 } from 'lucide-react';
import { Customer } from '../../types';
import { useRecharges } from '../../contexts/RechargeContext';
import { useCustomers } from '../../contexts/CustomerContext';

interface RechargeFormProps {
  isOpen: boolean;
  onClose: () => void;
  onRecharge?: (customerId: string, amount: number) => void; // Make optional
  customer: Customer | null;
}

export function RechargeForm({ isOpen, onClose, onRecharge, customer }: RechargeFormProps) {
  const { addRecharge, loading } = useRecharges();
  const { updateCustomer } = useCustomers();
  const [amount, setAmount] = useState<number>(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateAmount() && customer) {
      setIsSubmitting(true);
      try {
        // Create recharge record
        await addRecharge({
          amount: amount,
          customer_id: customer.id
        });

        // Update customer balance
        await updateCustomer(customer.id, {
          balance: customer.balance + amount
        });

        // Note: onRecharge callback is removed to prevent double processing
        
        setAmount(0);
        setErrors({});
        onClose();
      } catch (error) {
        console.error('Failed to recharge:', error);
        // Error is handled by the context
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const validateAmount = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    if (amount > 100000) {
      newErrors.amount = 'Amount cannot exceed PKR 100,000';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAmountChange = (value: string) => {
    const numValue = parseFloat(value) || 0;
    setAmount(numValue);
    
    // Clear error when user starts typing
    if (errors.amount) {
      setErrors(prev => ({ ...prev, amount: '' }));
    }
  };

  const quickAmounts = [500, 1000, 2000, 5000, 10000];

  if (!isOpen || !customer) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-900">Recharge Card</h2>
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
                <p className="text-sm text-gray-600">{customer.cardRefId}</p>
                <p className="text-sm text-gray-600">Current Balance: PKR {customer.balance.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Amount Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="inline w-4 h-4 mr-2" />
                Recharge Amount (PKR)
              </label>
              <input
                type="number"
                min="1"
                max="100000"
                step="1"
                value={amount || ''}
                onChange={(e) => handleAmountChange(e.target.value)}
                className={`w-full px-3 py-3 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-lg ${
                  errors.amount ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter amount"
                autoFocus
              />
              {errors.amount && <p className="text-red-500 text-sm mt-1">{errors.amount}</p>}
            </div>

                         {/* Quick Amount Buttons */}
             <div>
               <p className="text-sm font-medium text-gray-700 mb-3">Quick Amounts</p>
               <div className="grid grid-cols-3 gap-2">
                 {quickAmounts.map((quickAmount) => (
                   <button
                     key={quickAmount}
                     type="button"
                     onClick={() => {
                       setAmount(quickAmount);
                       if (errors.amount) {
                         setErrors(prev => ({ ...prev, amount: '' }));
                       }
                     }}
                     className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                       amount === quickAmount
                         ? 'bg-slate-700 text-white border-slate-700'
                         : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                     }`}
                   >
                     PKR {quickAmount.toLocaleString()}
                   </button>
                 ))}
               </div>
             </div>

            {/* New Balance Preview */}
            {amount > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm text-green-800">New Balance</p>
                    <p className="text-lg font-bold text-green-900">
                      PKR {(customer.balance + amount).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            )}

                       </form>
         </div>

         {/* Form Actions - Fixed at bottom */}
         <div className="p-6 border-t border-gray-200 flex-shrink-0">
           <div className="flex space-x-3">
             <button
               type="button"
               onClick={onClose}
               className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
             >
               Cancel
             </button>
             <button
               type="button"
               onClick={handleSubmit}
               disabled={amount <= 0 || isSubmitting}
               className="flex-1 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
             >
               {isSubmitting && <Loader2 size={16} className="animate-spin" />}
               <DollarSign size={16} />
               <span>{isSubmitting ? 'Processing...' : `Recharge PKR ${amount.toLocaleString()}`}</span>
             </button>
           </div>
         </div>
       </div>
     </div>
   );
 }
