#!/usr/bin/env python3
"""
Test script to send SMS to your personal number (03067286806) 
to verify SMS integration is working correctly
"""

import sys
import os

# Add the current directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.utils.sms import sms_service

def test_personal_sms():
    """Send test SMS to your personal number"""
    print("Sending test SMS to your personal number: 03067286806")
    
    # Format the phone number
    phone_number = "03067286806"
    formatted_phone = sms_service._format_phone_number(phone_number)
    print(f"Formatted phone number: {formatted_phone}")
    
    # Create a test message
    message = "SUCCESS! Your SMS integration is working correctly. - Cafe D Revenue System"
    
    # Send the SMS
    result = sms_service.send_sms(formatted_phone, message)
    
    if result:
        print("✅ SMS sent successfully!")
        print("Please check your phone for the test message.")
    else:
        print("❌ Failed to send SMS. Please check the logs above for details.")
    
    return result

def main():
    """Main test function"""
    print("Cafe D Revenue - Personal SMS Integration Test")
    print("=" * 50)
    
    # Test sending SMS to your personal number
    test_personal_sms()
    
    print("\nTest completed.")

if __name__ == "__main__":
    main()