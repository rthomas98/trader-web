import React, { useState } from "react";
import { Head, router } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import { formatCurrency, formatDate } from "@/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { Wallet, WalletTransaction } from "@/types";

interface WalletTransactionsProps {
  wallet: Wallet;
  transactions: WalletTransaction[];
}

export default function WalletTransactions({ wallet, transactions }: WalletTransactionsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'DEPOSIT':
        return <ArrowDownLeft className="h-4 w-4 text-green-500" />;
      case 'WITHDRAWAL':
        return <ArrowUpRight className="h-4 w-4 text-red-500" />;
      default:
        return <ArrowUpRight className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <div className="bg-green-500 text-white">Completed</div>;
      case 'PENDING':
        return <div className="bg-yellow-500 text-white">Pending</div>;
      case 'FAILED':
        return <div className="bg-red-500 text-white">Failed</div>;
      case 'CANCELLED':
        return <div className="bg-gray-500 text-white">Cancelled</div>;
      default:
        return <div className="bg-gray-500 text-white">{status}</div>;
    }
  };

  const getAmountColor = (type: string) => {
    switch (type) {
      case 'DEPOSIT':
        return 'text-green-600 dark:text-green-400';
      case 'WITHDRAWAL':
        return 'text-red-600 dark:text-red-400';
      default:
        return '';
    }
  };

  const getAmountPrefix = (type: string) => {
    switch (type) {
      case 'DEPOSIT':
        return '+';
      case 'WITHDRAWAL':
        return '-';
      default:
        return '';
    }
  };

  const filteredTransactions = transactions.filter((transaction) => {
    // Filter by status
    if (statusFilter !== 'all' && transaction.status.toLowerCase() !== statusFilter.toLowerCase()) {
      return false;
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        transaction.description.toLowerCase().includes(query) ||
        transaction.transaction_type.toLowerCase().includes(query) ||
        (transaction.reference_id && transaction.reference_id.toLowerCase().includes(query))
      );
    }

    return true;
  });

  const sortedTransactions = [...filteredTransactions].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const renderTransactionRow = (transaction: WalletTransaction) => {
    return (
      <div 
        key={transaction.id} 
        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
      >
        <div className="flex items-start sm:items-center gap-3 mb-2 sm:mb-0">
          <div className="flex-shrink-0 p-2 rounded-full bg-gray-100 dark:bg-gray-700">
            {getTransactionIcon(transaction.transaction_type)}
          </div>
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <p className="font-medium">{transaction.description}</p>
              {getStatusBadge(transaction.status)}
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center text-sm text-muted-foreground gap-1 sm:gap-2">
              <p>{formatDate(transaction.created_at)}</p>
              <span className="hidden sm:inline">•</span>
              <p>Ref: {transaction.reference_id ? transaction.reference_id.slice(0, 8) : ''}...</p>
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className={`text-lg font-semibold ${getAmountColor(transaction.transaction_type)}`}>
            {getAmountPrefix(transaction.transaction_type)}
            {formatCurrency(transaction.amount)}
          </p>
          {transaction.fee > 0 && (
            <p className="text-sm text-muted-foreground">
              Fee: {formatCurrency(transaction.fee)}
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <AppLayout>
      <Head title={`${wallet.currency} Wallet Transactions`} />
      <div className="py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
              {wallet.currency} Transactions
            </h2>
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => router.visit(`/wallets/${wallet.id}`)}
                variant="outline"
              >
                Back to Wallet
              </Button>
            </div>
          </div>
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => router.visit(route('wallets.show', wallet.id))}>
                  Back to Wallet
                </Button>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {wallet.currency} Wallet Transactions
                </h1>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => router.visit(route('funding.create-deposit', { wallet_id: wallet.id }))}>
                  <ArrowDownLeft className="mr-2 h-4 w-4" />
                  Deposit
                </Button>
                <Button variant="outline" onClick={() => router.visit(route('funding.create-withdrawal', { wallet_id: wallet.id }))}>
                  <ArrowUpRight className="mr-2 h-4 w-4" />
                  Withdraw
                </Button>
              </div>
            </div>

            <Card className="bg-white dark:bg-gray-800">
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <CardTitle>Transaction History</CardTitle>
                    <CardDescription>
                      All transactions for your {wallet.currency} wallet
                    </CardDescription>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <div className="relative w-full sm:w-64">
                      <input
                        placeholder="Search transactions..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full"
                      />
                    </div>
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                      <option value="all">All Statuses</option>
                      <option value="completed">Completed</option>
                      <option value="pending">Pending</option>
                      <option value="failed">Failed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sortedTransactions.map((transaction) => (
                    renderTransactionRow(transaction)
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
