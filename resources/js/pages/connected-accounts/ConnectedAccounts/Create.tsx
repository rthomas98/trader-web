import React, { useEffect, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Building, LockKeyhole, ShieldCheck } from 'lucide-react';

interface ConnectedAccountsCreateProps {
  link_token: string;
  wallets?: Array<{
    id: string;
    currency: string;
    balance: number;
  }>;
}

// Define a simplified type for Plaid metadata
type PlaidMetadata = {
  institution?: {
    name?: string;
    institution_id?: string;
  };
  accounts?: Array<{
    id?: string;
    name?: string;
    mask?: string;
    type?: string;
    subtype?: string;
  }>;
};

export default function ConnectedAccountsCreate({ link_token, wallets = [] }: ConnectedAccountsCreateProps) {
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdn.plaid.com/link/v2/stable/link-initialize.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const openPlaidLink = () => {
    if (!selectedWallet) {
      setError('Please select a wallet to connect to.');
      return;
    }

    // Use type assertion with unknown first to avoid direct any usage
    const windowWithPlaid = window as unknown as {
      Plaid?: {
        create: (config: unknown) => {
          open: () => void;
          exit: () => void;
        };
      };
    };

    if (!windowWithPlaid.Plaid) {
      setError('Plaid SDK not loaded. Please refresh the page and try again.');
      return;
    }

    const handleSuccess = (public_token: string, metadata: PlaidMetadata) => {
      setIsLoading(true);
      setError(null);

      // Extract only the properties we need for the API call
      const postData = {
        public_token,
        institution_id: metadata.institution?.institution_id || '',
        institution_name: metadata.institution?.name || '',
        // Convert accounts to a simpler format that can be sent via FormData
        accounts: JSON.stringify(metadata.accounts || []),
        wallet_id: selectedWallet,
      };

      router.post(route('connected-accounts.store'), postData, {
        onSuccess: () => {
          router.visit(route('connected-accounts.index'));
        },
        onError: (errors) => {
          setIsLoading(false);
          setError(errors.message || 'Failed to connect account. Please try again.');
        },
      });
    };

    const config = {
      token: link_token,
      onSuccess: handleSuccess,
      onExit: (err: unknown) => {
        if (err) {
          setError('Connection process was interrupted. Please try again.');
        }
      },
      onEvent: () => {
        // Track events if needed
      },
    };

    // Use the non-null assertion since we've checked for existence
    const plaidLink = windowWithPlaid.Plaid!.create(config as unknown);
    plaidLink.open();
  };

  return (
    <AppLayout>
      <Head title="Connect Bank Account" />
      <div className="py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
              Connect Bank Account
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.visit(route('connected-accounts.index'))}
            >
              Back to Connected Accounts
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Connect Your Bank Account</CardTitle>
                  <CardDescription>
                    Securely connect your bank account to fund your wallet
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {error && (
                    <Alert className="bg-red-50 border-red-200 text-red-800 dark:bg-red-950 dark:border-red-800 dark:text-red-300">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Select Wallet to Connect
                    </label>
                    {wallets.length > 0 ? (
                      <select
                        className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100"
                        value={selectedWallet || ''}
                        onChange={(e) => setSelectedWallet(e.target.value)}
                      >
                        <option value="">Select a wallet</option>
                        {wallets.map((wallet) => (
                          <option key={wallet.id} value={wallet.id}>
                            {wallet.currency} Wallet ({formatCurrency(wallet.balance)})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="p-4 bg-yellow-50 border border-yellow-200 text-yellow-800 dark:bg-yellow-950 dark:border-yellow-800 dark:text-yellow-300 rounded-md">
                        <p>You don't have any wallets yet. Please create a wallet first.</p>
                        <Button 
                          className="mt-2" 
                          variant="outline"
                          onClick={() => router.visit(route('wallets.create'))}
                        >
                          Create Wallet
                        </Button>
                      </div>
                    )}
                  </div>

                  {wallets.length > 0 && (
                    <Button
                      className="w-full"
                      onClick={openPlaidLink}
                      disabled={isLoading || !selectedWallet}
                    >
                      {isLoading ? 'Connecting...' : 'Connect Bank Account'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>

            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Security Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-full bg-gray-100 dark:bg-gray-700">
                      <ShieldCheck className="h-5 w-5 text-[#8D5EB7]" />
                    </div>
                    <div>
                      <h3 className="font-medium">Bank-Level Security</h3>
                      <p className="text-sm text-muted-foreground">
                        Your credentials are never stored on our servers
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-full bg-gray-100 dark:bg-gray-700">
                      <LockKeyhole className="h-5 w-5 text-[#8D5EB7]" />
                    </div>
                    <div>
                      <h3 className="font-medium">End-to-End Encryption</h3>
                      <p className="text-sm text-muted-foreground">
                        All data is encrypted during transmission
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-full bg-gray-100 dark:bg-gray-700">
                      <Building className="h-5 w-5 text-[#8D5EB7]" />
                    </div>
                    <div>
                      <h3 className="font-medium">Trusted by Banks</h3>
                      <p className="text-sm text-muted-foreground">
                        We use Plaid, trusted by major financial institutions
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}
