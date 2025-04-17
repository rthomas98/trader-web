import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  BookText, 
  Search, 
  Filter, 
  PlusCircle, 
} from 'lucide-react';
import { Link } from '@inertiajs/react';
import { Pagination } from '@/components/ui/pagination';
import JournalStatistics from '@/components/trading-journal/journal-statistics';
import JournalEntryCard from '@/components/trading-journal/journal-entry-card';
import JournalFilters from '@/components/trading-journal/journal-filters';

// Define types for the props
interface JournalEntry {
  id: number;
  title: string;
  description: string | null;
  entry_type: 'idea' | 'strategy' | 'analysis' | 'review';
  market_condition: 'bullish' | 'bearish' | 'neutral' | 'volatile' | 'ranging' | null;
  currency_pair: string | null;
  timeframe: string | null;
  entry_price: number | null;
  stop_loss: number | null;
  take_profit: number | null;
  risk_reward_ratio: number | null;
  position_size: number | null;
  risk_percentage: number | null;
  setup_notes: string | null;
  entry_reason: string | null;
  exit_reason: string | null;
  lessons_learned: string | null;
  indicators_used: string[] | null;
  screenshots: string[] | null;
  related_trade_id: string | null;
  trade_outcome: 'win' | 'loss' | 'breakeven' | 'pending' | null;
  profit_loss: number | null;
  profit_loss_percentage: number | null;
  emotional_state: string | null;
  trade_rating: number | null;
  followed_plan: boolean;
  is_favorite: boolean;
  tags: string[] | null;
  trade_date: string | null;
  created_at: string;
  updated_at: string;
  related_trade?: {
    id: string;
    currency_pair: string;
    trade_type: 'BUY' | 'SELL';
    profit_loss: number;
  };
  comments: {
    id: number;
    content: string;
    created_at: string;
    user: {
      id: number;
      name: string;
    };
  }[];
}

interface JournalStatistics {
  total_entries: number;
  entries_by_type: {
    [key: string]: number;
  };
  win_loss_stats: {
    wins: number;
    losses: number;
    breakeven: number;
    pending: number;
    win_rate: number;
  };
  avg_risk_reward: number;
  avg_profit_loss: number;
  total_profit_loss: number;
  most_traded_pairs: {
    [key: string]: number;
  };
  emotional_outcomes: {
    [key: string]: {
      [key: string]: number;
    };
  };
}

interface JournalIndexProps {
  entries: {
    data: JournalEntry[];
    links: {
      first: string;
      last: string;
      prev: string | null;
      next: string | null;
    };
    meta: {
      current_page: number;
      from: number;
      last_page: number;
      links: {
        url: string | null;
        label: string;
        active: boolean;
      }[];
      path: string;
      per_page: number;
      to: number;
      total: number;
    };
  };
  stats: JournalStatistics;
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
  currency_pairs: string[];
  tags: string[];
}

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
  },
  {
    title: 'Trading Journal',
    href: '/trading-journal',
  },
];

export default function JournalIndex({
  entries,
  stats,
  filters,
  currency_pairs,
  tags,
}: JournalIndexProps) {
  // Use the filter value from props to set the initial active tab
  const [activeTab, setActiveTab] = useState(filters.entry_type || 'all'); 
  const [searchQuery, setSearchQuery] = useState(filters.search || '');
  
  // Function to handle tab changes and trigger Inertia visit
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    const currentParams = route().params; // Get current query params
    router.get(route('trading-journal.index'), { 
      ...currentParams, // Keep existing filters
      entry_type: value === 'all' ? undefined : value, // Add/remove entry_type filter
      page: 1 // Reset to page 1 when changing filters
    }, {
      preserveState: true, // Keep component state like search input
      replace: true // Replace history state instead of pushing
    });
  };

  // Function to get entry type badge color
  const getEntryTypeColor = (type: string) => {
    switch (type) {
      case 'idea':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'strategy':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      case 'analysis':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
      case 'review':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };
  
  // Function to get outcome badge color
  const getOutcomeColor = (outcome: string | null) => {
    switch (outcome) {
      case 'win':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'loss':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'breakeven':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
      case 'pending':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Trading Journal" />
      <div className="flex h-full flex-1 flex-col gap-4 p-4">
        {/* Header with search and actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center">
            <BookText className="h-6 w-6 mr-2 text-primary" />
            <h1 className="text-2xl font-bold">Trading Journal</h1>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search entries..."
                className="pl-8 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Button asChild>
              <Link href="/trading-journal/create">
                <PlusCircle className="mr-2 h-4 w-4" />
                New Entry
              </Link>
            </Button>
          </div>
        </div>
        
        {/* Statistics Overview */}
        <JournalStatistics stats={stats} />
        
        {/* Main content with tabs and filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Filters sidebar */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <JournalFilters 
                filters={filters} 
                currencyPairs={currency_pairs} 
                tags={tags} 
              />
            </CardContent>
          </Card>
          
          {/* Journal entries */}
          <div className="md:col-span-3 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle>Journal Entries</CardTitle>
                  <Tabs value={activeTab} onValueChange={handleTabChange} className="w-auto">
                    <TabsList>
                      <TabsTrigger value="all">All</TabsTrigger>
                      <TabsTrigger value="idea">Ideas</TabsTrigger>
                      <TabsTrigger value="strategy">Strategies</TabsTrigger>
                      <TabsTrigger value="analysis">Analysis</TabsTrigger>
                      <TabsTrigger value="review">Reviews</TabsTrigger>                      
                    </TabsList>
                  </Tabs>
                </div>
                <CardDescription>
                  {entries?.meta?.total ?? 0} entries found
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {entries?.data?.length > 0 ? (
                    entries.data.map((entry) => (
                      <JournalEntryCard 
                        key={entry.id}
                        entry={entry}
                        getEntryTypeColor={getEntryTypeColor}
                        getOutcomeColor={getOutcomeColor}
                      />
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <BookText className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                      <h3 className="mt-4 text-lg font-medium">No journal entries found</h3>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Start documenting your trading journey by creating your first journal entry.
                      </p>
                      <Button asChild className="mt-4">
                        <Link href="/trading-journal/create">
                          <PlusCircle className="mr-2 h-4 w-4" />
                          Create Entry
                        </Link>
                      </Button>
                    </div>
                  )}
                  
                  {/* Pagination */}
                  {entries?.meta?.last_page > 1 && (
                    <div className="mt-4">
                      <Pagination>
                        <Pagination.First href={entries?.links?.first} />
                        <Pagination.Previous href={entries?.links?.prev || '#'} disabled={!entries?.links?.prev} />
                        
                        {entries?.meta?.links?.slice(1, -1).map((link, i) => (
                          <Pagination.Item
                            key={i}
                            href={link.url || '#'}
                            active={link.active}
                            disabled={!link.url}
                          >
                            {link.label}
                          </Pagination.Item>
                        ))}
                        
                        <Pagination.Next href={entries?.links?.next || '#'} disabled={!entries?.links?.next} />
                        <Pagination.Last href={entries?.links?.last} />
                      </Pagination>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
