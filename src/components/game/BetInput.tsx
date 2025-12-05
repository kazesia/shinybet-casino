import React from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Coins } from 'lucide-react';

interface BetInputProps {
    value: number | string;
    onChange: (value: number | string) => void;
    onHalf?: () => void;
    onDouble?: () => void;
    onMax?: () => void;
    min?: number;
    max?: number;
    disabled?: boolean;
    className?: string;
    currency?: string;
}

export const BetInput: React.FC<BetInputProps> = ({
    value,
    onChange,
    onHalf,
    onDouble,
    onMax,
    min = 0,
    max,
    disabled = false,
    className,
    currency = 'LTC' // Default currency, can be made dynamic
}) => {

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;

        // Allow empty string for better UX (clearing the input)
        if (val === '') {
            onChange('');
            return;
        }

        // Allow typing decimal points
        if (val === '.' || val.endsWith('.')) {
            onChange(val);
            return;
        }

        const num = parseFloat(val);
        if (!isNaN(num) && num >= 0) {
            onChange(val);
        }
    };

    const displayValue = value === 0 || value === '' ? '' : (typeof value === 'number' ? value.toString() : value);

    return (
        <div className={cn("space-y-1", className)}>
            <div className="flex justify-between text-xs font-bold text-[#b1bad3]">
                <span>Bet Amount</span>
                {/* Optional: Show max bet or balance here if needed, or just current value formatted */}
                <span>{typeof value === 'number' ? value.toFixed(2) : (parseFloat(value) || 0).toFixed(2)} USD</span>
            </div>

            <div className="relative flex items-center group">
                {/* Currency Icon/Symbol */}
                <div className="absolute left-3 text-[#b1bad3] pointer-events-none select-none flex items-center gap-2">
                    {/* Could use an icon here */}
                    <span className="text-sm">$</span>
                </div>

                <Input
                    type="text" // Use text to allow "0." handling better than type="number"
                    inputMode="decimal"
                    value={displayValue}
                    onChange={handleChange}
                    disabled={disabled}
                    className="bg-[#0f212e] border-[#2f4553] text-white font-bold pl-8 pr-24 h-10 focus-visible:ring-1 focus-visible:ring-[#2f4553] hover:border-[#3d5565] transition-colors"
                    placeholder=""
                />

                {/* Controls (1/2, 2x, Max) */}
                <div className="absolute right-1 flex gap-1">
                    {onHalf && (
                        <button
                            type="button"
                            onClick={onHalf}
                            disabled={disabled}
                            className="px-2 py-1 text-xs font-bold bg-[#2f4553] hover:bg-[#3d5565] rounded text-[#b1bad3] hover:text-white transition-colors disabled:opacity-50"
                        >
                            ½
                        </button>
                    )}
                    {onDouble && (
                        <button
                            type="button"
                            onClick={onDouble}
                            disabled={disabled}
                            className="px-2 py-1 text-xs font-bold bg-[#2f4553] hover:bg-[#3d5565] rounded text-[#b1bad3] hover:text-white transition-colors disabled:opacity-50"
                        >
                            2×
                        </button>
                    )}
                    {onMax && (
                        <button
                            type="button"
                            onClick={onMax}
                            disabled={disabled}
                            className="px-2 py-1 text-xs font-bold bg-[#2f4553] hover:bg-[#3d5565] rounded text-[#b1bad3] hover:text-white transition-colors disabled:opacity-50"
                        >
                            Max
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
