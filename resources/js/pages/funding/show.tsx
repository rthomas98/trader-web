import React from 'react';
import { Head, router } from '@inertiajs/react';
import { FundingTransaction } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowDownLeft, ArrowUpRight, ExternalLink, AlertCircle, Clock, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { formatCurrency, formatDate } from '@/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import AppLayout from '@/layouts/app-layout';

interface FundingShowProps {
  transaction: FundingTransaction & {
    connected_account: {
      id: string;
      institution_name: string;
      account_name: string;
      mask: string;
      is_verified: boolean;
      status: string;
    };
    wallet: {
      id: string;
      currency: string;
      balance: number;
      available_balance: number;
    };
  };
}

export default function FundingShow({ transaction }: FundingShowProps) {
  const isDeposit = transaction.transaction_type === 'DEPOSIT';
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'PENDING':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'FAILED':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'CANCELLED':
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Completed</Badge>;
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">Pending</Badge>;
      case 'failed':
        return <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleCancel = () => {
    if (confirm('Are you sure you want to cancel this transaction?')) {
      router.post(route('funding.cancel', transaction.id));
    }
  };

  const handleRetry = () => {
    router.post(route('funding.retry', transaction.id));
  };

  return (
    <AppLayout>
      <Head title={`${isDeposit ? 'Deposit' : 'Withdrawal'} Details`} />

      <div className="py-12">
        <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">
          <div className="mb-6 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => router.visit(route('funding.index'))}>
                Back to Transactions
              </Button>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {isDeposit ? 'Deposit' : 'Withdrawal'} Details
              </h1>
            </div>
          </div>

          {transaction.status === 'PENDING' && (
            <Alert className="mb-6">
              <Clock className="h-4 w-4" />
              <AlertTitle>Transaction in Progress</AlertTitle>
              <AlertDescription>
                This transaction is currently being processed. It typically takes 1-3 business days to complete.
              </AlertDescription>
            </Alert>
          )}

          {transaction.status === 'FAILED' && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Transaction Failed</AlertTitle>
              <AlertDescription>
                This transaction has failed. You can try again or contact support for assistance.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="bg-white dark:bg-gray-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-full bg-gray-100 dark:bg-gray-700">
                      {isDeposit ? (
                        <ArrowDownLeft className="h-5 w-5 text-green-500" />
                      ) : (
                        <ArrowUpRight className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                    <CardTitle>{transaction.description}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(transaction.status)}
                    {getStatusBadge(transaction.status)}
                  </div>
                </div>
                <CardDescription>
                  Reference ID: {transaction.reference_id}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">Amount</p>
                    <p className={`text-3xl font-bold ${
                      isDeposit ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {isDeposit ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {formatDate(transaction.created_at)}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">
                        {isDeposit ? 'From' : 'To'} Account
                      </h3>
                      <p className="font-medium">{transaction.connected_account.institution_name}</p>
                      <p className="text-sm">
                        {transaction.connected_account.account_name} •••• {transaction.connected_account.mask}
                      </p>
                      <Button 
                        variant="link" 
                        className="p-0 h-auto text-sm"
                        onClick={() => router.visit(route('connected-accounts.show', transaction.connected_account.id))}
                      >
                        View Account <ExternalLink className="ml-1 h-3 w-3" />
                      </Button>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">
                        {isDeposit ? 'To' : 'From'} Wallet
                      </h3>
                      <p className="font-medium">{transaction.wallet.currency} Wallet</p>
                      <p className="text-sm">
                        Balance: {formatCurrency(transaction.wallet.balance)}
                      </p>
                      <Button 
                        variant="link" 
                        className="p-0 h-auto text-sm"
                        onClick={() => router.visit(route('wallets.show', transaction.wallet.id))}
                      >
                        View Wallet <ExternalLink className="ml-1 h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {transaction.notes && (
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                      <h3 className="text-sm font-medium text-muted-foreground">Notes</h3>
                      <p className="mt-1">{transaction.notes}</p>
                    </div>
                  )}
                </div>
              </CardContent>
              {transaction.status === 'PENDING' && (
                <CardFooter>
                  <Button 
                    variant="destructive" 
                    className="w-full"
                    onClick={handleCancel}
                  >
                    Cancel Transaction
                  </Button>
                </CardFooter>
              )}
              {transaction.status === 'FAILED' && (
                <CardFooter>
                  <Button 
                    className="w-full"
                    onClick={handleRetry}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Retry Transaction
                  </Button>
                </CardFooter>
              )}
            </Card>

            <Card className="bg-white dark:bg-gray-800">
              <CardHeader>
                <CardTitle>Transaction Timeline</CardTitle>
                <CardDescription>
                  Track the status of your transaction
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="relative pl-8 pb-8 border-l border-gray-200 dark:border-gray-700">
                    <div className="absolute -left-2 p-1 rounded-full bg-green-100 dark:bg-green-900">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </div>
                    <div>
                      <p className="font-medium">Transaction Created</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(transaction.created_at)}
                      </p>
                    </div>
                  </div>

                  <div className="relative pl-8 pb-8 border-l border-gray-200 dark:border-gray-700">
                    <div className={`absolute -left-2 p-1 rounded-full ${
                      transaction.status !== 'PENDING' && transaction.status !== 'CANCELLED' 
                        ? 'bg-green-100 dark:bg-green-900' 
                        : transaction.status === 'PENDING'
                          ? 'bg-yellow-100 dark:bg-yellow-900'
                          : 'bg-gray-100 dark:bg-gray-700'
                    }`}>
                      {transaction.status !== 'PENDING' && transaction.status !== 'CANCELLED' ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : transaction.status === 'PENDING' ? (
                        <Clock className="h-4 w-4 text-yellow-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-gray-500" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">Processing</p>
                      <p className="text-sm text-muted-foreground">
                        {transaction.status === 'PENDING' 
                          ? 'Transaction is being processed' 
                          : transaction.status === 'CANCELLED'
                            ? 'Transaction was cancelled'
                            : transaction.status === 'FAILED'
                              ? 'Processing failed'
                              : 'Processing completed'}
                      </p>
                    </div>
                  </div>

                  <div className="relative pl-8">
                    <div className={`absolute -left-2 p-1 rounded-full ${
                      transaction.status === 'COMPLETED'
                        ? 'bg-green-100 dark:bg-green-900'
                        : transaction.status === 'FAILED'
                          ? 'bg-red-100 dark:bg-red-900'
                          : 'bg-gray-100 dark:bg-gray-700'
                    }`}>
                      {transaction.status === 'COMPLETED' ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : transaction.status === 'FAILED' ? (
                        <XCircle className="h-4 w-4 text-red-500" />
                      ) : (
                        <Clock className="h-4 w-4 text-gray-500" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">Completion</p>
                      <p className="text-sm text-muted-foreground">
                        {transaction.status === 'COMPLETED'
                          ? `Funds ${isDeposit ? 'deposited' : 'withdrawn'} successfully`
                          : transaction.status === 'FAILED'
                            ? `${isDeposit ? 'Deposit' : 'Withdrawal'} failed`
                            : `Awaiting ${isDeposit ? 'deposit' : 'withdrawal'} completion`}
                      </p>
                      {transaction.status === 'COMPLETED' && transaction.updated_at && (
                        <p className="text-sm text-muted-foreground">
                          {formatDate(transaction.updated_at)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                {transaction.status === 'COMPLETED' ? (
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => router.visit(isDeposit 
                      ? route('funding.create-deposit') 
                      : route('funding.create-withdrawal')
                    )}
                  >
                    {isDeposit ? 'Make Another Deposit' : 'Make Another Withdrawal'}
                  </Button>
                ) : transaction.status === 'FAILED' ? (
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => router.visit(route('contact'))}
                  >
                    Contact Support
                  </Button>
                ) : null}
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
