/**
 * Debug script for testing deposit functionality
 * Run this in the browser console to test the deposit API directly
 */

async function testDeposit() {
  try {
    console.log('Starting test deposit...');
    
    // Get the CSRF token from the meta tag
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
    console.log('CSRF Token:', csrfToken);
    
    // Make the deposit request
    const amount = 100; // Test with $100
    console.log('Making deposit request with amount:', amount);
    
    const response = await fetch('/funding/deposit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-CSRF-TOKEN': csrfToken
      },
      body: JSON.stringify({ amount })
    });
    
    // Log the raw response
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    
    // Parse the JSON response
    const data = await response.json();
    console.log('Response data:', data);
    
    if (data.success) {
      console.log('Deposit successful!');
      console.log('Transaction ID:', data.transaction.id);
      console.log('New wallet balance:', data.wallet.balance);
    } else {
      console.error('Deposit failed:', data.message);
    }
    
    return data;
  } catch (error) {
    console.error('Error in test deposit:', error);
    return { success: false, error: error.message };
  }
}

// Usage instructions:
// 1. Open the browser console on the onboarding page
// 2. Copy and paste this entire script
// 3. Run the testDeposit() function
// 4. Check the console for detailed logs
