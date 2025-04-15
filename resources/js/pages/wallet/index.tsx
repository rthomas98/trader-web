import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { formatCurrency } from '@/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Plus, ArrowUpRight, ArrowDownLeft, CreditCard } from 'lucide-react';
import { Wallet, WalletTransaction } from '@/types';

interface WalletIndexProps {
  wallets: Wallet[];
}

export default function WalletIndex({ wallets }: WalletIndexProps) {
  const [activeTab, setActiveTab] = useState('wallets');

  const handleDeposit = (id: string) => {
    router.visit(route('funding.deposit.create', { wallet_id: id }));
  };

  const handleWithdraw = (id: string) => {
    router.visit(route('funding.withdrawal.create', { wallet_id: id }));
  };

  return (
    <AppLayout>
      <Head title="Wallets" />

      <div className="py-12">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <div className="mb-6 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Your Wallets</h1>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => router.visit(route('connected-accounts.index'))}>
                <CreditCard className="mr-2 h-4 w-4" />
                Manage Bank Accounts
              </Button>
              <Button onClick={() => router.visit(route('wallets.create'))}>
                <Plus className="mr-2 h-4 w-4" />
                New Wallet
              </Button>
            </div>
          </div>

          <Tabs defaultValue="wallets" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full md:w-[400px] grid-cols-2">
              <TabsTrigger value="wallets">My Wallets</TabsTrigger>
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
            </TabsList>

            <TabsContent value="wallets" className="mt-6">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {wallets.map((wallet) => (
                  <Card key={wallet.id} className="bg-white dark:bg-gray-800">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between">
                        <CardDescription>
                          {wallet.is_default && (
                            <Badge className="mr-2 bg-[#8D5EB7] text-white">Default</Badge>
                          )}
                          {wallet.currency}
                        </CardDescription>
                        <Badge variant="outline" className="bg-[#EECEE6] text-[#1A161D]">
                          {wallet.currency_type}
                        </Badge>
                      </div>
                      <CardTitle className="text-2xl flex items-center">
                        {formatCurrency(wallet.balance)}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-muted-foreground">
                        <div className="flex justify-between py-1">
                          <span>Available:</span>
                          <span className="font-medium text-foreground">
                            {formatCurrency(wallet.available_balance)}
                          </span>
                        </div>
                        <div className="flex justify-between py-1">
                          <span>Locked:</span>
                          <span className="font-medium text-foreground">
                            {formatCurrency(wallet.locked_balance)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => router.visit(route('wallets.show', wallet.id))}
                      >
                        Details
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => handleDeposit(wallet.id)}
                      >
                        <ArrowDownLeft className="mr-1 h-3 w-3" /> Deposit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => handleWithdraw(wallet.id)}
                      >
                        <ArrowUpRight className="mr-1 h-3 w-3" /> Withdraw
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="transactions" className="mt-6">
              <Card className="bg-white dark:bg-gray-800">
                <CardHeader>
                  <CardTitle>Recent Transactions</CardTitle>
                  <CardDescription>
                    Your recent wallet transactions across all accounts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {wallets.flatMap(wallet => 
                      wallet.transactions?.slice(0, 3).map((transaction: WalletTransaction) => (
                        <div 
                          key={transaction.id} 
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                          <div className="flex items-start sm:items-center gap-3 mb-2 sm:mb-0">
                            <div className="flex-shrink-0 p-2 rounded-full bg-gray-100 dark:bg-gray-700">
                              {transaction.transaction_type === 'DEPOSIT' ? (
                                <ArrowDownLeft className="h-4 w-4 text-green-500" />
                              ) : (
                                <ArrowUpRight className="h-4 w-4 text-red-500" />
                              )}
                            </div>
                            <div>
                              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                                <p className="font-medium">{transaction.description}</p>
                                <div className={`px-2 py-1 text-xs rounded-full ${
                                  transaction.status === 'COMPLETED' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                  transaction.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                                  transaction.status === 'FAILED' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                                  'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                                }`}>
                                  {transaction.status}
                                </div>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {new Date(transaction.created_at).toLocaleString()} • {wallet.currency}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-lg font-semibold ${
                              transaction.transaction_type === 'DEPOSIT' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                            }`}>
                              {transaction.transaction_type === 'DEPOSIT' ? '+' : '-'}
                              {formatCurrency(transaction.amount)}
                            </p>
                            {transaction.fee > 0 && (
                              <p className="text-sm text-muted-foreground">
                                Fee: {formatCurrency(transaction.fee)}
                              </p>
                            )}
                          </div>
                        </div>
                      )) || []
                    )}
                  </div>
                  
                  {wallets.every(wallet => !wallet.transactions || wallet.transactions.length === 0) && (
                    <div className="text-center py-8 text-muted-foreground">
                      No transactions found
                    </div>
                  )}
                  
                  <div className="mt-6 text-center">
                    <Button 
                      variant="outline" 
                      onClick={() => router.visit(route('funding.index'))}
                    >
                      View All Transactions
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
}
