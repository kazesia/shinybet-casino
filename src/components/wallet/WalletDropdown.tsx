import { ChevronDown } from 'lucide-react';
import { useWallet } from '@/context/WalletContext';
import { useAuth } from '@/context/AuthContext';
import { formatMoney } from '@/utils/format';

export function WalletDropdown() {
    const { user } = useAuth();
    const { balance } = useWallet();

    if (!user) return null;

    return (
        <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-[#0D1016] border border-[#2f4553]">
            <span className="text-sm font-bold text-white">
                ${formatMoney(balance)}
            </span>
            <div className="w-5 h-5 rounded-full bg-[#2CE38F] flex items-center justify-center">
                <span className="text-white text-xs font-bold">$</span>
            </div>
            <ChevronDown className="w-4 h-4 text-[#b1bad3]" />
        </div>
    );
}
