import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { AlertCircle, Calculator, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import axios from 'axios';

interface PositionSizingCalculatorProps {
  positionSizing: {
    fixedRisk: Array<{
      pair: string;
      stopLossPips: number;
      maxRiskAmount: number;
      recommendedLotSize: number;
      positionSize: number;
    }>;
    percentageRisk: Array<{
      pair: string;
      riskPercentage: number;
      riskRewardRatio: number;
      potentialProfit: number;
      potentialLoss: number;
    }>;
    riskRewardRatios: {
      winRate: number;
      kellyPercentage: number;
      optimalRatio: number;
      expectedValues: Array<{
        ratio: number;
        expectedValue: number;
        isOptimal: boolean;
      }>;
    };
  };
  accountBalance: number;
  riskPercentage: number;
}

interface CalculationResult {
  riskAmount: number;
  stopLossPips: number;
  positionSize: number;
  standardLots: number;
  miniLots: number;
  microLots: number;
}

const PositionSizingCalculator: React.FC<PositionSizingCalculatorProps> = ({
  positionSizing,
  accountBalance,
  riskPercentage,
}) => {
  const { toast } = useToast();
  const [formValues, setFormValues] = useState({
    accountBalance: accountBalance,
    riskPercentage: riskPercentage,
    entryPrice: '',
    stopLoss: '',
    currencyPair: 'EUR/USD',
  });
  const [calculationResult, setCalculationResult] = useState<CalculationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Common currency pairs for forex trading
  const currencyPairs = [
    'EUR/USD',
    'GBP/USD',
    'USD/JPY',
    'USD/CHF',
    'AUD/USD',
    'USD/CAD',
    'NZD/USD',
    'EUR/GBP',
    'EUR/JPY',
    'GBP/JPY',
  ];

  useEffect(() => {
    // Update account balance and risk percentage when props change
    setFormValues(prev => ({
      ...prev,
      accountBalance,
      riskPercentage,
    }));
  }, [accountBalance, riskPercentage]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormValues(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormValues(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSliderChange = (value: number[]) => {
    setFormValues(prev => ({
      ...prev,
      riskPercentage: value[0],
    }));
  };

  const calculatePositionSize = async () => {
    // Validate inputs
    if (!formValues.entryPrice || !formValues.stopLoss) {
      toast({
        variant: "destructive",
        title: "Missing values",
        description: "Please enter both entry price and stop loss.",
      });
      return;
    }

    const entryPrice = parseFloat(formValues.entryPrice as string);
    const stopLoss = parseFloat(formValues.stopLoss as string);

    if (entryPrice <= 0 || stopLoss <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid values",
        description: "Entry price and stop loss must be greater than zero.",
      });
      return;
    }

    if (entryPrice === stopLoss) {
      toast({
        variant: "destructive",
        title: "Invalid values",
        description: "Entry price and stop loss cannot be the same.",
      });
      return;
    }

    setIsCalculating(true);

    try {
      const response = await axios.post('/api/risk-management/calculate-position-size', {
        account_balance: formValues.accountBalance,
        risk_percentage: formValues.riskPercentage,
        entry_price: entryPrice,
        stop_loss: stopLoss,
        currency_pair: formValues.currencyPair,
      });

      setCalculationResult(response.data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Calculation error",
        description: "An error occurred while calculating position size.",
      });
    } finally {
      setIsCalculating(false);
    }
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Calculator Form */}
        <Card className="bg-card">
          <CardContent className="pt-6">
            <form className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="accountBalance">Account Balance</Label>
                  <span className="text-sm text-muted-foreground">{formatCurrency(formValues.accountBalance)}</span>
                </div>
                <Input
                  id="accountBalance"
                  name="accountBalance"
                  type="number"
                  value={formValues.accountBalance}
                  onChange={handleInputChange}
                  min={0}
                  step={100}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Label htmlFor="riskPercentage" className="mr-2">Risk Percentage</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">Percentage of your account balance you're willing to risk on this trade.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <span className="text-sm text-muted-foreground">{formValues.riskPercentage}%</span>
                </div>
                <Slider
                  value={[formValues.riskPercentage]}
                  onValueChange={handleSliderChange}
                  min={0.1}
                  max={10}
                  step={0.1}
                  className="py-4"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currencyPair">Currency Pair</Label>
                <Select
                  value={formValues.currencyPair}
                  onValueChange={(value) => handleSelectChange('currencyPair', value)}
                >
                  <SelectTrigger id="currencyPair">
                    <SelectValue placeholder="Select currency pair" />
                  </SelectTrigger>
                  <SelectContent>
                    {currencyPairs.map((pair) => (
                      <SelectItem key={pair} value={pair}>{pair}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center">
                  <Label htmlFor="entryPrice" className="mr-2">Entry Price</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">The price at which you plan to enter the trade.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  id="entryPrice"
                  name="entryPrice"
                  type="number"
                  value={formValues.entryPrice}
                  onChange={handleInputChange}
                  min={0.00001}
                  step={0.00001}
                  placeholder="Enter price"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center">
                  <Label htmlFor="stopLoss" className="mr-2">Stop Loss</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">The price at which your trade will be closed if the market moves against you.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  id="stopLoss"
                  name="stopLoss"
                  type="number"
                  value={formValues.stopLoss}
                  onChange={handleInputChange}
                  min={0.00001}
                  step={0.00001}
                  placeholder="Enter stop loss"
                />
              </div>

              <Button 
                type="button" 
                onClick={calculatePositionSize} 
                disabled={isCalculating}
                className="w-full"
              >
                <Calculator className="mr-2 h-4 w-4" />
                {isCalculating ? 'Calculating...' : 'Calculate Position Size'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Results Display */}
        <Card className="bg-card">
          <CardContent className="pt-6">
            {calculationResult ? (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Calculation Results</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted p-3 rounded-md">
                    <div className="text-sm text-muted-foreground">Risk Amount</div>
                    <div className="text-xl font-bold">{formatCurrency(calculationResult.riskAmount)}</div>
                  </div>
                  
                  <div className="bg-muted p-3 rounded-md">
                    <div className="text-sm text-muted-foreground">Stop Loss (pips)</div>
                    <div className="text-xl font-bold">{calculationResult.stopLossPips.toFixed(1)}</div>
                  </div>
                </div>
                
                <div className="bg-muted p-4 rounded-md">
                  <div className="text-sm text-muted-foreground mb-1">Recommended Position Size</div>
                  <div className="text-2xl font-bold">{calculationResult.positionSize.toLocaleString()} units</div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Lot Sizes:</h4>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-muted p-2 rounded-md text-center">
                      <div className="text-xs text-muted-foreground">Standard</div>
                      <div className="font-semibold">{calculationResult.standardLots.toFixed(2)}</div>
                    </div>
                    <div className="bg-muted p-2 rounded-md text-center">
                      <div className="text-xs text-muted-foreground">Mini</div>
                      <div className="font-semibold">{calculationResult.miniLots.toFixed(2)}</div>
                    </div>
                    <div className="bg-muted p-2 rounded-md text-center">
                      <div className="text-xs text-muted-foreground">Micro</div>
                      <div className="font-semibold">{calculationResult.microLots.toFixed(2)}</div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start gap-2 p-3 border border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-900/30 rounded-md">
                  <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-800 dark:text-yellow-400">
                    This calculation is based on your risk parameters. Always double-check before placing actual trades.
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-8 text-center">
                <Calculator className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Position Size Calculator</h3>
                <p className="text-muted-foreground max-w-md">
                  Enter your trade parameters on the left to calculate the optimal position size based on your risk tolerance.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recommendations Table */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4">Recommended Position Sizes</h3>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Currency Pair</TableHead>
                  <TableHead>Stop Loss (pips)</TableHead>
                  <TableHead>Risk Amount</TableHead>
                  <TableHead>Lot Size</TableHead>
                  <TableHead>Position Size</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {positionSizing.fixedRisk.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{item.pair}</TableCell>
                    <TableCell>{item.stopLossPips}</TableCell>
                    <TableCell>{formatCurrency(item.maxRiskAmount)}</TableCell>
                    <TableCell>{item.recommendedLotSize.toFixed(2)}</TableCell>
                    <TableCell>{item.positionSize.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          <div className="mt-4 p-3 border border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-900/30 rounded-md">
            <div className="flex items-start gap-2">
              <Info className="h-5 w-5 text-blue-600 dark:text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800 dark:text-blue-400">
                <p className="font-medium mb-1">Position Sizing Tips:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Never risk more than {formValues.riskPercentage}% of your account on a single trade</li>
                  <li>Consider reducing position size for volatile currency pairs</li>
                  <li>Adjust your stop loss based on market volatility and support/resistance levels</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PositionSizingCalculator;
