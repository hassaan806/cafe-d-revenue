import api from './api';

export interface SMSSettings {
  enabled: boolean;
  provider: string;
  apiKey: string;
  senderId: string;
}

export interface SMSMessage {
  phone: string;
  message: string;
}

export interface BulkSMSMessage {
  messages: Array<{
    contact: string;
    message: string;
    type: string;
  }>;
}

export const smsService = {
  // Get SMS settings
  async getSMSSettings(): Promise<SMSSettings> {
    try {
      const response = await api.get<SMSSettings>('/settings/sms');
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch SMS settings:', error);
      throw new Error(
        error.response?.data?.detail?.[0]?.msg || 
        'Failed to fetch SMS settings. Please try again.'
      );
    }
  },

  // Update SMS settings
  async updateSMSSettings(settings: Partial<SMSSettings>): Promise<SMSSettings> {
    try {
      const response = await api.put<SMSSettings>('/settings/sms', settings);
      return response.data;
    } catch (error: any) {
      console.error('Failed to update SMS settings:', error);
      throw new Error(
        error.response?.data?.detail?.[0]?.msg || 
        'Failed to update SMS settings. Please try again.'
      );
    }
  },

  // Send test SMS
  async sendTestSMS(message: SMSMessage): Promise<boolean> {
    try {
      const response = await api.post<boolean>('/settings/sms/test', message);
      return response.data;
    } catch (error: any) {
      console.error('Failed to send test SMS:', error);
      throw new Error(
        error.response?.data?.detail?.[0]?.msg || 
        'Failed to send test SMS. Please try again.'
      );
    }
  },

  // Send test bulk SMS
  async sendTestBulkSMS(bulkMessage: BulkSMSMessage): Promise<boolean> {
    try {
      const response = await api.post<boolean>('/settings/sms/test-bulk', bulkMessage);
      return response.data;
    } catch (error: any) {
      console.error('Failed to send test bulk SMS:', error);
      throw new Error(
        error.response?.data?.detail?.[0]?.msg || 
        'Failed to send test bulk SMS. Please try again.'
      );
    }
  }
};