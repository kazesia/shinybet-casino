import { useState, useEffect } from 'react';
import { useEnhancedAutoBet, type AutoBetSettings } from '@/hooks/useEnhancedAutoBet';
import { useAuth } from '@/context/AuthContext';
import { useWallet } from '@/context/WalletContext';
import { DiceGameEngine } from '@/lib/DiceGameEngine';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { DiceStatsPanel } from '@/components/DiceStatsPanel';
import { AutoBetControl } from '@/components/AutoBetControl';
import { Dice1 } from 'lucide-react';
import { useDiceGame } from '@/hooks/useDiceGame';

export default function DicePage() {
    const { user } = useAuth();
    const { playDice, playing } = useDiceGame();
    const {
        running: autoBetRunning,
        paused: autoBetPaused,
        stats: autoBetStats,
        currentBet: autoBetCurrentBet,
        startAutoBet,
        pauseAutoBet,
        resumeAutoBet,
        stopAutoBet,
    } = useEnhancedAutoBet();

    const [betMode, setBetMode] = useState<'manual' | 'auto'>('manual');
    const [wager, setWager] = useState(1);
    const [rollOver, setRollOver] = useState(50.5);
    const [rolling, setRolling] = useState(false);

    const [autoBetSettings, setAutoBetSettings] = useState<AutoBetSettings>({
        baseBet: 1,
        target: 50.5,
        numberOfBets: 10,
        onWinAction: 'reset',
        onWinMultiplier: 1.0,
        onLossAction: 'increase',
        onLossMultiplier: 2.0,
        stopOnProfit: 100,
        stopOnLoss: 50,
    });

    const multiplier = DiceGameEngine.calculateMultiplier(rollOver);
    const winChance = rollOver;

    const handleManualBet = async () => {
        if (!user) return;
        setRolling(true);
        await playDice(wager, rollOver);
        setRolling(false);
    };

    const handleStartAutoBet = () => {
        startAutoBet({ ...autoBetSettings, target: rollOver });
    };

    return (
        <div className="min-h-screen bg-[#0f212e] text-white">
            <div className="max-w-7xl mx-auto p-6">
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
                    {/* Main Game Area */}
                    <div className="space-y-6">
                        {/* Game Header */}
                        <div className="flex items-center gap-3">
                            <Dice1 className="w-8 h-8 text-[#1475e1]" />
                            <h1 className="text-2xl font-bold">Dice</h1>
                            <span className="text-sm text-[#b1bad3]">Stake Originals</span>
                        </div>

                        {/* Betting Controls */}
                        <Card className="bg-[#1a2c38] border-[#2f4553] p-6">
                            <Tabs value={betMode} onValueChange={(v) => setBetMode(v as 'manual' | 'auto')}>
                                <TabsList className="w-full bg-[#0f212e] p-1 grid grid-cols-2 mb-6">
                                    <TabsTrigger value="manual" className="data-[state=active]:bg-[#2f4553]">
                                        Manual
                                    </TabsTrigger>
                                    <TabsTrigger value="auto" className="data-[state=active]:bg-[#2f4553]">
                                        Autobet
                                    </TabsTrigger>
                                </TabsList>

                                {/* Manual Betting */}
                                <TabsContent value="manual" className="space-y-6">
                                    <div>
                                        <label className="text-sm text-[#b1bad3] mb-2 block">Bet Amount</label>
                                        <div className="flex gap-2">
                                            <Input
                                                type="number"
                                                value={wager}
                                                onChange={(e) => setWager(parseFloat(e.target.value) || 0)}
                                                className="bg-[#0f212e] border-[#2f4553] text-white"
                                                step="0.01"
                                            />
                                            <Button variant="outline" onClick={() => setWager(wager / 2)} className="border-[#2f4553]">
                                                ½
                                            </Button>
                                            <Button variant="outline" onClick={() => setWager(wager * 2)} className="border-[#2f4553]">
                                                2×
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Visual Slider */}
                                    <div className="bg-[#0f212e] rounded-lg p-6">
                                        <div className="flex justify-between mb-4">
                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-white">{(100 - rollOver).toFixed(2)}</div>
                                                <div className="text-xs text-[#b1bad3]">0</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-white">{rollOver.toFixed(2)}</div>
                                                <div className="text-xs text-[#b1bad3]">100</div>
                                            </div>
                                        </div>

                                        {/* Custom Slider */}
                                        <div className="relative h-12 mb-4">
                                            <div className="absolute inset-0 flex items-center">
                                                <div className="w-full h-2 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full"></div>
                                            </div>
                                            <input
                                                type="range"
                                                min="0.01"
                                                max="99.99"
                                                step="0.01"
                                                value={rollOver}
                                                onChange={(e) => setRollOver(parseFloat(e.target.value))}
                                                className="absolute inset-0 w-full h-12 opacity-0 cursor-pointer z-10"
                                            />
                                            <div
                                                className="absolute top-1/2 -translate-y-1/2 w-6 h-6 bg-blue-500 rounded-full border-4 border-white shadow-lg pointer-events-none"
                                                style={{ left: `${rollOver}%`, transform: 'translate(-50%, -50%)' }}
                                            ></div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-4 text-center">
                                            <div>
                                                <div className="text-xs text-[#b1bad3]">Multiplier</div>
                                                <div className="text-lg font-bold text-white">{multiplier.toFixed(4)}x</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-[#b1bad3]">Roll Over</div>
                                                <div className="text-lg font-bold text-white">{rollOver.toFixed(2)}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-[#b1bad3]">Win %</div>
                                                <div className="text-lg font-bold text-white">{winChance.toFixed(2)}%</div>
                                            </div>
                                        </div>
                                    </div>

                                    <Button
                                        onClick={handleManualBet}
                                        disabled={playing || rolling || !user}
                                        className="w-full bg-[#00e701] hover:bg-[#00c501] text-black font-bold text-lg h-14"
                                    >
                                        {rolling ? 'Rolling...' : 'Bet'}
                                    </Button>
                                </TabsContent>

                                {/* Auto Betting */}
                                <TabsContent value="auto">
                                    <AutoBetControl
                                        settings={autoBetSettings}
                                        onSettingsChange={setAutoBetSettings}
                                        onStart={handleStartAutoBet}
                                        onPause={pauseAutoBet}
                                        onResume={resumeAutoBet}
                                        onStop={stopAutoBet}
                                        isRunning={autoBetRunning}
                                        isPaused={autoBetPaused}
                                        currentBet={autoBetCurrentBet}
                                    />
                                </TabsContent>
                            </Tabs>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div>
                        <DiceStatsPanel stats={autoBetStats} isRunning={autoBetRunning} />
                    </div>
                </div>
            </div>
        </div>
    );
}
