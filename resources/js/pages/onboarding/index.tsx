import React, { useState, useEffect } from 'react';
import { Head, useForm } from '@inertiajs/react';
import axios from 'axios';
import { usePlaidLink } from 'react-plaid-link';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { type BreadcrumbItem } from '@/types';
import { 
  CheckCircle, 
  ArrowRight, 
  Building, 
  DollarSign,
  CheckCheck,
  Loader2
} from 'lucide-react';

interface OnboardingProps {
  user: {
    id: number;
    name: string;
    email: string;
    onboarding_completed: boolean;
  };
  hasConnectedAccounts: boolean;
}

interface Step {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  content: React.ReactNode;
  completed: boolean;
}

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Onboarding',
    href: '/onboarding',
  },
];

export default function OnboardingIndex({ hasConnectedAccounts }: OnboardingProps) {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState<number>(hasConnectedAccounts ? 1 : 0);
  const [accountConnected, setAccountConnected] = useState<boolean>(hasConnectedAccounts);
  const [depositAmount, setDepositAmount] = useState<string>('1000');
  const [depositSuccess, setDepositSuccess] = useState<boolean>(false);
  const [depositError, setDepositError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  
  const { post } = useForm({
    amount: depositAmount,
  });

  useEffect(() => {
    if (!accountConnected) {
      fetchLinkToken();
    }
  }, [accountConnected]);

  const fetchLinkToken = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setApiError(null);
      
      // Get the CSRF token from the meta tag
      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
      
      const response = await axios.post('/onboarding/link-token', {}, {
        headers: {
          'X-CSRF-TOKEN': csrfToken,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        }
      });
      
      if (response.data.link_token) {
        setLinkToken(response.data.link_token);
      }
    } catch (error) {
      console.error('Error fetching link token:', error);
      setApiError('Failed to connect to Plaid. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlaidSuccess = (publicToken: string, metadata: any) => {
    exchangeToken(publicToken, metadata);
  };

  const exchangeToken = async (publicToken: string, metadata: any): Promise<void> => {
    try {
      setIsLoading(true);
      
      // Get the CSRF token from the meta tag
      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
      
      const response = await axios.post('/onboarding/exchange-token', {
        public_token: publicToken,
        metadata: metadata,
      }, {
        headers: {
          'X-CSRF-TOKEN': csrfToken,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        }
      });
      
      if (response.data.success) {
        setAccountConnected(true);
        setActiveStep(1);
      }
    } catch (error) {
      console.error('Error exchanging token:', error);
      setApiError('Failed to connect your account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Updated deposit handler to use the correct endpoint
  const handleDeposit = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setDepositError(null);
      
      // Get the CSRF token from the meta tag
      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
      
      // Using the correct endpoint from the route list
      const response = await axios.post('/onboarding/deposit', {
        amount: depositAmount,
      }, {
        headers: {
          'X-CSRF-TOKEN': csrfToken,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        }
      });
      
      if (response.data.success) {
        setDepositSuccess(true);
        setActiveStep(2);
      }
    } catch (error) {
      console.error('Error making deposit:', error);
      setDepositError('Failed to process your deposit. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = () => {
    post('/onboarding/complete');
  };

  const handleSkip = () => {
    setActiveStep(1);
  };

  // Configure Plaid Link
  const config = {
    token: linkToken,
    onSuccess: handlePlaidSuccess,
    onExit,
  };

  const { open, ready } = usePlaidLink(config);

  function onExit() {
    // Handle the case when a user exits the Plaid Link flow
  }

  const steps: Step[] = [
    {
      id: 0,
      title: 'Connect Bank',
      description: 'Connect your bank account to start trading',
      icon: <Building className="h-4 w-4" />,
      content: (
        <div className="flex flex-col items-center space-y-4">
          {apiError && (
            <div className="w-full p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-200 dark:text-red-800" role="alert">
              {apiError}
            </div>
          )}
          
          {!accountConnected ? (
            <div className="text-center">
              <p className="mb-4 text-muted-foreground">
                Connect your bank account to fund your trading account. We use Plaid to securely connect to your bank.
              </p>
              <Button 
                onClick={() => open()} 
                disabled={!ready || isLoading} 
                className="bg-[#8D5EB7] hover:bg-[#8D5EB7]/90 text-white"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  'Connect Bank Account'
                )}
              </Button>
            </div>
          ) : (
            <div className="text-center">
              <div className="flex items-center justify-center mb-4 text-green-500">
                <CheckCircle className="h-8 w-8" />
              </div>
              <p className="text-lg font-medium">Bank Account Connected</p>
              <p className="text-muted-foreground mt-2">
                Your bank account has been successfully connected. You can now proceed to make your initial deposit.
              </p>
            </div>
          )}
        </div>
      ),
      completed: accountConnected,
    },
    {
      id: 1,
      title: 'Initial Deposit',
      description: 'Make your first deposit to start trading',
      icon: <DollarSign className="h-4 w-4" />,
      content: (
        <div className="flex flex-col space-y-4">
          {depositError && (
            <div className="w-full p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-200 dark:text-red-800" role="alert">
              {depositError}
            </div>
          )}
          
          {!depositSuccess ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="depositAmount">Deposit Amount (USD)</Label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">$</span>
                  <Input
                    id="depositAmount"
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="pl-8"
                    placeholder="1000"
                    min="100"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Minimum deposit amount: $100
                </p>
              </div>
              
              <div className="pt-4">
                <Button 
                  onClick={handleDeposit} 
                  disabled={isLoading || parseFloat(depositAmount) < 100} 
                  className="w-full bg-[#8D5EB7] hover:bg-[#8D5EB7]/90 text-white"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Make Deposit'
                  )}
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center">
              <div className="flex items-center justify-center mb-4 text-green-500">
                <CheckCircle className="h-8 w-8" />
              </div>
              <p className="text-lg font-medium">Deposit Successful</p>
              <p className="text-muted-foreground mt-2">
                Your initial deposit of ${depositAmount} has been successfully processed. You can now complete your account setup.
              </p>
            </div>
          )}
        </div>
      ),
      completed: depositSuccess,
    },
    {
      id: 2,
      title: 'Complete Setup',
      description: 'Finalize your account setup',
      icon: <CheckCheck className="h-4 w-4" />,
      content: (
        <div className="text-center">
          <div className="flex items-center justify-center mb-4 text-green-500">
            <CheckCircle className="h-8 w-8" />
          </div>
          <p className="text-lg font-medium">You're All Set!</p>
          <p className="text-muted-foreground mt-2 mb-6">
            Your trading account has been successfully set up. You can now start trading.
          </p>
          <Button 
            onClick={handleComplete} 
            className="bg-[#8D5EB7] hover:bg-[#8D5EB7]/90 text-white"
          >
            Go to Dashboard
          </Button>
        </div>
      ),
      completed: false,
    },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Account Setup" />
      <div className="flex-1 flex items-center justify-center p-0 mt-0">
        {/* Main Card */}
        <Card className="w-full max-w-4xl shadow-md">
          <CardHeader className="border-b pb-3">
            <CardTitle className="text-xl">Welcome to Trader Pro</CardTitle>
            <CardDescription>Complete the following steps to set up your trading account</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Tabs 
              defaultValue={activeStep.toString()} 
              value={activeStep.toString()}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-3 mb-6">
                {steps.map((step) => (
                  <TabsTrigger 
                    key={step.id}
                    value={step.id.toString()}
                    onClick={() => {
                      // Only allow going back or to completed steps
                      if (step.id <= activeStep || step.completed) {
                        setActiveStep(step.id);
                      }
                    }}
                    disabled={step.id > activeStep && !step.completed}
                    className="flex items-center gap-2 py-3"
                  >
                    <div className={`flex h-6 w-6 items-center justify-center rounded-full ${step.completed ? 'bg-green-100 text-green-600' : step.id === activeStep ? 'bg-[#EECEE6] text-[#8D5EB7]' : 'bg-muted text-muted-foreground'}`}>
                      {step.completed ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        step.icon
                      )}
                    </div>
                    <span className="hidden md:inline">{step.title}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {steps.map((step) => (
                <TabsContent key={step.id} value={step.id.toString()}>
                  <Card className="border-0 shadow-none">
                    <CardHeader>
                      <CardTitle className="text-lg">{step.title}</CardTitle>
                      <CardDescription>{step.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                      {step.content}
                    </CardContent>
                    {step.id < steps.length - 1 && step.id === activeStep && (
                      <CardFooter className="flex justify-between border-t pt-6">
                        {step.id > 0 ? (
                          <Button 
                            variant="outline" 
                            onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
                          >
                            Back
                          </Button>
                        ) : (
                          <Button 
                            variant="outline" 
                            onClick={handleSkip}
                          >
                            Skip for Now
                          </Button>
                        )}
                        
                        {step.id === 0 ? (
                          <Button 
                            onClick={() => setActiveStep(activeStep + 1)}
                            disabled={!accountConnected}
                            className="bg-[#8D5EB7] hover:bg-[#8D5EB7]/90 text-white"
                          >
                            Continue <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        ) : (
                          <Button 
                            onClick={() => setActiveStep(activeStep + 1)}
                            disabled={step.id === 1 && !depositSuccess}
                            className="bg-[#8D5EB7] hover:bg-[#8D5EB7]/90 text-white"
                          >
                            Continue <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        )}
                      </CardFooter>
                    )}
                  </Card>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
