/**
 * Initialize ApexCharts for the trading page
 * This file handles the initialization and updating of the candlestick chart
 */

/* global ApexCharts */

// Expose trading chart functions globally
window.tradingChartFunctions = {
  updateChart: function(currencyPair, timeframe) {
    fetchChartData(currencyPair, timeframe);
  }
};

// Initialize the chart when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  initializeChart();
});

// Also initialize when the script is loaded (for dynamic loading)
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  setTimeout(initializeChart, 100);
}

/**
 * Initialize the ApexCharts candlestick chart
 */
function initializeChart() {
  const chartElement = document.getElementById('trading-chart');
  if (typeof ApexCharts === 'undefined' || !chartElement) {
    console.error('ApexCharts not loaded or chart container not found');
    // Try again after a short delay
    setTimeout(initializeChart, 500);
    return;
  }

  // Check if chart is already initialized
  if (window.tradingChart) {
    console.log('Chart already initialized');
    return;
  }

  console.log('Initializing trading chart...');

  // Default options for the chart
  const options = {
    chart: {
      height: 500,
      type: 'candlestick',
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
        }
      },
      animations: {
        enabled: true
      },
      background: 'transparent'
    },
    plotOptions: {
      candlestick: {
        colors: {
          upward: '#8D5EB7',
          downward: '#D04014'
        }
      }
    },
    title: {
      text: 'Trading Chart',
      align: 'left',
      style: {
        color: '#F9F9F9'
      }
    },
    xaxis: {
      type: 'datetime',
      labels: {
        style: {
          colors: '#F9F9F9'
        }
      }
    },
    yaxis: {
      tooltip: {
        enabled: true
      },
      labels: {
        style: {
          colors: '#F9F9F9'
        }
      }
    },
    grid: {
      borderColor: '#1A161D'
    },
    tooltip: {
      enabled: true,
      theme: 'dark'
    },
    stroke: {
      curve: 'smooth',
      width: [1, 2]
    },
    theme: {
      mode: 'dark',
      palette: 'palette1'
    },
    annotations: {
      points: []
    },
    series: [{
      name: 'candle',
      data: []
    }, {
      name: 'Prediction',
      type: 'line',
      data: [],
      color: '#EECEE6'
    }]
  };

  // Initialize the chart
  window.tradingChart = new ApexCharts(
    document.getElementById('trading-chart'), 
    options
  );
  
  window.tradingChart.render();
  
  // Fetch initial data
  fetchChartData('EUR/USD', '1h');
}

/**
 * Fetch chart data from the API
 * 
 * @param {string} currencyPair - The currency pair to fetch data for
 * @param {string} timeframe - The timeframe to fetch data for
 */
function fetchChartData(currencyPair, timeframe) {
  const baseUrl = window.location.origin;
  fetch(`${baseUrl}/api/trading/chart-data?currency_pair=${currencyPair}&timeframe=${timeframe}&limit=100`)
    .then(response => {
      if (!response.ok) {
        throw new Error('API endpoint not available');
      }
      return response.json();
    })
    .then(data => {
      // Format data for ApexCharts
      const candleData = data.map(item => ({
        x: new Date(parseInt(item.timestamp)).getTime(),
        y: [item.open, item.high, item.low, item.close]
      }));
      
      // Generate predictive data
      const predictiveData = generatePredictiveData(candleData);
      
      // Update the chart title with the currency pair and timeframe
      window.tradingChart.updateOptions({
        title: {
          text: `${currencyPair} (${timeframe})`,
          align: 'left'
        }
      });
      
      // Update the chart
      window.tradingChart.updateSeries([{
        name: 'candle',
        data: candleData
      }, {
        name: 'Prediction',
        type: 'line',
        data: predictiveData
      }]);
    })
    .catch(error => {
      console.warn('Failed to fetch chart data from API, using mock data:', error.message);
      
      // Generate mock data if API is not available
      const mockData = generateMockChartData(currencyPair, timeframe);
      
      // Update the chart with mock data
      window.tradingChart.updateSeries([{
        name: 'candle',
        data: mockData.candleData
      }, {
        name: 'Prediction',
        type: 'line',
        data: mockData.predictiveData
      }]);
    });
}

/**
 * Generate mock chart data for development
 * 
 * @param {string} currencyPair - The currency pair to generate data for
 * @param {string} timeframe - The timeframe to generate data for
 * @returns {Object} - Object containing candleData and predictiveData
 */
function generateMockChartData(currencyPair, timeframe) {
  // Base price depends on currency pair
  let basePrice = 1.0;
  let volatility = 0.002;
  
  switch(currencyPair) {
    case 'EUR/USD':
      basePrice = 1.09;
      volatility = 0.002;
      break;
    case 'GBP/USD':
      basePrice = 1.25;
      volatility = 0.003;
      break;
    case 'USD/JPY':
      basePrice = 151.5;
      volatility = 0.2;
      break;
    case 'BTC/USD':
      basePrice = 63500;
      volatility = 500;
      break;
    case 'ETH/USD':
      basePrice = 3050;
      volatility = 100;
      break;
    default:
      basePrice = 1.0;
      volatility = 0.002;
  }
  
  // Generate 100 candles
  const now = new Date();
  const candleData = [];
  let lastClose = basePrice;
  
  // Determine time interval based on timeframe
  let timeInterval = 60 * 60 * 1000; // Default 1 hour in milliseconds
  
  switch(timeframe) {
    case '1m': timeInterval = 60 * 1000; break;
    case '5m': timeInterval = 5 * 60 * 1000; break;
    case '15m': timeInterval = 15 * 60 * 1000; break;
    case '30m': timeInterval = 30 * 60 * 1000; break;
    case '1h': timeInterval = 60 * 60 * 1000; break;
    case '4h': timeInterval = 4 * 60 * 60 * 1000; break;
    case '1d': timeInterval = 24 * 60 * 60 * 1000; break;
    case '1w': timeInterval = 7 * 24 * 60 * 60 * 1000; break;
  }
  
  for (let i = 99; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - (i * timeInterval));
    
    // Generate random price movement
    const change = (Math.random() - 0.5) * volatility;
    const open = lastClose;
    const close = open + change;
    const high = Math.max(open, close) + (Math.random() * volatility * 0.5);
    const low = Math.min(open, close) - (Math.random() * volatility * 0.5);
    
    candleData.push({
      x: timestamp.getTime(),
      y: [open, high, low, close]
    });
    
    lastClose = close;
  }
  
  // Generate predictive data
  const predictiveData = generatePredictiveData(candleData);
  
  return {
    candleData,
    predictiveData
  };
}

/**
 * Generate predictive data using linear regression
 * 
 * @param {Array} candleData - The candle data to generate predictions from
 * @returns {Array} - The predictive data points
 */
function generatePredictiveData(candleData) {
  if (candleData.length < 10) return [];
  
  // Get the last 10 closing prices
  const lastPoints = candleData.slice(-10).map(candle => ({
    x: candle.x,
    y: candle.y[3] // Close price
  }));
  
  // Simple linear regression
  const xValues = lastPoints.map((_, i) => i);
  const yValues = lastPoints.map(point => point.y);
  
  const n = xValues.length;
  const sumX = xValues.reduce((a, b) => a + b, 0);
  const sumY = yValues.reduce((a, b) => a + b, 0);
  const sumXY = xValues.reduce((a, b, i) => a + b * yValues[i], 0);
  const sumXX = xValues.reduce((a, b) => a + b * b, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  // Generate 5 future predictions
  const predictions = [];
  const lastTimestamp = lastPoints[lastPoints.length - 1].x;
  const timeInterval = lastPoints[1].x - lastPoints[0].x;
  
  for (let i = 1; i <= 5; i++) {
    const predictedY = slope * (n + i - 1) + intercept;
    predictions.push({
      x: lastTimestamp + timeInterval * i,
      y: predictedY
    });
  }
  
  return [...lastPoints, ...predictions];
}

/**
 * Update the chart with new data
 * 
 * @param {string} currencyPair - The currency pair to update the chart with
 * @param {string} timeframe - The timeframe to update the chart with
 */
function updateChart(currencyPair, timeframe) {
  if (window.tradingChart) {
    fetchChartData(currencyPair, timeframe);
  }
}
