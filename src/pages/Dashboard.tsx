import { useAuth } from '@/context/AuthContext';
import { useDashboardData } from '@/hooks/useDashboardData';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, ChevronRight, Star, ChevronLeft, Dices, Trophy, ChevronDown, TrendingUp, Bomb, Coins, Gamepad2, Zap, Spade, Rocket } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import RecentBets from '@/components/home/LiveBets';
import GameCarousel from '@/components/home/GameCarousel';

// Enhanced Game Data with Premium Gradients and Icons
const ORIGINALS = [
   {
      id: 'dice',
      name: 'Dice',
      gradient: 'bg-gradient-to-br from-[#1475e1] to-[#0d4b91]',
      shadow: 'shadow-[0_8px_20px_-6px_rgba(20,117,225,0.5)]',
      icon: <Dices className="w-12 h-12 text-white drop-shadow-md" />,
      playing: 2096,
      link: '/game/dice'
   },
   {
      id: 'mines',
      name: 'Mines',
      gradient: 'bg-gradient-to-br from-[#f59e0b] to-[#b45309]',
      shadow: 'shadow-[0_8px_20px_-6px_rgba(245,158,11,0.5)]',
      icon: <Bomb className="w-12 h-12 text-white drop-shadow-md" />,
      playing: 2054,
      link: '/game/mines'
   },
   {
      id: 'flip',
      name: 'CoinFlip',
      gradient: 'bg-gradient-to-br from-[#8b5cf6] to-[#5b21b6]',
      shadow: 'shadow-[0_8px_20px_-6px_rgba(139,92,246,0.5)]',
      icon: <Coins className="w-12 h-12 text-white drop-shadow-md" />,
      playing: 254,
      link: '/game/coinflip'
   },
   {
      id: 'plinko',
      name: 'Plinko',
      gradient: 'bg-gradient-to-br from-[#ec4899] to-[#be185d]',
      shadow: 'shadow-[0_8px_20px_-6px_rgba(236,72,153,0.5)]',
      icon: <Zap className="w-12 h-12 text-white drop-shadow-md" />,
      playing: 1412,
      link: '/game/plinko'
   },
   {
      id: 'crash',
      name: 'Crash',
      gradient: 'bg-gradient-to-br from-[#ef4444] to-[#b91c1c]',
      shadow: 'shadow-[0_8px_20px_-6px_rgba(239,68,68,0.5)]',
      icon: <TrendingUp className="w-12 h-12 text-white drop-shadow-md" />,
      playing: 3421,
      link: '/game/crash'
   },
   {
      id: 'blackjack',
      name: 'Blackjack',
      gradient: 'bg-gradient-to-br from-[#10b981] to-[#047857]',
      shadow: 'shadow-[0_8px_20px_-6px_rgba(16,185,129,0.5)]',
      icon: <Spade className="w-12 h-12 text-white drop-shadow-md" />,
      playing: 1058,
      link: '#'
   },
   {
      id: 'roulette',
      name: 'Roulette',
      gradient: 'bg-gradient-to-br from-[#f43f5e] to-[#9f1239]',
      shadow: 'shadow-[0_8px_20px_-6px_rgba(244,63,94,0.5)]',
      icon: <Gamepad2 className="w-12 h-12 text-white drop-shadow-md" />,
      playing: 892,
      link: '#'
   },
   {
      id: 'limbo',
      name: 'Limbo',
      gradient: 'bg-gradient-to-br from-[#06b6d4] to-[#0e7490]',
      shadow: 'shadow-[0_8px_20px_-6px_rgba(6,182,212,0.5)]',
      icon: <Rocket className="w-12 h-12 text-white drop-shadow-md" />,
      playing: 568,
      link: '#'
   },
];

// VIP Tiers Configuration
const TIERS = [
   { name: 'Bronze', minWager: 0 },
   { name: 'Silver', minWager: 10000 },
   { name: 'Gold', minWager: 50000 },
   { name: 'Platinum', minWager: 100000 },
   { name: 'Diamond', minWager: 500000 },
];

export default function Dashboard() {
   const { profile } = useAuth();
   const { stats } = useDashboardData();

   // Calculate VIP Progress
   const wagered = stats?.total_wagered || 0;

   const currentTierIndex = TIERS.slice().reverse().findIndex(t => wagered >= t.minWager);
   const actualIndex = currentTierIndex === -1 ? 0 : TIERS.length - 1 - currentTierIndex;
   const currentTier = TIERS[actualIndex];
   const nextTier = TIERS[actualIndex + 1];

   let progressPercent = 0;
   if (nextTier) {
      const totalNeeded = nextTier.minWager - currentTier.minWager;
      const currentProgress = wagered - currentTier.minWager;
      // Ensure progress is between 0 and 100
      progressPercent = Math.min(100, Math.max(0, (currentProgress / totalNeeded) * 100));
   } else {
      progressPercent = 100;
   }

   return (
      <div className="container py-6 space-y-8 max-w-[1600px] mx-auto px-4 md:px-8">

         {/* Top Row: Profile + Banners */}
         <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* 1. Profile / VIP Progress Card */}
            <Card className="lg:col-span-4 bg-[#0f212e] border border-[#2f4553] shadow-lg overflow-hidden relative group h-[240px]">
               <CardContent className="relative p-6 h-full flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                     <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-[#213743] flex items-center justify-center text-[#F7D979] font-bold text-lg">
                           {profile?.username?.charAt(0).toUpperCase() || 'G'}
                        </div>
                        <div>
                           <h2 className="text-xl font-bold text-white leading-none">{profile?.username || 'Guest'}</h2>
                           <span className="text-xs text-[#b1bad3]">Welcome back!</span>
                        </div>
                     </div>
                     <Link to="/vip-club">
                        <Star className="w-5 h-5 text-[#F7D979] cursor-pointer hover:scale-110 transition-transform" />
                     </Link>
                  </div>

                  <div className="space-y-4 mt-auto">
                     <div className="flex justify-between items-center text-sm">
                        <Link to="/vip-club" className="text-white font-semibold flex items-center gap-1 hover:text-[#F7D979] transition-colors cursor-pointer">
                           VIP Progress <ChevronRight className="w-4 h-4" />
                        </Link>
                        <span className="text-[#F7D979] font-bold flex items-center gap-1">
                           {progressPercent.toFixed(2)}%
                        </span>
                     </div>

                     {/* Fixed VIP Progress Bar */}
                     <div className="relative h-2.5 bg-[#1a2c38] rounded-full overflow-hidden border border-[#2f4553]">
                        <div
                           className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#F7D979] to-[#b17827] rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(247,217,121,0.3)]"
                           style={{ width: `${progressPercent}%` }}
                        />
                     </div>

                     <div className="flex justify-between text-xs text-[#b1bad3] font-medium">
                        <span className="flex items-center gap-1">
                           {currentTier.name}
                        </span>
                        <span className="flex items-center gap-1">
                           {nextTier ? nextTier.name : 'Max Level'}
                        </span>
                     </div>
                  </div>
               </CardContent>
            </Card>

            {/* 2. Casino Banner */}
            <Card className="lg:col-span-4 bg-[#0052ff] border-0 shadow-lg overflow-hidden relative group cursor-pointer h-[240px]">
               <img
                  src="https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://placehold.co/600x350/0052ff/FFF?text=Live+Dealers"
                  alt="Casino"
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
               />
               <div className="absolute inset-0 bg-gradient-to-t from-[#0f212e] via-[#0f212e]/40 to-transparent opacity-90" />
               <CardContent className="relative h-full flex flex-col justify-end p-6">
                  <div className="flex justify-between items-end">
                     <div>
                        <div className="text-[#b1bad3] text-xs font-bold uppercase tracking-wider mb-1">Live Casino</div>
                        <div className="flex items-center gap-2 text-white font-bold text-2xl">
                           <Dices className="w-6 h-6" /> Casino
                        </div>
                     </div>
                     <Button className="bg-[#1475e1] hover:bg-[#1475e1]/90 text-white font-bold rounded-full px-6">
                        Play Now
                     </Button>
                  </div>
               </CardContent>
            </Card>

            {/* 3. Sports Banner */}
            <Card className="lg:col-span-4 bg-[#00b894] border-0 shadow-lg overflow-hidden relative group cursor-pointer h-[240px]">
               <img
                  src="https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://placehold.co/600x350/00b894/FFF?text=UFC+Fighters"
                  alt="Sports"
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
               />
               <div className="absolute inset-0 bg-gradient-to-t from-[#0f212e] via-[#0f212e]/40 to-transparent opacity-90" />
               <CardContent className="relative h-full flex flex-col justify-end p-6">
                  <div className="flex justify-between items-end">
                     <div>
                        <div className="text-[#b1bad3] text-xs font-bold uppercase tracking-wider mb-1">Sportsbook</div>
                        <div className="flex items-center gap-2 text-white font-bold text-2xl">
                           <Trophy className="w-6 h-6" /> Sports
                        </div>
                     </div>
                     <Button className="bg-[#FFD700] hover:bg-[#DAA520] text-[#0f212e] font-bold rounded-full px-6">
                        Bet Now
                     </Button>
                  </div>
               </CardContent>
            </Card>
         </div>

         {/* Game Carousel */}
         <GameCarousel />

         {/* Search Bar */}
         <div className="relative flex items-center w-full h-14 bg-[#0f212e] border border-[#2f4553] rounded-full overflow-hidden hover:border-[#b1bad3]/50 transition-colors shadow-sm">
            <div className="flex items-center h-full px-6 border-r border-[#2f4553] cursor-pointer hover:bg-[#213743] transition-colors bg-[#1a2c38]">
               <span className="text-sm font-bold text-white mr-2">Casino</span>
               <ChevronDown className="h-4 w-4 text-[#b1bad3]" />
            </div>
            <div className="pl-4">
               <Search className="h-5 w-5 text-[#b1bad3]" />
            </div>
            <Input
               className="flex-1 h-full border-0 bg-transparent text-white placeholder:text-[#b1bad3] focus-visible:ring-0 text-sm font-medium"
               placeholder="Search your game"
            />
         </div>

         {/* Continue Playing (Originals) */}
         <div className="space-y-4">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-3 text-white font-bold text-xl">
                  <div className="bg-[#F7D979] rounded-md p-1">
                     <Star className="w-4 h-4 text-black fill-black" />
                  </div>
                  Shiny Originals
               </div>
               <div className="flex gap-2">
                  <Button variant="ghost" size="icon" className="bg-[#1a2c38] hover:bg-[#213743] text-white rounded-md h-9 w-9 border border-[#2f4553]">
                     <ChevronLeft className="w-5 h-5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="bg-[#1a2c38] hover:bg-[#213743] text-white rounded-md h-9 w-9 border border-[#2f4553]">
                     <ChevronRight className="w-5 h-5" />
                  </Button>
               </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
               {ORIGINALS.map((game) => (
                  <Link to={game.link} key={game.id} className="group flex flex-col gap-2 cursor-pointer">
                     <div className={cn(
                        "relative aspect-[3/4] rounded-xl overflow-hidden hover:-translate-y-1 transition-all duration-300",
                        game.shadow
                     )}>
                        {/* Gradient Background */}
                        <div className={cn(
                           "absolute inset-0 flex flex-col items-center justify-center p-4",
                           game.gradient
                        )}>
                           {/* Subtle Pattern Overlay */}
                           <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />

                           {/* Top "Shiny" Tag */}
                           <div className="absolute top-3 right-3 bg-black/20 backdrop-blur-sm text-[9px] font-black px-2 py-0.5 rounded text-white uppercase tracking-wider border border-white/10">
                              Original
                           </div>

                           {/* Icon */}
                           <div className="mb-4 transform group-hover:scale-110 transition-transform duration-300 filter drop-shadow-lg">
                              {game.icon}
                           </div>

                           {/* Name */}
                           <div className="text-white font-black text-lg uppercase tracking-wider drop-shadow-md text-center leading-none z-10">
                              {game.name}
                           </div>

                           {/* Play Button Overlay (Visible on Hover) */}
                           <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                              <div className="bg-white text-black rounded-full p-3 shadow-xl transform scale-0 group-hover:scale-100 transition-transform duration-300">
                                 <ChevronRight className="w-6 h-6 ml-0.5" />
                              </div>
                           </div>
                        </div>
                     </div>

                     {/* Playing Count */}
                     <div className="flex items-center gap-1.5 text-[11px] text-[#b1bad3] font-medium px-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#00e701] shadow-[0_0_5px_#00e701]" />
                        <span className="text-white font-bold">{game.playing.toLocaleString()}</span> playing
                     </div>
                  </Link>
               ))}
            </div>
         </div>

         {/* Recent Bets Table */}
         <div className="space-y-4 pt-4">
            <RecentBets />
         </div>
      </div>
   );
}
