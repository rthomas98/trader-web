import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PositionSizingCalculator from '@/components/risk-management/position-sizing-calculator';
import RiskRewardVisualizer from '@/components/risk-management/risk-reward-visualizer';
import DrawdownAlerts from '@/components/risk-management/drawdown-alerts';
import RiskMetrics from '@/components/risk-management/risk-metrics';
import RiskProfile from '@/components/risk-management/risk-profile';

interface RiskManagementProps {
  riskProfile: {
    riskPercentage: number;
    historicalRisk: Array<{
      date: string;
      total_loss: number;
      total_profit: number;
      trade_count: number;
    }>;
    avgRiskPerTrade: number;
    riskToleranceLevel: 'conservative' | 'moderate' | 'aggressive';
  };
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
  riskMetrics: {
    maxDrawdown: {
      value: number;
      percentage: number;
      startDate: string | null;
      endDate: string | null;
      recoveryDate: string | null;
      duration: number;
    };
    sharpeRatio: number;
    sortinoRatio: number;
    valueAtRisk: {
      daily95: number;
      daily99: number;
      weekly95: number;
    };
  };
  drawdownAlerts: {
    currentDrawdown: number;
    currentDrawdownPercentage: number;
    maxAllowedDrawdown: number;
    alerts: Array<{
      level: 'critical' | 'warning' | 'caution' | 'position';
      message: string;
      percentage: number;
      position_id?: number;
      timestamp: string;
    }>;
  };
  activeWallet: {
    id: number;
    user_id: number;
    wallet_type: 'DEMO' | 'LIVE';
    balance: number;
    is_active: boolean;
  } | null;
}

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
  },
  {
    title: 'Risk Management',
    href: '/risk-management',
  },
];

export default function RiskManagement({
  riskProfile,
  positionSizing,
  riskMetrics,
  drawdownAlerts,
  activeWallet,
}: RiskManagementProps) {
  const [activeTab, setActiveTab] = useState('position-sizing');

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Risk Management" />
      <div className="flex h-full flex-1 flex-col gap-4 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Risk Profile Summary Card */}
          <Card className="flex-1">
            <CardHeader>
              <CardTitle>Risk Profile</CardTitle>
              <CardDescription>Your trading risk profile and metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <RiskProfile riskProfile={riskProfile} />
            </CardContent>
          </Card>

          {/* Drawdown Alerts Card */}
          <Card className="flex-1">
            <CardHeader>
              <CardTitle>Drawdown Alerts</CardTitle>
              <CardDescription>Current drawdown status and alerts</CardDescription>
            </CardHeader>
            <CardContent>
              <DrawdownAlerts drawdownAlerts={drawdownAlerts} />
            </CardContent>
          </Card>
        </div>

        {/* Main Risk Management Tools */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="position-sizing">Position Sizing</TabsTrigger>
            <TabsTrigger value="risk-reward">Risk-Reward Analysis</TabsTrigger>
            <TabsTrigger value="risk-metrics">Risk Metrics</TabsTrigger>
          </TabsList>

          <TabsContent value="position-sizing" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Position Sizing Calculator</CardTitle>
                <CardDescription>Calculate optimal position size based on your risk tolerance</CardDescription>
              </CardHeader>
              <CardContent>
                <PositionSizingCalculator 
                  positionSizing={positionSizing} 
                  accountBalance={activeWallet?.balance || 0} 
                  riskPercentage={riskProfile.riskPercentage} 
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="risk-reward" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Risk-Reward Analysis</CardTitle>
                <CardDescription>Visualize and optimize your risk-reward ratios</CardDescription>
              </CardHeader>
              <CardContent>
                <RiskRewardVisualizer 
                  positionSizing={positionSizing} 
                  riskProfile={riskProfile} 
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="risk-metrics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Risk Metrics</CardTitle>
                <CardDescription>Advanced risk metrics and analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <RiskMetrics riskMetrics={riskMetrics} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
