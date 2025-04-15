import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { ConnectedAccount, FundingTransaction } from '@/types';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/utils';
import { ArrowDownLeft, ArrowUpRight, RefreshCw, Trash2, AlertCircle, CheckCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ConnectedAccountShowProps {
  connectedAccount: ConnectedAccount & {
    transactions: FundingTransaction[];
  };
}

interface AccountLimitItem {
  limit_type: string;
  limit_amount: number | undefined;
}

export default function ConnectedAccountShow({ connectedAccount }: ConnectedAccountShowProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleRefresh = () => {
    router.post(route('connected-accounts.refresh', connectedAccount.id));
  };

  const handleVerify = () => {
    router.visit(route('connected-accounts.verify', connectedAccount.id));
  };

  const handleDelete = () => {
    router.delete(route('connected-accounts.destroy', connectedAccount.id), {
      onSuccess: () => {
        setDeleteDialogOpen(false);
      },
    });
  };

  const handleDeposit = () => {
    router.visit(route('funding.create-deposit', { connected_account_id: connectedAccount.id }));
  };

  const handleWithdraw = () => {
    router.visit(route('funding.create-withdrawal', { connected_account_id: connectedAccount.id }));
  };

  const getStatusBadge = (status: string, isVerified: boolean) => {
    if (status === 'PENDING' || !isVerified) {
      return <Badge variant="warning">Pending Verification</Badge>;
    } else if (status === 'ACTIVE' && isVerified) {
      return <Badge variant="success">Active</Badge>;
    } else {
      return <Badge variant="destructive">Inactive</Badge>;
    }
  };

  const recentTransactions = connectedAccount.transactions
    ? [...connectedAccount.transactions].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
    : [];

  const accountLimits: AccountLimitItem[] = [
    { limit_type: 'Daily Deposit Limit', limit_amount: connectedAccount.daily_deposit_limit },
    { limit_type: 'Daily Withdrawal Limit', limit_amount: connectedAccount.daily_withdrawal_limit },
    { limit_type: 'Monthly Deposit Limit', limit_amount: connectedAccount.monthly_deposit_limit },
    { limit_type: 'Monthly Withdrawal Limit', limit_amount: connectedAccount.monthly_withdrawal_limit },
    { limit_type: 'Min Transaction', limit_amount: connectedAccount.min_transaction_amount },
    { limit_type: 'Max Transaction', limit_amount: connectedAccount.max_transaction_amount },
  ];

  return (
    <AppLayout renderHeader={() => (
      <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">
        {connectedAccount.institution_name} Account
      </h2>
    )}>
      <Head title={`${connectedAccount.institution_name} Account`} />

      <div className="py-12">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <div className="mb-6 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => router.visit(route('connected-accounts.index'))}>
                Back to Accounts
              </Button>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {connectedAccount.institution_name} Account
                {connectedAccount.is_default && (
                  <Badge className="ml-2 bg-[#8D5EB7] text-white">Default</Badge>
                )}
              </h1>
            </div>
            <div className="flex gap-2">
              {connectedAccount.status === 'ACTIVE' && connectedAccount.is_verified ? (
                <Button variant="outline" size="sm" onClick={handleRefresh}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={handleVerify}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Verify
                </Button>
              )}
              <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete Connected Account</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to delete this connected account? This action cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                    <Button variant="destructive" onClick={handleDelete}>Delete</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-white dark:bg-gray-800">
              <CardHeader>
                <CardTitle>Account Details</CardTitle>
                <CardDescription>
                  Connected on {formatDate(connectedAccount.created_at)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!connectedAccount.is_verified && (
                  <Alert variant="warning">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Verification Required</AlertTitle>
                    <AlertDescription>
                      This account needs to be verified before you can make deposits or withdrawals.
                    </AlertDescription>
                  </Alert>
                )}

                <Tabs defaultValue="details">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="limits">Limits</TabsTrigger>
                  </TabsList>
                  <TabsContent value="details" className="space-y-4 pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Institution</p>
                        <p className="font-medium">{connectedAccount.institution_name}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Status</p>
                        <div className="flex items-center">
                          {getStatusBadge(connectedAccount.status, connectedAccount.is_verified)}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Account Type</p>
                        <p className="font-medium">{connectedAccount.account_type}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Account Number</p>
                        <p className="font-medium">
                          ••••{connectedAccount.account_number_last4 ?? ''}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Currency</p>
                        <p className="font-medium">{connectedAccount.currency ?? ''}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Balance</p>
                        <p className="font-medium">{formatCurrency(connectedAccount.balance ?? 0)}</p>
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="limits" className="space-y-4 pt-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Limit Type</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {accountLimits.map((limitItem: AccountLimitItem) => (
                          <TableRow key={limitItem.limit_type}>
                            <TableCell>{limitItem.limit_type}</TableCell>
                            <TableCell className="text-right">
                              {limitItem.limit_amount !== undefined && limitItem.limit_amount !== null
                                ? formatCurrency(limitItem.limit_amount, connectedAccount.currency ?? 'USD')
                                : 'N/A'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TabsContent>
                </Tabs>
              </CardContent>
              <CardFooter className="flex gap-2">
                <Button 
                  className="flex-1" 
                  onClick={handleDeposit}
                  disabled={!connectedAccount.is_verified || connectedAccount.status !== 'ACTIVE'}
                >
                  <ArrowDownLeft className="mr-2 h-4 w-4" />
                  Deposit
                </Button>
                <Button 
                  className="flex-1" 
                  onClick={handleWithdraw}
                  disabled={!connectedAccount.is_verified || connectedAccount.status !== 'ACTIVE'}
                >
                  <ArrowUpRight className="mr-2 h-4 w-4" />
                  Withdraw
                </Button>
              </CardFooter>
            </Card>

            <Card className="bg-white dark:bg-gray-800">
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>
                  Recent funding transactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recentTransactions.length > 0 ? (
                  <div className="space-y-4">
                    {recentTransactions.slice(0, 5).map((transaction) => (
                      <div 
                        key={transaction.id} 
                        className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0 p-2 rounded-full bg-gray-100 dark:bg-gray-700">
                            {transaction.transaction_type === 'DEPOSIT' ? (
                              <ArrowDownLeft className="h-4 w-4 text-green-500" />
                            ) : (
                              <ArrowUpRight className="h-4 w-4 text-red-500" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{transaction.description}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(transaction.created_at)} · 
                              <Badge 
                                variant={
                                  transaction.status === 'COMPLETED' ? 'success' : 
                                  transaction.status === 'PENDING' ? 'warning' : 
                                  transaction.status === 'FAILED' ? 'destructive' : 'outline'
                                }
                                className="ml-1"
                              >
                                {transaction.status}
                              </Badge>
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold ${
                            transaction.transaction_type === 'DEPOSIT' 
                              ? 'text-green-600 dark:text-green-400' 
                              : 'text-red-600 dark:text-red-400'
                          }`}>
                            {transaction.transaction_type === 'DEPOSIT' ? '+' : '-'}
                            {formatCurrency(transaction.amount)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground">No transactions yet</p>
                  </div>
                )}
              </CardContent>
              {recentTransactions.length > 5 && (
                <CardFooter>
                  <Button variant="outline" className="w-full" onClick={() => router.visit(route('funding.index'))}>
                    View All Transactions
                  </Button>
                </CardFooter>
              )}
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
