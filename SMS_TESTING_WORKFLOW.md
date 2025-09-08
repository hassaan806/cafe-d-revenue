# Cafe D Revenue SMS Testing Workflow

This document outlines the steps to test all SMS notification features in the Cafe D Revenue system.

## Prerequisites

1. Ensure the backend server is running
2. Ensure the frontend application is running
3. Have a valid SMS.app API token
4. Have at least one Pakistani phone number for testing

## 1. Configure SMS Settings

1. Log in to the application as an administrator
2. Navigate to **Settings** > **SMS Settings**
3. Fill in the following fields:
   - **Enable SMS Notifications**: Toggle to ON
   - **SMS Provider**: Generic SMS API
   - **API Token**: Your SMS.app API token (e.g., `270|mCyIkLZIHgQLQwk8Wd8GAD55ipRtSmkxWzbeDaAG`)
   - **Sender ID**: `Cafe de Revenue`
4. Click **Save Settings**

## 2. Test SMS Configuration

### Single SMS Test
1. In the **Test SMS Configuration** section:
   - Enter a valid Pakistani phone number (e.g., `923331234567`)
   - Keep the default test message or enter your own
2. Click **Send Test SMS**
3. Verify you receive the SMS on the test phone

### Bulk SMS Test
1. In the **Bulk Test SMS Configuration** section:
   - Enter multiple phone numbers (up to 50)
   - Enter messages for each number
2. Click **Send Bulk Test SMS**
3. Verify all phones receive their respective SMS

## 3. Test Customer Registration SMS

1. Navigate to **Customer Management**
2. Click **Add Customer**
3. Fill in customer details:
   - **Name**: Test Customer
   - **Phone No.**: A valid Pakistani phone number
   - **Card Reference ID**: CARD001 (or leave empty for auto-generation)
4. Click **Add Customer**
5. Verify the customer receives an SMS with:
   ```
   Welcome to Cafe D Revenue! Your card CARD001 has been registered successfully. Current balance: PKR 0.00
   ```

## 4. Test Card Payment SMS

1. Navigate to **Sales POS**
2. Add items to the cart
3. Select a customer with a card
4. Choose **Card** as the payment method
5. Complete the sale
6. Verify the customer receives an SMS with:
   ```
   Thank you for your purchase at Cafe D Revenue! Items: [Item names and quantities]. Total: PKR [amount]. Your remaining balance: PKR [balance].
   ```

## 5. Test Pending Bill Settlement SMS

1. Navigate to **Pending Sales Management**
2. Select one or more pending sales
3. Choose **Card** as the payment method
4. Complete the settlement
5. Verify the customer receives an SMS with:
   ```
   Your pending bill #[ID] has been settled at Cafe D Revenue! Items: [Item names and quantities]. Total: PKR [amount]. Your remaining balance: PKR [balance].
   ```

## 6. Test Card Recharge SMS

1. Navigate to **Customer Management**
2. Find a customer and click the recharge icon
3. Enter a recharge amount
4. Complete the recharge
5. Verify the customer receives an SMS with:
   ```
   Your card at Cafe D Revenue has been recharged with PKR [amount]. New balance: PKR [balance].
   ```

## 7. Test Low Balance Alert SMS

1. Navigate to **Customer Management**
2. Find a customer with a high balance
3. Recharge their card with an amount that will bring their balance below 100 PKR
   - For example, if they have 500 PKR, recharge with -450 PKR (simulate a large purchase)
4. Verify the customer receives a low balance alert SMS with:
   ```
   Low balance alert: Your card balance is PKR [amount]. Please recharge soon.
   ```

## 8. Troubleshooting

### Common Issues

1. **SMS not sending**
   - Verify API token is correct
   - Check phone number format (should be 923XXXXXXXXX)
   - Ensure sender ID is exactly "Cafe de Revenue"
   - Check internet connection

2. **Invalid phone number format**
   - Pakistani numbers should start with 923
   - No spaces, dashes, or parentheses
   - Example: 923331234567

3. **API authentication errors**
   - Verify API token is valid and not expired
   - Check that the token is entered correctly (including the prefix like `270|`)

### Logs and Debugging

1. Check backend console for SMS sending logs
2. Look for error messages in the browser console
3. Verify network requests in browser developer tools

## 9. Expected SMS Formats

All SMS messages follow these formats:

1. **Registration**: 
   ```
   Welcome to Cafe D Revenue! Your card [CARD_ID] has been registered successfully. Current balance: PKR [amount]
   ```

2. **Card Payment**: 
   ```
   Thank you for your purchase at Cafe D Revenue! Items: [Item list]. Total: PKR [amount]. Your remaining balance: PKR [balance]
   ```

3. **Pending Bill Settlement**: 
   ```
   Your pending bill #[ID] has been settled at Cafe D Revenue! Items: [Item list]. Total: PKR [amount]. Your remaining balance: PKR [balance]
   ```

4. **Card Recharge**: 
   ```
   Your card at Cafe D Revenue has been recharged with PKR [amount]. New balance: PKR [balance]
   ```

5. **Low Balance Alert**: 
   ```
   Low balance alert: Your card balance is PKR [amount]. Please recharge soon.
   ```

## 10. Best Practices

1. Always test with real phone numbers you have access to
2. Keep track of balances to properly test low balance alerts
3. Test both single and bulk SMS functionality
4. Verify all phone number formats are correctly handled
5. Test error scenarios (invalid tokens, network issues, etc.)