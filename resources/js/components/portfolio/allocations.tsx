import React from 'react';
// import Chart from 'react-apexcharts'; // Direct import

interface AllocationsProps {
    allocations: AllocationItem[];
}

const Allocations: React.FC<AllocationsProps> = ({ allocations }) => {
    if (!allocations || allocations.length === 0) {
        return <p className="p-4 text-sm text-muted-foreground">No allocation data available.</p>;
    }

    // Prepare data for ApexCharts
    // const series = allocations.map(item => item.percentage);
    // const labels = allocations.map(item => `${item.symbol} (${item.count})`); // Include count in label

    // const options: any = { ... }; // Chart options commented out, ApexCharts type removed

    return (
        <div className="chart-container p-2">
            {/* <Chart options={options} series={series} type="donut" width="100%" height={300} /> */}
            <p className="text-muted-foreground">Allocation chart placeholder.</p>
            {/* Display allocation list as fallback or alternative */}
            <ul className="mt-4 space-y-2">
                {allocations.map((alloc) => (
                    <li key={alloc.symbol} className="flex justify-between">
                        <span>{alloc.symbol}</span>
                        <span>{alloc.percentage.toFixed(1)}%</span>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default Allocations;
