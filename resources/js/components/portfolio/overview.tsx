import React, { useEffect, useState } from 'react';
import Chart from 'react-apexcharts';
import { useTheme } from '@/components/theme-provider';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PortfolioPerformanceData {
  month: string;
  total: number;
}

interface OverviewProps {
  data: PortfolioPerformanceData[];
  loading: boolean;
}

export function Overview({ data, loading }: OverviewProps) {
  const { theme } = useTheme();
  const [chartKey, setChartKey] = useState(Date.now());
  
  // Force re-render when theme changes
  useEffect(() => {
    setChartKey(Date.now());
  }, [theme]);

  // Use brand colors - using our brand colors from memory
  const barColor = theme === 'dark' ? '#211DE4' : '#8D5EB7'; // dark: deep purple, light: accent purple
  const labelColor = theme === 'dark' ? '#a1a1aa' : '#71717a';
  const gridColor = theme === 'dark' ? '#3f3f46' : '#e4e4e7';

  const options: ApexCharts.ApexOptions = {
    chart: {
      type: 'bar',
      height: 350,
      toolbar: {
        show: false,
      },
      parentHeightOffset: 0,
      background: 'transparent',
      foreColor: labelColor,
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
        horizontal: false,
        columnWidth: '55%',
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: false,
    },
    xaxis: {
      categories: data.map((item) => item.month),
      labels: {
        style: {
          colors: labelColor,
          fontSize: '12px',
        },
      },
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: labelColor,
          fontSize: '12px',
        },
        formatter: (value) => `$${value.toFixed(0)}`,
      },
    },
    grid: {
      show: true,
      borderColor: gridColor,
      strokeDashArray: 4,
      position: 'back',
      yaxis: {
        lines: {
          show: true,
        },
      },
      xaxis: {
        lines: {
          show: false,
        },
      },
    },
    fill: {
      opacity: 1,
      colors: [barColor],
    },
    tooltip: {
      theme: theme,
      y: {
        formatter: (value) => `$${value.toFixed(2)}`,
      },
    },
    theme: {
      mode: theme === 'dark' ? 'dark' : 'light',
      palette: 'palette1',
    },
  };

  const series = [
    {
      name: 'Portfolio Value',
      data: data.map((item) => item.total),
    },
  ];

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>Portfolio Overview</CardTitle>
      </CardHeader>
      <CardContent className="pl-2">
        {loading ? (
          <div className="h-[350px] flex items-center justify-center">
            <Skeleton className="h-[300px] w-full" />
          </div>
        ) : (
          <div className={`${theme === 'dark' ? 'dark' : 'light'} w-full`}>
            <Chart 
              key={chartKey}
              options={options} 
              series={series} 
              type="bar" 
              height={350} 
              width="100%" 
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
