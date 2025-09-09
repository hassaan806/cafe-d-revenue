import React, { useState, useEffect } from 'react';
import { Settings, Send, CheckCircle, XCircle, AlertCircle, Users } from 'lucide-react';
import { smsService, SMSMessage, BulkSMSMessage } from '../../services/smsService';
import type { SMSSettings } from '../../services/smsService';

export function SMSSettings() {
  const [settings, setSettings] = useState<SMSSettings>({
    enabled: false,
    provider: 'generic',
    apiKey: '',
    senderId: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testSending, setTestSending] = useState(false);
  const [bulkTestSending, setBulkTestSending] = useState(false);
  const [testResult, setTestResult] = useState<boolean | null>(null);
  const [bulkTestResult, setBulkTestResult] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [testMessage, setTestMessage] = useState<SMSMessage>({
    phone: '',
    message: 'This is a test message from Cafe D Revenue system.'
  });
  const [bulkTestMessages, setBulkTestMessages] = useState<BulkSMSMessage>({
    messages: [
      { contact: '', message: 'This is a bulk test message from Cafe D Revenue system.', type: 'text' },
      { contact: '', message: 'This is another bulk test message.', type: 'text' }
    ]
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const smsSettings = await smsService.getSMSSettings();
      setSettings(smsSettings);
    } catch (err: any) {
      setError(err.message || 'Failed to load SMS settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      await smsService.updateSMSSettings(settings);
      setTestResult(null);
      setBulkTestResult(null);
    } catch (err: any) {
      setError(err.message || 'Failed to save SMS settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTestSMS = async () => {
    if (!testMessage.phone) {
      setError('Please enter a phone number for testing');
      return;
    }

    try {
      setTestSending(true);
      setError(null);
      const result = await smsService.sendTestSMS(testMessage);
      setTestResult(result);
      setTimeout(() => setTestResult(null), 5000);
    } catch (err: any) {
      setError(err.message || 'Failed to send test SMS');
      setTestResult(false);
    } finally {
      setTestSending(false);
    }
  };

  const handleBulkTestSMS = async () => {
    const validMessages = bulkTestMessages.messages.filter(msg => msg.contact.trim() !== '');
    if (validMessages.length === 0) {
      setError('Please enter at least one phone number for bulk testing');
      return;
    }

    try {
      setBulkTestSending(true);
      setError(null);
      const bulkMessage: BulkSMSMessage = {
        messages: validMessages.map(msg => ({
          contact: msg.contact,
          message: msg.message,
          type: 'text'
        }))
      };
      const result = await smsService.sendTestBulkSMS(bulkMessage);
      setBulkTestResult(result);
      setTimeout(() => setBulkTestResult(null), 5000);
    } catch (err: any) {
      setError(err.message || 'Failed to send bulk test SMS');
      setBulkTestResult(false);
    } finally {
      setBulkTestSending(false);
    }
  };

  const addBulkMessage = () => {
    setBulkTestMessages(prev => ({
      messages: [...prev.messages, { contact: '', message: '', type: 'text' }]
    }));
  };

  const removeBulkMessage = (index: number) => {
    if (bulkTestMessages.messages.length > 1) {
      setBulkTestMessages(prev => ({
        messages: prev.messages.filter((_, i) => i !== index)
      }));
    }
  };

  const updateBulkMessage = (index: number, field: string, value: string) => {
    setBulkTestMessages(prev => ({
      messages: prev.messages.map((msg, i) => 
        i === index ? { ...msg, [field]: value } : msg
      )
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-700"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <Settings className="w-5 h-5 mr-2 text-slate-600" />
          SMS Configuration
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Configure SMS settings for customer notifications
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {testResult !== null && (
        <div className={`border rounded-lg p-4 ${testResult ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-center">
            {testResult ? (
              <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
            ) : (
              <XCircle className="w-5 h-5 text-red-400 mr-2" />
            )}
            <p className={`text-sm ${testResult ? 'text-green-700' : 'text-red-700'}`}>
              {testResult 
                ? 'Test SMS sent successfully!' 
                : 'Failed to send test SMS. Please check your configuration.'}
            </p>
          </div>
        </div>
      )}

      {bulkTestResult !== null && (
        <div className={`border rounded-lg p-4 ${bulkTestResult ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-center">
            {bulkTestResult ? (
              <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
            ) : (
              <XCircle className="w-5 h-5 text-red-400 mr-2" />
            )}
            <p className={`text-sm ${bulkTestResult ? 'text-green-700' : 'text-red-700'}`}>
              {bulkTestResult 
                ? 'Bulk test SMS sent successfully!' 
                : 'Failed to send bulk test SMS. Please check your configuration.'}
            </p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="space-y-6">
          {/* Enable SMS */}
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Enable SMS Notifications</h4>
              <p className="text-sm text-gray-500">Send SMS notifications for customer activities</p>
            </div>
            <button
              onClick={() => setSettings(prev => ({ ...prev, enabled: !prev.enabled }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 ${
                settings.enabled ? 'bg-slate-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* SMS Provider */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              SMS Provider
            </label>
            <select
              value={settings.provider}
              onChange={(e) => setSettings(prev => ({ ...prev, provider: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
            >
              <option value="generic">Generic SMS API</option>
              <option value="twilio">Twilio</option>
              <option value="nexmo">Nexmo/Vonage</option>
            </select>
          </div>

          {/* API Key */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API Token
            </label>
            <input
              type="password"
              value={settings.apiKey}
              onChange={(e) => setSettings(prev => ({ ...prev, apiKey: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
              placeholder="Enter your SMS provider API token"
            />
          </div>

          {/* Sender ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sender ID
            </label>
            <input
              type="text"
              value={settings.senderId}
              onChange={(e) => setSettings(prev => ({ ...prev, senderId: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
              placeholder="Enter sender ID (e.g., Cafe de Revenue)"
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors font-medium disabled:opacity-50 flex items-center space-x-2"
            >
              {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
              <span>{saving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Test SMS Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Test SMS Configuration</h4>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Test Phone Number
            </label>
            <input
              type="tel"
              value={testMessage.phone}
              onChange={(e) => setTestMessage(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
              placeholder="923331234567"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Test Message
            </label>
            <textarea
              value={testMessage.message}
              onChange={(e) => setTestMessage(prev => ({ ...prev, message: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
              rows={3}
            />
          </div>

          <button
            onClick={handleTestSMS}
            disabled={testSending || !settings.enabled}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 flex items-center space-x-2"
          >
            <Send className="w-4 h-4" />
            {testSending ? 'Sending...' : 'Send Test SMS'}
          </button>
        </div>
      </div>

      {/* Bulk Test SMS Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <Users className="w-5 h-5 mr-2" />
          Bulk Test SMS Configuration
        </h4>
        
        <div className="space-y-4">
          {bulkTestMessages.messages.map((msg, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              <div className="md:col-span-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number {index + 1}
                </label>
                <input
                  type="tel"
                  value={msg.contact}
                  onChange={(e) => updateBulkMessage(index, 'contact', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  placeholder="923331234567"
                />
              </div>
              <div className="md:col-span-7">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message {index + 1}
                </label>
                <input
                  type="text"
                  value={msg.message}
                  onChange={(e) => updateBulkMessage(index, 'message', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  placeholder="Enter message"
                />
              </div>
              <div className="md:col-span-1">
                {bulkTestMessages.messages.length > 1 && (
                  <button
                    onClick={() => removeBulkMessage(index)}
                    className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          ))}
          
          <div className="flex space-x-3">
            <button
              onClick={addBulkMessage}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Add Another
            </button>
            
            <button
              onClick={handleBulkTestSMS}
              disabled={bulkTestSending || !settings.enabled}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 flex items-center space-x-2"
            >
              <Send className="w-4 h-4" />
              {bulkTestSending ? 'Sending...' : 'Send Bulk Test SMS'}
            </button>
          </div>
        </div>
      </div>

      {/* SMS Notification Types */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">SMS Notification Types</h4>
        
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-1">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
            <div>
              <h5 className="text-sm font-medium text-gray-900">Customer Registration</h5>
              <p className="text-sm text-gray-500">Sent when a new customer is registered with their card</p>
              <p className="text-xs text-gray-400 mt-1">Example: "Welcome to Cafe D Revenue! Your card CARD001 has been registered successfully. Current balance: PKR 0.00"</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-1">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
            <div>
              <h5 className="text-sm font-medium text-gray-900">Card Payments</h5>
              <p className="text-sm text-gray-500">Sent when a customer makes a purchase using their card</p>
              <p className="text-xs text-gray-400 mt-1">Example: "Thank you for your purchase at Cafe D Revenue! Items: Coffee x2, Sandwich x1. Total: PKR 500.00. Your remaining balance: PKR 1500.00"</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-1">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
            <div>
              <h5 className="text-sm font-medium text-gray-900">Pending Bill Settlement</h5>
              <p className="text-sm text-gray-500">Sent when a customer settles their pending bills</p>
              <p className="text-xs text-gray-400 mt-1">Example: "Your pending bill #123 has been settled at Cafe D Revenue! Items: Burger x1, Fries x1. Total: PKR 350.00. Your remaining balance: PKR 1150.00"</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-1">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
            <div>
              <h5 className="text-sm font-medium text-gray-900">Card Recharge</h5>
              <p className="text-sm text-gray-500">Sent when a customer recharges their card balance</p>
              <p className="text-xs text-gray-400 mt-1">Example: "Your card at Cafe D Revenue has been recharged with PKR 1000.00. New balance: PKR 2500.00"</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-1">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
            <div>
              <h5 className="text-sm font-medium text-gray-900">Low Balance Alert</h5>
              <p className="text-sm text-gray-500">Sent when customer balance falls below PKR 100</p>
              <p className="text-xs text-gray-400 mt-1">Example: "Low balance alert: Your card balance is PKR 75.00. Please recharge soon."</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}