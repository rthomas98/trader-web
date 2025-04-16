import React from 'react';
import { WatchlistItem } from '@/types/watchlist-item';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area'; // Use ScrollArea for potential overflow

interface WatchlistProps {
    watchlist: WatchlistItem[];
}

const Watchlist: React.FC<WatchlistProps> = ({ watchlist }) => {
    if (!watchlist || watchlist.length === 0) {
        return <p className="p-4 text-sm text-muted-foreground">Your watchlist is empty.</p>;
    }

    return (
        <ScrollArea className="h-[200px]"> {/* Adjust height as needed */}
            <Table className="w-full">
                <TableHeader>
                    <TableRow>
                        <TableHead>Symbol</TableHead>
                        {/* Add more headers later (Price, Change, etc.) */}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {watchlist.map((item) => (
                        <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.symbol}</TableCell>
                            {/* Add more cells later */}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </ScrollArea>
    );
};

export default Watchlist;
