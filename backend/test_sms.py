#!/usr/bin/env python3
"""
Test script for SMS integration with SMS.app API
"""

import sys
import os

# Add the current directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.utils.sms import sms_service
from app.core.config import settings

def test_sms_configuration():
    """Test SMS service configuration"""
    print("Testing SMS Service Configuration...")
    print(f"API Token: {settings.SMS_API_KEY[:10]}..." if settings.SMS_API_KEY else "Not set")
    print(f"Sender ID: {settings.SMS_SENDER_ID}")
    print(f"API URL: {settings.SMS_API_URL}")
    print(f"Service Enabled: {sms_service.enabled}")
    print()

def test_url_construction():
    """Test URL construction for SMS endpoints"""
    print("Testing URL Construction...")
    base_url = settings.SMS_API_URL or "https://connect.smsapp.pk/api/v3"
    single_sms_url = f"{base_url.rstrip('/')}/sms/send"
    bulk_sms_url = f"{base_url.rstrip('/')}/sms/send-bulk-messages"
    print(f"Base URL: {base_url}")
    print(f"Single SMS URL: {single_sms_url}")
    print(f"Bulk SMS URL: {bulk_sms_url}")
    print()

def test_phone_formatting():
    """Test phone number formatting"""
    print("Testing Phone Number Formatting...")
    test_numbers = [
        "03331234567",
        "3331234567",
        "923331234567",
        "+923331234567",
        "333-1234567",
        "0333 1234567"
    ]
    
    for number in test_numbers:
        formatted = sms_service._format_phone_number(number)
        print(f"Original: {number:>15} -> Formatted: {formatted}")
    print()

def test_single_sms_with_debug(phone_number: str = "923331234567"):
    """Test sending a single SMS with detailed debugging"""
    print("Testing Single SMS with Debug Information...")
    message = "This is a test message from Cafe D Revenue system."
    print(f"Phone Number: {phone_number}")
    print(f"Message: {message}")
    result = sms_service.send_sms(phone_number, message)
    print(f"SMS sent to {phone_number}: {'SUCCESS' if result else 'FAILED'}")
    print()

def test_all_sms_scenarios():
    """Test all SMS scenarios that might cause a 404 error"""
    print("Testing All SMS Scenarios...")
    
    # Test 1: Regular sale payment SMS (like the one causing 404)
    print("Test 1: Sale Payment SMS")
    payment_message = "DEBIT\nCafe D Revenue\nPKR 120.00\nBal: PKR 880.00\nProduct x2"
    result = sms_service.send_sms("923331234567", payment_message)
    print(f"Payment SMS: {'SUCCESS' if result else 'FAILED'}")
    print()
    
    # Test 2: Settlement SMS
    print("Test 2: Settlement SMS")
    settlement_message = "DEBIT\nCafe D Revenue\nBill #123 Settled\nPKR 120.00\nBal: PKR 880.00\nProduct x2"
    result = sms_service.send_sms("923331234567", settlement_message)
    print(f"Settlement SMS: {'SUCCESS' if result else 'FAILED'}")
    print()
    
    # Test 3: Registration SMS
    print("Test 3: Registration SMS")
    registration_message = "WELCOME\nCafe D Revenue\nCard: 1234567890\nBal: PKR 1000.00\nThank you for registering!"
    result = sms_service.send_sms("923331234567", registration_message)
    print(f"Registration SMS: {'SUCCESS' if result else 'FAILED'}")
    print()
    
    # Test 4: Recharge SMS
    print("Test 4: Recharge SMS")
    recharge_message = "CREDIT\nCafe D Revenue\nPKR 500.00\nBal: PKR 1500.00\nRecharge successful!"
    result = sms_service.send_sms("923331234567", recharge_message)
    print(f"Recharge SMS: {'SUCCESS' if result else 'FAILED'}")
    print()
    
    # Test 5: Low balance alert SMS
    print("Test 5: Low Balance Alert SMS")
    low_balance_message = "LOW BALANCE ALERT\nCafe D Revenue\nCurrent Bal: PKR 80.00\nPlease recharge your card soon."
    result = sms_service.send_sms("923331234567", low_balance_message)
    print(f"Low Balance SMS: {'SUCCESS' if result else 'FAILED'}")
    print()

def main():
    """Main test function"""
    print("Cafe D Revenue SMS Integration Test")
    print("=" * 40)
    
    # Test configuration
    test_sms_configuration()
    
    # Test URL construction
    test_url_construction()
    
    # Test phone formatting
    test_phone_formatting()
    
    # Test all SMS scenarios
    test_all_sms_scenarios()
    
    # Test single SMS with debug (uncomment to test)
    # test_single_sms_with_debug()
    
    print("Test completed.")

if __name__ == "__main__":
    main()