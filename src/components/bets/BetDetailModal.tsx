import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Copy, ExternalLink, X, Dices, Zap, Flame, TrendingUp, Spade, Coins, Star, Gem } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { StatisticsModal } from '@/components/profile/StatisticsModal';

// VIP Tiers Configuration
const VIP_TIERS = [
    { name: 'Bronze', minWager: 0, color: '#cd7f32', icon: '⭐' },
    { name: 'Silver', minWager: 10000, color: '#c0c0c0', icon: '⭐' },
    { name: 'Gold', minWager: 50000, color: '#ffd700', icon: '🌟' },
    { name: 'Platinum', minWager: 100000, color: '#e5e4e2', icon: '💎' },
    { name: 'Diamond', minWager: 500000, color: '#b9f2ff', icon: '💎' },
];

// Dollar icon component (same as WalletModal/LiveBets)
const CryptoIcon = () => (
    <div className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 bg-[#00e701]">
        $
    </div>
);

interface Bet {
    id: string;
    user_id: string;
    game_type: string;
    stake_credits: number;
    payout_credits: number;
    result: 'win' | 'loss' | 'pending';
    raw_data?: Record<string, any>;
    created_at: string;
    profiles?: {
        id?: string;
        username: string;
    };
}

interface BetDetailModalProps {
    bet: Bet | null;
    isOpen: boolean;
    onClose: () => void;
}

const getGameIcon = (gameType: string) => {
    const type = gameType.toLowerCase();
    switch (type) {
        case 'dice':
            return <Dices className="w-5 h-5" />;
        case 'plinko':
            return <Zap className="w-5 h-5" />;
        case 'mines':
            return <Flame className="w-5 h-5" />;
        case 'crash':
            return <TrendingUp className="w-5 h-5" />;
        case 'blackjack':
            return <Spade className="w-5 h-5" />;
        case 'coinflip':
        case 'coin flip':
            return <Coins className="w-5 h-5" />;
        default:
            return <Dices className="w-5 h-5" />;
    }
};

const getGameLink = (gameType: string) => {
    const type = gameType.toLowerCase();
    switch (type) {
        case 'dice':
            return '/game/dice';
        case 'plinko':
            return '/game/plinko';
        case 'mines':
            return '/game/mines';
        case 'crash':
            return '/game/crash';
        case 'blackjack':
            return '/game/blackjack';
        case 'coinflip':
        case 'coin flip':
            return '/game/coinflip';
        case 'dragon-tower':
        case 'dragon tower':
            return '/game/dragon-tower';
        case 'limbo':
            return '/game/limbo';
        case 'roulette':
            return '/game/roulette';
        default:
            return '/casino';
    }
};

// Format bet ID to be more readable (like Stake's format)
const formatBetId = (id: string) => {
    // Convert UUID to a numeric-like format
    const numericId = id.replace(/-/g, '').slice(0, 15);
    // Add commas for readability
    return numericId.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

// Game-specific visualizations
const MinesVisualization = ({ rawData }: { rawData: Record<string, any> }) => {
    const grid = rawData?.grid || rawData?.revealedCells || [];
    const minePositions = rawData?.minePositions || rawData?.mines || [];

    if (!grid || grid.length === 0) return null;

    // Create 5x5 grid
    const gridSize = 5;
    const cells = Array(gridSize * gridSize).fill(null);

    return (
        <div className="grid grid-cols-5 gap-1.5 p-4 bg-[#0f212e] rounded-lg">
            {cells.map((_, index) => {
                const isRevealed = grid.includes(index);
                const isMine = minePositions.includes(index);

                return (
                    <div
                        key={index}
                        className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center transition-all",
                            isRevealed
                                ? isMine
                                    ? "bg-red-500/80"
                                    : "bg-green-500/80"
                                : "bg-[#2f4553]"
                        )}
                    >
                        {isRevealed && (
                            isMine ? (
                                <span className="text-lg">💣</span>
                            ) : (
                                <span className="text-lg">💎</span>
                            )
                        )}
                    </div>
                );
            })}
        </div>
    );
};

const DiceVisualization = ({ rawData }: { rawData: Record<string, any> }) => {
    const target = rawData?.target || rawData?.targetNumber;
    const rolled = rawData?.rolled || rawData?.result;
    const isOver = rawData?.isOver ?? rawData?.rollOver;

    if (target === undefined || rolled === undefined) return null;

    return (
        <div className="flex flex-col items-center gap-4 p-4 bg-[#0f212e] rounded-lg">
            <div className="flex items-center gap-8">
                <div className="text-center">
                    <div className="text-xs text-[#b1bad3] mb-1">Target</div>
                    <div className="text-2xl font-bold text-white">{target}</div>
                    <div className="text-xs text-[#b1bad3]">{isOver ? 'Roll Over' : 'Roll Under'}</div>
                </div>
                <div className="text-3xl text-[#b1bad3]">→</div>
                <div className="text-center">
                    <div className="text-xs text-[#b1bad3] mb-1">Rolled</div>
                    <div className={cn(
                        "text-3xl font-bold",
                        rawData?.won ? "text-green-400" : "text-red-400"
                    )}>
                        {rolled}
                    </div>
                </div>
            </div>
        </div>
    );
};

const CoinFlipVisualization = ({ rawData }: { rawData: Record<string, any> }) => {
    const side = rawData?.side;
    const outcome = rawData?.outcome;

    if (!side || !outcome) return null;

    return (
        <div className="flex flex-col items-center gap-4 p-4 bg-[#0f212e] rounded-lg">
            <div className="flex items-center gap-8">
                <div className="text-center">
                    <div className="text-xs text-[#b1bad3] mb-1">Picked</div>
                    <div className="text-3xl">{side === 'heads' ? '🪙' : '🔵'}</div>
                    <div className="text-sm text-white capitalize">{side}</div>
                </div>
                <div className="text-3xl text-[#b1bad3]">→</div>
                <div className="text-center">
                    <div className="text-xs text-[#b1bad3] mb-1">Result</div>
                    <div className="text-3xl">{outcome === 'heads' ? '🪙' : '🔵'}</div>
                    <div className={cn(
                        "text-sm font-bold capitalize",
                        side === outcome ? "text-green-400" : "text-red-400"
                    )}>
                        {outcome}
                    </div>
                </div>
            </div>
        </div>
    );
};

const GameVisualization = ({ gameType, rawData }: { gameType: string; rawData?: Record<string, any> }) => {
    if (!rawData) return null;

    const type = gameType.toLowerCase();

    switch (type) {
        case 'mines':
            return <MinesVisualization rawData={rawData} />;
        case 'dice':
            return <DiceVisualization rawData={rawData} />;
        case 'coinflip':
        case 'coin flip':
            return <CoinFlipVisualization rawData={rawData} />;
        default:
            // Show raw data for other games
            if (Object.keys(rawData).length > 0) {
                return (
                    <div className="p-4 bg-[#0f212e] rounded-lg">
                        <pre className="text-xs text-[#b1bad3] overflow-auto max-h-32">
                            {JSON.stringify(rawData, null, 2)}
                        </pre>
                    </div>
                );
            }
            return null;
    }
};

export function BetDetailModal({ bet, isOpen, onClose }: BetDetailModalProps) {
    const [userVipTier, setUserVipTier] = useState(VIP_TIERS[0]);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

    useEffect(() => {
        const fetchUserVipTier = async () => {
            if (!bet?.user_id || !isOpen) return;

            try {
                const { data } = await supabase.rpc('get_user_stats', { user_id: bet.user_id });
                const wagered = data?.total_wagered || 0;

                // Find the user's VIP tier
                const tierIndex = VIP_TIERS.slice().reverse().findIndex(t => wagered >= t.minWager);
                const actualIndex = tierIndex === -1 ? 0 : VIP_TIERS.length - 1 - tierIndex;
                setUserVipTier(VIP_TIERS[actualIndex]);
            } catch (error) {
                console.error('Error fetching VIP tier:', error);
            }
        };

        fetchUserVipTier();
    }, [bet?.user_id, isOpen]);

    if (!bet) return null;

    const multiplier = bet.payout_credits > 0
        ? (bet.payout_credits / bet.stake_credits).toFixed(2)
        : '0.00';

    const copyBetId = () => {
        navigator.clipboard.writeText(bet.id);
        toast.success('Bet ID copied to clipboard');
    };

    const shareBet = () => {
        const url = `${window.location.origin}/?bet=${bet.id}`;
        navigator.clipboard.writeText(url);
        toast.success('Bet link copied to clipboard');
    };

    const openUserProfile = () => {
        setIsProfileModalOpen(true);
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
                <DialogContent className="bg-[#1a2c38] border-[#2f4553] text-white max-w-md p-0 overflow-hidden [&>button]:hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-[#2f4553]">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-[#2f4553] rounded">
                                {getGameIcon(bet.game_type)}
                            </div>
                            <DialogTitle className="text-lg font-bold">Bet</DialogTitle>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            className="text-[#b1bad3] hover:text-white hover:bg-[#2f4553] h-8 w-8"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-4">
                        {/* Game Name */}
                        <div className="text-center">
                            <h2 className="text-xl font-bold text-white capitalize">{bet.game_type}</h2>

                            {/* Bet ID */}
                            <div className="flex items-center justify-center gap-2 mt-1">
                                <span className="text-sm text-[#b1bad3]">ID {formatBetId(bet.id)}</span>
                                <button
                                    onClick={copyBetId}
                                    className="p-1 hover:bg-[#2f4553] rounded transition-colors"
                                >
                                    <Copy className="w-3.5 h-3.5 text-[#b1bad3] hover:text-white" />
                                </button>
                                <button
                                    onClick={shareBet}
                                    className="p-1 hover:bg-[#2f4553] rounded transition-colors"
                                >
                                    <ExternalLink className="w-3.5 h-3.5 text-[#b1bad3] hover:text-white" />
                                </button>
                            </div>
                        </div>

                        {/* Player Info */}
                        <div className="text-center text-sm text-[#b1bad3]">
                            <div className="flex items-center justify-center gap-1">
                                <span>Placed by</span>
                                <button
                                    onClick={openUserProfile}
                                    className="flex items-center gap-1 font-medium hover:underline cursor-pointer transition-colors"
                                    style={{ color: userVipTier.color }}
                                >
                                    <span>{userVipTier.icon}</span>
                                    {bet.profiles?.username || 'Anonymous'}
                                </button>
                            </div>
                            <div>
                                on {new Date(bet.created_at).toLocaleDateString('en-US', {
                                    month: 'numeric',
                                    day: 'numeric',
                                    year: 'numeric'
                                })} at {new Date(bet.created_at).toLocaleTimeString('en-US', {
                                    hour: 'numeric',
                                    minute: '2-digit',
                                    hour12: true
                                })}
                            </div>
                        </div>

                        {/* Logo */}
                        <div className="flex justify-center py-2">
                            <img src="/logo.png" alt="Shiny.bet" className="h-8 opacity-50" />
                        </div>

                        {/* Bet Stats */}
                        <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="bg-[#0f212e] rounded-lg p-3">
                                <div className="text-xs text-[#b1bad3] mb-1">Bet</div>
                                <div className="flex items-center justify-center gap-1">
                                    <span className="font-bold text-white">${bet.stake_credits.toFixed(2)}</span>
                                    <CryptoIcon />
                                </div>
                            </div>
                            <div className="bg-[#0f212e] rounded-lg p-3">
                                <div className="text-xs text-[#b1bad3] mb-1">Multiplier</div>
                                <div className="font-bold text-white">{multiplier}x</div>
                            </div>
                            <div className="bg-[#0f212e] rounded-lg p-3">
                                <div className="text-xs text-[#b1bad3] mb-1">Payout</div>
                                <div className={cn(
                                    "flex items-center justify-center gap-1 font-bold",
                                    bet.result === 'win' ? 'text-green-400' : 'text-[#b1bad3]'
                                )}>
                                    ${bet.payout_credits.toFixed(2)}
                                    <CryptoIcon />
                                </div>
                            </div>
                        </div>

                        {/* Game Visualization */}
                        <GameVisualization gameType={bet.game_type} rawData={bet.raw_data} />

                        {/* Play Button */}
                        <Link to={getGameLink(bet.game_type)} onClick={onClose}>
                            <Button className="w-full bg-[#00e701] hover:bg-[#00e701]/90 text-black font-bold h-12 text-base">
                                Play {bet.game_type}
                            </Button>
                        </Link>
                    </div>
                </DialogContent>
            </Dialog>

            {/* User Profile Modal */}
            <StatisticsModal
                externalUserId={bet.user_id}
                externalUsername={bet.profiles?.username}
                isExternalOpen={isProfileModalOpen}
                onExternalClose={() => setIsProfileModalOpen(false)}
            />
        </>
    );
}

export default BetDetailModal;
