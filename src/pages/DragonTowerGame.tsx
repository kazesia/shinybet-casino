import { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings2, BarChart2, Shuffle, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useWallet } from '@/context/WalletContext';
import { useUI } from '@/context/UIContext';
import { supabase } from '@/lib/supabase';
import RecentBets from '@/components/home/LiveBets';
import { useViewport } from '@/hooks/useViewport';
import { GameControlsMobile } from '@/components/game/GameControlsMobile';
import { toast } from 'sonner';

// Sound effects URLs
const SOUNDS = {
    click: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',
    win: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3',
    lose: 'https://assets.mixkit.co/active_storage/sfx/2658/2658-preview.mp3',
    cashout: 'https://assets.mixkit.co/active_storage/sfx/888/888-preview.mp3',
    climb: 'https://assets.mixkit.co/active_storage/sfx/270/270-preview.mp3',
};

// Difficulty configurations
const DIFFICULTIES = {
    easy: { name: 'Easy', tilesPerRow: 4, safeTiles: 3, multiplier: 1.31, color: '#22c55e' },
    medium: { name: 'Medium', tilesPerRow: 3, safeTiles: 2, multiplier: 1.47, color: '#eab308' },
    hard: { name: 'Hard', tilesPerRow: 2, safeTiles: 1, multiplier: 1.96, color: '#f97316' },
    expert: { name: 'Expert', tilesPerRow: 3, safeTiles: 1, multiplier: 2.94, color: '#ef4444' },
    master: { name: 'Master', tilesPerRow: 4, safeTiles: 1, multiplier: 3.92, color: '#dc2626' },
} as const;

type Difficulty = keyof typeof DIFFICULTIES;
type TileState = 'hidden' | 'safe' | 'dragon' | 'revealed-safe' | 'revealed-dragon';
type GameState = 'idle' | 'playing' | 'won' | 'lost';

const TOWER_ROWS = 9;

// Egg/Gem SVG Component with pattern
const EggIcon = ({ className, faded = false }: { className?: string; faded?: boolean }) => (
    <svg className={className} viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="16" cy="22" rx="12" ry="16" fill={faded ? "#4a5568" : "#5a7a8a"} />
        <ellipse cx="16" cy="22" rx="10" ry="14" fill={faded ? "#3d4a56" : "#4a6a7a"} />
        {/* Spots */}
        <circle cx="10" cy="18" r="3" fill={faded ? "#2d3748" : "#3a5a6a"} />
        <circle cx="18" cy="14" r="2.5" fill={faded ? "#2d3748" : "#3a5a6a"} />
        <circle cx="20" cy="24" r="3.5" fill={faded ? "#2d3748" : "#3a5a6a"} />
        <circle cx="12" cy="28" r="2" fill={faded ? "#2d3748" : "#3a5a6a"} />
        {/* Highlight */}
        <ellipse cx="12" cy="16" rx="2" ry="3" fill={faded ? "#4a5568" : "#6a8a9a"} opacity="0.5" />
    </svg>
);

// Skull SVG Component  
const SkullIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 32 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="16" cy="16" r="12" fill="#2d5a3a" />
        <ellipse cx="16" cy="16" r="10" fill="#1a4a2a" />
        {/* Eyes */}
        <ellipse cx="11" cy="14" rx="3" ry="4" fill="#0f2a1a" />
        <ellipse cx="21" cy="14" rx="3" ry="4" fill="#0f2a1a" />
        {/* Nose */}
        <path d="M16 18 L14 22 L18 22 Z" fill="#0f2a1a" />
        {/* Teeth */}
        <rect x="11" y="26" width="3" height="6" rx="1" fill="#2d5a3a" />
        <rect x="18" y="26" width="3" height="6" rx="1" fill="#2d5a3a" />
    </svg>
);

// Enhanced Dragon Component
const DragonGraphic = ({ isWin = false }: { isWin?: boolean }) => (
    <div className="relative w-full flex items-center justify-center" style={{ height: '140px' }}>
        {/* Stone platform base */}
        <div className="absolute bottom-0 w-[320px] h-20 bg-gradient-to-b from-[#5a6a7a] to-[#3a4a5a] rounded-t-xl border-t-4 border-[#7a8a9a] shadow-xl">
            {/* Platform texture */}
            <div className="absolute inset-0 opacity-30" style={{
                backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.05) 10px, rgba(255,255,255,0.05) 20px)'
            }} />
            {/* Platform edge details */}
            <div className="absolute top-3 left-6 w-12 h-3 bg-[#4a5a6a] rounded-sm" />
            <div className="absolute top-3 right-6 w-12 h-3 bg-[#4a5a6a] rounded-sm" />
            <div className="absolute top-10 left-1/2 -translate-x-1/2 w-20 h-3 bg-[#4a5a6a] rounded-sm" />
        </div>

        {/* Dragon */}
        <div className={cn("relative z-10 flex flex-col items-center transition-all duration-500", isWin && "animate-bounce")}>
            {/* Wings - Left */}
            <div className="absolute -left-24 top-0">
                <svg width="80" height="100" viewBox="0 0 80 100" fill="none">
                    <path d="M75 10 C60 5, 40 20, 30 50 C20 80, 5 95, 0 100 L35 90 L50 70 L65 45 L75 10 Z"
                        fill="url(#wingGradientL)" stroke="#3a5a7a" strokeWidth="2" />
                    <path d="M65 25 L45 60" stroke="#3a5a7a" strokeWidth="1.5" opacity="0.5" />
                    <path d="M55 35 L35 75" stroke="#3a5a7a" strokeWidth="1.5" opacity="0.5" />
                    <defs>
                        <linearGradient id="wingGradientL" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#2a4a6a" />
                            <stop offset="100%" stopColor="#1a3a5a" />
                        </linearGradient>
                    </defs>
                </svg>
            </div>

            {/* Wings - Right */}
            <div className="absolute -right-24 top-0">
                <svg width="80" height="100" viewBox="0 0 80 100" fill="none" style={{ transform: 'scaleX(-1)' }}>
                    <path d="M75 10 C60 5, 40 20, 30 50 C20 80, 5 95, 0 100 L35 90 L50 70 L65 45 L75 10 Z"
                        fill="url(#wingGradientR)" stroke="#3a5a7a" strokeWidth="2" />
                    <path d="M65 25 L45 60" stroke="#3a5a7a" strokeWidth="1.5" opacity="0.5" />
                    <path d="M55 35 L35 75" stroke="#3a5a7a" strokeWidth="1.5" opacity="0.5" />
                    <defs>
                        <linearGradient id="wingGradientR" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#2a4a6a" />
                            <stop offset="100%" stopColor="#1a3a5a" />
                        </linearGradient>
                    </defs>
                </svg>
            </div>

            {/* Head */}
            <div className="relative">
                <svg width="70" height="60" viewBox="0 0 70 60" fill="none">
                    {/* Head shape */}
                    <ellipse cx="35" cy="30" rx="25" ry="22" fill="url(#headGradient)" />
                    {/* Horns */}
                    <path d="M15 15 L5 0 L12 18" fill="#6a7a8a" />
                    <path d="M55 15 L65 0 L58 18" fill="#6a7a8a" />
                    {/* Spikes */}
                    <path d="M30 8 L35 0 L40 8" fill="#5a6a7a" />
                    {/* Eyes with glow */}
                    <circle cx="24" cy="28" r="5" fill={isWin ? "#FFD700" : "#00e7e7"} />
                    <circle cx="24" cy="28" r="3" fill={isWin ? "#FFF" : "#7fffff"} />
                    <circle cx="46" cy="28" r="5" fill={isWin ? "#FFD700" : "#00e7e7"} />
                    <circle cx="46" cy="28" r="3" fill={isWin ? "#FFF" : "#7fffff"} />
                    {/* Snout */}
                    <ellipse cx="35" cy="42" rx="10" ry="6" fill="#4a5a6a" />
                    {/* Nostrils */}
                    <circle cx="31" cy="42" r="2" fill="#2a3a4a" />
                    <circle cx="39" cy="42" r="2" fill="#2a3a4a" />
                    <defs>
                        <linearGradient id="headGradient" x1="50%" y1="0%" x2="50%" y2="100%">
                            <stop offset="0%" stopColor="#6a7a8a" />
                            <stop offset="100%" stopColor="#4a5a6a" />
                        </linearGradient>
                    </defs>
                </svg>
                {/* Eye glow effect */}
                <div className={cn(
                    "absolute top-7 left-[18px] w-3 h-3 rounded-full blur-sm",
                    isWin ? "bg-[#FFD700]" : "bg-cyan-400"
                )} />
                <div className={cn(
                    "absolute top-7 right-[18px] w-3 h-3 rounded-full blur-sm",
                    isWin ? "bg-[#FFD700]" : "bg-cyan-400"
                )} />
            </div>

            {/* Body on platform */}
            <div className="w-28 h-8 bg-gradient-to-b from-[#4a5a6a] to-[#3a4a5a] rounded-b-2xl -mt-2" />
        </div>
    </div>
);

// Diagonal pattern tile component
const TilePattern = ({ active = false, className = "" }: { active?: boolean; className?: string }) => (
    <div className={cn(
        "absolute inset-0 rounded-lg overflow-hidden",
        className
    )}>
        <div
            className="absolute inset-0"
            style={{
                backgroundImage: active
                    ? 'repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(255,255,255,0.15) 8px, rgba(255,255,255,0.15) 16px)'
                    : 'repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(255,255,255,0.05) 8px, rgba(255,255,255,0.05) 16px)',
            }}
        />
    </div>
);

export default function DragonTowerGame() {
    const { user } = useAuth();
    const { balance, optimisticUpdate } = useWallet();
    const { openFairnessModal } = useUI();
    const { isMobile } = useViewport();

    // Audio
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [soundEnabled, setSoundEnabled] = useState(true);

    // Game State
    const [betAmount, setBetAmount] = useState<number>(0);
    const [difficulty, setDifficulty] = useState<Difficulty>('medium');
    const [gameState, setGameState] = useState<GameState>('idle');
    const [currentRow, setCurrentRow] = useState<number>(0);
    const [multiplier, setMultiplier] = useState<number>(1);
    const [tower, setTower] = useState<TileState[][]>([]);
    const [dragonPositions, setDragonPositions] = useState<number[][]>([]);
    const [mode, setMode] = useState<'manual' | 'auto'>('manual');
    const [totalProfit, setTotalProfit] = useState<number>(0);
    const [lastPickedTile, setLastPickedTile] = useState<{ row: number, col: number } | null>(null);
    const [showCashoutDisplay, setShowCashoutDisplay] = useState<boolean>(false);

    const config = DIFFICULTIES[difficulty];

    // Play sound effect
    const playSound = useCallback((soundKey: keyof typeof SOUNDS) => {
        if (!soundEnabled) return;
        try {
            if (audioRef.current) {
                audioRef.current.pause();
            }
            audioRef.current = new Audio(SOUNDS[soundKey]);
            audioRef.current.volume = 0.3;
            audioRef.current.play().catch(() => { });
        } catch (e) {
            console.log('Audio play failed');
        }
    }, [soundEnabled]);

    // Initialize tower grid
    const initializeTower = useCallback(() => {
        const newTower: TileState[][] = [];
        const newDragons: number[][] = [];

        for (let row = 0; row < TOWER_ROWS; row++) {
            const rowTiles: TileState[] = Array(config.tilesPerRow).fill('hidden');
            newTower.push(rowTiles);

            const dragons: number[] = [];
            const dragonCount = config.tilesPerRow - config.safeTiles;
            const availablePositions = Array.from({ length: config.tilesPerRow }, (_, i) => i);

            for (let d = 0; d < dragonCount; d++) {
                const randomIndex = Math.floor(Math.random() * availablePositions.length);
                dragons.push(availablePositions[randomIndex]);
                availablePositions.splice(randomIndex, 1);
            }
            newDragons.push(dragons);
        }

        setTower(newTower);
        setDragonPositions(newDragons);
    }, [config.tilesPerRow, config.safeTiles]);

    // Start new game
    const startGame = () => {
        if (!user) return toast.error("Please log in to play");
        if (betAmount <= 0) return toast.error("Invalid bet amount");
        if (betAmount > balance) return toast.error("Insufficient balance");

        playSound('click');
        optimisticUpdate(-betAmount);
        initializeTower();
        setGameState('playing');
        setCurrentRow(0);
        setMultiplier(1);
        setTotalProfit(0);
        setLastPickedTile(null);
        setShowCashoutDisplay(false);
    };

    // Random pick
    const handleRandomPick = () => {
        if (gameState !== 'playing') return;
        playSound('click');
        const randomIndex = Math.floor(Math.random() * config.tilesPerRow);
        handleTileClick(currentRow, randomIndex);
    };

    // Handle tile click
    const handleTileClick = (row: number, col: number) => {
        if (gameState !== 'playing') return;
        if (row !== currentRow) return;

        const isDragon = dragonPositions[row].includes(col);
        const newTower = [...tower];

        if (isDragon) {
            playSound('lose');
            newTower[row][col] = 'revealed-dragon';

            for (let c = 0; c < config.tilesPerRow; c++) {
                if (dragonPositions[row].includes(c)) {
                    newTower[row][c] = 'revealed-dragon';
                } else {
                    newTower[row][c] = 'revealed-safe';
                }
            }

            setTower(newTower);
            setGameState('lost');
            setLastPickedTile({ row, col });
            syncToDb(betAmount, 0, multiplier, false);
        } else {
            playSound('climb');
            newTower[row][col] = 'safe';

            for (let c = 0; c < config.tilesPerRow; c++) {
                if (c !== col) {
                    if (dragonPositions[row].includes(c)) {
                        newTower[row][c] = 'revealed-dragon';
                    } else {
                        newTower[row][c] = 'revealed-safe';
                    }
                }
            }

            const newMultiplier = parseFloat((multiplier * config.multiplier).toFixed(2));
            const newProfit = parseFloat((betAmount * newMultiplier - betAmount).toFixed(8));

            setMultiplier(newMultiplier);
            setTotalProfit(newProfit);
            setTower(newTower);
            setLastPickedTile({ row, col });

            if (row === TOWER_ROWS - 1) {
                handleCashout(newMultiplier);
            } else {
                setCurrentRow(row + 1);
            }
        }
    };

    // Handle cashout
    const handleCashout = (mult?: number) => {
        if (gameState !== 'playing') return;

        const finalMultiplier = mult || multiplier;
        const payout = betAmount * finalMultiplier;

        playSound('cashout');
        optimisticUpdate(payout);
        setGameState('won');
        setShowCashoutDisplay(true);
        syncToDb(betAmount, payout, finalMultiplier, true);
    };

    // Sync to database
    const syncToDb = async (stake: number, payout: number, mult: number, isWin: boolean) => {
        if (!user) return;
        try {
            const netChange = payout - stake;
            await supabase.rpc('increment_balance', { p_user_id: user.id, p_amount: netChange });
            await supabase.from('bets').insert({
                user_id: user.id,
                game_type: 'DragonTower',
                stake_credits: stake,
                payout_credits: payout,
                result: isWin ? 'win' : 'loss',
                raw_data: { difficulty, rows_climbed: currentRow + 1, multiplier: mult }
            });
        } catch (e) {
            console.error(e);
        }
    };

    // Reset game
    const resetGame = () => {
        setGameState('idle');
        setCurrentRow(0);
        setMultiplier(1);
        setTotalProfit(0);
        setTower([]);
        setDragonPositions([]);
        setLastPickedTile(null);
        setShowCashoutDisplay(false);
    };

    const handleBetAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value);
        setBetAmount(isNaN(val) ? 0 : val);
    };

    const adjustBet = (factor: number) => {
        setBetAmount(prev => parseFloat((prev * factor).toFixed(8)));
    };

    const potentialWin = betAmount * multiplier;

    return (
        <div className="min-h-[calc(100vh-64px)] bg-[#0f212e] p-4 md:p-8 font-sans text-[#b1bad3]">
            <div className="max-w-[1200px] mx-auto space-y-6">

                {/* Main Game Container */}
                <div className="flex flex-col lg:flex-row bg-[#1a2c38] rounded-lg overflow-hidden shadow-xl border border-[#213743]">

                    {/* LEFT: Control Panel */}
                    {!isMobile && (
                        <div className="w-full lg:w-[280px] bg-[#213743] p-4 flex flex-col gap-4 border-r border-[#1a2c38]">

                            {/* Mode Tabs */}
                            <div className="bg-[#0f212e] p-1 rounded-full flex">
                                <button
                                    onClick={() => setMode('manual')}
                                    className={cn(
                                        "flex-1 py-2 text-sm font-bold rounded-full transition-all",
                                        mode === 'manual' ? "bg-[#2f4553] text-white shadow-md" : "text-[#b1bad3] hover:text-white"
                                    )}
                                >
                                    Manual
                                </button>
                                <button
                                    onClick={() => setMode('auto')}
                                    className={cn(
                                        "flex-1 py-2 text-sm font-bold rounded-full transition-all",
                                        mode === 'auto' ? "bg-[#2f4553] text-white shadow-md" : "text-[#b1bad3] hover:text-white"
                                    )}
                                >
                                    Auto
                                </button>
                            </div>

                            {/* Bet Amount */}
                            <div className="space-y-1">
                                <div className="flex justify-between text-xs font-bold text-[#b1bad3]">
                                    <span>Bet Amount</span>
                                    <span className="text-[#b1bad3]/70">$0.00</span>
                                </div>
                                <div className="relative flex items-center">
                                    <Input
                                        type="number"
                                        value={betAmount === 0 ? '' : betAmount}
                                        onChange={handleBetAmountChange}
                                        disabled={gameState === 'playing'}
                                        className="bg-[#0f212e] border-[#2f4553] text-white font-bold pl-4 pr-24 h-10 focus-visible:ring-1 focus-visible:ring-[#2f4553]"
                                        placeholder="0.00"
                                    />
                                    <div className="absolute right-1 flex gap-1">
                                        <button
                                            onClick={() => adjustBet(0.5)}
                                            disabled={gameState === 'playing'}
                                            className="px-2 py-1 text-xs font-bold bg-[#2f4553] hover:bg-[#3d5565] rounded text-[#b1bad3] hover:text-white transition-colors disabled:opacity-50"
                                        >
                                            ½
                                        </button>
                                        <button
                                            onClick={() => adjustBet(2)}
                                            disabled={gameState === 'playing'}
                                            className="px-2 py-1 text-xs font-bold bg-[#2f4553] hover:bg-[#3d5565] rounded text-[#b1bad3] hover:text-white transition-colors disabled:opacity-50"
                                        >
                                            2×
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Difficulty */}
                            <div className="space-y-1">
                                <Label className="text-xs font-bold text-[#b1bad3]">Difficulty</Label>
                                <Select
                                    value={difficulty}
                                    onValueChange={(v: Difficulty) => setDifficulty(v)}
                                    disabled={gameState === 'playing'}
                                >
                                    <SelectTrigger className="bg-[#0f212e] border-[#2f4553] text-white font-bold h-10">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#213743] border-[#2f4553] text-white">
                                        {Object.entries(DIFFICULTIES).map(([key, val]) => (
                                            <SelectItem key={key} value={key}>{val.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Action Buttons */}
                            {gameState === 'idle' && (
                                <Button
                                    onClick={startGame}
                                    className="w-full h-12 bg-[#FFD700] hover:bg-[#DAA520] text-[#0f212e] font-black text-base shadow-[0_4px_0_#B8860B] active:shadow-none active:translate-y-[4px] transition-all"
                                >
                                    Bet
                                </Button>
                            )}

                            {gameState === 'playing' && (
                                <>
                                    <Button
                                        onClick={() => handleCashout()}
                                        disabled={currentRow === 0}
                                        className="w-full h-12 bg-[#00e701] hover:bg-[#00c301] text-black font-black text-base shadow-[0_4px_0_#00a001] active:shadow-none active:translate-y-[4px] transition-all disabled:opacity-50 disabled:shadow-none"
                                    >
                                        Cashout
                                    </Button>
                                    <Button
                                        onClick={handleRandomPick}
                                        variant="outline"
                                        className="w-full h-10 border-[#2f4553] text-white font-bold hover:bg-[#2f4553]"
                                    >
                                        <Shuffle className="w-4 h-4 mr-2" />
                                        Random Pick
                                    </Button>
                                </>
                            )}

                            {(gameState === 'won' || gameState === 'lost') && (
                                <Button
                                    onClick={resetGame}
                                    className="w-full h-12 bg-[#FFD700] hover:bg-[#DAA520] text-[#0f212e] font-black text-base shadow-[0_4px_0_#B8860B] active:shadow-none active:translate-y-[4px] transition-all"
                                >
                                    Bet
                                </Button>
                            )}

                            {/* Total Profit */}
                            <div className="space-y-1 mt-2">
                                <div className="flex justify-between text-xs">
                                    <span className="text-[#b1bad3]">Total Profit ({multiplier.toFixed(2)}x)</span>
                                    <span className="text-[#b1bad3]/70">$0.00</span>
                                </div>
                                <div className="relative flex items-center">
                                    <Input
                                        type="text"
                                        value={totalProfit.toFixed(2)}
                                        readOnly
                                        className={cn(
                                            "bg-[#0f212e] border-[#2f4553] font-bold h-10",
                                            totalProfit > 0 ? "text-[#00e701]" : "text-white"
                                        )}
                                    />
                                    <div className="absolute right-3">
                                        <div className="w-5 h-5 rounded-full bg-[#00e701] flex items-center justify-center">
                                            <span className="text-black text-xs font-bold">$</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    )}

                    {/* RIGHT: Game Area */}
                    <div className="flex-1 bg-[#1a2c38] relative flex flex-col items-center justify-start min-h-[750px] overflow-hidden">

                        {/* Dungeon background */}
                        <div className="absolute inset-0">
                            {/* Gradient overlay */}
                            <div className="absolute inset-0 bg-gradient-to-b from-[#1a2c38] via-[#152535] to-[#0f212e]" />
                            {/* Decorative elements */}
                            <div className="absolute top-20 left-8 w-16 h-20 bg-[#2a3a4a] rounded-full opacity-20 blur-sm" />
                            <div className="absolute top-40 right-12 w-12 h-16 bg-[#2a3a4a] rounded-full opacity-15 blur-sm" />
                            <div className="absolute bottom-40 left-16 w-20 h-24 bg-[#2a3a4a] rounded-full opacity-10 blur-sm" />
                        </div>

                        {/* Dragon at top */}
                        <DragonGraphic isWin={gameState === 'won'} />

                        {/* Tower Container with stone frame */}
                        <div className="relative z-10 mt-2">
                            {/* Stone frame */}
                            <div className="absolute -inset-3 bg-gradient-to-b from-[#5a6a7a] to-[#4a5a6a] rounded-xl" />
                            <div className="absolute -inset-2 bg-[#3a4a5a] rounded-lg" />

                            {/* Tower Grid */}
                            <div className="relative bg-[#2a3a4a] rounded-lg p-2 flex flex-col gap-1">
                                {gameState !== 'idle' ? (
                                    <>
                                        {/* Cashout Display - Centered, Bigger */}
                                        {showCashoutDisplay && (
                                            <div className="flex justify-center py-2">
                                                <div className="w-[140px] h-[90px] rounded-xl border-4 border-[#00e701] bg-[#1a2c38] shadow-[0_0_30px_rgba(0,231,1,0.5)] flex flex-col items-center justify-center">
                                                    <span className="text-3xl font-black text-white">{multiplier.toFixed(2)}x</span>
                                                    <div className="w-20 h-[2px] bg-[#3a4a5a] my-1.5" />
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-base font-bold text-[#b1bad3]">${potentialWin.toFixed(2)}</span>
                                                        <div className="w-5 h-5 rounded-full bg-[#00e701] flex items-center justify-center">
                                                            <span className="text-xs text-black font-bold">$</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Tower rows */}
                                        {[...tower].reverse().map((row, reversedIndex) => {
                                            const rowIndex = TOWER_ROWS - 1 - reversedIndex;
                                            const isCurrentRow = rowIndex === currentRow && gameState === 'playing';
                                            const isFutureRow = rowIndex > currentRow;

                                            return (
                                                <div key={rowIndex} className={cn("flex gap-1 transition-all duration-300", isCurrentRow && "scale-[1.02]")}>
                                                    {row.map((tile, colIndex) => {
                                                        const isClickable = isCurrentRow && tile === 'hidden';
                                                        const isLastPickedSafe = lastPickedTile?.row === rowIndex && lastPickedTile?.col === colIndex && (gameState === 'won' || tile === 'safe');

                                                        return (
                                                            <button
                                                                key={colIndex}
                                                                onClick={() => handleTileClick(rowIndex, colIndex)}
                                                                disabled={!isClickable}
                                                                className={cn(
                                                                    "relative w-[80px] h-[48px] rounded-lg flex items-center justify-center transition-all duration-200 overflow-hidden",
                                                                    // Hidden future tiles - dark with pattern
                                                                    tile === 'hidden' && isFutureRow && "bg-[#2a3a4a] border-2 border-[#3a4a5a]",
                                                                    // Current row - bright green
                                                                    tile === 'hidden' && isCurrentRow && "bg-gradient-to-b from-[#00ff00] to-[#00cc00] border-2 border-[#00aa00] cursor-pointer hover:brightness-110 hover:scale-105 shadow-[0_0_15px_rgba(0,255,0,0.4)]",
                                                                    // Selected safe tile
                                                                    tile === 'safe' && !isLastPickedSafe && "bg-gradient-to-b from-[#00e701] to-[#00b801] border-2 border-[#009901]",
                                                                    tile === 'safe' && isLastPickedSafe && "bg-gradient-to-b from-[#00e701] to-[#00b801] border-4 border-[#00ff00] shadow-[0_0_20px_rgba(0,231,1,0.6)]",
                                                                    // Revealed safe
                                                                    tile === 'revealed-safe' && "bg-[#2a3a4a] border-2 border-[#3a4a5a]",
                                                                    // Dragon
                                                                    tile === 'revealed-dragon' && "bg-[#3a2a2a] border-2 border-[#5a3a3a]"
                                                                )}
                                                            >
                                                                {/* Diagonal pattern */}
                                                                <TilePattern active={isCurrentRow && tile === 'hidden'} />

                                                                {/* Content */}
                                                                <div className="relative z-10">
                                                                    {tile === 'safe' && (
                                                                        <div className="w-8 h-8 bg-[#1a2c38] rounded-full flex items-center justify-center border-2 border-[#00e701] shadow-lg">
                                                                            <EggIcon className="w-5 h-6" />
                                                                        </div>
                                                                    )}
                                                                    {tile === 'revealed-safe' && (
                                                                        <EggIcon className="w-7 h-9" faded />
                                                                    )}
                                                                    {tile === 'revealed-dragon' && (
                                                                        <SkullIcon className="w-8 h-9" />
                                                                    )}
                                                                </div>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            );
                                        })}
                                    </>
                                ) : (
                                    // Idle state
                                    Array(TOWER_ROWS).fill(null).map((_, rowIndex) => (
                                        <div key={rowIndex} className="flex gap-1">
                                            {Array(config.tilesPerRow).fill(null).map((_, colIndex) => (
                                                <div
                                                    key={colIndex}
                                                    className="relative w-[80px] h-[48px] rounded-lg bg-[#2a3a4a] border-2 border-[#3a4a5a] flex items-center justify-center overflow-hidden"
                                                >
                                                    <TilePattern />
                                                    <EggIcon className="w-7 h-9 relative z-10" faded />
                                                </div>
                                            ))}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Footer Controls */}
                        <div className="absolute bottom-0 left-0 right-0 h-12 bg-[#0f212e] border-t border-[#213743] flex items-center justify-between px-4 z-20">
                            <div className="flex items-center gap-2">
                                <Button variant="ghost" size="icon" className="text-[#b1bad3] hover:text-white hover:bg-[#213743]">
                                    <Settings2 className="w-4 h-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-[#b1bad3] hover:text-white hover:bg-[#213743]"
                                    onClick={() => setSoundEnabled(!soundEnabled)}
                                >
                                    {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                                </Button>
                            </div>

                            <div className="font-bold text-white tracking-tight text-lg italic">
                                Shiny
                            </div>

                            <div className="flex items-center gap-4">
                                <div
                                    className="flex items-center gap-2 bg-[#213743] px-3 py-1 rounded-full cursor-pointer hover:bg-[#2f4553] transition-colors"
                                    onClick={openFairnessModal}
                                >
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                    <span className="text-xs font-bold text-white">Fairness</span>
                                </div>
                                <Button variant="ghost" size="icon" className="text-[#b1bad3] hover:text-white hover:bg-[#213743]">
                                    <BarChart2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>

                    </div>

                </div>

                {/* Mobile Controls */}
                {isMobile && (
                    <div className="fixed bottom-[64px] left-0 right-0 z-40">
                        <GameControlsMobile
                            betAmount={betAmount.toString()}
                            setBetAmount={(val) => setBetAmount(parseFloat(val) || 0)}
                            onBet={gameState === 'idle' ? startGame : (gameState === 'playing' ? () => handleCashout() : resetGame)}
                            isBetting={false}
                            balance={balance}
                            mainButtonLabel={gameState === 'idle' ? 'Bet' : (gameState === 'playing' ? `Cashout $${potentialWin.toFixed(2)}` : 'New Game')}
                        >
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium text-[#b1bad3]">Difficulty</Label>
                                <Select value={difficulty} onValueChange={(v: Difficulty) => setDifficulty(v)} disabled={gameState === 'playing'}>
                                    <SelectTrigger className="bg-[#0f212e] border-[#2f4553] text-white font-medium h-10 text-sm rounded-lg">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#1a2c38] border-[#2f4553] text-white">
                                        {Object.entries(DIFFICULTIES).map(([key, val]) => (
                                            <SelectItem key={key} value={key}>{val.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {gameState === 'playing' && (
                                <Button onClick={handleRandomPick} variant="outline" className="w-full h-10 border-[#2f4553] text-white font-bold">
                                    <Shuffle className="w-4 h-4 mr-2" /> Random Pick
                                </Button>
                            )}
                        </GameControlsMobile>
                    </div>
                )}

                {/* Live Bets */}
                <RecentBets />

            </div>
        </div>
    );
}
