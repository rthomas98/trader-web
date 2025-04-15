<?php
// This script will update the handleDeposit function in the Onboarding component

// Path to the Onboarding component
$onboardingPath = __DIR__ . '/../resources/js/Pages/Onboarding/Index.tsx';

// Read the current file content
$content = file_get_contents($onboardingPath);

// The new handleDeposit function
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

// The old handleDeposit function pattern to match
$pattern = '/const handleDeposit = async \(\): Promise<void> => \{.*?setIsLoading\(false\);\s*\};\s*/s';

// Replace the old function with the new one
$updatedContent = preg_replace($pattern, $newHandleDeposit, $content);

// Check if the replacement was successful
if ($content !== $updatedContent) {
    // Create a backup of the original file
    file_put_contents($onboardingPath . '.bak', $content);
    
    // Write the updated content back to the file
    file_put_contents($onboardingPath, $updatedContent);
    
    echo "Success! The handleDeposit function has been updated.\n";
    echo "A backup of the original file has been saved to " . $onboardingPath . ".bak\n";
} else {
    echo "Error: Could not find and replace the handleDeposit function.\n";
}
