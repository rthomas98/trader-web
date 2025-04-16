// resources/js/components/trading/order-form.tsx

import React, { useEffect } from 'react';
import { useForm, router } from "@inertiajs/react";
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from "@/components/ui/use-toast";
import { AvailablePairs } from '@/types/currency-pair';

// Interface for the form data
interface OrderFormData {
    [key: string]: string | number | null | boolean; // Allow for flexible properties
    trading_wallet_id: string | number | null;
    currency_pair: string;
    side: 'BUY' | 'SELL';
    order_type: 'MARKET' | 'LIMIT';
    quantity: number | string; // Allow string during input
    entry_price: number | string | null; // Allow string during input
    stop_loss: number | string | null; // Allow string during input
    take_profit: number | string | null; // Allow string during input
}

// Interface for the component's props
interface OrderFormProps {
    selectedPair: string;
    availablePairs: AvailablePairs;
    tradingWalletId: string | number | null; // Pass wallet ID from parent
    onSubmitSuccess?: () => void; // Optional callback for success
}

const OrderForm: React.FC<OrderFormProps> = ({
    selectedPair,
    availablePairs,
    tradingWalletId,
    onSubmitSuccess
}) => {
    const { toast } = useToast();

    // Combine all available pairs into a single list for the select dropdown
    const currencyPairOptions = [
        ...(availablePairs?.forex || []),
        ...(availablePairs?.crypto || []),
        ...(availablePairs?.commodities || []),
        ...(availablePairs?.indices || []),
    ];

    const { data: formData, setData, processing, errors, reset } = useForm<OrderFormData>({
        trading_wallet_id: tradingWalletId,
        currency_pair: selectedPair,
        side: 'BUY',
        order_type: 'MARKET',
        quantity: '', // Initialize numeric string inputs as empty strings
        entry_price: '',
        stop_loss: '',
        take_profit: '',
    });

    // Update form's currency pair when the selectedPair prop changes
    useEffect(() => {
        setData('currency_pair', selectedPair);
    }, [selectedPair, setData]);

    // Update wallet ID if it changes
    useEffect(() => {
        setData('trading_wallet_id', tradingWalletId);
    }, [tradingWalletId, setData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;

        // Handle numeric inputs, allowing empty string but converting to number otherwise
        if (type === 'number') {
            setData(name as keyof OrderFormData, value === '' ? '' : Number(value));
        } else {
            setData(name as keyof OrderFormData, value);
        }
    };

    const handleSelectChange = (name: keyof OrderFormData, value: string) => {
        setData(name, value);
        // Reset entry price if switching back to Market order
        if (name === 'order_type' && value === 'MARKET') {
            setData('entry_price', null);
        }
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!formData.trading_wallet_id) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Trading wallet is not selected or available.",
            });
            return;
        }

        // Manually prepare data with correct types for backend
        const dataToSubmit = {
            ...formData,
            quantity: Number(formData.quantity) || 0,
            entry_price: formData.entry_price ? Number(formData.entry_price) : undefined,
            stop_loss: formData.stop_loss ? Number(formData.stop_loss) : undefined,
            take_profit: formData.take_profit ? Number(formData.take_profit) : undefined,
        };

        // Use router.post directly
        router.post(route('trading.orders.store'), dataToSubmit, {
            preserveScroll: true,
            onSuccess: () => {
                toast({
                    title: "Order Submitted",
                    description: `${formData.side} ${formData.quantity} ${formData.currency_pair} order placed successfully.`,
                });
                reset(); // Reset form fields
                setData('currency_pair', selectedPair); // Keep selected pair
                setData('trading_wallet_id', tradingWalletId); // Re-set wallet ID
                if (onSubmitSuccess) {
                    onSubmitSuccess(); // Call the callback if provided
                }
            },
            onError: (errors: Record<string, string>) => { // Added explicit type for errors
                console.error('Order submission failed:', errors);
                // Optionally display specific errors to the user
                // Display a general error, specific errors are shown below fields
                toast({
                    variant: "destructive",
                    title: "Order Failed",
                    description: "Please check the form for errors.",
                });
            },
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <Label htmlFor="currency_pair">Currency Pair</Label>
                <Select
                    value={formData.currency_pair}
                    onValueChange={(value) => handleSelectChange('currency_pair', value)}
                >
                    <SelectTrigger id="currency_pair">
                        <SelectValue placeholder="Select currency pair" />
                    </SelectTrigger>
                    <SelectContent>
                        {currencyPairOptions.length > 0 ? (
                            currencyPairOptions.map((pair) => (
                                <SelectItem key={pair.symbol} value={pair.symbol}>
                                    {pair.symbol}
                                </SelectItem>
                            ))
                        ) : (
                            <SelectItem value="" disabled>No pairs available</SelectItem>
                        )}
                    </SelectContent>
                </Select>
                {errors.currency_pair && <p className="text-red-500 text-xs mt-1">{errors.currency_pair}</p>}
            </div>

            <div>
                <Label htmlFor="side">Side</Label>
                <Select
                    value={formData.side}
                    onValueChange={(value) => handleSelectChange('side', value)}
                >
                    <SelectTrigger id="side">
                        <SelectValue placeholder="Select side" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="BUY">Buy</SelectItem>
                        <SelectItem value="SELL">Sell</SelectItem>
                    </SelectContent>
                </Select>
                {errors.side && <p className="text-red-500 text-xs mt-1">{errors.side}</p>}
            </div>

            <div>
                <Label htmlFor="order_type">Order Type</Label>
                <Select
                    value={formData.order_type}
                    onValueChange={(value) => handleSelectChange('order_type', value)}
                >
                    <SelectTrigger id="order_type">
                        <SelectValue placeholder="Select order type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="MARKET">Market</SelectItem>
                        <SelectItem value="LIMIT">Limit</SelectItem>
                    </SelectContent>
                </Select>
                {errors.order_type && <p className="text-red-500 text-xs mt-1">{errors.order_type}</p>}
            </div>

            {formData.order_type === 'LIMIT' && (
                <div>
                    <Label htmlFor="entry_price">Entry Price</Label>
                    <Input
                        id="entry_price"
                        name="entry_price"
                        type="number"
                        step="any" // Use 'any' for fine price steps
                        min="0" // Min price is 0
                        value={formData.entry_price ?? ''}
                        onChange={handleChange}
                        required
                        placeholder="Enter desired entry price"
                        className="mt-1"
                    />
                    {errors.entry_price && <p className="text-red-500 text-xs mt-1">{errors.entry_price}</p>}
                </div>
            )}

            <div>
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                    id="quantity"
                    name="quantity"
                    type="number"
                    step="0.01" // Standard quantity step
                    min="0.01" // Minimum quantity
                    value={formData.quantity}
                    onChange={handleChange}
                    required
                    className="mt-1"
                    placeholder="Enter quantity"
                />
                {errors.quantity && <p className="text-red-500 text-xs mt-1">{errors.quantity}</p>}
            </div>

            <div>
                <Label htmlFor="stop_loss">Stop Loss</Label>
                <Input
                    id="stop_loss"
                    name="stop_loss"
                    type="number"
                    step="any"
                    min="0"
                    value={formData.stop_loss ?? ''}
                    onChange={handleChange}
                    placeholder="Optional stop price"
                    className="mt-1"
                />
                {errors.stop_loss && <p className="text-red-500 text-xs mt-1">{errors.stop_loss}</p>}
            </div>

            <div>
                <Label htmlFor="take_profit">Take Profit</Label>
                <Input
                    id="take_profit"
                    name="take_profit"
                    type="number"
                    step="any"
                    min="0"
                    value={formData.take_profit ?? ''}
                    onChange={handleChange}
                    placeholder="Optional profit target"
                    className="mt-1"
                />
                {errors.take_profit && <p className="text-red-500 text-xs mt-1">{errors.take_profit}</p>}
            </div>

            <Button type="submit" className="w-full" disabled={processing || !formData.trading_wallet_id}>
                {processing ? 'Submitting...' : 'Submit Order'}
            </Button>
            {!formData.trading_wallet_id && (
                <p className="text-red-500 text-xs mt-1 text-center">Please select a trading wallet.</p>
            )}
        </form>
    );
};

export default OrderForm;
