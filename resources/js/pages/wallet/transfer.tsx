import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { Wallet } from '@/types';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { FormError } from '@/components/form-error';
import { formatCurrency } from '@/utils';
import { AlertCircle, ArrowLeftRight, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface WalletTransferProps {
  wallets: Wallet[];
  fromWalletId?: string;
}

export default function WalletTransfer({ wallets, fromWalletId }: WalletTransferProps) {
  const [fromWallet, setFromWallet] = useState<Wallet | null>(
    fromWalletId ? wallets.find(wallet => wallet.id === fromWalletId) || null : null
  );
  
  const [toWallet, setToWallet] = useState<Wallet | null>(null);

  const { data, setData, post, processing, errors } = useForm({
    from_wallet_id: fromWalletId || '',
    to_wallet_id: '',
    amount: '',
    description: 'Transfer between wallets',
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('wallets.store-transfer'));
  };

  const handleFromWalletChange = (walletId: string) => {
    const wallet = wallets.find(w => w.id === walletId) || null;
    setFromWallet(wallet);
    setData('from_wallet_id', walletId);
    
    // If the selected "to" wallet is the same as the new "from" wallet, reset it
    if (data.to_wallet_id === walletId) {
      setData('to_wallet_id', '');
      setToWallet(null);
    }
  };

  const handleToWalletChange = (walletId: string) => {
    const wallet = wallets.find(w => w.id === walletId) || null;
    setToWallet(wallet);
    setData('to_wallet_id', walletId);
  };

  // Filter wallets with available balance for the "from" wallet
  const walletsWithBalance = wallets.filter(wallet => wallet.available_balance > 0);
  
  // Filter wallets for the "to" wallet (exclude the selected "from" wallet)
  const eligibleToWallets = wallets.filter(wallet => wallet.id !== data.from_wallet_id);

  // Check if we have compatible wallets for transfer (same currency type)
  const getCompatibleWallets = (fromWalletId: string) => {
    const sourceWallet = wallets.find(w => w.id === fromWalletId);
    if (!sourceWallet) return [];
    
    return wallets.filter(w => 
      w.id !== fromWalletId && 
      w.currency_type === sourceWallet.currency_type
    );
  };

  const compatibleWallets = data.from_wallet_id ? getCompatibleWallets(data.from_wallet_id) : [];
  const hasCompatibleWallets = compatibleWallets.length > 0;

  return (
    <AppLayout
      title="Transfer Funds"
      renderHeader={() => (
        <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">
          Transfer Funds
        </h2>
      )}
    >
      <Head title="Transfer Funds" />

      <div className="py-12">
        <div className="max-w-3xl mx-auto sm:px-6 lg:px-8">
          {walletsWithBalance.length === 0 && (
            <Alert variant="warning" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No Available Funds</AlertTitle>
              <AlertDescription>
                You don't have any wallets with available funds to transfer.
              </AlertDescription>
            </Alert>
          )}

          {walletsWithBalance.length > 0 && !hasCompatibleWallets && data.from_wallet_id && (
            <Alert variant="warning" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No Compatible Wallets</AlertTitle>
              <AlertDescription>
                You don't have any compatible wallets to transfer to. Transfers can only be made between wallets of the same currency type.
              </AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowLeftRight className="h-5 w-5" />
                Transfer Between Wallets
              </CardTitle>
              <CardDescription>
                Move funds between your wallets of the same currency type.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="from_wallet_id">From Wallet</Label>
                  <Select
                    value={data.from_wallet_id}
                    onValueChange={handleFromWalletChange}
                    disabled={processing || walletsWithBalance.length === 0}
                  >
                    <SelectTrigger id="from_wallet_id">
                      <SelectValue placeholder="Select source wallet" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="" disabled>Select source wallet</SelectItem>
                      {walletsWithBalance.map((wallet) => (
                        <SelectItem key={wallet.id} value={wallet.id}>
                          {wallet.currency} Wallet {wallet.is_default && '(Default)'} - {formatCurrency(wallet.available_balance)} available
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fromWallet && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Available balance: {formatCurrency(fromWallet.available_balance)}
                    </p>
                  )}
                  <FormError message={errors.from_wallet_id} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="to_wallet_id">To Wallet</Label>
                  <Select
                    value={data.to_wallet_id}
                    onValueChange={handleToWalletChange}
                    disabled={processing || !data.from_wallet_id || !hasCompatibleWallets}
                  >
                    <SelectTrigger id="to_wallet_id">
                      <SelectValue placeholder="Select destination wallet" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="" disabled>Select destination wallet</SelectItem>
                      {compatibleWallets.map((wallet) => (
                        <SelectItem key={wallet.id} value={wallet.id}>
                          {wallet.currency} Wallet {wallet.is_default && '(Default)'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {toWallet && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Current balance: {formatCurrency(toWallet.balance)}
                    </p>
                  )}
                  <FormError message={errors.to_wallet_id} />
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
                      max={fromWallet?.available_balance || 0}
                      className="pl-8"
                      value={data.amount}
                      onChange={(e) => setData('amount', e.target.value)}
                      disabled={processing || !fromWallet}
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
                  <AlertTitle>Instant Transfer</AlertTitle>
                  <AlertDescription>
                    Transfers between wallets are processed instantly with no fees.
                  </AlertDescription>
                </Alert>
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
                <Button 
                  type="submit" 
                  disabled={
                    processing || 
                    !data.from_wallet_id || 
                    !data.to_wallet_id || 
                    !data.amount ||
                    !hasCompatibleWallets
                  }
                >
                  Transfer Funds
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
