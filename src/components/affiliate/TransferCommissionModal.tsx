import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { AlertCircle, TrendingUp, X } from 'lucide-react';
import { toast } from 'sonner';

interface TransferCommissionModalProps {
    open: boolean;
    onClose: () => void;
    availableCommission: Record<string, number>;
    onTransfer: (amount: number, currency: string) => Promise<void>;
}

export function TransferCommissionModal({
    open,
    onClose,
    availableCommission,
    onTransfer
}: TransferCommissionModalProps) {
    const [selectedCurrency, setSelectedCurrency] = useState('USD');
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);

    const available = availableCommission[selectedCurrency] || 0;
    const canTransfer = available >= 10;

    const handleTransfer = async () => {
        const transferAmount = parseFloat(amount);

        if (!transferAmount || transferAmount <= 0) {
            toast.error('Please enter a valid amount');
            return;
        }

        if (transferAmount > available) {
            toast.error('Amount exceeds available commission');
            return;
        }

        if (transferAmount < 10) {
            toast.error('Minimum transfer amount is $10 USD equivalent');
            return;
        }

        setLoading(true);
        try {
            await onTransfer(transferAmount, selectedCurrency);
            toast.success('Commission transferred successfully!');
            onClose();
            setAmount('');
        } catch (error: any) {
            toast.error(error.message || 'Transfer failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="bg-[#1a2c38] border-[#2f4553] max-w-[600px]">
                <DialogHeader className="flex flex-row items-center justify-between border-b border-[#2f4553] pb-4">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-[#00e701]" />
                        <DialogTitle className="text-white text-xl">Transfer Commission</DialogTitle>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-[#b1bad3] hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </DialogHeader>

                <div className="space-y-6 pt-4">
                    {/* Available Commission Display */}
                    <div className="bg-[#0f212e] rounded-lg p-4">
                        <Label className="text-[#b1bad3] text-sm mb-2 block">
                            Estimated Available Commission
                        </Label>
                        <div className="text-2xl font-bold text-white">
                            ${available.toFixed(2)} {selectedCurrency}
                        </div>
                    </div>

                    {/* Transfer Not Available Warning */}
                    {!canTransfer && (
                        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                                <div>
                                    <h4 className="text-red-500 font-semibold mb-1">Transfer Not Available</h4>
                                    <p className="text-red-400 text-sm">
                                        There is currently no commission available to transfer to your balance.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Transfer Form */}
                    {canTransfer && (
                        <div className="space-y-4">
                            <div>
                                <Label className="text-white mb-2 block">Currency</Label>
                                <select
                                    value={selectedCurrency}
                                    onChange={(e) => setSelectedCurrency(e.target.value)}
                                    className="w-full bg-[#0f212e] border border-[#2f4553] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00e701]"
                                >
                                    {Object.keys(availableCommission).map((currency) => (
                                        <option key={currency} value={currency}>
                                            {currency} - ${availableCommission[currency].toFixed(2)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <Label className="text-white mb-2 block">Amount</Label>
                                <Input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="Enter amount"
                                    className="bg-[#0f212e] border-[#2f4553] text-white focus:border-[#00e701]"
                                    min={10}
                                    max={available}
                                    step={0.01}
                                />
                                <p className="text-[#b1bad3] text-xs mt-1">
                                    Minimum: $10.00 | Maximum: ${available.toFixed(2)}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        {canTransfer ? (
                            <>
                                <Button
                                    onClick={onClose}
                                    variant="outline"
                                    className="flex-1 bg-transparent border-[#2f4553] text-white hover:bg-[#2f4553]"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleTransfer}
                                    disabled={loading || !amount}
                                    className="flex-1 bg-[#1475e1] hover:bg-[#1266c9] text-white"
                                >
                                    {loading ? 'Transferring...' : 'Transfer Commission'}
                                </Button>
                            </>
                        ) : (
                            <Button
                                onClick={onClose}
                                className="w-full bg-[#1475e1] hover:bg-[#1266c9] text-white"
                            >
                                Done
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
