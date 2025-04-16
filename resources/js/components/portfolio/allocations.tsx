import React from 'react';
import { AllocationItem } from '@/types/allocation-item';
import Chart from 'react-apexcharts'; // Direct import

interface AllocationsProps {
    allocations: AllocationItem[];
}

const Allocations: React.FC<AllocationsProps> = ({ allocations }) => {
    if (!allocations || allocations.length === 0) {
        return <p className="p-4 text-sm text-muted-foreground">No allocation data available.</p>;
    }

    // Prepare data for ApexCharts
    const series = allocations.map(item => item.percentage);
    const labels = allocations.map(item => `${item.symbol} (${item.count})`); // Include count in label

    const options: ApexCharts.ApexOptions = {
        chart: {
            type: 'donut',
        },
        labels: labels,
        plotOptions: {
            pie: {
                donut: {
                    labels: {
                        show: true,
                        total: {
                            show: true,
                            label: 'Total Pos.', // Label for the total count
                            formatter: function () { // Remove unused parameter
                                // Calculate total count from the input data
                                const totalCount = allocations.reduce((sum, item) => sum + item.count, 0);
                                return totalCount.toString(); // Display the total count
                            }
                        }
                    }
                }
            }
        },
        dataLabels: {
            enabled: true,
            formatter: function (val: number) {
                return val.toFixed(1) + '%'; // Show percentage on slices
            },
        },
        legend: {
            position: 'bottom',
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
        // Add other styling/options as needed, potentially using brand colors
        // colors: ['#8D5EB7', '#211DE49', '#EECEE6', '#D04014', ...] // Example using brand colors
    };

    return (
        <div className="chart-container p-2">
            <Chart options={options} series={series} type="donut" width="100%" height={300} />
        </div>
    );
};

export default Allocations;
