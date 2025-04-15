import React from 'react';
import { Head, useForm } from '@inertiajs/react';
import { Wallet } from '@/types';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { FormError } from '@/components/form-error';

interface WalletEditProps {
  wallet: Wallet;
}

export default function WalletEdit({ wallet }: WalletEditProps) {
  const { data, setData, patch, processing, errors } = useForm({
    currency: wallet.currency,
    is_default: wallet.is_default,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    patch(route('wallets.update', wallet.id));
  };

  const currencyOptions = [
    { value: 'USD', label: 'US Dollar (USD)', type: 'FIAT' },
    { value: 'EUR', label: 'Euro (EUR)', type: 'FIAT' },
    { value: 'GBP', label: 'British Pound (GBP)', type: 'FIAT' },
    { value: 'JPY', label: 'Japanese Yen (JPY)', type: 'FIAT' },
    { value: 'CAD', label: 'Canadian Dollar (CAD)', type: 'FIAT' },
    { value: 'AUD', label: 'Australian Dollar (AUD)', type: 'FIAT' },
    { value: 'BTC', label: 'Bitcoin (BTC)', type: 'CRYPTO' },
    { value: 'ETH', label: 'Ethereum (ETH)', type: 'CRYPTO' },
    { value: 'USDT', label: 'Tether (USDT)', type: 'CRYPTO' },
    { value: 'SOL', label: 'Solana (SOL)', type: 'CRYPTO' },
  ];

  return (
    <AppLayout
      renderHeader={() => (
        <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">
          Edit Wallet
        </h2>
      )}
    >
      <Head title="Edit Wallet" />

      <div className="py-12">
        <div className="max-w-3xl mx-auto sm:px-6 lg:px-8">
          <Card className="bg-white dark:bg-gray-800">
            <CardHeader>
              <CardTitle>Edit Wallet</CardTitle>
              <CardDescription>
                Update your wallet settings
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={data.currency}
                    onValueChange={(value) => setData('currency', value)}
                    disabled={wallet.balance > 0}
                  >
                    <SelectTrigger id="currency">
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Removed the problematic SelectItem with empty value */}
                      {currencyOptions
                        .filter(option => option.type === wallet.currency_type)
                        .map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))
                      }
                    </SelectContent>
                  </Select>
                  {wallet.balance > 0 && (
                    <p className="text-sm text-muted-foreground">
                      Currency cannot be changed for wallets with a balance
                    </p>
                  )}
                  <FormError message={errors.currency} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency_type">Currency Type</Label>
                  <Input
                    id="currency_type"
                    value={wallet.currency_type}
                    disabled
                  />
                  <p className="text-sm text-muted-foreground">
                    Currency type cannot be changed
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="balance">Current Balance</Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <span className="text-gray-500 dark:text-gray-400">$</span>
                    </div>
                    <Input
                      id="balance"
                      value={wallet.balance}
                      className="pl-8"
                      disabled
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Balance can only be changed through deposits and withdrawals
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_default"
                    checked={data.is_default}
                    onCheckedChange={(checked) => setData('is_default', checked)}
                    disabled={data.is_default}
                  />
                  <Label htmlFor="is_default">Set as default wallet</Label>
                  {data.is_default && (
                    <p className="text-sm text-muted-foreground ml-2">
                      Default wallet cannot be unset
                    </p>
                  )}
                  <FormError message={errors.is_default} />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => window.history.back()}
                  disabled={processing}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={processing}>
                  Update Wallet
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
