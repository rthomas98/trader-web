/**
 * Calculates the Simple Moving Average (SMA) for a given period.
 * @param data Array of numbers (e.g., closing prices).
 * @param period The number of data points to include in the average.
 * @returns An array of SMA values, starting after the initial period.
 */
export const calculateSMA = (data: number[], period: number): (number | null)[] => {
    if (!data || data.length < period) {
        return Array(data.length).fill(null); // Return nulls if not enough data
    }

    const smaValues: (number | null)[] = Array(period - 1).fill(null); // Pad beginning with nulls
    let sum = 0;

    // Calculate initial sum for the first period
    for (let i = 0; i < period; i++) {
        sum += data[i];
    }
    smaValues.push(sum / period);

    // Calculate subsequent SMA values efficiently
    for (let i = period; i < data.length; i++) {
        sum = sum - data[i - period] + data[i];
        smaValues.push(sum / period);
    }

    return smaValues;
};

/**
 * Calculates the Exponential Moving Average (EMA) for a given period.
 * @param data Array of numbers (e.g., closing prices).
 * @param period The number of data points to use for smoothing.
 * @returns An array of EMA values, starting after the initial period.
 */
export const calculateEMA = (data: number[], period: number): (number | null)[] => {
    if (!data || data.length < period) {
        return Array(data.length).fill(null);
    }

    const emaValues: (number | null)[] = Array(period - 1).fill(null); // Pad beginning
    const k = 2 / (period + 1); // Smoothing factor

    // Calculate the initial SMA for the first EMA value
    let initialSum = 0;
    for (let i = 0; i < period; i++) {
        initialSum += data[i];
    }
    let ema = initialSum / period;
    emaValues.push(ema);

    // Calculate subsequent EMA values
    for (let i = period; i < data.length; i++) {
        ema = (data[i] - ema) * k + ema;
        emaValues.push(ema);
    }

    return emaValues;
};

// TODO: Implement RSI calculation (requires separate pane)
export const calculateRSI = (data: number[], period: number = 14): (number | null)[] => {
    // Placeholder implementation
    console.warn("RSI calculation not yet implemented.");
    return Array(data.length).fill(null);
};

// TODO: Implement MACD calculation (requires separate pane)
export const calculateMACD = (data: number[], shortPeriod: number = 12, longPeriod: number = 26, signalPeriod: number = 9): { macdLine: (number | null)[], signalLine: (number | null)[], histogram: (number | null)[] } => {
    // Placeholder implementation
    console.warn("MACD calculation not yet implemented.");
    const nulls = Array(data.length).fill(null);
    return { macdLine: nulls, signalLine: nulls, histogram: nulls };
};
