import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ArrowUpRight, ArrowDownLeft, Zap } from 'lucide-react';
import { formatCurrency } from '@/utils';

interface OrderFormProps {
  pair: {
    id: string;
    name: string;
    base_currency?: string;
    quote_currency?: string;
    price: number;
  };
  wallets: {
    id: string;
    name?: string;
    currency?: string;
    balance: number;
    available_balance?: number;
    available?: number;
  }[];
  predictiveEnabled: boolean;
}

export default function OrderForm({ pair, wallets, predictiveEnabled }: OrderFormProps) {
  const [orderType, setOrderType] = useState('LIMIT');
  const [orderSide, setOrderSide] = useState('BUY');
  const [price, setPrice] = useState(pair.price.toString());
  const [amount, setAmount] = useState('');
  const [total, setTotal] = useState('0');
  const [leverage, setLeverage] = useState(1);
  const [useRecommendedSettings, setUseRecommendedSettings] = useState(false);
  const [recommendedSettings, setRecommendedSettings] = useState({
    side: 'BUY',
    price: 0,
    amount: 0,
    leverage: 1,
    stopLoss: 0,
    takeProfit: 0,
    confidence: 0
  });
  
  // Find the wallet that matches the quote currency
  // Support both old and new wallet structures
  const baseCurrency = pair.base_currency || pair.name.split('/')[0];
  const quoteCurrency = pair.quote_currency || pair.name.split('/')[1];
  
  const quoteWallet = wallets.find(wallet => 
    (wallet.currency && wallet.currency === quoteCurrency) || 
    (wallet.name && wallet.name === quoteCurrency)
  );
  
  const availableBalance = quoteWallet?.available_balance || quoteWallet?.available || 0;
  
  // Generate recommended settings based on predictive algorithms
  const generateRecommendedSettings = useCallback(() => {
    // In a real app, this would be based on the predictive algorithms
    // For demo, we'll generate random recommendations
    
    const currentPrice = pair.price;
    const randomFactor = Math.random() * 0.05; // 0-5% deviation
    const direction = Math.random() > 0.5 ? 'BUY' : 'SELL';
    
    let recommendedPrice;
    if (direction === 'BUY') {
      // For buy, recommend slightly lower than market for limit orders
      recommendedPrice = currentPrice * (1 - randomFactor * 0.5);
    } else {
      // For sell, recommend slightly higher than market for limit orders
      recommendedPrice = currentPrice * (1 + randomFactor * 0.5);
    }
    
    // Recommended position size based on available balance
    const recommendedAmount = availableBalance * 0.1 / recommendedPrice; // 10% of available balance
    
    // Recommended leverage based on volatility (simplified)
    const recommendedLeverage = Math.floor(Math.random() * 5) + 1; // 1-5x
    
    // Stop loss and take profit levels
    const stopLossPercentage = direction === 'BUY' ? 0.05 : 0.03; // 5% for buys, 3% for sells
    const takeProfitPercentage = direction === 'BUY' ? 0.1 : 0.07; // 10% for buys, 7% for sells
    
    const stopLoss = direction === 'BUY' 
      ? recommendedPrice * (1 - stopLossPercentage)
      : recommendedPrice * (1 + stopLossPercentage);
      
    const takeProfit = direction === 'BUY'
      ? recommendedPrice * (1 + takeProfitPercentage)
      : recommendedPrice * (1 - takeProfitPercentage);
    
    // Confidence level (random for demo)
    const confidence = Math.floor(65 + Math.random() * 30); // 65-95%
    
    setRecommendedSettings({
      side: direction,
      price: recommendedPrice,
      amount: recommendedAmount,
      leverage: recommendedLeverage,
      stopLoss,
      takeProfit,
      confidence
    });
  }, [pair.price, availableBalance]);
  
  // Update price when pair changes
  useEffect(() => {
    setPrice(pair.price.toString());
    
    // Generate recommended settings if predictive is enabled
    if (predictiveEnabled) {
      generateRecommendedSettings();
    }
  }, [pair, predictiveEnabled, generateRecommendedSettings]);
  
  // Update total when price or amount changes
  useEffect(() => {
    if (price && amount) {
      const calculatedTotal = parseFloat(price) * parseFloat(amount);
      setTotal(calculatedTotal.toFixed(2));
    } else {
      setTotal('0');
    }
  }, [price, amount]);
  
  // Apply recommended settings when toggled
  useEffect(() => {
    if (useRecommendedSettings && predictiveEnabled) {
      setOrderSide(recommendedSettings.side);
      setPrice(recommendedSettings.price.toString());
      setAmount(recommendedSettings.amount.toString());
      setLeverage(recommendedSettings.leverage);
    }
  }, [useRecommendedSettings, recommendedSettings, predictiveEnabled]);
  
  // Handle percentage of balance buttons
  const handlePercentage = (percentage: number) => {
    if (price) {
      const maxAmount = availableBalance * percentage / parseFloat(price);
      setAmount(maxAmount.toFixed(6));
    }
  };
  
  return (
    <div>
      {/* Order Type Tabs */}
      <Tabs defaultValue="LIMIT" className="mb-4" onValueChange={(value) => setOrderType(value)}>
        <TabsList className="grid grid-cols-3 mb-3 bg-[#F9F9F9] dark:bg-[#1A161D]">
          <TabsTrigger value="LIMIT" className="data-[state=active]:bg-[#8D5EB7] data-[state=active]:text-white">Limit</TabsTrigger>
          <TabsTrigger value="MARKET" className="data-[state=active]:bg-[#8D5EB7] data-[state=active]:text-white">Market</TabsTrigger>
          <TabsTrigger value="STOP" className="data-[state=active]:bg-[#8D5EB7] data-[state=active]:text-white">Stop</TabsTrigger>
        </TabsList>
        
        {/* Order Side Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <Button 
            variant={orderSide === 'BUY' ? 'default' : 'outline'} 
            className={orderSide === 'BUY' ? 'bg-green-600 hover:bg-green-700' : 'border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-950'}
            onClick={() => setOrderSide('BUY')}
          >
            <ArrowUpRight className="mr-2 h-4 w-4" />
            Buy
          </Button>
          <Button 
            variant={orderSide === 'SELL' ? 'default' : 'outline'} 
            className={orderSide === 'SELL' ? 'bg-red-600 hover:bg-red-700' : 'border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-950'}
            onClick={() => setOrderSide('SELL')}
          >
            <ArrowDownLeft className="mr-2 h-4 w-4" />
            Sell
          </Button>
        </div>
        
        {/* Order Form Content */}
        <TabsContent value="LIMIT" className="space-y-5">
          {/* Price Input */}
          <div className="space-y-2.5">
            <div className="flex justify-between">
              <Label htmlFor="price">Price ({quoteCurrency})</Label>
              {orderType === 'LIMIT' && (
                <div className="text-sm text-muted-foreground">
                  Market: {formatCurrency(pair.price)}
                </div>
              )}
            </div>
            <Input 
              id="price" 
              type="number" 
              value={price} 
              onChange={(e) => setPrice(e.target.value)}
              className="border-[#8D5EB7]/30 focus:border-[#8D5EB7] dark:focus:border-[#EECEE6]"
              disabled={orderType === 'MARKET'}
            />
          </div>
          
          {/* Amount Input */}
          <div className="space-y-2.5">
            <div className="flex justify-between">
              <Label htmlFor="amount">Amount ({baseCurrency})</Label>
              <div className="text-sm text-muted-foreground">
                Available: {formatCurrency(availableBalance)} {quoteCurrency}
              </div>
            </div>
            <Input 
              id="amount" 
              type="number" 
              value={amount} 
              onChange={(e) => setAmount(e.target.value)}
              className="border-[#8D5EB7]/30 focus:border-[#8D5EB7] dark:focus:border-[#EECEE6]"
            />
            
            {/* Percentage Buttons */}
            <div className="grid grid-cols-4 gap-3 mt-3">
              <Button variant="outline" size="sm" onClick={() => handlePercentage(0.25)} className="text-xs border-[#8D5EB7]/30 hover:bg-[#8D5EB7]/10">
                25%
              </Button>
              <Button variant="outline" size="sm" onClick={() => handlePercentage(0.5)} className="text-xs border-[#8D5EB7]/30 hover:bg-[#8D5EB7]/10">
                50%
              </Button>
              <Button variant="outline" size="sm" onClick={() => handlePercentage(0.75)} className="text-xs border-[#8D5EB7]/30 hover:bg-[#8D5EB7]/10">
                75%
              </Button>
              <Button variant="outline" size="sm" onClick={() => handlePercentage(1)} className="text-xs border-[#8D5EB7]/30 hover:bg-[#8D5EB7]/10">
                100%
              </Button>
            </div>
          </div>
          
          {/* Total */}
          <div className="space-y-2.5">
            <Label htmlFor="total">Total ({quoteCurrency})</Label>
            <Input 
              id="total" 
              type="text" 
              value={total} 
              readOnly 
              className="bg-gray-50 dark:bg-gray-800 border-[#8D5EB7]/30"
            />
          </div>
          
          {/* Leverage Slider */}
          <div className="space-y-2.5 pt-1">
            <div className="flex justify-between">
              <Label htmlFor="leverage">Leverage</Label>
              <span className="text-sm font-medium">{leverage}x</span>
            </div>
            <Slider 
              id="leverage"
              min={1} 
              max={10} 
              step={1} 
              value={[leverage]} 
              onValueChange={(value) => setLeverage(value[0])}
              className="py-4"
            />
            <div className="flex justify-between text-xs text-muted-foreground pt-1 px-1">
              <span>1x</span>
              <span>5x</span>
              <span>10x</span>
            </div>
          </div>
          
          {/* Predictive Trading Section */}
          {predictiveEnabled && (
            <div className="space-y-2.5 p-4 border rounded-md bg-[#F9F9F9] dark:bg-[#1A161D] border-[#8D5EB7]/30 mt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Zap className="h-4 w-4 mr-2 text-[#8D5EB7]" />
                  <Label htmlFor="recommended-settings" className="text-sm font-medium">Recommended Settings</Label>
                </div>
                <Switch 
                  id="recommended-settings" 
                  checked={useRecommendedSettings}
                  onCheckedChange={setUseRecommendedSettings}
                />
              </div>
              
              {useRecommendedSettings && (
                <div className="mt-3 text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Direction:</span>
                    <Badge variant={recommendedSettings.side === 'BUY' ? 'success' : 'destructive'}>
                      {recommendedSettings.side}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Price:</span>
                    <span>{formatCurrency(recommendedSettings.price)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount:</span>
                    <span>{recommendedSettings.amount.toFixed(6)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Leverage:</span>
                    <span>{recommendedSettings.leverage}x</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Confidence:</span>
                    <Badge variant="outline" className="bg-[#EECEE6]/20">
                      {recommendedSettings.confidence}%
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Submit Button */}
          <Button 
            className={`w-full ${orderSide === 'BUY' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} mt-2`}
          >
            {orderSide === 'BUY' ? 'Buy' : 'Sell'} {baseCurrency}
          </Button>
        </TabsContent>
        
        <TabsContent value="MARKET" className="space-y-5">
          {/* Market Order Form - Similar to Limit but with price disabled */}
          {/* Price Input */}
          <div className="space-y-2.5">
            <div className="flex justify-between">
              <Label htmlFor="market-price">Price ({quoteCurrency})</Label>
              <div className="text-sm text-muted-foreground">
                Market: {formatCurrency(pair.price)}
              </div>
            </div>
            <Input 
              id="market-price" 
              type="number" 
              value={pair.price} 
              readOnly
              className="bg-gray-50 dark:bg-gray-800 border-[#8D5EB7]/30"
            />
          </div>
          
          {/* Amount Input */}
          <div className="space-y-2.5">
            <div className="flex justify-between">
              <Label htmlFor="market-amount">Amount ({baseCurrency})</Label>
              <div className="text-sm text-muted-foreground">
                Available: {formatCurrency(availableBalance)} {quoteCurrency}
              </div>
            </div>
            <Input 
              id="market-amount" 
              type="number" 
              value={amount} 
              onChange={(e) => setAmount(e.target.value)}
              className="border-[#8D5EB7]/30 focus:border-[#8D5EB7] dark:focus:border-[#EECEE6]"
            />
            
            {/* Percentage Buttons */}
            <div className="grid grid-cols-4 gap-3 mt-3">
              <Button variant="outline" size="sm" onClick={() => handlePercentage(0.25)} className="text-xs border-[#8D5EB7]/30 hover:bg-[#8D5EB7]/10">
                25%
              </Button>
              <Button variant="outline" size="sm" onClick={() => handlePercentage(0.5)} className="text-xs border-[#8D5EB7]/30 hover:bg-[#8D5EB7]/10">
                50%
              </Button>
              <Button variant="outline" size="sm" onClick={() => handlePercentage(0.75)} className="text-xs border-[#8D5EB7]/30 hover:bg-[#8D5EB7]/10">
                75%
              </Button>
              <Button variant="outline" size="sm" onClick={() => handlePercentage(1)} className="text-xs border-[#8D5EB7]/30 hover:bg-[#8D5EB7]/10">
                100%
              </Button>
            </div>
          </div>
          
          {/* Total */}
          <div className="space-y-2.5">
            <Label htmlFor="market-total">Total ({quoteCurrency})</Label>
            <Input 
              id="market-total" 
              type="text" 
              value={total} 
              readOnly 
              className="bg-gray-50 dark:bg-gray-800 border-[#8D5EB7]/30"
            />
          </div>
          
          {/* Submit Button */}
          <Button 
            className={`w-full ${orderSide === 'BUY' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} mt-2`}
          >
            {orderSide === 'BUY' ? 'Buy' : 'Sell'} {baseCurrency} at Market
          </Button>
        </TabsContent>
        
        <TabsContent value="STOP" className="space-y-5">
          {/* Stop Order Form */}
          {/* Trigger Price Input */}
          <div className="space-y-2.5">
            <div className="flex justify-between">
              <Label htmlFor="trigger-price">Trigger Price ({quoteCurrency})</Label>
              <div className="text-sm text-muted-foreground">
                Market: {formatCurrency(pair.price)}
              </div>
            </div>
            <Input 
              id="trigger-price" 
              type="number" 
              placeholder={orderSide === 'BUY' ? 'Above market' : 'Below market'}
              className="border-[#8D5EB7]/30 focus:border-[#8D5EB7] dark:focus:border-[#EECEE6]"
            />
          </div>
          
          {/* Price Input */}
          <div className="space-y-2.5">
            <Label htmlFor="stop-price">Price ({quoteCurrency})</Label>
            <Input 
              id="stop-price" 
              type="number" 
              value={price} 
              onChange={(e) => setPrice(e.target.value)}
              className="border-[#8D5EB7]/30 focus:border-[#8D5EB7] dark:focus:border-[#EECEE6]"
            />
          </div>
          
          {/* Amount Input */}
          <div className="space-y-2.5">
            <div className="flex justify-between">
              <Label htmlFor="stop-amount">Amount ({baseCurrency})</Label>
              <div className="text-sm text-muted-foreground">
                Available: {formatCurrency(availableBalance)} {quoteCurrency}
              </div>
            </div>
            <Input 
              id="stop-amount" 
              type="number" 
              value={amount} 
              onChange={(e) => setAmount(e.target.value)}
              className="border-[#8D5EB7]/30 focus:border-[#8D5EB7] dark:focus:border-[#EECEE6]"
            />
            
            {/* Percentage Buttons */}
            <div className="grid grid-cols-4 gap-3 mt-3">
              <Button variant="outline" size="sm" onClick={() => handlePercentage(0.25)} className="text-xs border-[#8D5EB7]/30 hover:bg-[#8D5EB7]/10">
                25%
              </Button>
              <Button variant="outline" size="sm" onClick={() => handlePercentage(0.5)} className="text-xs border-[#8D5EB7]/30 hover:bg-[#8D5EB7]/10">
                50%
              </Button>
              <Button variant="outline" size="sm" onClick={() => handlePercentage(0.75)} className="text-xs border-[#8D5EB7]/30 hover:bg-[#8D5EB7]/10">
                75%
              </Button>
              <Button variant="outline" size="sm" onClick={() => handlePercentage(1)} className="text-xs border-[#8D5EB7]/30 hover:bg-[#8D5EB7]/10">
                100%
              </Button>
            </div>
          </div>
          
          {/* Total */}
          <div className="space-y-2.5">
            <Label htmlFor="stop-total">Total ({quoteCurrency})</Label>
            <Input 
              id="stop-total" 
              type="text" 
              value={total} 
              readOnly 
              className="bg-gray-50 dark:bg-gray-800 border-[#8D5EB7]/30"
            />
          </div>
          
          {/* Submit Button */}
          <Button 
            className={`w-full ${orderSide === 'BUY' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} mt-2`}
          >
            Place {orderSide === 'BUY' ? 'Buy' : 'Sell'} Stop Order
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
}
