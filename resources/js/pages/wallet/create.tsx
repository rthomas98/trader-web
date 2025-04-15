import React from 'react';
import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Toggle } from '@/components/ui/toggle';
import { FormError } from '@/components/FormError';

// Define form data type
interface WalletFormData {
  currency: string;
  currency_type: 'FIAT' | 'CRYPTO';
  balance: string; // Using string for form input
  is_default: boolean;
  [key: string]: any; // Change 'unknown' to 'any' here
}

export default function WalletCreate() {
  const { data, setData, post, processing, errors } = useForm<WalletFormData>({
    currency: 'USD',
    currency_type: 'FIAT',
    balance: '0',
    is_default: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('wallets.store'));
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
      title="Create Wallet"
      renderHeader={() => (
        <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">
          Create Wallet
        </h2>
      )}
    >
      <Head title="Create Wallet" />

      <div className="py-12">
        <div className="max-w-3xl mx-auto sm:px-6 lg:px-8">
          <Card className="bg-white dark:bg-gray-800">
            <CardHeader>
              <CardTitle>Create New Wallet</CardTitle>
              <CardDescription>
                Create a new wallet to manage your funds
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={data.currency}
                    onValueChange={(value) => {
                      const selectedCurrency = currencyOptions.find(option => option.value === value);
                      setData({
                        ...data,
                        currency: value,
                        currency_type: selectedCurrency?.type as 'FIAT' | 'CRYPTO'
                      });
                    }}
                  >
                    <SelectTrigger id="currency">
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {currencyOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormError message={errors.currency} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency_type">Currency Type</Label>
                  <Select
                    value={data.currency_type}
                    onValueChange={(value) => setData('currency_type', value as 'FIAT' | 'CRYPTO')}
                    disabled
                  >
                    <SelectTrigger id="currency_type">
                      <SelectValue placeholder="Select currency type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FIAT">Fiat Currency</SelectItem>
                      <SelectItem value="CRYPTO">Cryptocurrency</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    Currency type is automatically set based on the selected currency
                  </p>
                  <FormError message={errors.currency_type} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="balance">Initial Balance</Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <span className="text-gray-500 dark:text-gray-400">$</span>
                    </div>
                    <Input
                      id="balance"
                      type="number"
                      step="0.01"
                      min="0"
                      className="pl-8"
                      value={data.balance}
                      onChange={(e) => setData('balance', e.target.value)}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    You can fund your wallet later through deposits
                  </p>
                  <FormError message={errors.balance} />
                </div>

                <div className="flex items-center space-x-2">
                  <Toggle
                    id="is_default"
                    pressed={data.is_default}
                    onPressedChange={(pressed) => setData('is_default', pressed)}
                  >
                    <span className="sr-only">Set as default wallet</span>
                  </Toggle>
                  <Label htmlFor="is_default">Set as default wallet</Label>
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
                  Create Wallet
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
