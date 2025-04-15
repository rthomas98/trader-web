import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Format a number as currency
 * @param value - The value to format
 * @param currency - The currency code (default: USD)
 * @param locale - The locale (default: en-US)
 * @returns Formatted currency string
 */
export function formatCurrency(
    value: number, 
    currency: string = 'USD', 
    locale: string = 'en-US'
): string {
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 6,
    }).format(value);
}
