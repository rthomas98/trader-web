import React, { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format, subDays, subMonths, isAfter } from 'date-fns'; // For date filtering and formatting
import { cn } from '@/lib/utils'; // For conditional classes
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
} from 'lucide-react';

// Define the structure of a single trade
export interface Trade {
  id: string | number;
  symbol: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  entry_price: number;
  close_price?: number | null;
  pnl: number;
  status: 'OPEN' | 'CLOSED';
  opened_at: string | Date;
  closed_at?: string | Date | null;
}

// Define the props for the RecentTrades component
interface RecentTradesProps {
  trades: Trade[];
}

// Date filter options
type DateFilterOption = 'all' | 'week' | 'month';

// Sort options
type SortField = 'symbol' | 'type' | 'quantity' | 'pnl' | 'closed_at';
type SortDirection = 'asc' | 'desc';

// Helper function to format currency
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

const RecentTrades: React.FC<RecentTradesProps> = ({ trades }) => {
  // State for filters
  const [symbolFilter, setSymbolFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'BUY' | 'SELL'>('ALL');
  const [dateFilter, setDateFilter] = useState<DateFilterOption>('all');
  
  // State for sorting
  const [sortField, setSortField] = useState<SortField>('closed_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; // Number of trades to show per page

  // Handle sort toggle
  const handleSort = (field: SortField) => {
    if (field === sortField) {
      // Toggle direction if clicking the same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and default to descending for most fields (ascending for symbol)
      setSortField(field);
      setSortDirection(field === 'symbol' ? 'asc' : 'desc');
    }
    // Reset to first page when sorting changes
    setCurrentPage(1);
  };

  // Clear all filters
  const clearFilters = () => {
    setSymbolFilter('');
    setTypeFilter('ALL');
    setDateFilter('all');
    setCurrentPage(1);
  };

  // Filter trades based on current filter settings
  const filteredTrades = useMemo(() => {
    return trades.filter(trade => {
      // Symbol filter
      if (symbolFilter && !trade.symbol.toLowerCase().includes(symbolFilter.toLowerCase())) {
        return false;
      }

      // Type filter
      if (typeFilter !== 'ALL' && trade.type !== typeFilter) {
        return false;
      }

      // Date filter
      if (dateFilter !== 'all' && trade.closed_at) {
        const closedDate = new Date(trade.closed_at);
        const now = new Date();
        
        if (dateFilter === 'week' && !isAfter(closedDate, subDays(now, 7))) {
          return false;
        }
        
        if (dateFilter === 'month' && !isAfter(closedDate, subMonths(now, 1))) {
          return false;
        }
      }

      return true;
    });
  }, [trades, symbolFilter, typeFilter, dateFilter]);

  // Sort the filtered trades
  const sortedTrades = useMemo(() => {
    return [...filteredTrades].sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'symbol':
          comparison = a.symbol.localeCompare(b.symbol);
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
        case 'quantity':
          comparison = a.quantity - b.quantity;
          break;
        case 'pnl':
          comparison = a.pnl - b.pnl;
          break;
        case 'closed_at':
          // Handle potential null/undefined closed_at values
          if (!a.closed_at) return 1;
          if (!b.closed_at) return -1;
          comparison = new Date(a.closed_at).getTime() - new Date(b.closed_at).getTime();
          break;
        default:
          comparison = 0;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredTrades, sortField, sortDirection]);

  // Calculate pagination
  const totalPages = Math.ceil(sortedTrades.length / itemsPerPage);
  const paginatedTrades = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedTrades.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedTrades, currentPage, itemsPerPage]);

  // Pagination controls
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  // Render sort indicator
  const renderSortIndicator = (field: SortField) => {
    if (field !== sortField) {
      return <ArrowUpDown className="ml-1 h-4 w-4 inline" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="ml-1 h-4 w-4 inline text-purple-500" />
      : <ArrowDown className="ml-1 h-4 w-4 inline text-purple-500" />;
  };

  // Check if any filters are active
  const hasActiveFilters = symbolFilter !== '' || typeFilter !== 'ALL' || dateFilter !== 'all';

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Trades</CardTitle>
        {hasActiveFilters && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={clearFilters}
            className="flex items-center gap-1"
          >
            <X className="h-4 w-4" /> Clear Filters
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {/* Filter Controls */}
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="symbol-filter">Symbol</Label>
            <Input
              id="symbol-filter"
              placeholder="Filter by symbol..."
              value={symbolFilter}
              onChange={(e) => {
                setSymbolFilter(e.target.value);
                setCurrentPage(1); // Reset to first page when filter changes
              }}
              className="w-[150px]"
            />
          </div>
          
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="type-filter">Type</Label>
            <Select
              value={typeFilter}
              onValueChange={(value) => {
                setTypeFilter(value as 'ALL' | 'BUY' | 'SELL');
                setCurrentPage(1); // Reset to first page when filter changes
              }}
            >
              <SelectTrigger id="type-filter" className="w-[120px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Types</SelectItem>
                <SelectItem value="BUY">Buy</SelectItem>
                <SelectItem value="SELL">Sell</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="date-filter">Time Period</Label>
            <Select
              value={dateFilter}
              onValueChange={(value) => {
                setDateFilter(value as DateFilterOption);
                setCurrentPage(1); // Reset to first page when filter changes
              }}
            >
              <SelectTrigger id="date-filter" className="w-[150px]">
                <SelectValue placeholder="All Time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="week">Last Week</SelectItem>
                <SelectItem value="month">Last Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {sortedTrades.length > 0 ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer hover:text-purple-500"
                    onClick={() => handleSort('symbol')}
                  >
                    Symbol {renderSortIndicator('symbol')}
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:text-purple-500"
                    onClick={() => handleSort('type')}
                  >
                    Type {renderSortIndicator('type')}
                  </TableHead>
                  <TableHead 
                    className="text-right cursor-pointer hover:text-purple-500"
                    onClick={() => handleSort('quantity')}
                  >
                    Quantity {renderSortIndicator('quantity')}
                  </TableHead>
                  <TableHead 
                    className="text-right cursor-pointer hover:text-purple-500"
                    onClick={() => handleSort('pnl')}
                  >
                    P/L {renderSortIndicator('pnl')}
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead 
                    className="text-right cursor-pointer hover:text-purple-500"
                    onClick={() => handleSort('closed_at')}
                  >
                    Date Closed {renderSortIndicator('closed_at')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTrades.map((trade) => (
                  <TableRow key={trade.id}>
                    <TableCell className="font-medium">{trade.symbol}</TableCell>
                    <TableCell>
                      <Badge variant={trade.type === 'BUY' ? 'default' : 'destructive'}>
                        {trade.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{trade.quantity}</TableCell>
                    <TableCell
                      className={cn(
                        'text-right',
                        trade.pnl >= 0 ? 'text-green-500' : 'text-red-500'
                      )}
                    >
                      {formatCurrency(trade.pnl)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={trade.status === 'OPEN' ? 'outline' : 'secondary'}>
                        {trade.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {trade.closed_at
                        ? format(new Date(trade.closed_at), 'PPpp') // Format: Sep 10, 2024, 10:30:00 AM
                        : 'N/A'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between space-x-2 py-4">
                <div className="text-sm text-muted-foreground">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, sortedTrades.length)} of {sortedTrades.length} trades
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => goToPage(1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => goToPage(totalPages)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="text-center text-muted-foreground py-4">
            {trades.length > 0 
              ? 'No trades match your filter criteria.' 
              : 'No recent trades found.'}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentTrades;
