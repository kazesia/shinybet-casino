import { useWallet } from '@/context/WalletContext';
import { useUI } from '@/context/UIContext';
import { Button } from '@/components/ui/button';
import { Wallet, ArrowUpRight, ArrowDownLeft, Plus } from 'lucide-react';
import { formatMoney } from '@/utils/format';

export function BalanceCard() {
    const { balance } = useWallet();
    const { openWalletModal } = useUI();

    return (
        <div className="bg-gradient-to-br from-[#1a2c38] to-[#0f212e] rounded-xl p-5 border border-[#2f4553] shadow-lg relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#1475e1]/10 rounded-full blur-2xl" />

            <div className="relative z-10 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[#b1bad3]">
                        <Wallet className="w-4 h-4" />
                        <span className="text-sm font-medium">Total Balance</span>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openWalletModal('overview')}
                        className="h-8 text-[#1475e1] hover:text-[#1475e1] hover:bg-[#1475e1]/10 -mr-2"
                    >
                        Wallet
                    </Button>
                </div>

                <div className="space-y-1">
                    <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-white tracking-tight">
                            ${formatMoney(balance)}
                        </span>
                        <span className="text-sm text-[#b1bad3] font-medium">USD</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                    <Button
                        onClick={() => openWalletModal('deposit')}
                        className="bg-[#1475e1] hover:bg-[#1475e1]/90 text-white font-bold h-10 shadow-lg shadow-blue-500/20"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Deposit
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => openWalletModal('withdraw')}
                        className="bg-[#213743] border-[#2f4553] hover:bg-[#2f4553] text-white font-bold h-10"
                    >
                        <ArrowUpRight className="w-4 h-4 mr-2" />
                        Withdraw
                    </Button>
                </div>
            </div>
        </div>
    );
}
