import React from 'react';
import { Link } from '@inertiajs/react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  Star, 
  MessageSquare, 
  ArrowUpRight, 
  TrendingUp,
  TrendingDown,
  Banknote,
  BarChart2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

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
  trade_outcome: 'win' | 'loss' | 'breakeven' | 'pending' | null;
  profit_loss: number | null;
  profit_loss_percentage: number | null;
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

interface JournalEntryCardProps {
  entry: JournalEntry;
  getEntryTypeColor: (type: string) => string;
  getOutcomeColor: (outcome: string | null) => string;
}

export default function JournalEntryCard({ 
  entry, 
  getEntryTypeColor,
  getOutcomeColor 
}: JournalEntryCardProps) {
  // Format currency
  const formatCurrency = (value: number | null) => {
    if (value === null) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  // Format percentage
  const formatPercentage = (value: number | null) => {
    if (value === null) return '-';
    return `${value.toFixed(2)}%`;
  };

  // Format date
  const formatDate = (date: string | null) => {
    if (!date) return 'N/A';
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">
              <Link 
                href={`/trading-journal/${entry.id}`}
                className="hover:text-primary transition-colors duration-200"
              >
                {entry.title}
              </Link>
            </CardTitle>
            <CardDescription className="flex items-center mt-1">
              <Calendar className="h-3.5 w-3.5 mr-1" />
              {formatDate(entry.trade_date || entry.created_at)}
              
              {entry.currency_pair && (
                <>
                  <span className="mx-1">•</span>
                  <span>{entry.currency_pair}</span>
                </>
              )}
              
              {entry.timeframe && (
                <>
                  <span className="mx-1">•</span>
                  <span>{entry.timeframe}</span>
                </>
              )}
            </CardDescription>
          </div>
          
          <div className="flex items-center space-x-1">
            <Badge className={getEntryTypeColor(entry.entry_type)}>
              {entry.entry_type.charAt(0).toUpperCase() + entry.entry_type.slice(1)}
            </Badge>
            
            {entry.trade_outcome && (
              <Badge className={getOutcomeColor(entry.trade_outcome)}>
                {entry.trade_outcome.charAt(0).toUpperCase() + entry.trade_outcome.slice(1)}
              </Badge>
            )}
            
            {entry.is_favorite && (
              <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/30">
                <Star className="h-3 w-3 mr-1 fill-current" />
                Favorite
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pb-2">
        {entry.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {entry.description}
          </p>
        )}
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          {entry.entry_price && (
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground mb-1 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                Entry Price
              </span>
              <span className="font-medium">{entry.entry_price}</span>
            </div>
          )}
          
          {entry.stop_loss && (
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground mb-1 flex items-center">
                <TrendingDown className="h-3 w-3 mr-1" />
                Stop Loss
              </span>
              <span className="font-medium">{entry.stop_loss}</span>
            </div>
          )}
          
          {entry.take_profit && (
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground mb-1 flex items-center">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                Take Profit
              </span>
              <span className="font-medium">{entry.take_profit}</span>
            </div>
          )}
          
          {entry.risk_reward_ratio && (
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground mb-1 flex items-center">
                <BarChart2 className="h-3 w-3 mr-1" />
                Risk/Reward
              </span>
              <span className="font-medium">
                {typeof entry.risk_reward_ratio === 'number' ? entry.risk_reward_ratio.toFixed(2) : 'N/A'}
              </span>
            </div>
          )}
        </div>
        
        {entry.profit_loss && (
          <div className="mt-3 flex items-center">
            <Banknote className="h-4 w-4 mr-1" />
            <span className={`font-medium ${entry.profit_loss >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {formatCurrency(entry.profit_loss)}
              {entry.profit_loss_percentage && (
                <span className="ml-1 text-sm">
                  ({entry.profit_loss_percentage >= 0 ? '+' : ''}{formatPercentage(entry.profit_loss_percentage)})
                </span>
              )}
            </span>
          </div>
        )}
        
        {entry.tags && entry.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {entry.tags.map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="pt-2 flex justify-between items-center text-sm text-muted-foreground">
        <div className="flex items-center">
          <MessageSquare className="h-3.5 w-3.5 mr-1" />
          {entry.comments.length} comment{entry.comments.length !== 1 ? 's' : ''}
        </div>
        
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/trading-journal/${entry.id}`}>
            View Details
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
