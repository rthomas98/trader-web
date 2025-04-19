// @ts-nocheck
import React, { useEffect, useRef } from 'react';
import { 
    createChart, 
    IChartApi, 
    ISeriesApi, 
    LineData, 
    LineStyle, 
    ColorType, 
    Time 
} from 'lightweight-charts';
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

export function Overview({ data = [], loading }: OverviewProps) {
  const { theme } = useTheme();
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const lineSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);

  const lineColorLight = '#8D5EB7'; // Accent Purple
  const lineColorDark = '#211DE4'; // Deep Purple
  const gridColorLight = '#e4e4e7';
  const gridColorDark = '#3f3f46';
  const textColorLight = '#3f3f46'; // Darker text for light bg
  const textColorDark = '#f9f9f9'; // Light text for dark bg

  useEffect(() => {
    if (loading || !chartContainerRef.current || data.length === 0) {
        if (chartRef.current) {
            chartRef.current.remove();
            chartRef.current = null;
            lineSeriesRef.current = null;
        }
        return;
    }

    const isDark = theme === 'dark';
    const chartOptions = {
        layout: {
            background: { type: ColorType.Solid, color: 'transparent' }, 
            textColor: isDark ? textColorDark : textColorLight,
        },
        grid: {
            vertLines: {
                color: isDark ? gridColorDark : gridColorLight,
                style: LineStyle.Dashed,
            },
            horzLines: {
                color: isDark ? gridColorDark : gridColorLight,
                style: LineStyle.Dashed,
            },
        },
        timeScale: {
            visible: true, 
            timeVisible: false, 
            secondsVisible: false, 
            borderColor: isDark ? gridColorDark : gridColorLight,
            rightOffset: 10, 
            leftOffset: 10,
        },
        priceScale: {
            borderColor: isDark ? gridColorDark : gridColorLight,
        },
        handleScroll: true,
        handleScale: true,
    };

    const formattedData: LineData[] = data.map((item, index) => ({
        time: index + 1 as Time, 
        value: item.total,
    }));

    if (!chartRef.current) {
      chartRef.current = createChart(chartContainerRef.current, chartOptions);
      lineSeriesRef.current = chartRef.current.addLineSeries({
          color: isDark ? lineColorDark : lineColorLight,
          lineWidth: 2,
      });
    } else {
        chartRef.current.applyOptions(chartOptions);
        if (lineSeriesRef.current) {
             lineSeriesRef.current.applyOptions({
                color: isDark ? lineColorDark : lineColorLight,
            });
        }
    }

    if (lineSeriesRef.current && formattedData.length > 0) {
      lineSeriesRef.current.setData(formattedData);
      chartRef.current.timeScale().fitContent(); 
    }
    
    const handleResize = () => {
        if (chartRef.current && chartContainerRef.current) {
            chartRef.current.applyOptions({
                width: chartContainerRef.current.clientWidth,
                height: chartContainerRef.current.clientHeight,
            });
        }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    if (chartContainerRef.current) {
      resizeObserver.observe(chartContainerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [data, theme, loading]); 

  useEffect(() => {
      return () => {
          chartRef.current?.remove();
      }
  }, []);

  return (
    <Card className="overflow-hidden h-[422px]"> 
      <CardHeader>
        <CardTitle>Portfolio Overview</CardTitle>
      </CardHeader>
      <CardContent className="pl-2 h-[350px]"> 
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <Skeleton className="h-[300px] w-full" />
          </div>
        ) : (
           <div ref={chartContainerRef} className="w-full h-full" />
        )}
      </CardContent>
    </Card>
  );
}
