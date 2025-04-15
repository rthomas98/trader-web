import React, { useState, useEffect, useCallback } from 'react';
import { Head, router } from '@inertiajs/react'; 
import AppLayout from '@/layouts/app-layout'; 
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { usePlaidLink, PlaidLinkOnSuccessMetadata, PlaidLinkError, PlaidLinkOnExitMetadata } from 'react-plaid-link';
import axios from 'axios';
import { Loader2, AlertCircle, Banknote, XCircle, CheckCircle } from 'lucide-react'; 

interface ConnectedAccount {
  id: string;
  institution_name: string;
  account_name: string;
  mask: string | null;
  status: string;
}

interface ConnectedAccountsIndexProps {
  connectedAccounts: ConnectedAccount[];
}

export default function ConnectedAccountsIndex({ connectedAccounts }: ConnectedAccountsIndexProps) { 
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [connectionSuccess, setConnectionSuccess] = useState<boolean>(false);

  const fetchLinkToken = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setApiError(null);
      setConnectionSuccess(false);
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
      setApiError('Failed to initialize connection service. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const exchangeToken = useCallback(async (publicToken: string, metadata: PlaidLinkOnSuccessMetadata): Promise<void> => {
    try {
      setIsLoading(true);
      setApiError(null);
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
        console.log('Account connected successfully!');
        setConnectionSuccess(true);
        router.reload({ only: ['connectedAccounts'] });
      } else {
        setApiError(response.data.message || 'Failed to link account. Please try again.');
      }
    } catch (error) {
      console.error('Error exchanging token:', error);
      setApiError('Failed to connect your account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handlePlaidSuccess = useCallback((publicToken: string, metadata: PlaidLinkOnSuccessMetadata) => {
    exchangeToken(publicToken, metadata);
  }, [exchangeToken]);

  useEffect(() => {
    fetchLinkToken();
  }, [fetchLinkToken]);

  const config = {
    token: linkToken,
    onSuccess: handlePlaidSuccess,
    onExit: (err: PlaidLinkError | null, metadata: PlaidLinkOnExitMetadata) => {
      console.log('Plaid Link exited. Error:', err, 'Metadata:', metadata);
    },
  };
  const { open, ready } = usePlaidLink(config);

  const handleRemoveAccount = (accountId: string) => {
    if (confirm('Are you sure you want to remove this account?')) {
      router.delete(route('connected-accounts.destroy', accountId), {
        preserveScroll: true,
        onSuccess: () => console.log('Account removed'),
        onError: (errors) => console.error('Error removing account:', errors),
      });
    }
  };

  return (
    <AppLayout>
      <Head title="Manage Bank Accounts" />

      <div className="py-12">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <Card>
            <CardHeader>
              <CardTitle>Manage Connected Bank Accounts</CardTitle>
              <CardDescription>
                View, add, or remove your linked bank accounts.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6"> 
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Your Connected Accounts</h3>
                {connectedAccounts.length > 0 ? (
                  <ul className="divide-y divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-700 rounded-md">
                    {connectedAccounts.map((account) => (
                      <li key={account.id} className="px-4 py-4 flex items-center justify-between sm:px-6">
                        <div className="flex items-center space-x-4">
                          <Banknote className="h-6 w-6 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                              {account.institution_name} - {account.account_name}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Account ending in {account.mask} • <span className={`capitalize ${account.status === 'ACTIVE' ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>{account.status.toLowerCase()}</span>
                            </p>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                          onClick={() => handleRemoveAccount(account.id)} 
                          aria-label={`Remove account ${account.account_name} ending in ${account.mask}`}
                        >
                          <XCircle className="h-5 w-5" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-700/50 text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      You haven't connected any bank accounts yet.
                    </p>
                  </div>
                )}
              </div>

              {apiError && (
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-600 p-3 rounded-md bg-red-50 dark:bg-red-900/30">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <p>{apiError}</p>
                </div>
              )}

              {connectionSuccess && (
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400 border border-green-300 dark:border-green-600 p-3 rounded-md bg-green-50 dark:bg-green-900/30">
                  <CheckCircle className="h-5 w-5 flex-shrink-0" /> 
                  <p>Account connected successfully! The list has been updated.</p>
                </div>
              )}

              <Button 
                onClick={() => open()}
                disabled={!ready || isLoading || !linkToken} 
                className="w-full sm:w-auto"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? 'Initializing...' : (ready && linkToken ? 'Connect New Bank Account' : 'Loading Connection...')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
