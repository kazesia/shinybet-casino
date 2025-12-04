import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings2, Maximize2, BarChart2, Volume2, Gem, Bomb } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useWallet } from '@/context/WalletContext';
import { useUI } from '@/context/UIContext';
import { toast } from 'sonner';
import { useSound } from '@/hooks/useSound';
import { GameHistory } from '@/components/games/GameHistory';
import { useViewport } from '@/hooks/useViewport';
import { GameControlsMobile } from '@/components/game/GameControlsMobile';

// --- Constants & Math ---
const GRID_SIZE = 25;

// Calculate multiplier based on: Total Spots / (Total Spots - Mines - Revealed)
// This is a simplified probability-based multiplier. 
// Real casinos add a house edge (e.g., 1% or 3%). We'll apply a 1% house edge.
const calculateMultiplier = (mines: number, revealed: number) => {
  let mult = 1;
  const houseEdge = 0.99; // 1% edge

  for (let i = 0; i < revealed; i++) {
    const remainingSpots = GRID_SIZE - i;
    const remainingGems = GRID_SIZE - mines - i;
    const probability = remainingGems / remainingSpots;
    mult = mult * (1 / probability);
  }

  return mult * houseEdge;
};

const calculateNextMultiplier = (mines: number, revealed: number) => {
  return calculateMultiplier(mines, revealed + 1);
};

interface Tile {
  id: number;
  isRevealed: boolean;
  isMine: boolean;
  isExploded?: boolean; // The specific mine clicked
}

export default function MinesGame() {
  const { user } = useAuth();
  const { balance, optimisticUpdate } = useWallet();
  const { openFairnessModal } = useUI();
  const sound = useSound();
  const { isMobile } = useViewport();

  // --- State ---
  const [betAmount, setBetAmount] = useState<number>(0);
  const [mineCount, setMineCount] = useState<number>(3);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'cashed_out' | 'boom'>('idle');
  const [grid, setGrid] = useState<Tile[]>([]);
  const [revealedCount, setRevealedCount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mode, setMode] = useState<'manual' | 'auto'>('manual');

  // Initialize Grid
  useEffect(() => {
    resetGrid();
  }, []);

  const resetGrid = () => {
    const newGrid = Array.from({ length: GRID_SIZE }, (_, i) => ({
      id: i,
      isRevealed: false,
      isMine: false
    }));
    setGrid(newGrid);
    setRevealedCount(0);
  };

  // --- Handlers ---

  const handleBetAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setBetAmount(isNaN(val) ? 0 : val);
  };

  const adjustBet = (factor: number) => {
    setBetAmount(prev => parseFloat((prev * factor).toFixed(8)));
  };

  const startGame = () => {
    if (!user) return toast.error("Please log in to play");
    if (betAmount <= 0) return toast.error("Invalid bet amount");
    if (betAmount > balance) return toast.error("Insufficient balance");
    if (gameState === 'playing') return;

    // 1. Deduct Balance
    optimisticUpdate(-betAmount);

    // 2. Setup Game State
    setGameState('playing');
    setRevealedCount(0);

    // 3. Generate Mines (Client-side for demo, ideally server-side)
    const newGrid = Array.from({ length: GRID_SIZE }, (_, i) => ({
      id: i,
      isRevealed: false,
      isMine: false
    }));

    let minesPlaced = 0;
    while (minesPlaced < mineCount) {
      const idx = Math.floor(Math.random() * GRID_SIZE);
      if (!newGrid[idx].isMine) {
        newGrid[idx].isMine = true;
        minesPlaced++;
      }
    }
    setGrid(newGrid);
  };

  const handleTileClick = (index: number) => {
    if (gameState !== 'playing' || isProcessing) return;
    if (grid[index].isRevealed) return;

    const tile = grid[index];

    // Update Grid UI immediately
    const newGrid = [...grid];
    newGrid[index].isRevealed = true;
    setGrid(newGrid);

    if (tile.isMine) {
      // GAME OVER
      sound.loss();
      newGrid[index].isExploded = true;
      handleGameOver(newGrid);
    } else {
      // GEM FOUND
      sound.reveal();
      const newRevealedCount = revealedCount + 1;
      setRevealedCount(newRevealedCount);

      // Check if all gems found (Auto Win)
      const totalGems = GRID_SIZE - mineCount;
      if (newRevealedCount === totalGems) {
        handleCashout(newGrid, newRevealedCount);
      }
    }
  };

  const handleGameOver = async (finalGrid: Tile[]) => {
    setGameState('boom');

    // Reveal all mines
    const revealedGrid = finalGrid.map(t => ({
      ...t,
      isRevealed: t.isMine ? true : t.isRevealed
    }));
    setGrid(revealedGrid);

    // Sync Loss to DB
    try {
      await supabase.rpc('increment_balance', { p_user_id: user?.id, p_amount: -betAmount });
      await supabase.from('bets').insert({
        user_id: user?.id,
        game_type: 'Mines',
        stake_credits: betAmount,
        payout_credits: 0,
        result: 'loss',
        raw_data: { mines: mineCount, revealed: revealedCount }
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleCashout = async (currentGrid = grid, count = revealedCount) => {
    if (gameState !== 'playing') return;
    setIsProcessing(true);

    const multiplier = calculateMultiplier(mineCount, count);
    const payout = betAmount * multiplier;

    sound.cashout();
    setGameState('cashed_out');
    optimisticUpdate(payout);

    // Reveal remaining mines passively
    const revealedGrid = currentGrid.map(t => ({
      ...t,
      isRevealed: true // Reveal everything visually
    }));
    setGrid(revealedGrid);

    // Sync Win to DB
    try {
      const netProfit = payout - betAmount;
      await supabase.rpc('increment_balance', { p_user_id: user?.id, p_amount: netProfit });
      await supabase.from('bets').insert({
        user_id: user?.id,
        game_type: 'Mines',
        stake_credits: betAmount,
        payout_credits: payout,
        result: 'win',
        raw_data: { mines: mineCount, revealed: count, multiplier }
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRandomPick = () => {
    if (gameState !== 'playing') return;

    // Find unrevealed tiles
    const unrevealedIndices = grid
      .map((t, i) => (!t.isRevealed ? i : -1))
      .filter(i => i !== -1);

    if (unrevealedIndices.length > 0) {
      const randomIdx = unrevealedIndices[Math.floor(Math.random() * unrevealedIndices.length)];
      handleTileClick(randomIdx);
    }
  };

  // --- Derived Values ---
  const currentMultiplier = calculateMultiplier(mineCount, revealedCount);
  const nextMultiplier = calculateNextMultiplier(mineCount, revealedCount);
  const currentProfit = (betAmount * currentMultiplier) - betAmount; // Net profit
  const totalPayout = betAmount * currentMultiplier;
  const nextPayout = betAmount * nextMultiplier;

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#0f212e] p-4 md:p-8 font-sans text-[#b1bad3]">
      <div className="max-w-[1200px] mx-auto space-y-6">

        {/* Main Game Container */}
        <div className="flex flex-col lg:flex-row bg-[#1a2c38] rounded-lg overflow-hidden shadow-xl border border-[#213743]">

          {/* LEFT: Control Panel (Desktop Only) */}
          {!isMobile && (
            <div className="w-full lg:w-[320px] bg-[#213743] p-4 flex flex-col gap-4 border-r border-[#1a2c38]">

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
                  <span>{betAmount.toFixed(8)} LTC</span>
                </div>
                <div className="relative flex items-center">
                  <Input
                    type="number"
                    value={betAmount}
                    onChange={handleBetAmountChange}
                    disabled={gameState === 'playing'}
                    className="bg-[#0f212e] border-[#2f4553] text-white font-bold pl-4 pr-24 h-10 focus-visible:ring-1 focus-visible:ring-[#2f4553] disabled:opacity-50"
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

              {/* Mines Selection */}
              <div className="space-y-1">
                <Label className="text-xs font-bold text-[#b1bad3]">Mines</Label>
                <Select
                  value={mineCount.toString()}
                  onValueChange={(v) => setMineCount(parseInt(v))}
                  disabled={gameState === 'playing'}
                >
                  <SelectTrigger className="bg-[#0f212e] border-[#2f4553] text-white font-bold h-10">
                    <SelectValue placeholder="Select mines" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#213743] border-[#2f4553] text-white max-h-[300px]">
                    {Array.from({ length: 24 }, (_, i) => i + 1).map((num) => (
                      <SelectItem key={num} value={num.toString()} className="focus:bg-[#2f4553] focus:text-white">
                        {num}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Gems Count (Read Only) */}
              <div className="space-y-1">
                <Label className="text-xs font-bold text-[#b1bad3]">Gems</Label>
                <Input
                  readOnly
                  value={25 - mineCount}
                  className="bg-[#0f212e] border-[#2f4553] text-white font-bold h-10 cursor-default focus-visible:ring-0"
                />
              </div>

              {/* Action Button */}
              {gameState === 'playing' ? (
                <Button
                  onClick={() => handleCashout()}
                  disabled={revealedCount === 0}
                  className="w-full h-12 mt-2 bg-[#FFD700] hover:bg-[#DAA520] text-[#0f212e] font-black text-base shadow-[0_4px_0_#B8860B] active:shadow-none active:translate-y-[4px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex flex-col items-center leading-none">
                    <span>Cashout</span>
                    {revealedCount > 0 && (
                      <span className="text-xs font-medium opacity-80">
                        {totalPayout.toFixed(6)} LTC
                      </span>
                    )}
                  </div>
                </Button>
              ) : (
                <Button
                  onClick={startGame}
                  className="w-full h-12 mt-2 bg-[#FFD700] hover:bg-[#DAA520] text-[#0f212e] font-black text-base shadow-[0_4px_0_#B8860B] active:shadow-none active:translate-y-[4px] transition-all"
                >
                  Bet
                </Button>
              )}

              {/* Random Pick Button */}
              <Button
                onClick={handleRandomPick}
                disabled={gameState !== 'playing'}
                className="w-full h-10 bg-[#2f4553] hover:bg-[#3d5565] text-white font-bold border border-transparent hover:border-[#b1bad3]/20"
              >
                Random Pick
              </Button>

              {/* Profit Display */}
              <div className="space-y-1 mt-2">
                <div className="flex justify-between text-xs font-bold text-[#b1bad3]">
                  <span>Total Profit ({currentMultiplier.toFixed(2)}x)</span>
                  <span>{gameState === 'playing' ? nextMultiplier.toFixed(2) : '0.00'}x</span>
                </div>
                <div className="relative flex items-center">
                  <Input
                    readOnly
                    value={gameState === 'playing' ? (totalPayout - betAmount).toFixed(8) : "0.00000000"}
                    className="bg-[#0f212e] border-[#2f4553] text-white font-bold pl-4 pr-8 h-10"
                  />
                  <div className="absolute right-3 text-[#00e701]">
                    <Gem className="w-4 h-4" />
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* RIGHT: Game Grid */}
          <div className="flex-1 bg-[#0f212e] p-6 md:p-12 flex flex-col relative min-h-[500px]">

            {/* Win Popup Overlay */}
            {gameState === 'cashed_out' && revealedCount > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
              >
                <div className="bg-[#1a2c38] border-2 border-green-500 rounded-lg p-8 shadow-2xl">
                  <div className="text-center">
                    <div className="text-5xl font-black text-green-500 mb-2">
                      {currentMultiplier.toFixed(2)}x
                    </div>
                    <div className="text-2xl font-bold text-white mb-4">
                      ${totalPayout.toFixed(2)}
                    </div>
                    <Button
                      onClick={() => {
                        setGameState('idle');
                        resetGrid();
                      }}
                      className="bg-green-500 hover:bg-green-600 text-white font-bold px-8"
                    >
                      Play Again
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}

            <div className="flex-1 flex items-center justify-center">
              <div className="grid grid-cols-5 gap-3 w-full max-w-[450px] aspect-square">
                <AnimatePresence>
                  {grid.map((tile) => (
                    <motion.button
                      key={tile.id}
                      onClick={() => handleTileClick(tile.id)}
                      disabled={gameState !== 'playing' && !tile.isRevealed}
                      whileHover={gameState === 'playing' && !tile.isRevealed ? { scale: 1.05, backgroundColor: '#557086' } : {}}
                      whileTap={gameState === 'playing' && !tile.isRevealed ? { scale: 0.95 } : {}}
                      className={cn(
                        "relative rounded-lg transition-colors duration-200 flex items-center justify-center overflow-hidden shadow-lg",
                        // Base Style
                        !tile.isRevealed ? "bg-[#2f4553]" : "bg-[#071824]",
                        // Cursor
                        gameState === 'playing' && !tile.isRevealed ? "cursor-pointer" : "cursor-default",
                        // Exploded Mine
                        tile.isExploded && "bg-red-500/20 border-2 border-red-500",
                        // Dimmed if game over and not revealed
                        (gameState === 'cashed_out' || gameState === 'boom') && !tile.isRevealed && "opacity-50"
                      )}
                    >
                      {/* Content */}
                      <div className="relative z-10">
                        {tile.isRevealed && (
                          <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: "spring", stiffness: 260, damping: 20 }}
                          >
                            {tile.isMine ? (
                              <svg className={cn("w-10 h-10 md:w-12 md:h-12")} viewBox="0 0 32 32" fill="none">
                                <circle cx="16" cy="16" r="10" fill="#dc2626" opacity={tile.isExploded ? "1" : "0.5"} />
                                <circle cx="16" cy="16" r="6" fill="#991b1b" opacity={tile.isExploded ? "1" : "0.5"} />
                                <circle cx="16" cy="16" r="3" fill="#450a0a" opacity={tile.isExploded ? "1" : "0.5"} />
                                <g stroke={tile.isExploded ? "#ffffff" : "#ffffff80"} strokeWidth="2" strokeLinecap="round">
                                  <line x1="16" y1="2" x2="16" y2="8" />
                                  <line x1="16" y1="24" x2="16" y2="30" />
                                  <line x1="2" y1="16" x2="8" y2="16" />
                                  <line x1="24" y1="16" x2="30" y2="16" />
                                  <line x1="6" y1="6" x2="10" y2="10" />
                                  <line x1="22" y1="22" x2="26" y2="26" />
                                  <line x1="26" y1="6" x2="22" y2="10" />
                                  <line x1="10" y1="22" x2="6" y2="26" />
                                </g>
                              </svg>
                            ) : (
                              <svg className="w-10 h-10 md:w-12 md:h-12" viewBox="0 0 32 32" fill="none">
                                <defs>
                                  <linearGradient id="gemGradient" x1="16" y1="4" x2="16" y2="28">
                                    <stop offset="0%" stopColor="#22c55e" />
                                    <stop offset="50%" stopColor="#00e701" />
                                    <stop offset="100%" stopColor="#15803d" />
                                  </linearGradient>
                                  <filter id="glow">
                                    <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                                    <feMerge>
                                      <feMergeNode in="coloredBlur" />
                                      <feMergeNode in="SourceGraphic" />
                                    </feMerge>
                                  </filter>
                                </defs>
                                <path d="M16 4 L20 10 L28 11 L22 17 L24 25 L16 21 L8 25 L10 17 L4 11 L12 10 Z"
                                  fill="url(#gemGradient)"
                                  stroke="#00ff00"
                                  strokeWidth="1.5"
                                  strokeLinejoin="round"
                                  filter="url(#glow)" />
                                <path d="M16 8 L18 12 L22 13 L19 16 L20 20 L16 18 L12 20 L13 16 L10 13 L14 12 Z"
                                  fill="#ffffff"
                                  opacity="0.3" />
                              </svg>
                            )}
                          </motion.div>
                        )}
                      </div>

                      {/* Explosion Effect */}
                      {tile.isExploded && (
                        <motion.div
                          className="absolute inset-0 bg-red-500"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 0.5 }}
                        />
                      )}
                    </motion.button>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* Footer Controls */}
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-[#0f212e] border-t border-[#213743] flex items-center justify-between px-4">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="text-[#b1bad3] hover:text-white hover:bg-[#213743]">
                  <Settings2 className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="text-[#b1bad3] hover:text-white hover:bg-[#213743]">
                  <Maximize2 className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="text-[#b1bad3] hover:text-white hover:bg-[#213743]">
                  <BarChart2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="absolute left-1/2 -translate-x-1/2 font-bold text-white tracking-tight text-lg">
                Shiny
              </div>

              <div className="flex items-center gap-2">
                <div
                  className="flex items-center gap-2 bg-[#213743] px-3 py-1 rounded-full hover:bg-[#2f4553] cursor-pointer transition-colors"
                  onClick={openFairnessModal}
                >
                  <div className="w-3 h-3 rounded-full bg-green-500 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  </div>
                  <span className="text-xs font-bold text-white">Fairness</span>
                </div>
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
              onBet={gameState === 'playing' ? () => handleCashout() : startGame}
              isBetting={isProcessing}
              balance={balance}
              mainButtonLabel={gameState === 'playing' ? "Cashout" : "Bet"}
              isMainButtonDisabled={gameState === 'playing' && revealedCount === 0}
            >
              {/* Random Pick Button */}
              {gameState === 'playing' && (
                <Button
                  onClick={() => {
                    // Find first unrevealed, non-mine tile and click it
                    const unrevealedTiles = grid.filter(t => !t.isRevealed);
                    if (unrevealedTiles.length > 0) {
                      const randomTile = unrevealedTiles[Math.floor(Math.random() * unrevealedTiles.length)];
                      handleTileClick(randomTile.id);
                    }
                  }}
                  disabled={isProcessing}
                  className="w-full h-10 bg-[#0f212e] border border-[#2f4553] hover:bg-[#213743] text-[#b1bad3] hover:text-white font-medium text-sm rounded-lg transition-colors"
                >
                  Random Pick
                </Button>
              )}

              {/* Mines and Gems Selectors */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-[#b1bad3]">Mines</Label>
                  <Select
                    value={mineCount.toString()}
                    onValueChange={(v) => setMineCount(parseInt(v))}
                    disabled={gameState === 'playing'}
                  >
                    <SelectTrigger className="bg-[#0f212e] border-[#2f4553] text-white font-medium h-10 text-sm rounded-lg hover:border-[#00e701] transition-colors">
                      <SelectValue placeholder="Mines" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a2c38] border-[#2f4553] text-white max-h-[200px]">
                      {Array.from({ length: 24 }, (_, i) => i + 1).map((num) => (
                        <SelectItem key={num} value={num.toString()} className="hover:bg-[#213743]">
                          {num}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-[#b1bad3]">Gems</Label>
                  <div className="bg-[#0f212e] border border-[#2f4553] text-white font-medium h-10 flex items-center justify-center rounded-lg text-sm">
                    {25 - mineCount}
                  </div>
                </div>
              </div>
            </GameControlsMobile>
          </div>
        )}

        {/* Recent Bets */}
        <GameHistory gameType="Mines" />

      </div>
    </div>
  );
}
