import { useState, useEffect, useRef } from 'react';
import Matter from 'matter-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings2, BarChart2, Volume2, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useWallet } from '@/context/WalletContext';
import { useUI } from '@/context/UIContext';
import { toast } from 'sonner';
import { PLINKO_CONFIG, getMultipliers, getBucketColor } from '@/components/games/plinko/config';
import { GameHistory } from '@/components/games/GameHistory';

export default function PlinkoGame() {
  const { user } = useAuth();
  const { balance, optimisticUpdate } = useWallet();
  const { openFairnessModal } = useUI();

  // Game State
  const [betAmount, setBetAmount] = useState<number>(0);
  const [rows, setRows] = useState<number>(16);
  const [risk, setRisk] = useState<'low' | 'medium' | 'high'>('medium');
  const [mode, setMode] = useState<'manual' | 'auto'>('manual');

  // Physics Refs
  const sceneRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const renderRef = useRef<Matter.Render | null>(null);
  const runnerRef = useRef<Matter.Runner | null>(null);

  // Initialize Physics Engine
  useEffect(() => {
    if (!sceneRef.current) return;

    // Setup Matter JS
    const Engine = Matter.Engine,
      Render = Matter.Render,
      Runner = Matter.Runner,
      World = Matter.World,
      Bodies = Matter.Bodies;

    const engine = Engine.create();
    engine.world.gravity.y = 1.2; // Adjust gravity for feel

    const render = Render.create({
      element: sceneRef.current,
      engine: engine,
      options: {
        width: 800,
        height: 600,
        wireframes: false,
        background: 'transparent',
        pixelRatio: 1 // Optimize for performance
      }
    });

    // Create Board (Pegs)
    createBoard(engine.world, rows);

    Render.run(render);
    const runner = Runner.create();
    Runner.run(runner, engine);

    // Collision Events
    Matter.Events.on(engine, 'collisionStart', (event) => {
      event.pairs.forEach((pair) => {
        const bodyA = pair.bodyA;
        const bodyB = pair.bodyB;

        // Check if ball hits bucket (sensor)
        if (bodyA.label === 'ball' && bodyB.label.startsWith('bucket-')) {
          handleBallLanded(bodyA, bodyB);
        } else if (bodyB.label === 'ball' && bodyA.label.startsWith('bucket-')) {
          handleBallLanded(bodyB, bodyA);
        }
      });
    });

    engineRef.current = engine;
    renderRef.current = render;
    runnerRef.current = runner;

    return () => {
      Render.stop(render);
      Runner.stop(runner);
      if (render.canvas) render.canvas.remove();
      World.clear(engine.world, false);
      Engine.clear(engine);
    };
  }, []);

  // Recreate board when rows change
  useEffect(() => {
    if (engineRef.current) {
      createBoard(engineRef.current.world, rows);
    }
  }, [rows, risk]);

  const createBoard = (world: Matter.World, rowCount: number) => {
    Matter.World.clear(world, false); // Clear existing bodies (except balls if any, but we clear all for simplicity)

    const Bodies = Matter.Bodies;
    const width = 800;
    const startY = 50;
    const gap = width / (rowCount + 3); // Dynamic gap based on rows

    const pegs: Matter.Body[] = [];

    for (let row = 0; row < rowCount; row++) {
      const colsInRow = row + 3;
      const y = startY + row * gap;
      for (let col = 0; col < colsInRow; col++) {
        const x = width / 2 - ((colsInRow - 1) * gap) / 2 + col * gap;
        const peg = Bodies.circle(x, y, PLINKO_CONFIG.pegSize, {
          isStatic: true,
          label: 'peg',
          render: { fillStyle: 'white' }
        });
        pegs.push(peg);
      }
    }

    // Create Buckets (Sensors)
    const multipliers = getMultipliers(rowCount, risk);
    const bucketY = startY + rowCount * gap + gap / 2;
    const buckets: Matter.Body[] = [];

    multipliers.forEach((mult, i) => {
      const colsInLastRow = rowCount + 2; // Logic for bucket positioning
      // Align buckets between the last row's projected gaps
      // Actually buckets are under the gaps of the last row of pegs
      // The last row of pegs has `rowCount + 2` pegs.
      // So there are `rowCount + 1` gaps? No, standard Plinko has multipliers = rows + 1

      // Let's align based on standard plinko pyramid
      const x = width / 2 - ((multipliers.length - 1) * gap) / 2 + i * gap;

      const bucket = Bodies.rectangle(x, bucketY, gap * 0.8, 20, {
        isStatic: true,
        isSensor: true, // Ball passes through but triggers collision
        label: `bucket-${mult}-${i}`,
        render: {
          fillStyle: getBucketColor(mult),
          opacity: 0.5
        }
      });
      buckets.push(bucket);
    });

    Matter.World.add(world, [...pegs, ...buckets]);
  };

  const handleBallLanded = (ball: Matter.Body, bucket: Matter.Body) => {
    if (!engineRef.current) return;

    // Remove ball
    Matter.World.remove(engineRef.current.world, ball);

    // Extract Multiplier
    const parts = bucket.label.split('-');
    const multiplier = parseFloat(parts[1]);

    // Calculate Payout
    // We need to track which bet this ball belongs to. 
    // For simplicity in this demo, we assume the current betAmount is constant or we attach data to ball.
    // Ideally, attach bet data to the ball body.
    const betData = (ball as any).betData || { stake: 0 };
    const payout = betData.stake * multiplier;
    const isWin = payout >= betData.stake;

    // Update UI
    optimisticUpdate(payout);

    if (isWin && multiplier > 1) {
      toast.success(`${multiplier}x`, {
        className: "bg-green-500/10 border-green-500 text-green-500 font-bold py-2"
      });
    }

    // Sync to DB
    syncToDb(betData.stake, payout, multiplier, isWin);
  };

  const syncToDb = async (stake: number, payout: number, multiplier: number, isWin: boolean) => {
    try {
      const netChange = payout - stake;
      await supabase.rpc('increment_balance', { p_user_id: user?.id, p_amount: netChange });

      const { data: bet } = await supabase.from('bets').insert({
        user_id: user?.id,
        game_type: 'Plinko',
        stake_credits: stake,
        payout_credits: payout,
        result: isWin ? 'win' : 'loss',
        raw_data: { rows, risk, multiplier }
      }).select().single();
    } catch (e) {
      console.error(e);
    }
  };

  const dropBall = () => {
    if (!user) return toast.error("Please log in to play");
    if (betAmount <= 0) return toast.error("Invalid bet amount");
    if (betAmount > balance) return toast.error("Insufficient balance");
    if (!engineRef.current) return;

    optimisticUpdate(-betAmount);

    // Randomize drop position slightly to create variance
    const randomX = (Math.random() - 0.5) * 10;

    const ball = Matter.Bodies.circle(400 + randomX, 20, PLINKO_CONFIG.ballSize, {
      restitution: 0.5, // Bounciness
      friction: 0.001,
      label: 'ball',
      render: { fillStyle: '#F7D979' }
    });

    // Attach bet data to ball for retrieval on collision
    (ball as any).betData = { stake: betAmount };

    Matter.World.add(engineRef.current.world, ball);
  };

  // --- UI Helpers ---
  const handleBetAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setBetAmount(isNaN(val) ? 0 : val);
  };

  const adjustBet = (factor: number) => {
    setBetAmount(prev => parseFloat((prev * factor).toFixed(8)));
  };

  const currentMultipliers = getMultipliers(rows, risk);

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#0f212e] p-4 md:p-8 font-sans text-[#b1bad3]">
      <div className="max-w-[1200px] mx-auto space-y-6">

        {/* Main Game Container */}
        <div className="flex flex-col lg:flex-row bg-[#1a2c38] rounded-lg overflow-hidden shadow-xl border border-[#213743]">

          {/* LEFT: Control Panel */}
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
                  className="bg-[#0f212e] border-[#2f4553] text-white font-bold pl-4 pr-24 h-10 focus-visible:ring-1 focus-visible:ring-[#2f4553]"
                />
                <div className="absolute right-1 flex gap-1">
                  <button onClick={() => adjustBet(0.5)} className="px-2 py-1 text-xs font-bold bg-[#2f4553] hover:bg-[#3d5565] rounded text-[#b1bad3] hover:text-white transition-colors">½</button>
                  <button onClick={() => adjustBet(2)} className="px-2 py-1 text-xs font-bold bg-[#2f4553] hover:bg-[#3d5565] rounded text-[#b1bad3] hover:text-white transition-colors">2×</button>
                </div>
              </div>
            </div>

            {/* Risk Level */}
            <div className="space-y-1">
              <Label className="text-xs font-bold text-[#b1bad3]">Risk</Label>
              <Select value={risk} onValueChange={(v: any) => setRisk(v)}>
                <SelectTrigger className="bg-[#0f212e] border-[#2f4553] text-white font-bold h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#213743] border-[#2f4553] text-white">
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Rows */}
            <div className="space-y-1">
              <Label className="text-xs font-bold text-[#b1bad3]">Rows</Label>
              <Select value={rows.toString()} onValueChange={(v) => setRows(parseInt(v))}>
                <SelectTrigger className="bg-[#0f212e] border-[#2f4553] text-white font-bold h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#213743] border-[#2f4553] text-white">
                  <SelectItem value="8">8</SelectItem>
                  <SelectItem value="12">12</SelectItem>
                  <SelectItem value="16">16</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Play Button */}
            <Button
              onClick={dropBall}
              className="w-full h-12 mt-2 bg-[#FFD700] hover:bg-[#DAA520] text-[#0f212e] font-black text-base shadow-[0_4px_0_#B8860B] active:shadow-none active:translate-y-[4px] transition-all"
            >
              Bet
            </Button>

          </div>

          {/* RIGHT: Game Area */}
          <div className="flex-1 bg-[#0f212e] relative flex flex-col items-center justify-center overflow-hidden min-h-[600px]">

            {/* Multiplier Legend (Top Overlay) */}
            <div className="absolute top-4 left-4 z-10">
              <div className="bg-[#213743]/80 backdrop-blur px-3 py-1 rounded text-xs font-bold text-white border border-white/5">
                Max Payout: <span className="text-[#00e701]">{currentMultipliers[0]}x</span>
              </div>
            </div>

            {/* Canvas Container */}
            <div ref={sceneRef} className="w-[800px] h-[600px] scale-75 sm:scale-90 md:scale-100 origin-center transition-transform" />

            {/* Multiplier Visuals (HTML Overlay for better text rendering than Canvas) */}
            <div className="absolute bottom-[60px] flex gap-1 items-end justify-center w-full pointer-events-none">
              {currentMultipliers.map((mult, i) => (
                <div
                  key={i}
                  className="flex items-center justify-center rounded shadow-lg text-[10px] font-bold text-black"
                  style={{
                    backgroundColor: getBucketColor(mult),
                    width: `${800 / (currentMultipliers.length + 2)}px`, // Approximate width matching physics
                    height: '24px',
                    transform: 'translateY(0px)'
                  }}
                >
                  {mult}x
                </div>
              ))}
            </div>

            {/* Footer Controls */}
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-[#0f212e] border-t border-[#213743] flex items-center justify-between px-4 z-20">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="text-[#b1bad3] hover:text-white hover:bg-[#213743]">
                  <Settings2 className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="text-[#b1bad3] hover:text-white hover:bg-[#213743]">
                  <Volume2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="absolute left-1/2 -translate-x-1/2 font-bold text-white tracking-tight text-lg flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#ec4899]" /> Plinko
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

        {/* History */}
        <GameHistory gameType="Plinko" />

      </div>
    </div>
  );
}
