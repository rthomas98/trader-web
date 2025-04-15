import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { ConnectedAccount, Wallet } from '@/types';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { FormError } from '@/components/FormError';
import { formatCurrency } from '@/utils';
import { AlertCircle, ArrowDownLeft, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface CreateDepositProps {
  connectedAccounts: ConnectedAccount[];
  wallets: Wallet[];
  preSelectedWalletId?: string;
  preSelectedConnectedAccountId?: string;
}

export default function CreateDeposit({ 
  connectedAccounts, 
  wallets,
  preSelectedWalletId,
  preSelectedConnectedAccountId
}: CreateDepositProps) {
  const [selectedAccount, setSelectedAccount] = useState<ConnectedAccount | null>(
    preSelectedConnectedAccountId 
      ? connectedAccounts.find(account => account.id === preSelectedConnectedAccountId) || null
      : null
  );

  const { data, setData, post, processing, errors } = useForm({
    connected_account_id: preSelectedConnectedAccountId || '',
    wallet_id: preSelectedWalletId || '',
    amount: '',
    description: 'Deposit from bank account',
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('funding.deposit.store'));
  };

  const handleAccountChange = (accountId: string) => {
    const account = connectedAccounts.find(a => a.id === accountId) || null;
    setSelectedAccount(account);
    setData('connected_account_id', accountId);
  };

  // Filter only active and verified accounts
  const activeAccounts = connectedAccounts.filter(
    account => account.status === 'ACTIVE' && account.is_verified
  );

  return (
    <AppLayout
      renderHeader={() => (
        <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">
          Deposit Funds
        </h2>
      )}
    >
      <Head title="Deposit Funds" />

      <div className="py-12">
        <div className="max-w-3xl mx-auto sm:px-6 lg:px-8">
          {activeAccounts.length === 0 && (
            <Alert variant="warning" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No Verified Accounts</AlertTitle>
              <AlertDescription>
                You need to connect and verify a bank account before you can make a deposit.
                <Button 
                  variant="link" 
                  className="p-0 h-auto ml-1"
                  onClick={() => window.location.href = route('connected-accounts.create')}
                >
                  Connect a bank account
                </Button>
              </AlertDescription>
            </Alert>
          )}

          <Card className="bg-white dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center">
                <ArrowDownLeft className="mr-2 h-5 w-5 text-green-500" />
                Deposit Funds
              </CardTitle>
              <CardDescription>
                Transfer money from your bank account to your wallet
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="connected_account_id">From Bank Account</Label>
                  <Select
                    value={data.connected_account_id}
                    onValueChange={handleAccountChange}
                    disabled={processing || activeAccounts.length === 0}
                  >
                    <SelectTrigger id="connected_account_id">
                      <SelectValue placeholder="Select bank account" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeAccounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.institution_name} - {account.mask ? `****${account.mask}` : account.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedAccount && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Available balance: {formatCurrency(selectedAccount.available_balance)}
                    </p>
                  )}
                  <FormError message={errors.connected_account_id} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="wallet_id">To Wallet</Label>
                  <Select
                    value={data.wallet_id}
                    onValueChange={(value) => setData('wallet_id', value)}
                    disabled={processing}
                  >
                    <SelectTrigger id="wallet_id">
                      <SelectValue placeholder="Select wallet" />
                    </SelectTrigger>
                    <SelectContent>
                      {wallets.map((wallet) => (
                        <SelectItem key={wallet.id} value={wallet.id}>
                          {wallet.currency} Wallet {wallet.is_default && '(Default)'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormError message={errors.wallet_id} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <span className="text-gray-500 dark:text-gray-400">$</span>
                    </div>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="1"
                      className="pl-8"
                      value={data.amount}
                      onChange={(e) => setData('amount', e.target.value)}
                      disabled={processing}
                    />
                  </div>
                  <FormError message={errors.amount} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={data.description}
                    onChange={(e) => setData('description', e.target.value)}
                    disabled={processing}
                  />
                  <FormError message={errors.description} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={data.notes}
                    onChange={(e) => setData('notes', e.target.value)}
                    disabled={processing}
                    placeholder="Add any additional notes here"
                  />
                  <FormError message={errors.notes} />
                </div>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Processing Time</AlertTitle>
                  <AlertDescription>
                    Deposits typically take 1-3 business days to process through the ACH network.
                  </AlertDescription>
                </Alert>
              </CardContent>
              <CardFooter className="flex justify-between mt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => window.history.back()}
                  disabled={processing}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={processing || activeAccounts.length === 0}
                >
                  Deposit Funds
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
