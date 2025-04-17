import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Tag,
  X,
  Star,
  Plus
} from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';

interface TradingPosition {
  id: string;
  currency_pair: string;
  trade_type: 'BUY' | 'SELL';
  profit_loss: number;
}

interface CreateJournalProps {
  related_trade: TradingPosition | null;
  currency_pairs: string[];
  timeframes: string[];
  indicators: string[];
}

interface JournalEntryFormData {
  title: string;
  description: string;
  entry_type: 'idea' | 'strategy' | 'analysis' | 'review';
  market_condition: string | null;
  currency_pair: string | null;
  timeframe: string | null;
  entry_price: string; 
  stop_loss: string; 
  take_profit: string; 
  setup_notes: string;
  entry_reason: string;
  exit_reason: string;
  lessons_learned: string;
  indicators_used: string[];
  screenshots: File[];
  related_trade_id: string | number | null; 
  trade_outcome: 'win' | 'loss' | 'breakeven' | null;
  profit_loss: number | null; 
  profit_loss_percentage: string; 
  emotional_state: string | null;
  trade_rating: number | null;
  followed_plan: boolean;
  is_favorite: boolean;
  tags: string[];
  trade_date: string;
  position_size: number | null;
  risk_percentage: number | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any; // Add index signature for Inertia compatibility
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
    title: 'Create Entry',
    href: '#',
  },
];

export default function JournalCreate({ 
  related_trade,
  currency_pairs,
  timeframes,
  indicators
}: CreateJournalProps) {
  // Form state
  const { data, setData, post, processing, errors } = useForm<JournalEntryFormData>({
    title: '',
    description: '',
    entry_type: 'idea',
    market_condition: null as string | null,
    currency_pair: related_trade ? related_trade.currency_pair : (null as string | null),
    timeframe: null as string | null,
    entry_price: '',
    stop_loss: '',
    take_profit: '',
    setup_notes: '',
    entry_reason: '',
    exit_reason: '',
    lessons_learned: '',
    indicators_used: [] as string[],
    screenshots: [] as File[],
    related_trade_id: related_trade ? related_trade.id : null,
    trade_outcome: null as 'win' | 'loss' | 'breakeven' | null,
    profit_loss: related_trade ? related_trade.profit_loss : null,
    profit_loss_percentage: '',
    emotional_state: null as string | null,
    trade_rating: null as number | null,
    followed_plan: false, 
    is_favorite: false, 
    tags: [] as string[],
    trade_date: format(new Date(), 'yyyy-MM-dd'),
    position_size: null,
    risk_percentage: null,
  });
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post('/trading-journal');
  };
  
  // Handle tag input
  const [tagInput, setTagInput] = useState('');
  
  const addTag = () => {
    if (tagInput.trim() && !data.tags.includes(tagInput.trim())) {
      setData('tags', [...data.tags, tagInput.trim()]);
      setTagInput('');
    }
  };
  
  const removeTag = (tag: string) => {
    setData('tags', data.tags.filter(t => t !== tag));
  };
  
  // Handle indicators
  const toggleIndicator = (indicator: string) => {
    if (data.indicators_used.includes(indicator)) {
      setData('indicators_used', data.indicators_used.filter(i => i !== indicator));
    } else {
      setData('indicators_used', [...data.indicators_used, indicator]);
    }
  };
  
  // Handle trade rating
  const handleRatingChange = (rating: number) => {
    setData('trade_rating', rating);
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Create Journal Entry" />
      <div className="flex h-full flex-1 flex-col gap-4 p-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center">
            <Button variant="outline" size="sm" asChild className="mr-2">
              <Link href="/trading-journal">
                <X className="h-4 w-4 mr-1" />
                Back
              </Link>
            </Button>
            <h1 className="text-2xl font-bold">Create Journal Entry</h1>
          </div>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={data.title}
                    onChange={(e) => setData('title', e.target.value)}
                    placeholder="Enter a title for this journal entry"
                  />
                  {errors.title && (
                    <p className="text-sm text-red-500">{errors.title}</p>
                  )}
                </div>
                
                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={data.description}
                    onChange={(e) => setData('description', e.target.value)}
                    placeholder="Provide a brief description"
                    rows={3}
                  />
                </div>
                
                {/* Entry Type */}
                <div className="space-y-2">
                  <Label htmlFor="entry_type">Entry Type</Label>
                  <Select
                    value={data.entry_type}
                    onValueChange={(value) => setData('entry_type', value as JournalEntryFormData['entry_type'])}
                  >
                    <SelectTrigger id="entry_type">
                      <SelectValue placeholder="Select entry type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="idea">Idea</SelectItem>
                      <SelectItem value="strategy">Strategy</SelectItem>
                      <SelectItem value="analysis">Analysis</SelectItem>
                      <SelectItem value="review">Review</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.entry_type && (
                    <p className="text-sm text-red-500">{errors.entry_type}</p>
                  )}
                </div>
                
                {/* Date */}
                <div className="space-y-2">
                  <Label htmlFor="trade_date">Date</Label>
                  <Input
                    id="trade_date"
                    type="date"
                    value={data.trade_date}
                    onChange={(e) => setData('trade_date', e.target.value)}
                  />
                </div>
                
                {/* Favorite */}
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="is_favorite" className="cursor-pointer">
                    <div className="flex items-center">
                      <Star className="h-4 w-4 mr-2 text-amber-500" />
                      Mark as Favorite
                    </div>
                  </Label>
                  <Switch
                    id="is_favorite"
                    checked={data.is_favorite}
                    onCheckedChange={(checked: boolean) => setData('is_favorite', checked)}
                  />
                </div>
              </CardContent>
            </Card>
            
            {/* Trade Details */}
            <Card>
              <CardHeader>
                <CardTitle>Trade Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Currency Pair */}
                  <div className="space-y-2">
                    <Label htmlFor="currency_pair">Currency Pair</Label>
                    <Select
                      value={data.currency_pair || ''}
                      onValueChange={(value) => setData('currency_pair', value || null)}
                    >
                      <SelectTrigger id="currency_pair">
                        <SelectValue placeholder="Select pair..." />
                      </SelectTrigger>
                      <SelectContent>
                        {currency_pairs.map((pair) => (
                          <SelectItem key={pair} value={pair}>
                            {pair} {/* Ensure pair is not empty */}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Timeframe */}
                  <div className="space-y-2">
                    <Label htmlFor="timeframe">Timeframe</Label>
                    <Select
                      value={data.timeframe || ''}
                      onValueChange={(value) => setData('timeframe', value || null)}
                    >
                      <SelectTrigger id="timeframe">
                        <SelectValue placeholder="Select timeframe..." />
                      </SelectTrigger>
                      <SelectContent>
                        {timeframes.map((tf) => (
                          <SelectItem key={tf} value={tf}>
                            {tf} {/* Ensure timeframe is not empty */}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Entry Price */}
                  <div className="space-y-2">
                    <Label htmlFor="entry_price">Entry Price</Label>
                    <Input
                      id="entry_price"
                      type="number"
                      step="0.00001"
                      value={data.entry_price}
                      onChange={(e) => setData('entry_price', e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  
                  {/* Stop Loss */}
                  <div className="space-y-2">
                    <Label htmlFor="stop_loss">Stop Loss</Label>
                    <Input
                      id="stop_loss"
                      type="number"
                      step="0.00001"
                      value={data.stop_loss}
                      onChange={(e) => setData('stop_loss', e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  
                  {/* Take Profit */}
                  <div className="space-y-2">
                    <Label htmlFor="take_profit">Take Profit</Label>
                    <Input
                      id="take_profit"
                      type="number"
                      step="0.00001"
                      value={data.take_profit}
                      onChange={(e) => setData('take_profit', e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  
                  {/* Position Size */}
                  <div className="space-y-2">
                    <Label htmlFor="position_size">Position Size</Label>
                    <Input
                      id="position_size"
                      type="text"
                      inputMode="decimal"
                      value={data.position_size === null ? '' : String(data.position_size)}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '') {
                          setData('position_size', null);
                        } else {
                          const parsedValue = parseFloat(value);
                          if (!isNaN(parsedValue)) {
                            setData('position_size', parsedValue);
                          }
                        }
                      }}
                      placeholder="e.g., 0.5 or 10000"
                      className={errors.position_size ? 'border-red-500' : ''}
                    />
                    {errors.position_size && <p className="text-sm text-red-600">{errors.position_size}</p>}
                  </div>
                  
                  {/* Risk Percentage */}
                  <div className="space-y-2">
                    <Label htmlFor="risk_percentage">Risk Percentage (%)</Label>
                    <Input
                      id="risk_percentage"
                      type="text"
                      inputMode="decimal"
                      value={data.risk_percentage === null ? '' : String(data.risk_percentage)}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '') {
                          setData('risk_percentage', null);
                        } else {
                          const parsedValue = parseFloat(value);
                          if (!isNaN(parsedValue)) {
                            setData('risk_percentage', parsedValue);
                          }
                        }
                      }}
                      placeholder="e.g., 1.5"
                      className={errors.risk_percentage ? 'border-red-500' : ''}
                    />
                    {errors.risk_percentage && <p className="text-sm text-red-600">{errors.risk_percentage}</p>}
                  </div>
                  
                  {/* Market Condition */}
                  <div className="space-y-2">
                    <Label htmlFor="market_condition">Market Condition</Label>
                    <Select
                      value={data.market_condition || ''}
                      onValueChange={(value) => setData('market_condition', value || null)}
                    >
                      <SelectTrigger id="market_condition">
                        <SelectValue placeholder="Select condition..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bullish">Bullish</SelectItem>
                        <SelectItem value="bearish">Bearish</SelectItem>
                        <SelectItem value="neutral">Neutral</SelectItem>
                        <SelectItem value="volatile">Volatile</SelectItem>
                        <SelectItem value="ranging">Ranging</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {/* Indicators */}
                <div className="mt-6 space-y-2">
                  <Label>Indicators Used</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {indicators.map((indicator) => (
                      <Badge
                        key={indicator}
                        variant={data.indicators_used.includes(indicator) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleIndicator(indicator)}
                      >
                        {indicator}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Setup Notes */}
                <div className="space-y-2">
                  <Label htmlFor="setup_notes">Setup Notes</Label>
                  <Textarea
                    id="setup_notes"
                    value={data.setup_notes}
                    onChange={(e) => setData('setup_notes', e.target.value)}
                    placeholder="Describe your trading setup"
                    rows={3}
                  />
                </div>
                
                {/* Entry Reason */}
                <div className="space-y-2">
                  <Label htmlFor="entry_reason">Entry Reason</Label>
                  <Textarea
                    id="entry_reason"
                    value={data.entry_reason}
                    onChange={(e) => setData('entry_reason', e.target.value)}
                    placeholder="Why did you enter this trade?"
                    rows={3}
                  />
                </div>
                
                {/* Exit Reason */}
                <div className="space-y-2">
                  <Label htmlFor="exit_reason">Exit Reason</Label>
                  <Textarea
                    id="exit_reason"
                    value={data.exit_reason}
                    onChange={(e) => setData('exit_reason', e.target.value)}
                    placeholder="Why did you exit this trade?"
                    rows={3}
                  />
                </div>
                
                {/* Lessons Learned */}
                <div className="space-y-2">
                  <Label htmlFor="lessons_learned">Lessons Learned</Label>
                  <Textarea
                    id="lessons_learned"
                    value={data.lessons_learned}
                    onChange={(e) => setData('lessons_learned', e.target.value)}
                    placeholder="What did you learn from this trade?"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
            
            {/* Outcome */}
            <Card>
              <CardHeader>
                <CardTitle>Outcome</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Trade Outcome */}
                  <div className="space-y-2">
                    <Label htmlFor="trade_outcome">Trade Outcome</Label>
                    <Select
                      value={data.trade_outcome || ''}
                      onValueChange={(value) => setData('trade_outcome', (value || null) as JournalEntryFormData['trade_outcome'])}
                    >
                      <SelectTrigger id="trade_outcome">
                        <SelectValue placeholder="Select outcome..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="win">Win</SelectItem>
                        <SelectItem value="loss">Loss</SelectItem>
                        <SelectItem value="breakeven">Breakeven</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Profit/Loss */}
                  <div className="space-y-2">
                    <Label htmlFor="profit_loss">Profit/Loss</Label>
                    <Input
                      id="profit_loss"
                      type="text" 
                      inputMode="decimal"
                      value={data.profit_loss === null ? '' : String(data.profit_loss)} 
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '') {
                          setData('profit_loss', null);
                        } else {
                          const parsedValue = parseFloat(value);
                          if (!isNaN(parsedValue)) {
                            setData('profit_loss', parsedValue);
                          }
                        }
                      }}
                      placeholder="e.g., 150.75 or -50"
                      className={errors.profit_loss ? 'border-red-500' : ''}
                    />
                    {errors.profit_loss && <p className="text-sm text-red-600">{errors.profit_loss}</p>}
                  </div>
                  
                  {/* Profit/Loss Percentage */}
                  <div className="space-y-2">
                    <Label htmlFor="profit_loss_percentage">Profit/Loss Percentage (%)</Label>
                    <Input
                      id="profit_loss_percentage"
                      type="number"
                      step="0.01"
                      value={data.profit_loss_percentage}
                      onChange={(e) => setData('profit_loss_percentage', e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  
                  {/* Emotional State */}
                  <div className="space-y-2">
                    <Label htmlFor="emotional_state">Emotional State</Label>
                    <Select
                      value={data.emotional_state || ''}
                      onValueChange={(value) => setData('emotional_state', value || null)}
                    >
                      <SelectTrigger id="emotional_state">
                        <SelectValue placeholder="Select emotional state" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="confident">Confident</SelectItem>
                        <SelectItem value="fearful">Fearful</SelectItem>
                        <SelectItem value="greedy">Greedy</SelectItem>
                        <SelectItem value="patient">Patient</SelectItem>
                        <SelectItem value="impulsive">Impulsive</SelectItem>
                        <SelectItem value="calm">Calm</SelectItem>
                        <SelectItem value="stressed">Stressed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Followed Plan */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="followed_plan"
                        checked={data.followed_plan}
                        onCheckedChange={(checked: boolean) => setData('followed_plan', checked)}
                      />
                      <Label htmlFor="followed_plan" className="cursor-pointer">Yes</Label>
                    </div>
                  </div>
                  
                  {/* Trade Rating */}
                  <div className="space-y-2">
                    <Label>Trade Rating</Label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <StarRatingButton
                          key={rating}
                          ratingValue={rating}
                          currentRating={data.trade_rating}
                          onRatingChange={handleRatingChange}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Screenshots */}
            <Card>
              <CardHeader>
                <CardTitle>Screenshots</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="screenshots">Upload Screenshots</Label>
                  <Input
                    id="screenshots"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      setData('screenshots', files);
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    Upload screenshots of your trade setup, analysis, or results. Max 2MB per file.
                  </p>
                </div>
              </CardContent>
            </Card>
            
            {/* Tags */}
            <Card>
              <CardHeader>
                <CardTitle>Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Current Tags */}
                  {data.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {data.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          {tag}
                          <button
                            type="button"
                            className="ml-1 hover:text-red-500"
                            onClick={() => removeTag(tag)}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                  
                  {/* Add New Tag */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a tag"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addTag();
                        }
                      }}
                    />
                    <Button type="button" onClick={addTag} variant="outline">
                      <Tag className="h-4 w-4 mr-2" />
                      Add
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Related Trade */}
            {related_trade && (
              <Card>
                <CardHeader>
                  <CardTitle>Related Trade</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 border rounded-md bg-muted/50">
                      <div className="flex flex-col space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Pair:</span>
                          <span className="text-sm font-medium">{related_trade.currency_pair}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Type:</span>
                          <span className="text-sm font-medium">
                            {related_trade.trade_type === 'BUY' ? (
                              <span className="text-green-600 dark:text-green-400">Buy</span>
                            ) : (
                              <span className="text-red-600 dark:text-red-400">Sell</span>
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">P/L:</span>
                          <span className={`text-sm font-medium ${
                            related_trade.profit_loss >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                          }`}>
                            {new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: 'USD',
                            }).format(related_trade.profit_loss)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      This journal entry will be linked to the selected trade.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Submit Button */}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                asChild
              >
                <Link href="/trading-journal">
                  Cancel
                </Link>
              </Button>
              
              <Button
                type="submit"
                disabled={processing}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Entry
              </Button>
            </div>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}

// Helper component for star rating buttons
interface StarRatingButtonProps {
  ratingValue: number;
  currentRating: number | null;
  onRatingChange: (rating: number) => void;
}

const StarRatingButton: React.FC<StarRatingButtonProps> = ({ 
  ratingValue, 
  currentRating, 
  onRatingChange 
}) => (
  <Button
    type="button"
    variant={currentRating === ratingValue ? 'default' : 'outline'}
    size="icon"
    onClick={() => onRatingChange(ratingValue)}
    aria-label={`Rate ${ratingValue} star${ratingValue > 1 ? 's' : ''}`}
    className={`transition-colors duration-200 ease-in-out ${currentRating === ratingValue ? 'bg-primary text-primary-foreground' : ''}`}
  >
    <Star 
      className={`h-4 w-4 transition-colors duration-200 ease-in-out ${currentRating !== null && currentRating >= ratingValue ? 'fill-yellow-400 text-yellow-500' : 'text-muted-foreground'}`}
    />
  </Button>
);
