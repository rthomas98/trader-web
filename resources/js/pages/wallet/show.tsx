import React, { useState } from "react";
import { Head, router } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, ArrowDownLeft, Pencil, Trash2, ArrowLeftRight } from 'lucide-react';
import { formatCurrency, formatDate } from "@/utils";
import WalletTransactionList from "@/components/wallet/WalletTransactionList";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from 'lucide-react';

interface WalletShowProps {
  wallet: {
    id: string;
    name: string;
    currency: string;
    balance: number;
    available_balance: number;
    locked_balance: number;
    is_default: boolean;
    created_at: string;
    updated_at: string;
    currency_type: string;
  };
  transactions: Array<{
    id: string;
    wallet_id: string;
    amount: number;
    fee: number;
    transaction_type: string;
    status: string;
    description: string;
    reference_id: string | null;
    created_at: string;
    updated_at: string;
  }>;
  connected_accounts: Array<{
    id: string;
    name: string;
    status: string;
  }>;
}

export default function WalletShow({ wallet, transactions, connected_accounts }: WalletShowProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleDeposit = () => {
    router.visit(route('funding.create-deposit', { wallet_id: wallet.id }), {
      preserveState: true,
      only: [],
    });
  };

  const handleWithdraw = () => {
    router.visit(route('funding.create-withdrawal', { wallet_id: wallet.id }), {
      preserveState: true,
      only: [],
    });
  };

  const handleDelete = () => {
    router.delete(route('wallets.destroy', wallet.id), {
      onSuccess: () => {
        setIsDeleteDialogOpen(false);
      },
    });
  };

  const recentTransactions = [...(transactions || [])]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <AppLayout>
      <Head title={`${wallet.currency} Wallet`} />
      <div className="py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
              {wallet.currency} Wallet
            </h2>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.visit(route('wallets.index'))}
              >
                Back to Wallets
              </Button>
              <Button variant="outline" size="sm" onClick={() => router.visit(route('wallets.edit', wallet.id))}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Button>
              {wallet.balance <= 0 && (
                <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Delete Wallet</DialogTitle>
                      <DialogDescription>
                        Are you sure you want to delete this wallet? This action cannot be undone.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
                      <Button variant="destructive" onClick={handleDelete}>Delete</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="bg-white dark:bg-gray-800">
              <CardHeader>
                <CardTitle>Wallet Details</CardTitle>
                <CardDescription>
                  <Badge className={wallet.currency_type === 'fiat' ? "bg-[#EECEE6] text-[#1A161D]" : "bg-[#EECEE6] text-[#1A161D]"}>
                    {wallet.currency_type}
                  </Badge>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Balance</h3>
                    <p className="text-3xl font-bold">{formatCurrency(wallet.balance)}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Available</h3>
                      <p className="text-lg font-semibold">{formatCurrency(wallet.available_balance)}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Locked</h3>
                      <p className="text-lg font-semibold">{formatCurrency(wallet.locked_balance)}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">Transaction Status</p>
                        <p className="text-sm text-muted-foreground">
                          {wallet.locked_balance > 0 ? 'Some funds are locked' : 'All funds available'}
                        </p>
                      </div>
                      <Badge className={wallet.locked_balance > 0 ? "bg-yellow-500 text-white" : "bg-green-500 text-white"}>
                        {wallet.locked_balance > 0 ? 'Locked' : 'Available'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Status</p>
                      <p className="text-sm text-muted-foreground">
                        {wallet.is_default ? 'Default wallet' : 'Regular wallet'}
                      </p>
                    </div>
                    <Badge className={wallet.is_default ? "bg-green-500 text-white" : "bg-gray-500 text-white"}>
                      {wallet.is_default ? 'Default' : 'Regular'}
                    </Badge>
                  </div>
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <h3 className="text-sm font-medium text-muted-foreground">Created</h3>
                    <p>{formatDate(wallet.created_at)}</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-wrap gap-2">
                <Button className="flex-1" onClick={handleDeposit}>
                  <ArrowDownLeft className="mr-2 h-4 w-4" />
                  Deposit
                </Button>
                <Button className="flex-1" onClick={handleWithdraw}>
                  <ArrowUpRight className="mr-2 h-4 w-4" />
                  Withdraw
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => router.visit(route('wallets.transfer', { from_wallet_id: wallet.id }))}>
                  <ArrowLeftRight className="mr-2 h-4 w-4" />
                  Transfer
                </Button>
              </CardFooter>
            </Card>

            <div className="space-y-6">
              {wallet.balance <= 0 && (
                <Alert className="bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>No funds</AlertTitle>
                  <AlertDescription>
                    This wallet has no funds. Deposit funds to start using this wallet.
                  </AlertDescription>
                </Alert>
              )}

              <Card className="bg-white dark:bg-gray-800">
                <CardHeader>
                  <CardTitle>Transaction History</CardTitle>
                </CardHeader>
                <CardContent>
                  {recentTransactions.length > 0 ? (
                    <WalletTransactionList transactions={recentTransactions.slice(0, 5)} />
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      <p>No transactions yet</p>
                    </div>
                  )}
                </CardContent>
                {recentTransactions.length > 5 && (
                  <CardFooter>
                    <Button variant="outline" className="w-full" onClick={() => router.visit(route('wallets.transactions', wallet.id))}>
                      View All Transactions
                    </Button>
                  </CardFooter>
                )}
              </Card>
            </div>
          </div>

          <div className="mt-6">
            <Card className="bg-white dark:bg-gray-800">
              <CardHeader>
                <CardTitle>Connected Funding Sources</CardTitle>
                <CardDescription>Bank accounts connected to this wallet</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {connected_accounts && connected_accounts.length > 0 ? (
                    connected_accounts.map((account) => (
                      <div key={account.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">{account.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {account.name} •••• 
                          </p>
                        </div>
                        <Badge className={account.status === 'active' ? "bg-green-500 text-white" : "bg-yellow-500 text-white"}>
                          {account.status === 'active' ? 'Active' : 'Pending'}
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-muted-foreground">No connected accounts</p>
                      <Button 
                        variant="outline" 
                        className="mt-2"
                        onClick={() => router.visit(route('connected-accounts.create'))}
                      >
                        Connect a Bank Account
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" onClick={() => router.visit(route('connected-accounts.index'))}>
                  Manage Connected Accounts
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
