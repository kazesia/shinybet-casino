import { useState } from 'react';
import { useAdminMutations } from '@/hooks/useAdmin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, Minus } from 'lucide-react';

interface BalanceAdjustmentProps {
    userId: string;
    username: string;
    currentBalance: number;
    onSuccess?: () => void;
}

export function BalanceAdjustment({ userId, username, currentBalance, onSuccess }: BalanceAdjustmentProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [amount, setAmount] = useState('');
    const [type, setType] = useState<'credit' | 'debit'>('credit');
    const [reason, setReason] = useState('');

    const { adjustBalance } = useAdminMutations();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || !reason) return;

        const numericAmount = parseFloat(amount);
        if (isNaN(numericAmount) || numericAmount <= 0) return;

        const finalAmount = type === 'credit' ? numericAmount : -numericAmount;

        await adjustBalance.mutateAsync({
            userId,
            amount: finalAmount,
            reason
        });

        setIsOpen(false);
        setAmount('');
        setReason('');
        if (onSuccess) onSuccess();
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="border-admin-border hover:bg-white/5">
                    Adjust Balance
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-admin-surface border-admin-border text-white">
                <DialogHeader>
                    <DialogTitle>Adjust Balance for {username}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Current Balance</Label>
                            <div className="p-2 bg-black/30 rounded border border-admin-border font-mono">
                                {currentBalance.toFixed(2)}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Adjustment Type</Label>
                            <Select value={type} onValueChange={(v: 'credit' | 'debit') => setType(v)}>
                                <SelectTrigger className="bg-black/30 border-admin-border">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-admin-surface border-admin-border text-white">
                                    <SelectItem value="credit">Credit (+)</SelectItem>
                                    <SelectItem value="debit">Debit (-)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Amount</Label>
                        <div className="relative">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                {type === 'credit' ? <Plus className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                            </div>
                            <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                className="pl-9 bg-black/30 border-admin-border"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Reason (Required)</Label>
                        <Textarea
                            placeholder="e.g. Bonus, Correction, Refund..."
                            className="bg-black/30 border-admin-border min-h-[80px]"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            required
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
                        <Button
                            type="submit"
                            className={type === 'credit' ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
                            disabled={adjustBalance.isPending}
                        >
                            {adjustBalance.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {type === 'credit' ? 'Add Credits' : 'Deduct Credits'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
