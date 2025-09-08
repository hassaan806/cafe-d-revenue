import requests
import os
from typing import Optional, List, Dict, Any
from ..core.config import settings

class SMSService:
    def __init__(self):
        # Initialize with default settings from environment
        self.api_token = settings.SMS_API_KEY
        self.sender_id = settings.SMS_SENDER_ID
        self.sms_url = settings.SMS_API_URL or "https://connect.smsapp.pk/api/v3"
        self.enabled = bool(self.api_token and self.sender_id and self.sms_url)
    
    def configure(self, api_token: str, sender_id: str, sms_url: str = None):
        """Configure SMS service with provided settings"""
        self.api_token = api_token
        self.sender_id = sender_id
        self.sms_url = sms_url or "https://connect.smsapp.pk/api/v3"
        self.enabled = bool(self.api_token and self.sender_id and self.sms_url)
    
    def send_sms(self, phone_number: str, message: str) -> bool:
        """
        Send SMS to a phone number using the SMS.app API
        Returns True if successful, False otherwise
        """
        if not self.enabled:
            print("SMS service not configured - skipping SMS send")
            return False
            
        if not phone_number or not message:
            print("Invalid phone number or message")
            return False
            
        try:
            # Format phone number (ensure it starts with 92 for Pakistan)
            formatted_phone = self._format_phone_number(phone_number)
            
            # Prepare headers
            headers = {
                "Accept": "application/json",
                "Authorization": f"Bearer {self.api_token}",
                "Content-Type": "application/json"
            }
            
            # Prepare SMS payload
            payload = {
                "recipient": formatted_phone,
                "sender_id": self.sender_id,
                "message": message
            }
            
            # Send SMS via API - Fixed URL construction to avoid double slashes
            url = f"{self.sms_url.rstrip('/')}/sms/send"
            print(f"Sending SMS to URL: {url}")  # Debug log
            print(f"Headers: {headers}")  # Debug log
            print(f"Payload: {payload}")  # Debug log
            
            response = requests.post(url, json=payload, headers=headers, timeout=30)
            
            # Check response
            print(f"Response Status Code: {response.status_code}")  # Debug log
            print(f"Response Headers: {response.headers}")  # Debug log
            print(f"Response Text: {response.text}")  # Debug log
            
            if response.status_code == 200:
                try:
                    result = response.json()
                    if result.get("status") == "success":
                        print(f"SMS sent successfully to {formatted_phone}")
                        return True
                    else:
                        print(f"Failed to send SMS: {result.get('message', 'Unknown error')}")
                        return False
                except ValueError:
                    print(f"Failed to parse JSON response: {response.text}")
                    return False
            else:
                print(f"Failed to send SMS. Status code: {response.status_code}")
                print(f"Response: {response.text}")
                # If it's a 404 error, provide more specific information
                if response.status_code == 404:
                    print("404 Error: The endpoint might not exist or there might be an issue with the URL construction")
                return False
                
        except requests.exceptions.RequestException as e:
            print(f"Network error sending SMS: {str(e)}")
            return False
        except Exception as e:
            print(f"Error sending SMS: {str(e)}")
            return False
    
    def send_bulk_sms(self, messages: List[Dict[str, Any]]) -> bool:
        """
        Send bulk SMS using the SMS.app API
        Each message should have 'contact', 'message', and 'type' keys
        Returns True if successful, False otherwise
        """
        if not self.enabled:
            print("SMS service not configured - skipping bulk SMS send")
            return False
            
        if not messages:
            print("No messages to send")
            return False
            
        try:
            # Prepare headers
            headers = {
                "Accept": "application/json",
                "Authorization": f"Bearer {self.api_token}",
                "Content-Type": "application/json"
            }
            
            # Prepare bulk SMS payload (max 50 contacts)
            payload = messages[:50]  # Limit to 50 messages
            
            # Send bulk SMS via API - Fixed URL construction to avoid double slashes
            url = f"{self.sms_url.rstrip('/')}/sms/send-bulk-messages"
            print(f"Sending bulk SMS to URL: {url}")  # Debug log
            print(f"Headers: {headers}")  # Debug log
            print(f"Payload: {payload}")  # Debug log
            
            response = requests.post(url, json=payload, headers=headers, timeout=30)
            
            # Check response
            print(f"Bulk SMS Response Status Code: {response.status_code}")  # Debug log
            print(f"Bulk SMS Response Headers: {response.headers}")  # Debug log
            print(f"Bulk SMS Response Text: {response.text}")  # Debug log
            
            if response.status_code == 200:
                try:
                    result = response.json()
                    if result.get("status") == "success":
                        print(f"Bulk SMS sent successfully for {len(payload)} messages")
                        return True
                    else:
                        print(f"Failed to send bulk SMS: {result.get('message', 'Unknown error')}")
                        return False
                except ValueError:
                    print(f"Failed to parse JSON response: {response.text}")
                    return False
            else:
                print(f"Failed to send bulk SMS. Status code: {response.status_code}")
                print(f"Response: {response.text}")
                # If it's a 404 error, provide more specific information
                if response.status_code == 404:
                    print("404 Error: The bulk SMS endpoint might not exist or there might be an issue with the URL construction")
                return False
                
        except requests.exceptions.RequestException as e:
            print(f"Network error sending bulk SMS: {str(e)}")
            return False
        except Exception as e:
            print(f"Error sending bulk SMS: {str(e)}")
            return False
    
    def _format_phone_number(self, phone_number: str) -> str:
        """
        Format phone number to international format for Pakistan
        """
        # Remove any spaces, dashes, or parentheses
        cleaned = ''.join(filter(str.isdigit, phone_number))
        
        # If it starts with 03, replace with 923
        if cleaned.startswith('03') and len(cleaned) == 11:
            return '92' + cleaned[1:]
        
        # If it starts with 3, add 92
        if cleaned.startswith('3') and len(cleaned) == 10:
            return '92' + cleaned
            
        # If it already starts with 923, return as is
        if cleaned.startswith('923') and len(cleaned) == 12:
            return cleaned
            
        # Default fallback - assume it's a Pakistani number
        return '92' + cleaned[-10:] if len(cleaned) >= 10 else cleaned

# Global SMS service instance
sms_service = SMSService()