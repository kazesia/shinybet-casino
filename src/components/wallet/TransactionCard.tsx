import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ExternalLink } from 'lucide-react';

interface TransactionItem {
    id: string;
    created_at: string;
    amount: number;
    currency: string;
    status: string;
    type: string;
    tx_hash?: string;
}

interface TransactionCardProps {
    item: TransactionItem;
}

export function TransactionCard({ item }: TransactionCardProps) {
    return (
        <div className="bg-[#1a2c38] border border-[#2f4553] rounded-lg p-4 flex flex-col gap-3 shadow-sm">
            <div className="flex items-center justify-between">
                <div className="flex flex-col">
                    <span className="text-sm font-bold text-white">{item.type}</span>
                    <span className="text-xs text-[#b1bad3]">
                        {new Date(item.created_at).toLocaleString('en-US', {
                            month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true
                        })}
                    </span>
                </div>
                <Badge variant="outline" className={cn(
                    "capitalize border-0 font-bold",
                    item.status === 'confirmed' || item.status === 'paid' ? "text-green-500 bg-green-500/10" :
                        item.status === 'pending' ? "text-yellow-500 bg-yellow-500/10" :
                            "text-red-500 bg-red-500/10"
                )}>
                    {item.status}
                </Badge>
            </div>

            <div className="flex items-center justify-between border-t border-[#2f4553] pt-3">
                <div className="flex items-center gap-2 text-white font-bold text-xs cursor-pointer hover:text-[#1475e1] transition-colors">
                    View Transaction <ExternalLink className="w-3 h-3" />
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-white font-mono font-bold text-lg">${item.amount.toFixed(2)}</span>
                    <div className="w-5 h-5 rounded-full bg-[#345d9d] flex items-center justify-center text-white text-[10px] font-bold">
                        Ł
                    </div>
                </div>
            </div>
        </div>
    );
}
