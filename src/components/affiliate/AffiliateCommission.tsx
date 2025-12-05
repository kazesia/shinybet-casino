import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { toast } from 'sonner';
import { Filter } from 'lucide-react';
import { TransferCommissionModal } from './TransferCommissionModal';

interface AffiliateCommissionProps {
    affiliate: any;
}

const CURRENCIES = ['BTC', 'ETH', 'LTC', 'USDT', 'SOL', 'DOGE', 'BCH', 'XRP'];

export function AffiliateCommission({ affiliate }: AffiliateCommissionProps) {
    const { stats, loading, transferToBalance } = affiliate;
    const [sortBy, setSortBy] = useState('lifetime-high');
    const [transferring, setTransferring] = useState<string | null>(null);
    const [showTransferModal, setShowTransferModal] = useState(false);

    const handleTransfer = async (currency: string, amount: number) => {
        if (amount < 10) {
            toast.error('Minimum transfer amount is $10 USD equivalent');
            return;
        }

        setTransferring(currency);
        try {
            await transferToBalance(amount, currency);
            toast.success(`Successfully transferred ${amount.toFixed(8)} ${currency} to your balance`);
        } catch (error: any) {
            toast.error(error.message || 'Transfer failed');
        } finally {
            setTransferring(null);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-white mb-2">Commission</h2>
                <p className="text-[#b1bad3]">
                    View and track the earnings you've generated through your referrals. This section provides a clear breakdown of your commissions and payouts — keeping you in control of your earnings.
                </p>
            </div>

            {/* Controls */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-[#b1bad3]" />
                    <span className="text-white text-sm font-medium">Sort</span>
                </div>
                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-[#1a2c38] border border-[#2f4553] rounded-lg px-4 py-2 text-white text-sm"
                >
                    <option value="lifetime-high">Lifetime Commission: High to Low</option>
                    <option value="lifetime-low">Lifetime Commission: Low to High</option>
                    <option value="available-high">Available Commission: High to Low</option>
                </select>

                <Button className="bg-[#1475e1] hover:bg-[#1266c9] text-white">
                    <Filter className="w-4 h-4 mr-2" />
                    Filter
                </Button>

                <div className="flex-1" />

                <Button
                    onClick={() => setShowTransferModal(true)}
                    className="bg-[#1475e1] hover:bg-[#1266c9] text-white"
                >
                    Transfer to Balance
                </Button>
            </div>

            {/* Commission Table */}
            <Card className="bg-[#1a2c38] border-[#2f4553]">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="border-b border-[#2f4553]">
                            <tr>
                                <th className="text-left px-6 py-4 text-[#b1bad3] font-medium text-sm">Currencies</th>
                                <th className="text-left px-6 py-4 text-[#b1bad3] font-medium text-sm">Available Commission</th>
                                <th className="text-left px-6 py-4 text-[#b1bad3] font-medium text-sm">Withdrawn Commission</th>
                                <th className="text-left px-6 py-4 text-[#b1bad3] font-medium text-sm">Lifetime Commission</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-[#b1bad3]">
                                        Loading...
                                    </td>
                                </tr>
                            ) : (
                                CURRENCIES.map((currency) => {
                                    const available = stats?.availableCommission?.[currency] || 0;
                                    const withdrawn = stats?.withdrawnCommission?.[currency] || 0;
                                    const lifetime = stats?.lifetimeCommission?.[currency] || 0;

                                    return (
                                        <tr key={currency} className="border-b border-[#2f4553] hover:bg-[#213743]">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-[#F7D979]/10 flex items-center justify-center">
                                                        <span className="text-xs font-bold text-[#F7D979]">{currency.charAt(0)}</span>
                                                    </div>
                                                    <span className="text-white font-medium">{currency}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-white">
                                                ${available.toFixed(2)}
                                                <span className="ml-1 text-[#00e701]">●</span>
                                            </td>
                                            <td className="px-6 py-4 text-white">
                                                ${withdrawn.toFixed(2)}
                                                <span className="ml-1 text-[#00e701]">●</span>
                                            </td>
                                            <td className="px-6 py-4 text-white">
                                                ${lifetime.toFixed(2)}
                                                <span className="ml-1 text-[#00e701]">●</span>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Transfer Commission Modal */}
            <TransferCommissionModal
                open={showTransferModal}
                onClose={() => setShowTransferModal(false)}
                availableCommission={stats?.availableCommission || {}}
                onTransfer={transferToBalance}
            />
        </div>
    );
}
