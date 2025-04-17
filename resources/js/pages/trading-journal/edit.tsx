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
  ChevronLeft, 
  Save,
  Tag,
  X,
  Star
} from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';

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
}

interface JournalEditProps {
  entry: JournalEntry;
  currency_pairs: string[];
  timeframes: string[];
  indicators: string[];
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
    title: 'Edit Entry',
    href: '#',
  },
];

export default function JournalEdit({ 
  entry,
  currency_pairs,
  timeframes,
  indicators
}: JournalEditProps) {
  // Form state
  const { data, setData, put, processing, errors } = useForm({
    title: entry.title,
    description: entry.description || '',
    entry_type: entry.entry_type,
    market_condition: entry.market_condition || '',
    currency_pair: entry.currency_pair || '',
    timeframe: entry.timeframe || '',
    entry_price: entry.entry_price || '',
    stop_loss: entry.stop_loss || '',
    take_profit: entry.take_profit || '',
    risk_reward_ratio: entry.risk_reward_ratio || '',
    position_size: entry.position_size || '',
    risk_percentage: entry.risk_percentage || '',
    setup_notes: entry.setup_notes || '',
    entry_reason: entry.entry_reason || '',
    exit_reason: entry.exit_reason || '',
    lessons_learned: entry.lessons_learned || '',
    indicators_used: entry.indicators_used || [],
    keep_screenshots: entry.screenshots || [],
    new_screenshots: [] as File[],
    related_trade_id: entry.related_trade_id || '',
    trade_outcome: entry.trade_outcome || '',
    profit_loss: entry.profit_loss || '',
    profit_loss_percentage: entry.profit_loss_percentage ?? '',
    emotional_state: entry.emotional_state || '',
    trade_rating: entry.trade_rating || 0,
    followed_plan: entry.followed_plan,
    is_favorite: entry.is_favorite,
    tags: entry.tags || [],
    trade_date: entry.trade_date ? format(new Date(entry.trade_date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
  });
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    put(route('trading-journal.update', entry.id));
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
  
  // Handle screenshot removal
  const removeScreenshot = (path: string) => {
    setData('keep_screenshots', data.keep_screenshots.filter(s => s !== path));
  };
  
  // Handle trade rating
  const setTradeRating = (rating: number) => {
    setData('trade_rating', rating);
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`Edit Journal: ${entry.title}`} />
      <div className="flex h-full flex-1 flex-col gap-4 p-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center">
            <Button variant="outline" size="sm" asChild className="mr-2">
              <Link href={`/trading-journal/${entry.id}`}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Link>
            </Button>
            <h1 className="text-2xl font-bold">Edit Journal Entry</h1>
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
                    onValueChange={(value) => setData('entry_type', value as JournalEntry['entry_type'])}
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
                    onCheckedChange={(checked) => setData('is_favorite', checked)}
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
                      value={data.currency_pair}
                      onValueChange={(value) => setData('currency_pair', value)}
                    >
                      <SelectTrigger id="currency_pair">
                        <SelectValue placeholder="Select currency pair" />
                      </SelectTrigger>
                      <SelectContent>
                        {currency_pairs.map((pair) => (
                          <SelectItem key={pair} value={pair}>
                            {pair}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Timeframe */}
                  <div className="space-y-2">
                    <Label htmlFor="timeframe">Timeframe</Label>
                    <Select
                      value={data.timeframe}
                      onValueChange={(value) => setData('timeframe', value)}
                    >
                      <SelectTrigger id="timeframe">
                        <SelectValue placeholder="Select timeframe" />
                      </SelectTrigger>
                      <SelectContent>
                        {timeframes.map((timeframe) => (
                          <SelectItem key={timeframe} value={timeframe}>
                            {timeframe}
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
                      type="number"
                      step="0.01"
                      value={data.position_size}
                      onChange={(e) => setData('position_size', e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  
                  {/* Risk Percentage */}
                  <div className="space-y-2">
                    <Label htmlFor="risk_percentage">Risk Percentage (%)</Label>
                    <Input
                      id="risk_percentage"
                      type="number"
                      step="0.01"
                      value={data.risk_percentage}
                      onChange={(e) => setData('risk_percentage', e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  
                  {/* Market Condition */}
                  <div className="space-y-2">
                    <Label htmlFor="market_condition">Market Condition</Label>
                    <Select
                      value={data.market_condition}
                      onValueChange={(value) => setData('market_condition', value)}
                    >
                      <SelectTrigger id="market_condition">
                        <SelectValue placeholder="Select market condition" />
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
                      value={data.trade_outcome}
                      onValueChange={(value) => setData('trade_outcome', value)}
                    >
                      <SelectTrigger id="trade_outcome">
                        <SelectValue placeholder="Select outcome" />
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
                      type="number"
                      step="0.01"
                      value={data.profit_loss}
                      onChange={(e) => setData('profit_loss', e.target.value)}
                      placeholder="0.00"
                    />
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
                      value={data.emotional_state}
                      onValueChange={(value) => setData('emotional_state', value)}
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
                    <div className="flex items-center justify-between space-x-2">
                      <Label htmlFor="followed_plan">Followed Trading Plan</Label>
                      <Switch
                        id="followed_plan"
                        checked={data.followed_plan}
                        onCheckedChange={(checked) => setData('followed_plan', checked)}
                      />
                    </div>
                  </div>
                  
                  {/* Trade Rating */}
                  <div className="space-y-2">
                    <Label htmlFor="trade_rating">Trade Rating</Label>
                    <div className="flex items-center space-x-1">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <Star
                          key={rating}
                          className={`h-6 w-6 cursor-pointer ${
                            rating <= data.trade_rating
                              ? 'text-amber-500 fill-amber-500'
                              : 'text-gray-300 dark:text-gray-600'
                          }`}
                          onClick={() => setTradeRating(rating)}
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
                {/* Current Screenshots */}
                {data.keep_screenshots.length > 0 && (
                  <div className="mb-4">
                    <Label className="mb-2 block">Current Screenshots</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {data.keep_screenshots.map((screenshot, index) => (
                        <div key={index} className="relative group border rounded-md overflow-hidden">
                          <img
                            src={`/storage/${screenshot}`}
                            alt={`Screenshot ${index + 1}`}
                            className="w-full h-auto object-cover"
                          />
                          <button
                            type="button"
                            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeScreenshot(screenshot)}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* New Screenshots */}
                <div className="space-y-2">
                  <Label htmlFor="new_screenshots">Add New Screenshots</Label>
                  <Input
                    id="new_screenshots"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      setData('new_screenshots', files);
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
            
            {/* Submit Button */}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                asChild
              >
                <Link href={`/trading-journal/${entry.id}`}>
                  Cancel
                </Link>
              </Button>
              
              <Button
                type="submit"
                disabled={processing}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
