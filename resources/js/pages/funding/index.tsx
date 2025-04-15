import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { FundingTransaction } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { formatCurrency, formatDate } from '@/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';

interface FundingIndexProps {
  transactions: {
    transactions: FundingTransaction[];
    total: number;
    limit: number;
    offset: number;
  };
}

export default function FundingIndex({ transactions }: FundingIndexProps) {
  const [activeTab, setActiveTab] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const transactionItems = transactions.transactions || [];

  // Filter and sort transactions
  const filteredTransactions = transactionItems.filter(transaction => {
    // Filter by transaction type
    if (activeTab !== 'all' && transaction.transaction_type.toLowerCase() !== activeTab) {
      return false;
    }
    
    // Filter by status
    if (statusFilter !== 'all' && transaction.status.toLowerCase() !== statusFilter.toLowerCase()) {
      return false;
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        transaction.description.toLowerCase().includes(query) ||
        (transaction.notes && transaction.notes.toLowerCase().includes(query)) ||
        (transaction.connected_account?.institution_name.toLowerCase().includes(query)) ||
        (transaction.wallet?.currency.toLowerCase().includes(query))
      );
    }
    
    return true;
  }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

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

  return (
    <AppLayout>
      <Head title="Funding Transactions" />
      
      <div className="py-12">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Funding Transactions</h1>
            <div className="flex gap-2">
              <Button onClick={() => router.visit(route('funding.create-deposit'))}>
                <ArrowDownLeft className="mr-2 h-4 w-4" />
                Deposit
              </Button>
              <Button variant="outline" onClick={() => router.visit(route('funding.create-withdrawal'))}>
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
                    View all your deposits and withdrawals
                  </CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <div className="relative w-full sm:w-64">
                    <Input
                      placeholder="Search transactions..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-40">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="deposit">Deposits</TabsTrigger>
                  <TabsTrigger value="withdrawal">Withdrawals</TabsTrigger>
                </TabsList>
                <TabsContent value="all" className="mt-6">
                  {renderTransactionList(filteredTransactions)}
                </TabsContent>
                <TabsContent value="deposit" className="mt-6">
                  {renderTransactionList(filteredTransactions)}
                </TabsContent>
                <TabsContent value="withdrawal" className="mt-6">
                  {renderTransactionList(filteredTransactions)}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );

  function renderTransactionList(transactions: FundingTransaction[]) {
    if (transactions.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">No transactions found.</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {transactions.map((transaction) => (
          <div 
            key={transaction.id} 
            className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
            onClick={() => router.visit(route('funding.show', transaction.id))}
          >
            <div className="flex items-start sm:items-center gap-3 mb-2 sm:mb-0">
              <div className="flex-shrink-0 p-2 rounded-full bg-gray-100 dark:bg-gray-700">
                {transaction.transaction_type === 'DEPOSIT' ? (
                  <ArrowDownLeft className="h-5 w-5 text-green-500" />
                ) : (
                  <ArrowUpRight className="h-5 w-5 text-red-500" />
                )}
              </div>
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                  <p className="font-medium">{transaction.description}</p>
                  {getStatusBadge(transaction.status)}
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center text-sm text-muted-foreground gap-1 sm:gap-2">
                  <p>{formatDate(transaction.created_at)}</p>
                  <span className="hidden sm:inline">•</span>
                  <p>
                    {transaction.transaction_type === 'DEPOSIT' ? 'From' : 'To'}: {transaction.connected_account?.institution_name} 
                    {transaction.connected_account?.mask && ` (••••${transaction.connected_account.mask})`}
                  </p>
                  <span className="hidden sm:inline">•</span>
                  <p>
                    {transaction.transaction_type === 'DEPOSIT' ? 'To' : 'From'}: {transaction.wallet?.currency} Wallet
                  </p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-lg font-semibold ${
                transaction.transaction_type === 'DEPOSIT' 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {transaction.transaction_type === 'DEPOSIT' ? '+' : '-'}
                {formatCurrency(transaction.amount)}
              </p>
              <p className="text-sm text-muted-foreground">
                Reference: {transaction.reference_id.slice(0, 8)}...
              </p>
            </div>
          </div>
        ))}
      </div>
    );
  }
}
