import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { FundingTransaction, Wallet, ConnectedAccount } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowDownLeft, ArrowUpRight, Wallet as WalletIcon, Star, Search, ChevronLeft, ChevronRight } from 'lucide-react';
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
  wallets: Wallet[];
  connectedAccounts: ConnectedAccount[];
}

export default function FundingIndex({ transactions, wallets, connectedAccounts }: FundingIndexProps) {
  const [activeTab, setActiveTab] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWalletId, setSelectedWalletId] = useState<string | undefined>(
    wallets.length > 0 ? wallets[0].id : undefined
  );

  const transactionItems = transactions.transactions || [];
  const totalTransactions = transactions.total || 0;
  const limit = transactions.limit || 15;
  const offset = transactions.offset || 0;

  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(totalTransactions / limit);

  // Find the selected wallet object
  const selectedWallet = wallets.find(w => w.id === selectedWalletId);

  // Filter and sort transactions (Frontend filtering remains)
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

  // Handle page change
  const handlePageChange = (newPage: number) => {
    router.visit(route('funding.index'), {
      data: { page: newPage, limit: limit }, // Pass page and limit
      preserveState: true,
      preserveScroll: true,
      only: ['transactions'], // Only reload transaction data
    });
  };

  return (
    <AppLayout>
      <Head title="Funding Transactions" />
      
      <div className="py-12">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          {/* Account Summaries Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Wallets Summary */}
            <Card className="bg-white dark:bg-gray-800">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Selected Wallet</CardTitle>
                {wallets.length > 0 ? (
                  <Select value={selectedWalletId} onValueChange={setSelectedWalletId}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select Wallet" />
                    </SelectTrigger>
                    <SelectContent>
                      {wallets.map((wallet) => (
                        <SelectItem key={wallet.id} value={wallet.id}>
                          <div className="flex items-center gap-2">
                            <WalletIcon className="h-4 w-4 text-muted-foreground" />
                            <span>{wallet.currency} Wallet</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <span className="text-sm text-muted-foreground">No Wallets</span>
                )}
              </CardHeader>
              <CardContent>
                {selectedWallet ? (
                  <div className="text-2xl font-bold">
                    {formatCurrency(selectedWallet.available_balance, selectedWallet.currency)}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Please select a wallet.</p>
                )}
                {selectedWallet && (
                  <p className="text-xs text-muted-foreground">
                    {selectedWallet.currency} available balance
                  </p>
                )}
              </CardContent>
              <CardFooter>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700" 
                  onClick={() => router.visit(route('wallets.index'))}
                >
                  Manage Wallets
                </Button>
              </CardFooter>
            </Card>

            {/* Connected Accounts Summary */}
            <Card className="bg-white dark:bg-gray-800">
              <CardHeader>
                <CardTitle>Connected Bank Accounts</CardTitle>
                <CardDescription>Accounts linked via Plaid</CardDescription>
              </CardHeader>
              <CardContent>
                {connectedAccounts.length > 0 ? (
                  <ul className="space-y-3">
                    {connectedAccounts.map((account) => (
                      <li key={account.id} className="flex justify-between items-center gap-2">
                        <div className="flex items-center gap-1.5">
                          {account.is_default && <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />}
                          <span className="truncate font-medium">{account.institution_name}</span>
                          <span className="text-sm text-muted-foreground truncate"> -
                            {account.account_name} 
                            ({account.account_subtype ? account.account_subtype.replace('_', ' ') : 'N/A'}) 
                            (••••{account.mask})
                          </span>
                        </div>
                        {/* Display stored available balance */}
                        {account.available_balance !== undefined && account.available_balance !== null ? (
                          <span className="font-semibold whitespace-nowrap">{formatCurrency(account.available_balance, account.iso_currency_code || 'USD')}</span>
                        ) : (
                          <span className="text-sm text-muted-foreground italic whitespace-nowrap">Balance N/A</span>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No connected accounts found.</p>
                )}
              </CardContent>
              <CardFooter>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700" 
                  onClick={() => router.visit(route('connected-accounts.index'))}
                >
                  Manage Connections
                </Button>
              </CardFooter>
            </Card>
          </div>

          <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Funding Transactions</h1>
            <div className="flex gap-2">
              <Button onClick={() => router.visit(route('funding.deposit.create'))}>
                <ArrowDownLeft className="mr-2 h-4 w-4" />
                Deposit
              </Button>
              <Button variant="outline" onClick={() => router.visit(route('funding.withdrawal.create'))}>
                <ArrowUpRight className="mr-2 h-4 w-4" />
                Withdraw
              </Button>
            </div>
          </div>

          <Card className="bg-white dark:bg-gray-800">
            <CardHeader>
              <div>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>
                  View all your deposits and withdrawals
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="deposit">Deposits</TabsTrigger>
                  <TabsTrigger value="withdrawal">Withdrawals</TabsTrigger>
                </TabsList>

                <div className="flex flex-col sm:flex-row gap-4 mb-6 mt-4">
                  <div className="relative flex-grow">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search by description, notes, bank..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 sm:w-full md:w-[300px] lg:w-[400px] bg-white dark:bg-gray-900"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <TabsContent value="all" className="mt-0">
                  {renderTransactionList(filteredTransactions)}
                </TabsContent>
                <TabsContent value="deposit" className="mt-0">
                  {renderTransactionList(filteredTransactions)}
                </TabsContent>
                <TabsContent value="withdrawal" className="mt-0">
                  {renderTransactionList(filteredTransactions)}
                </TabsContent>
              </Tabs>
            </CardContent>
            {/* Custom Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center space-x-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    // Logic to show pages around current page
                    let pageToShow;
                    if (totalPages <= 5) {
                      // If 5 or fewer pages, show all
                      pageToShow = i + 1;
                    } else if (currentPage <= 3) {
                      // If near start, show first 5 pages
                      pageToShow = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      // If near end, show last 5 pages
                      pageToShow = totalPages - 4 + i;
                    } else {
                      // Otherwise show 2 before and 2 after current
                      pageToShow = currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageToShow}
                        variant={pageToShow === currentPage ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(pageToShow)}
                        className="h-8 w-8 p-0"
                      >
                        {pageToShow}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </AppLayout>
  );

  function renderTransactionList(transactionsToRender: FundingTransaction[]) {
    if (transactionsToRender.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">No transactions found.</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {transactionsToRender.map((transaction) => (
          <div 
            key={transaction.id} 
            className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer 
                        border-l-4 ${transaction.transaction_type === 'DEPOSIT' ? 'border-l-green-500 dark:border-l-green-600' : 'border-l-red-500 dark:border-l-red-600'}`}
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
