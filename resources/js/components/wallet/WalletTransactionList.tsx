import React from 'react';
import { WalletTransaction } from '@/types';
import { formatCurrency, formatDate } from '@/utils';
import { Badge } from '@/components/ui/badge';
import { ArrowUpRight, ArrowDownLeft, Lock, Unlock, RefreshCw } from 'lucide-react';

interface WalletTransactionListProps {
  transactions: WalletTransaction[];
}

export default function WalletTransactionList({ transactions }: WalletTransactionListProps) {
  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'DEPOSIT':
        return <ArrowDownLeft className="h-4 w-4 text-green-500" />;
      case 'WITHDRAWAL':
        return <ArrowUpRight className="h-4 w-4 text-red-500" />;
      case 'LOCK':
        return <Lock className="h-4 w-4 text-orange-500" />;
      case 'UNLOCK':
        return <Unlock className="h-4 w-4 text-blue-500" />;
      case 'TRANSFER':
        return <RefreshCw className="h-4 w-4 text-purple-500" />;
      default:
        return <RefreshCw className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge variant="success">Completed</Badge>;
      case 'PENDING':
        return <Badge variant="warning">Pending</Badge>;
      case 'FAILED':
        return <Badge variant="destructive">Failed</Badge>;
      case 'CANCELLED':
        return <Badge variant="outline">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getAmountColor = (type: string) => {
    switch (type) {
      case 'DEPOSIT':
      case 'UNLOCK':
        return 'text-green-600 dark:text-green-400';
      case 'WITHDRAWAL':
      case 'LOCK':
        return 'text-red-600 dark:text-red-400';
      default:
        return '';
    }
  };

  const getAmountPrefix = (type: string) => {
    switch (type) {
      case 'DEPOSIT':
      case 'UNLOCK':
        return '+';
      case 'WITHDRAWAL':
      case 'LOCK':
        return '-';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-4">
      {transactions.length > 0 ? (
        transactions.map((transaction) => (
          <div 
            key={transaction.id} 
            className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 p-2 rounded-full bg-gray-100 dark:bg-gray-700">
                {getTransactionIcon(transaction.transaction_type)}
              </div>
              <div>
                <p className="font-medium">{transaction.description}</p>
                <p className="text-sm text-muted-foreground">
                  {formatDate(transaction.created_at)} · {getStatusBadge(transaction.status)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className={`font-semibold ${getAmountColor(transaction.transaction_type)}`}>
                {getAmountPrefix(transaction.transaction_type)}
                {formatCurrency(transaction.amount)}
              </p>
              {transaction.fee > 0 && (
                <p className="text-xs text-muted-foreground">
                  Fee: {formatCurrency(transaction.fee)}
                </p>
              )}
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-6">
          <p className="text-muted-foreground">No transactions found</p>
        </div>
      )}
    </div>
  );
}
