// resources/js/components/portfolio/open-positions.tsx
import React from 'react';
import { TradingPosition } from '@/types/trading-position'; // Assuming this type exists or needs creation
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from 'date-fns';

interface OpenPositionsProps {
    openPositions: TradingPosition[];
}

const OpenPositions: React.FC<OpenPositionsProps> = ({ openPositions }) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Open Positions</CardTitle>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[300px] w-full"> {/* Adjust height as needed */}
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Pair</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead className="text-right">Quantity</TableHead>
                                <TableHead className="text-right">Entry Price</TableHead>
                                <TableHead>Entry Time</TableHead>
                                <TableHead className="text-right">Stop Loss</TableHead>
                                <TableHead className="text-right">Take Profit</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {openPositions.length > 0 ? (
                                openPositions.map((position) => (
                                    <TableRow key={position.id}>
                                        <TableCell className="font-medium">{position.currency_pair}</TableCell>
                                        <TableCell
                                             className={position.trade_type === 'BUY' ? 'text-green-500' : 'text-red-500'}
                                        >
                                            {position.trade_type}
                                         </TableCell>
                                        <TableCell className="text-right">{position.quantity.toFixed(4)}</TableCell>
                                        <TableCell className="text-right">{position.entry_price.toFixed(5)}</TableCell>
                                        <TableCell>{format(new Date(position.entry_time), 'PPpp')}</TableCell>
                                        <TableCell className="text-right">
                                            {position.stop_loss ? position.stop_loss.toFixed(5) : 'N/A'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {position.take_profit ? position.take_profit.toFixed(5) : 'N/A'}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center">
                                        No open positions found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </ScrollArea>
            </CardContent>
        </Card>
    );
};

export default OpenPositions;
