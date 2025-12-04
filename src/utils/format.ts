/**
 * Format a number into compact notation (K, M, B, T)
 * @param value - The number to format
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted string like "1.2K", "3.5M", etc.
 */
export function formatCompact(value: number, decimals: number = 1): string {
    if (value === 0) return '0.00';

    const absValue = Math.abs(value);
    const sign = value < 0 ? '-' : '';

    if (absValue < 1000) {
        return sign + value.toFixed(2);
    }

    const units = [
        { value: 1e12, suffix: 'T' },
        { value: 1e9, suffix: 'B' },
        { value: 1e6, suffix: 'M' },
        { value: 1e3, suffix: 'K' }
    ];

    for (const unit of units) {
        if (absValue >= unit.value) {
            const formatted = (absValue / unit.value).toFixed(decimals);
            return sign + formatted + unit.suffix;
        }
    }

    return sign + absValue.toFixed(decimals);
}

/**
 * Format a number with commas and decimal places
 * @param value - The number to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string like "2,120,897,928,240.02"
 */
export function formatFull(value: number, decimals: number = 2): string {
    if (value === 0) return '0.00';

    const parts = value.toFixed(decimals).split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');

    return parts.join('.');
}

/**
 * Format currency with symbol
 * @param value - The number to format
 * @param currency - Currency code (e.g., 'SHY', 'USD')
 * @param compact - Whether to use compact notation
 * @returns Formatted currency string
 */
export function formatCurrency(
    value: number,
    currency: string = 'SHY',
    compact: boolean = false
): string {
    const formatted = compact ? formatCompact(value) : formatFull(value);
    return `${formatted} ${currency}`;
}

/**
 * Interpolate between two numbers for animation
 * @param start - Starting value
 * @param end - Ending value
 * @param progress - Progress from 0 to 1
 * @returns Interpolated value
 */
export function interpolate(start: number, end: number, progress: number): number {
    return start + (end - start) * progress;
}

/**
 * Easing function for smooth animations
 * @param t - Time progress from 0 to 1
 * @returns Eased value
 */
export function easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
}

/**
 * Format a number as money with commas and 2 decimal places
 * @param value - The number to format
 * @returns Formatted string like "1,234.56"
 */
export function formatMoney(value: number | string): string {
    const n = typeof value === 'string' ? Number(value) : value;
    if (Number.isNaN(n)) return '0.00';

    return n.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}
