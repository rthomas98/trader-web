import React from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import type { CellContext } from '@tanstack/react-table';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import type { TradingPosition } from '@/types'; // Use TradingPosition

// Helper function for date formatting
const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
};

// Helper function for currency formatting
const formatCurrency = (amount: number | null | undefined) => {
  if (amount === null || amount === undefined) return '-';
  // TODO: Use user's preferred currency or account currency
  return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' }); 
};

// Define props interface
interface HistoryProps {
  closedPositions: TradingPosition[];
}

// Define columns for the DataTable
const columns: ColumnDef<TradingPosition>[] = [
  { accessorKey: 'symbol', header: 'Symbol' },
  {
    accessorKey: 'position_type',
    header: 'Side',
    cell: ({ row }: CellContext<TradingPosition, unknown>) => (row.original.position_type === 'LONG' ? 'BUY' : 'SELL'),
  },
  {
    accessorKey: 'entry_price',
    header: 'Entry Price',
    cell: ({ row }: CellContext<TradingPosition, unknown>) => formatCurrency(row.original.entry_price),
  },
  {
    accessorKey: 'exit_price',
    header: 'Exit Price',
    cell: ({ row }: CellContext<TradingPosition, unknown>) => formatCurrency(row.original.exit_price),
  },
  {
    accessorKey: 'profit_loss',
    header: 'P/L',
    cell: ({ row }: CellContext<TradingPosition, unknown>) => {
      const pnl = row.original.profit_loss;
      const pnlClass = pnl === null || pnl === 0 ? '' : pnl > 0 ? 'text-green-600' : 'text-red-600';
      return <span className={pnlClass}>{formatCurrency(pnl)}</span>;
    },
  },
  {
    accessorKey: 'open_date',
    header: 'Opened At',
    cell: ({ row }: CellContext<TradingPosition, unknown>) => formatDate(row.original.open_date),
  },
  {
    accessorKey: 'close_date',
    header: 'Closed At',
    cell: ({ row }: CellContext<TradingPosition, unknown>) => formatDate(row.original.close_date),
  },
];

const History: React.FC<HistoryProps> = ({ closedPositions }) => {
  return (
    <AppLayout>
      <Head title="Trade History" />
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle>Trade History</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable columns={columns} data={closedPositions} />
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default History;
