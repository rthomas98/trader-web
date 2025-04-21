import React from 'react';
import Chart from 'react-apexcharts';
import type { ApexOptions } from 'apexcharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; 
import { useTheme } from '@/components/theme-provider'; 

interface Allocation {
    symbol: string;
    percentage: number;
    count?: number; 
    value?: number; 
}

interface AllocationsProps {
    allocations: Allocation[];
}

const Allocations: React.FC<AllocationsProps> = ({ allocations }) => {
    const { theme } = useTheme(); 
    const isDarkMode = theme === 'dark';

    if (!allocations || allocations.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Portfolio Allocations</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="p-4 text-sm text-muted-foreground text-center">No allocation data available.</p>
                </CardContent>
            </Card>
        );
    }

    const series = allocations.map(item => item.percentage);
    const labels = allocations.map(item => item.symbol);

    const options: ApexOptions = {
        chart: {
            type: 'donut',
            background: 'transparent',
        },
        labels: labels,
        theme: {
            mode: isDarkMode ? 'dark' : 'light',
            palette: 'palette1' 
        },
        plotOptions: {
            pie: {
                donut: {
                    size: '65%',
                    labels: {
                        show: true,
                        total: {
                            show: true,
                            showAlways: true,
                            label: 'Total Assets',
                            fontSize: '16px',
                            fontWeight: 600,
                            color: isDarkMode ? '#F9F9F9' : '#1A161D',
                            formatter: function (w) {
                                const total = w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0);
                                return `${total.toFixed(1)}%`; 
                            }
                        },
                        value: {
                           color: isDarkMode ? '#E1E1E6' : '#333333',
                           offsetY: 8, 
                           formatter: function (val) {
                               return `${Number(val).toFixed(1)}%`;
                           }
                        },
                    }
                }
            }
        },
        dataLabels: {
            enabled: true,
            formatter: function (val, opts) {
                const symbol = opts.w.globals.labels[opts.seriesIndex];
                return `${symbol}: ${Number(val).toFixed(1)}%`;
            },
            style: {
                 colors: [isDarkMode ? '#FFFFFF' : '#000000'] 
            },
             dropShadow: { 
                 enabled: true,
                 top: 1,
                 left: 1,
                 blur: 1,
                 color: '#000',
                 opacity: 0.45
             }
        },
        legend: {
            show: true,
            position: 'bottom',
            horizontalAlign: 'center',
            labels: {
                colors: isDarkMode ? '#F9F9F9' : '#1A161D'
            }
        },
        tooltip: {
            theme: isDarkMode ? 'dark' : 'light',
            y: {
                formatter: function(value) {
                    return `${value.toFixed(2)}%`;
                },
                title: {
                    formatter: function (seriesName) {
                        return seriesName; 
                    }
                }
            }
        },
        responsive: [{
            breakpoint: 480,
            options: {
                chart: {
                    width: '100%'
                },
                legend: {
                    position: 'bottom'
                }
            }
        }]
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Portfolio Allocations</CardTitle>
            </CardHeader>
            <CardContent>
                <div id="chart-allocations">
                    <Chart options={options} series={series} type="donut" height={350} />
                </div>
                <ul className="mt-4 space-y-2">
                    {allocations.map((alloc) => (
                        <li key={alloc.symbol} className="flex justify-between">
                            <span>{alloc.symbol}</span>
                            <span>{alloc.percentage.toFixed(1)}%</span>
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
    );
};

export default Allocations;
