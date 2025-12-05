import { Zap, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import RecentBets from '@/components/home/LiveBets';

export default function PlinkoGame() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#0f212e] p-4 md:p-8 font-sans text-[#b1bad3]">
      <div className="max-w-[1200px] mx-auto space-y-6">

        {/* Coming Soon Card */}
        <div className="bg-[#1a2c38] rounded-lg overflow-hidden shadow-xl border border-[#213743] min-h-[500px] flex flex-col items-center justify-center p-8">

          {/* Icon */}
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#ec4899] to-[#8b5cf6] flex items-center justify-center mb-6 animate-pulse">
            <Zap className="w-12 h-12 text-white" />
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4 text-center">
            Plinko
          </h1>

          {/* Coming Soon Badge */}
          <div className="flex items-center gap-2 bg-[#FFD700]/20 px-4 py-2 rounded-full mb-6">
            <Clock className="w-5 h-5 text-[#FFD700]" />
            <span className="text-[#FFD700] font-bold text-lg">Coming Soon</span>
          </div>

          {/* Description */}
          <p className="text-[#b1bad3] text-center max-w-md mb-8 text-lg">
            Drop the ball and watch it bounce through the pegs! Provably fair with customizable risk levels and massive multipliers up to 1000x.
          </p>

          {/* Features Preview */}
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <div className="bg-[#213743] px-4 py-2 rounded-lg text-sm">
              <span className="text-[#00e701] font-bold">3 Risk Levels</span>
            </div>
            <div className="bg-[#213743] px-4 py-2 rounded-lg text-sm">
              <span className="text-[#00e701] font-bold">8-16 Rows</span>
            </div>
            <div className="bg-[#213743] px-4 py-2 rounded-lg text-sm">
              <span className="text-[#00e701] font-bold">Up to 1000x</span>
            </div>
            <div className="bg-[#213743] px-4 py-2 rounded-lg text-sm">
              <span className="text-[#00e701] font-bold">Provably Fair</span>
            </div>
          </div>

          {/* Back Button */}
          <Button
            onClick={() => navigate('/')}
            className="bg-[#2f4553] hover:bg-[#3d5565] text-white font-bold px-8 py-3"
          >
            Back to Games
          </Button>

        </div>

        {/* Live Bets */}
        <RecentBets />

      </div>
    </div>
  );
}
