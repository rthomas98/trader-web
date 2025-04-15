import React, { useEffect, useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { useAppearance } from '@/hooks/use-appearance';

interface TradingChartProps {
  currencyPair: string;
  timeframe: string;
  // TODO: Add prop for real data fetching
}

// Sample Candlestick Data (replace with actual data fetching)
const generateSampleData = () => {
  let i = 0;
  const series = [];
  let timestamp = new Date().getTime() - (30 * 24 * 60 * 60 * 1000); // Start 30 days ago
  while (i < 60) {
    const open = Math.random() * 10 + 100;
    const high = open + Math.random() * 5;
    const low = open - Math.random() * 5;
    const close = (high - low) * Math.random() + low;
    series.push({
        x: new Date(timestamp),
        y: [open.toFixed(2), high.toFixed(2), low.toFixed(2), close.toFixed(2)]
    });
    timestamp += 24 * 60 * 60 * 1000; // Increment by one day
    i++;
  }
  return [{ data: series }];
};

const TradingChart: React.FC<TradingChartProps> = ({ currencyPair, timeframe }) => {
  const { theme } = useAppearance();
  const [chartData, setChartData] = useState<ApexAxisChartSeries | ApexNonAxisChartSeries>([]);
  const [chartOptions, setChartOptions] = useState<ApexOptions>({});
  // Removed unused setErrorMessage state to resolve lint error

  useEffect(() => {
    // TODO: Implement actual data fetching based on currencyPair and timeframe
    // For now, using sample data
    console.log(`Fetching chart data for ${currencyPair} (${timeframe})... (Using Sample Data)`);
    const sampleData = generateSampleData();
    setChartData(sampleData);

    // Basic error handling example (replace with actual logic)
    // if (!currencyPair || !timeframe) {
    //   console.error('Currency pair or timeframe is missing.');
    //   setChartData([]);
    //   return;
    // }

  }, [currencyPair, timeframe]);

  useEffect(() => {
    const options: ApexOptions = {
      chart: {
        type: 'candlestick',
        height: 400,
        background: 'transparent',
        foreColor: theme === 'dark' ? '#f9f9f9' : '#1a161d', // Adjust text color based on theme
        toolbar: {
          show: true,
          tools: {
            download: true,
            selection: true,
            zoom: true,
            zoomin: true,
            zoomout: true,
            pan: true,
            reset: true
          },
          autoSelected: 'zoom'
        },
      },
      title: {
        text: `${currencyPair} Candlestick Chart (${timeframe})`,
        align: 'left',
        style: {
          color: theme === 'dark' ? '#f9f9f9' : '#1a161d',
        }
      },
      xaxis: {
        type: 'datetime',
        labels: {
          style: {
            colors: theme === 'dark' ? '#adb5bd' : '#495057', // Lighter/darker grey for labels
          }
        }
      },
      yaxis: {
        tooltip: {
          enabled: true
        },
        labels: {
          style: {
            colors: theme === 'dark' ? '#adb5bd' : '#495057',
          },
          formatter: (value) => { return value.toFixed(2); } // Format Y-axis labels
        }
      },
      tooltip: {
        theme: theme, // Use the current theme for tooltip
        x: {
          format: 'dd MMM yyyy HH:mm' // Format date in tooltip
        }
      },
      plotOptions: {
        candlestick: {
          colors: {
            upward: '#8D5EB7', // Brand color for upward candles
            downward: '#D04014' // Brand color for downward candles
          },
          wick: {
            useFillColor: true,
          }
        }
      },
      theme: {
        mode: theme,
      }
    };
    setChartOptions(options);
  }, [theme, currencyPair, timeframe]);

  // Error display placeholder
  // if (!chartData || chartData.length === 0 || (chartData[0] && chartData[0].data.length === 0)) {
  //   return <div className="p-4 text-yellow-500 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200 rounded flex items-center justify-center h-[400px]">Loading chart data or no data available...</div>;
  // }

  return (
    <div id="chart">
      <ReactApexChart
        options={chartOptions}
        series={chartData}
        type="candlestick"
        height={400}
      />
    </div>
  );
};

export default TradingChart;