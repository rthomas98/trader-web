<?php
// This script updates only the handleDeposit function in the Onboarding component

$file = __DIR__ . '/../resources/js/Pages/Onboarding/Index.tsx';

// Read the file content
$content = file_get_contents($file);

// Define the new handleDeposit function
$newHandleDeposit = <<<'EOD'
  const handleDeposit = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setDepositError(null);
      
      // Get the CSRF token from the meta tag
      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
      
      console.log('Starting deposit process with amount:', depositAmount);
      
      // Use the new simplified deposit endpoint
      const response = await axios.post('/funding/simple-deposit', {
        amount: parseFloat(depositAmount),
      }, {
        headers: {
          'X-CSRF-TOKEN': csrfToken,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        }
      });
      
      console.log('Deposit response:', response.data);
      
      if (response.data.success) {
        console.log('Deposit successful!');
        setDepositSuccess(true);
        setActiveStep(2);
      } else {
        console.error('Deposit failed:', response.data.message);
        setDepositError(response.data.message || 'Failed to process deposit');
      }
    } catch (error) {
      console.error('Error processing deposit:', error);
      
      // Extract error message from the response if available
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'An unexpected error occurred';
      
      console.error('Error details:', errorMessage);
      
      // Show the error message to the user
      setDepositError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
EOD;

// Find the handleDeposit function in the file
$pattern = '/const handleDeposit = async \(\): Promise<void> => \{[\s\S]*?setIsLoading\(false\);\s*\};/';

// Replace the old function with the new one
$newContent = preg_replace($pattern, $newHandleDeposit, $content);

// Check if the replacement was successful
if ($content !== $newContent) {
    // Create a backup of the original file
    file_put_contents($file . '.bak3', $content);
    
    // Write the updated content back to the file
    file_put_contents($file, $newContent);
    
    echo "Success! The handleDeposit function has been updated.\n";
    echo "A backup of the original file has been saved to " . $file . ".bak3\n";
} else {
    echo "Error: Could not find and replace the handleDeposit function.\n";
}
