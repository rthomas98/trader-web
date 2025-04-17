import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Card, CardContent, CardHeader, CardFooter, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  BookText, 
  Calendar, 
  Clock, 
  Edit, 
  MessageSquare, 
  Star, 
  StarOff,
  Banknote,
  ChevronLeft,
  Trash2,
  Send,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Smile,
  Image
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

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

interface JournalShowProps {
  entry: JournalEntry;
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
  {
    title: 'Entry Details',
    href: '#',
  },
];

export default function JournalShow({ entry }: JournalShowProps) {
  const [activeTab, setActiveTab] = useState('details');
  
  // Form for adding comments
  const { data, setData, post, processing, reset, errors } = useForm({
    content: '',
  });
  
  // Handle comment submission
  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post(`/trading-journal/${entry.id}/comments`, {
      onSuccess: () => reset('content'),
    });
  };
  
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
    return format(new Date(date), 'PPP');
  };
  
  // Get entry type badge color
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
  
  // Get outcome badge color
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
  
  // Get emotional state icon
  const getEmotionalStateIcon = (state: string | null) => {
    switch (state) {
      case 'confident':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'fearful':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'greedy':
        return <Banknote className="h-4 w-4 text-purple-500" />;
      case 'patient':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'impulsive':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'calm':
        return <Smile className="h-4 w-4 text-green-500" />;
      case 'stressed':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };
  
  // Toggle favorite status
  const toggleFavorite = () => {
    post(`/trading-journal/${entry.id}/favorite`);
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`Journal: ${entry.title}`} />
      <div className="flex h-full flex-1 flex-col gap-4 p-4">
        {/* Header with actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center">
            <Button variant="outline" size="sm" asChild className="mr-2">
              <Link href="/trading-journal">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Link>
            </Button>
            <h1 className="text-2xl font-bold">{entry.title}</h1>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleFavorite}
            >
              {entry.is_favorite ? (
                <>
                  <StarOff className="h-4 w-4 mr-2" />
                  Remove Favorite
                </>
              ) : (
                <>
                  <Star className="h-4 w-4 mr-2" />
                  Add to Favorites
                </>
              )}
            </Button>
            
            <Button asChild variant="outline" size="sm">
              <Link href={`/trading-journal/${entry.id}/edit`}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Link>
            </Button>
            
            <Button variant="destructive" size="sm" asChild>
              <Link
                href={`/trading-journal/${entry.id}`}
                method="delete"
                as="button"
                type="button"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Link>
            </Button>
          </div>
        </div>
        
        {/* Entry metadata */}
        <div className="flex flex-wrap gap-2 items-center">
          <Badge className={getEntryTypeColor(entry.entry_type)}>
            {entry.entry_type.charAt(0).toUpperCase() + entry.entry_type.slice(1)}
          </Badge>
          
          {entry.trade_outcome && (
            <Badge className={getOutcomeColor(entry.trade_outcome)}>
              {entry.trade_outcome.charAt(0).toUpperCase() + entry.trade_outcome.slice(1)}
            </Badge>
          )}
          
          {entry.currency_pair && (
            <Badge variant="outline">
              {entry.currency_pair}
            </Badge>
          )}
          
          {entry.timeframe && (
            <Badge variant="outline">
              {entry.timeframe}
            </Badge>
          )}
          
          <div className="flex items-center text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 mr-1" />
            {formatDate(entry.trade_date || entry.created_at)}
          </div>
        </div>
        
        {/* Main content with tabs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Entry details */}
          <div className="md:col-span-2">
            <Card>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <CardHeader className="pb-3">
                  <TabsList className="w-full">
                    <TabsTrigger value="details" className="flex-1">Details</TabsTrigger>
                    <TabsTrigger value="analysis" className="flex-1">Analysis</TabsTrigger>
                    <TabsTrigger value="screenshots" className="flex-1">Screenshots</TabsTrigger>
                    <TabsTrigger value="comments" className="flex-1">Comments ({entry.comments.length})</TabsTrigger>
                  </TabsList>
                </CardHeader>
                
                <CardContent>
                  <TabsContent value="details" className="mt-0">
                    {entry.description && (
                      <div className="mb-6">
                        <h3 className="text-lg font-medium mb-2">Description</h3>
                        <p className="text-muted-foreground whitespace-pre-line">{entry.description}</p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      {/* Trade details */}
                      {(entry.entry_price || entry.stop_loss || entry.take_profit) && (
                        <div>
                          <h3 className="text-lg font-medium mb-3">Trade Details</h3>
                          <div className="space-y-3">
                            {entry.entry_price && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Entry Price:</span>
                                <span className="font-medium">{entry.entry_price}</span>
                              </div>
                            )}
                            
                            {entry.stop_loss && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Stop Loss:</span>
                                <span className="font-medium">{entry.stop_loss}</span>
                              </div>
                            )}
                            
                            {entry.take_profit && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Take Profit:</span>
                                <span className="font-medium">{entry.take_profit}</span>
                              </div>
                            )}
                            
                            {entry.risk_reward_ratio && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Risk/Reward Ratio:</span>
                                <span className="font-medium">
                                  {(() => {
                                    const value = entry.risk_reward_ratio;
                                    const numValue = typeof value === 'string' ? parseFloat(value) : (typeof value === 'number' ? value : NaN);
                                    return !isNaN(numValue) ? numValue.toFixed(2) : 'N/A';
                                  })()}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Risk management */}
                      {(entry.position_size || entry.risk_percentage) && (
                        <div>
                          <h3 className="text-lg font-medium mb-3">Risk Management</h3>
                          <div className="space-y-3">
                            {entry.position_size && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Position Size:</span>
                                <span className="font-medium">{formatCurrency(entry.position_size)}</span>
                              </div>
                            )}
                            
                            {entry.risk_percentage && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Risk Percentage:</span>
                                <span className="font-medium">{formatPercentage(entry.risk_percentage)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Outcome */}
                    {entry.trade_outcome && (
                      <div className="mb-6">
                        <h3 className="text-lg font-medium mb-3">Outcome</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Result:</span>
                              <span className={`font-medium ${
                                entry.trade_outcome === 'win' ? 'text-green-600 dark:text-green-400' :
                                entry.trade_outcome === 'loss' ? 'text-red-600 dark:text-red-400' :
                                ''
                              }`}>
                                {entry.trade_outcome.charAt(0).toUpperCase() + entry.trade_outcome.slice(1)}
                              </span>
                            </div>
                            
                            {entry.profit_loss && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Profit/Loss:</span>
                                <span className={`font-medium ${
                                  entry.profit_loss >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                }`}>
                                  {formatCurrency(entry.profit_loss)}
                                  {entry.profit_loss_percentage && (
                                    <span className="ml-1 text-sm">
                                      ({entry.profit_loss_percentage >= 0 ? '+' : ''}{formatPercentage(entry.profit_loss_percentage)})
                                    </span>
                                  )}
                                </span>
                              </div>
                            )}
                          </div>
                          
                          <div className="space-y-3">
                            {entry.followed_plan !== null && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Followed Trading Plan:</span>
                                <span className={`font-medium ${
                                  entry.followed_plan ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                }`}>
                                  {entry.followed_plan ? 'Yes' : 'No'}
                                </span>
                              </div>
                            )}
                            
                            {entry.emotional_state && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Emotional State:</span>
                                <span className="font-medium flex items-center">
                                  {getEmotionalStateIcon(entry.emotional_state)}
                                  <span className="ml-1">
                                    {entry.emotional_state.charAt(0).toUpperCase() + entry.emotional_state.slice(1)}
                                  </span>
                                </span>
                              </div>
                            )}
                            
                            {entry.trade_rating && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Trade Rating:</span>
                                <span className="font-medium">
                                  {Array(5).fill(0).map((_, i) => (
                                    <Star 
                                      key={i} 
                                      className={`inline h-4 w-4 ${i < entry.trade_rating! ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground'}`} 
                                    />
                                  ))}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Indicators */}
                    {entry.indicators_used && entry.indicators_used.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-lg font-medium mb-2">Indicators Used</h3>
                        <div className="flex flex-wrap gap-2">
                          {entry.indicators_used.map((indicator, index) => (
                            <Badge key={index} variant="secondary">
                              {indicator}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Tags */}
                    {entry.tags && entry.tags.length > 0 && (
                      <div>
                        <h3 className="text-lg font-medium mb-2">Tags</h3>
                        <div className="flex flex-wrap gap-2">
                          {entry.tags.map((tag, index) => (
                            <Badge key={index} variant="outline">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="analysis" className="mt-0">
                    {/* Setup Notes */}
                    {entry.setup_notes && (
                      <div className="mb-6">
                        <h3 className="text-lg font-medium mb-2">Setup Notes</h3>
                        <p className="text-muted-foreground whitespace-pre-line">{entry.setup_notes}</p>
                      </div>
                    )}
                    
                    {/* Entry Reason */}
                    {entry.entry_reason && (
                      <div className="mb-6">
                        <h3 className="text-lg font-medium mb-2">Entry Reason</h3>
                        <p className="text-muted-foreground whitespace-pre-line">{entry.entry_reason}</p>
                      </div>
                    )}
                    
                    {/* Exit Reason */}
                    {entry.exit_reason && (
                      <div className="mb-6">
                        <h3 className="text-lg font-medium mb-2">Exit Reason</h3>
                        <p className="text-muted-foreground whitespace-pre-line">{entry.exit_reason}</p>
                      </div>
                    )}
                    
                    {/* Lessons Learned */}
                    {entry.lessons_learned && (
                      <div>
                        <h3 className="text-lg font-medium mb-2">Lessons Learned</h3>
                        <p className="text-muted-foreground whitespace-pre-line">{entry.lessons_learned}</p>
                      </div>
                    )}
                    
                    {!entry.setup_notes && !entry.entry_reason && !entry.exit_reason && !entry.lessons_learned && (
                      <div className="text-center py-8">
                        <BookText className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                        <h3 className="mt-4 text-lg font-medium">No analysis information</h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Edit this entry to add setup notes, entry/exit reasons, and lessons learned.
                        </p>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="screenshots" className="mt-0">
                    {entry.screenshots && entry.screenshots.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {entry.screenshots.map((screenshot, index) => (
                          <div key={index} className="border rounded-md overflow-hidden">
                            <a href={`/storage/${screenshot}`} target="_blank" rel="noopener noreferrer">
                              <img 
                                src={`/storage/${screenshot}`} 
                                alt={`Screenshot ${index + 1}`} 
                                className="w-full h-auto object-cover hover:opacity-90 transition-opacity"
                              />
                            </a>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Image className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                        <h3 className="mt-4 text-lg font-medium">No screenshots</h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Edit this entry to add screenshots of your trade setup or analysis.
                        </p>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="comments" className="mt-0">
                    {/* Comment form */}
                    <form onSubmit={handleCommentSubmit} className="mb-6">
                      <div className="flex gap-4">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>U</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <Textarea
                            placeholder="Add a comment..."
                            className="mb-2"
                            value={data.content}
                            onChange={(e) => setData('content', e.target.value)}
                          />
                          {errors.content && (
                            <p className="text-sm text-red-500 mb-2">{errors.content}</p>
                          )}
                          <Button type="submit" disabled={processing}>
                            <Send className="h-4 w-4 mr-2" />
                            Post Comment
                          </Button>
                        </div>
                      </div>
                    </form>
                    
                    {/* Comments list */}
                    {entry.comments.length > 0 ? (
                      <div className="space-y-4">
                        {entry.comments.map((comment) => (
                          <div key={comment.id} className="flex gap-4">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback>
                                {comment.user.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium">{comment.user.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                                </span>
                              </div>
                              <p className="text-sm whitespace-pre-line">{comment.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                        <h3 className="mt-4 text-lg font-medium">No comments yet</h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Be the first to add a comment to this journal entry.
                        </p>
                      </div>
                    )}
                  </TabsContent>
                </CardContent>
              </Tabs>
            </Card>
          </div>
          
          {/* Sidebar */}
          <div className="md:col-span-1 space-y-4">
            {/* Related Trade */}
            {entry.related_trade && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Related Trade</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Pair:</span>
                      <span className="text-sm font-medium">{entry.related_trade.currency_pair}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Type:</span>
                      <span className="text-sm font-medium">
                        {entry.related_trade.trade_type === 'BUY' ? (
                          <span className="text-green-600 dark:text-green-400">Buy</span>
                        ) : (
                          <span className="text-red-600 dark:text-red-400">Sell</span>
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">P/L:</span>
                      <span className={`text-sm font-medium ${
                        entry.related_trade.profit_loss >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {formatCurrency(entry.related_trade.profit_loss)}
                      </span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-0">
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <Link href={`/trading/${entry.related_trade.id}`}>
                      View Trade Details
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            )}
            
            {/* Market Conditions */}
            {entry.market_condition && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Market Conditions</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge className="mb-2">
                    {entry.market_condition.charAt(0).toUpperCase() + entry.market_condition.slice(1)}
                  </Badge>
                  
                  <div className="text-sm text-muted-foreground">
                    {entry.market_condition === 'bullish' && 'Strong upward trend with buying pressure.'}
                    {entry.market_condition === 'bearish' && 'Strong downward trend with selling pressure.'}
                    {entry.market_condition === 'neutral' && 'No clear directional bias in the market.'}
                    {entry.market_condition === 'volatile' && 'High price fluctuations with increased uncertainty.'}
                    {entry.market_condition === 'ranging' && 'Price moving sideways between support and resistance.'}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Quick Actions */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href={`/trading-journal/create?entry_type=${entry.entry_type}`}>
                    <BookText className="h-4 w-4 mr-2" />
                    Create Similar Entry
                  </Link>
                </Button>
                
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href="/trading-journal">
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Back to Journal
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
