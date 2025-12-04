import { ChevronDown } from 'lucide-react';
import { useWallet } from '@/context/WalletContext';
import { useAuth } from '@/context/AuthContext';
import { useUI } from '@/context/UIContext';
import { formatMoney } from '@/utils/format';

export function WalletDropdown() {
    const { user } = useAuth();
    const { balance } = useWallet();
    const { openWalletModal } = useUI();

    if (!user) return null;

    return (
        <button
            onClick={() => openWalletModal('overview')}
            className="flex items-center gap-2 px-3 py-2 rounded-md bg-[#0D1016] border border-[#2f4553] hover:bg-[#1a2c38] transition-colors cursor-pointer"
        >
            <span className="text-sm font-bold text-white">
                ${formatMoney(balance)}
            </span>
            <div className="w-5 h-5 rounded-full bg-[#2CE38F] flex items-center justify-center">
                <span className="text-white text-xs font-bold">$</span>
            </div>
            <ChevronDown className="w-4 h-4 text-[#b1bad3]" />
        </button>
    );
}
