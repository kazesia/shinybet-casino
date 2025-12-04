import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Copy, ExternalLink } from 'lucide-react';
import { BetData } from '@/hooks/useRecentBets';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface BetDetailDrawerProps {
    bet: BetData;
    isOpen: boolean;
    onClose: () => void;
}

export function BetDetailDrawer({ bet, isOpen, onClose }: BetDetailDrawerProps) {
    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`${label} copied to clipboard`);
    };

    const isWin = bet.payout_credits > bet.stake_credits;
    const multiplier = bet.stake_credits > 0 ? bet.payout_credits / bet.stake_credits : 0;

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="bg-[#0f212e] border-l border-[#2f4553] text-white w-full sm:max-w-lg overflow-y-auto">
                <SheetHeader>
                    <SheetTitle className="text-white">Bet Details</SheetTitle>
                </SheetHeader>

                <div className="mt-6 space-y-6">
                    {/* Status Badge */}
                    <div className="flex items-center gap-2">
                        <Badge
                            className={cn(
                                "px-3 py-1",
                                isWin ? "bg-[#2CE38F]/20 text-[#2CE38F] border-[#2CE38F]/30" : "bg-[#b1bad3]/20 text-[#b1bad3] border-[#b1bad3]/30"
                            )}
                        >
                            {isWin ? 'WIN' : 'LOSS'}
                        </Badge>
                        <span className="text-sm text-[#b1bad3] capitalize">{bet.game_type}</span>
                    </div>

                    {/* Main Stats */}
                    <div className="grid grid-cols-2 gap-4">
                        <Card className="bg-[#1a2c38] border-[#2f4553]">
                            <CardContent className="p-4">
                                <div className="text-xs text-[#b1bad3] mb-1">Bet Amount</div>
                                <div className="text-xl font-bold text-white">${bet.stake_credits.toFixed(2)}</div>
                            </CardContent>
                        </Card>

                        <Card className="bg-[#1a2c38] border-[#2f4553]">
                            <CardContent className="p-4">
                                <div className="text-xs text-[#b1bad3] mb-1">Payout</div>
                                <div className={cn(
                                    "text-xl font-bold",
                                    isWin ? "text-[#2CE38F]" : "text-[#b1bad3]"
                                )}>
                                    ${bet.payout_credits.toFixed(2)}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-[#1a2c38] border-[#2f4553]">
                            <CardContent className="p-4">
                                <div className="text-xs text-[#b1bad3] mb-1">Multiplier</div>
                                <div className="text-xl font-bold text-white">{multiplier.toFixed(2)}x</div>
                            </CardContent>
                        </Card>

                        <Card className="bg-[#1a2c38] border-[#2f4553]">
                            <CardContent className="p-4">
                                <div className="text-xs text-[#b1bad3] mb-1">Profit</div>
                                <div className={cn(
                                    "text-xl font-bold",
                                    isWin ? "text-[#2CE38F]" : "text-red-400"
                                )}>
                                    {isWin ? '+' : ''}${(bet.payout_credits - bet.stake_credits).toFixed(2)}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Bet ID */}
                    <Card className="bg-[#1a2c38] border-[#2f4553]">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-xs text-[#b1bad3] mb-1">Bet ID</div>
                                    <div className="text-sm font-mono text-white">{bet.id.substring(0, 20)}...</div>
                                </div>
                                <button
                                    onClick={() => copyToClipboard(bet.id, 'Bet ID')}
                                    className="p-2 hover:bg-[#213743] rounded-lg transition-colors"
                                >
                                    <Copy className="w-4 h-4 text-[#b1bad3]" />
                                </button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* User Info */}
                    {bet.display_username && (
                        <Card className="bg-[#1a2c38] border-[#2f4553]">
                            <CardContent className="p-4">
                                <div className="text-xs text-[#b1bad3] mb-1">Player</div>
                                <div className="text-sm text-white">{bet.display_username}</div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Timestamp */}
                    <Card className="bg-[#1a2c38] border-[#2f4553]">
                        <CardContent className="p-4">
                            <div className="text-xs text-[#b1bad3] mb-1">Time</div>
                            <div className="text-sm text-white">
                                {new Date(bet.created_at).toLocaleString()}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Provably Fair */}
                    <Card className="bg-[#1a2c38] border-[#2f4553]">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-xs text-[#b1bad3] mb-1">Provably Fair</div>
                                    <div className="text-sm text-white">Verify this bet</div>
                                </div>
                                <button className="p-2 hover:bg-[#213743] rounded-lg transition-colors">
                                    <ExternalLink className="w-4 h-4 text-[#b1bad3]" />
                                </button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </SheetContent>
        </Sheet>
    );
}
