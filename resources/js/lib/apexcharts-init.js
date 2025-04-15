/**
 * Initialize ApexCharts for the trading page
 * This file handles the initialization and updating of the candlestick chart
 */

/* global ApexCharts */

// Initialize the chart when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  initializeChart();
});

/**
 * Initialize the ApexCharts candlestick chart
 */
function initializeChart() {
  if (typeof ApexCharts === 'undefined' || !document.getElementById('apexcharts-candlestick')) {
    console.error('ApexCharts not loaded or chart container not found');
    return;
  }

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
      }
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
      align: 'left'
    },
    xaxis: {
      type: 'datetime'
    },
    yaxis: {
      tooltip: {
        enabled: true
      }
    },
    grid: {
      borderColor: '#f1f1f1'
    },
    tooltip: {
      enabled: true
    },
    stroke: {
      curve: 'smooth',
      width: [1, 2]
    },
    theme: {
      mode: 'dark'
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
      data: []
    }]
  };

  // Initialize the chart
  window.tradingChart = new ApexCharts(
    document.getElementById('apexcharts-candlestick'), 
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
  fetch(`/api/trading/chart-data?currency_pair=${currencyPair}&timeframe=${timeframe}&limit=100`)
    .then(response => response.json())
    .then(data => {
      // Format data for ApexCharts
      const candleData = data.map(item => ({
        x: new Date(item.timestamp).getTime(),
        y: [item.open, item.high, item.low, item.close]
      }));
      
      // Generate predictive data
      const predictiveData = generatePredictiveData(candleData);
      
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
      console.error('Failed to fetch chart data:', error);
    });
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

// Export functions for use in other files
window.tradingChartFunctions = {
  updateChart
};
