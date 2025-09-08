import React, { useState, useEffect } from 'react';
import { X, User, CreditCard, Wifi } from 'lucide-react';
import { Customer } from '../../types';

interface NewCardFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (customer: Omit<Customer, 'id' | 'createdAt'>) => void;
  existingCustomers: Customer[];
}

export function NewCardForm({ isOpen, onClose, onSave, existingCustomers }: NewCardFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    cardRefId: '',
    rfId: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: '',
        phone: '',
        cardRefId: '',
        rfId: ''
      });
      setErrors({});
    }
  }, [isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\+92-\d{3}-\d{7}$/.test(formData.phone)) {
      newErrors.phone = 'Phone must be in format +92-XXX-XXXXXXX';
    }

    if (!formData.cardRefId.trim()) {
      newErrors.cardRefId = 'Card ID is required';
    } else if (existingCustomers.some(c => c.cardRefId === formData.cardRefId)) {
      newErrors.cardRefId = 'This Card ID already exists';
    }

    if (formData.rfId.trim() && existingCustomers.some(c => (c as any).rfId === formData.rfId)) {
      newErrors.rfId = 'This RF ID already exists';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSave({
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        cardRefId: formData.cardRefId.trim(),
        balance: 0, // Always 0 for new cards
        // Add RF ID to the customer data if provided
        ...(formData.rfId.trim() && { rfId: formData.rfId.trim() })
      } as any);
      
      // Reset form
      setFormData({
        name: '',
        phone: '',
        cardRefId: '',
        rfId: ''
      });
      setErrors({});
      onClose();
    }
  };

  const formatPhoneNumber = (value: string): string => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '');
    
    // Handle Pakistan phone number format: +92-XXX-XXXXXXX
    if (digits.length === 0) return '';
    if (digits.length <= 2) return `+${digits}`;
    if (digits.length <= 5) return `+${digits.slice(0, 2)}-${digits.slice(2)}`;
    if (digits.length <= 12) return `+${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5)}`;
    
    // Limit to 12 digits total
    return `+${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5, 12)}`;
  };

  const handleInputChange = (field: string, value: string) => {
    let processedValue = value;
    
    // Auto-format phone number
    if (field === 'phone') {
      processedValue = formatPhoneNumber(value);
    }
    
    setFormData(prev => ({ ...prev, [field]: processedValue }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Create New Card</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="inline w-4 h-4 mr-2" />
              Customer Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter customer name"
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          {/* Phone Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
                         <input
               type="text"
               value={formData.phone}
               onChange={(e) => handleInputChange('phone', e.target.value)}
               className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
                 errors.phone ? 'border-red-500' : 'border-gray-300'
               }`}
               placeholder="+92-300-1234567"
               maxLength={15}
                          />
             {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
           </div>

          {/* Card ID Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <CreditCard className="inline w-4 h-4 mr-2" />
              Card ID
            </label>
            <input
              type="text"
              value={formData.cardRefId}
              onChange={(e) => handleInputChange('cardRefId', e.target.value.toUpperCase())}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
                errors.cardRefId ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter your preferred card ID (e.g., CARD001)"
            />
            {errors.cardRefId && <p className="text-red-500 text-sm mt-1">{errors.cardRefId}</p>}
          </div>

          {/* RF ID Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Wifi className="inline w-4 h-4 mr-2" />
              RF ID (Optional)
            </label>
            <input
              type="text"
              value={formData.rfId}
              onChange={(e) => handleInputChange('rfId', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
                errors.rfId ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter RF ID (optional)"
            />
            {errors.rfId && <p className="text-red-500 text-sm mt-1">{errors.rfId}</p>}
          </div>


          {/* Form Actions */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
            >
              Create Card
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
