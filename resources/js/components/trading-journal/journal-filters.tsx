import React, { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { type DateRange } from "react-day-picker"
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Separator } from '@/components/ui/separator';
import { 
  Filter, 
  Star, 
  Calendar, 
  RefreshCw
} from 'lucide-react';

interface JournalFiltersProps {
  filters: {
    entry_type: string | null;
    outcome: string | null;
    pair: string | null;
    tag: string | null;
    favorites: boolean;
    start_date: string | null;
    end_date: string | null;
    search: string | null;
  };
  currencyPairs: string[];
  tags: string[];
}

export default function JournalFilters({ 
  filters, 
  currencyPairs, 
  tags 
}: JournalFiltersProps) {
  const { data, setData, get, processing } = useForm({
    entry_type: filters.entry_type || 'all',
    outcome: filters.outcome || 'all',
    pair: filters.pair || 'all',
    tag: filters.tag || 'all',
    favorites: filters.favorites || false,
    start_date: filters.start_date || '',
    end_date: filters.end_date || '',
    search: filters.search || '',
  });

  // Use DateRange type from react-day-picker
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: filters.start_date ? new Date(filters.start_date) : undefined,
    to: filters.end_date ? new Date(filters.end_date) : undefined,
  });

  // Handle date range change
  // Ensure handler accepts the DateRange type provided by DateRangePicker's onChange
  const handleDateRangeChange = (range: DateRange) => {
    setDateRange(range);
    setData({
      ...data,
      start_date: range.from ? range.from.toISOString().split('T')[0] : '',
      end_date: range.to ? range.to.toISOString().split('T')[0] : '',
    });
  };

  // Apply filters
  const applyFilters = () => {
    get('/trading-journal', {
      preserveState: true,
      preserveScroll: true,
      only: ['entries', 'stats'],
    });
  };

  // Reset filters
  const resetFilters = () => {
    setData({
      entry_type: 'all',
      outcome: 'all',
      pair: 'all',
      tag: 'all',
      favorites: false,
      start_date: '',
      end_date: '',
      search: filters.search || '', // Keep search term
    });
    
    setDateRange({
      from: undefined,
      to: undefined,
    });
    
    get('/trading-journal', {
      preserveState: true,
      preserveScroll: true,
      only: ['entries', 'stats'],
    });
  };

  // Check if any filters are applied
  const hasActiveFilters = () => {
    return (
      data.entry_type !== 'all' ||
      data.outcome !== 'all' ||
      data.pair !== 'all' ||
      data.tag !== 'all' ||
      data.favorites ||
      data.start_date !== '' ||
      data.end_date !== ''
    );
  };

  return (
    <div className="space-y-4">
      {/* Entry Type */}
      <div className="space-y-2">
        <Label htmlFor="entry_type">Entry Type</Label>
        <Select
          value={data.entry_type}
          onValueChange={(value) => setData('entry_type', value)}
        >
          <SelectTrigger id="entry_type">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="idea">Ideas</SelectItem>
            <SelectItem value="strategy">Strategies</SelectItem>
            <SelectItem value="analysis">Analysis</SelectItem>
            <SelectItem value="review">Reviews</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Trade Outcome */}
      <div className="space-y-2">
        <Label htmlFor="outcome">Trade Outcome</Label>
        <Select
          value={data.outcome}
          onValueChange={(value) => setData('outcome', value)}
        >
          <SelectTrigger id="outcome">
            <SelectValue placeholder="All outcomes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All outcomes</SelectItem>
            <SelectItem value="win">Win</SelectItem>
            <SelectItem value="loss">Loss</SelectItem>
            <SelectItem value="breakeven">Breakeven</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Currency Pair */}
      <div className="space-y-2">
        <Label htmlFor="pair">Currency Pair</Label>
        <Select
          value={data.pair}
          onValueChange={(value) => setData('pair', value)}
        >
          <SelectTrigger id="pair">
            <SelectValue placeholder="All pairs" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All pairs</SelectItem>
            {currencyPairs.map((pair) => (
              <SelectItem key={pair} value={pair}>
                {pair}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="tag">Tag</Label>
          <Select
            value={data.tag}
            onValueChange={(value) => setData('tag', value)}
          >
            <SelectTrigger id="tag">
              <SelectValue placeholder="All tags" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All tags</SelectItem>
              {tags.map((tag) => (
                <SelectItem key={tag} value={tag}>
                  {tag}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Favorites */}
      <div className="flex items-center justify-between space-x-2">
        <Label htmlFor="favorites" className="cursor-pointer">
          <div className="flex items-center">
            <Star className="h-4 w-4 mr-2 text-amber-500" />
            Favorites only
          </div>
        </Label>
        <Switch
          id="favorites"
          checked={data.favorites}
          onCheckedChange={(checked) => setData('favorites', checked)}
        />
      </div>

      <Separator />

      {/* Date Range */}
      <div className="space-y-2">
        <Label className="flex items-center">
          <Calendar className="h-4 w-4 mr-2" />
          Date Range
        </Label>
        <DateRangePicker
          value={dateRange} // Type should now match
          onChange={handleDateRangeChange}
          className="w-full"
        />
      </div>

      <Separator />

      {/* Action Buttons */}
      <div className="flex flex-col space-y-2">
        <Button
          onClick={applyFilters}
          disabled={processing}
          className="w-full"
        >
          <Filter className="h-4 w-4 mr-2" />
          Apply Filters
        </Button>
        
        {hasActiveFilters() && (
          <Button
            onClick={resetFilters}
            variant="outline"
            disabled={processing}
            className="w-full"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset Filters
          </Button>
        )}
      </div>
    </div>
  );
}
