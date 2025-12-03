import { useAuth } from '@/context/AuthContext';
import { useDashboardData } from '@/hooks/useDashboardData';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, ChevronRight, Star, Info, ChevronLeft, Dices, Trophy, ChevronDown, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

// Game Data matching the screenshot
const ORIGINALS = [
  { id: 'flip', name: 'Flip', color: 'bg-[#00e701]', icon: '🪙', playing: 254, link: '/game/coinflip' },
  { id: 'blackjack', name: 'Blackjack', color: 'bg-[#ff4d4d]', icon: '🃏', playing: 1058, link: '#' },
  { id: 'snakes', name: 'Snakes', color: 'bg-[#00b8ff]', icon: '🐍', playing: 196, link: '#' },
  { id: 'mines', name: 'Mines', color: 'bg-[#0052ff]', icon: '💣', playing: 2054, link: '/game/mines' },
  { id: 'dice', name: 'Dice', color: 'bg-[#9146ff]', icon: '🎲', playing: 2096, link: '/game/dice' },
  { id: 'chicken', name: 'Chicken', color: 'bg-[#5c5cff]', icon: '🐔', playing: 568, link: '#' },
  { id: 'plinko', name: 'Plinko', color: 'bg-[#ff469f]', icon: '🎯', playing: 1412, link: '#' },
  { id: 'diamonds', name: 'Diamonds', color: 'bg-[#a359ff]', icon: '💎', playing: 87, link: '#' },
];

export default function Dashboard() {
  const { profile } = useAuth();
  const { wallet } = useDashboardData(); // Using hook to get data if needed

  return (
    <div className="container py-6 space-y-8 max-w-[1600px] mx-auto px-4 md:px-8">
      
      {/* Top Row: Profile + Banners */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* 1. Profile / VIP Progress Card */}
        <Card className="lg:col-span-4 bg-[#0f212e] border border-[#F7D979] shadow-lg overflow-hidden relative group h-[240px]">
           <CardContent className="relative p-6 h-full flex flex-col justify-between">
              <div className="flex justify-between items-start">
                 <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold text-white">{profile?.username || 'Guest'}</h2>
                 </div>
                 <Star className="w-5 h-5 text-[#F7D979] cursor-pointer" />
              </div>

              <div className="space-y-4 mt-auto">
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-white font-semibold flex items-center gap-1 hover:underline cursor-pointer">
                      Your VIP Progress <ChevronRight className="w-4 h-4" />
                    </span>
                    <span className="text-white font-bold flex items-center gap-1">
                      20.01% <Info className="w-3 h-3 text-[#b1bad3]" />
                    </span>
                 </div>
                 <div className="relative h-2 bg-[#213743] rounded-full overflow-hidden">
                    <div className="absolute top-0 left-0 h-full w-[20%] bg-[#b1bad3] rounded-full" />
                 </div>
                 <div className="flex justify-between text-xs text-[#b1bad3] font-medium">
                    <span className="flex items-center gap-1"><Star className="w-3 h-3" /> Bronze</span>
                    <span className="flex items-center gap-1"><Star className="w-3 h-3" /> Silver</span>
                 </div>
              </div>
           </CardContent>
        </Card>

        {/* 2. Casino Banner */}
        <Card className="lg:col-span-4 bg-[#0052ff] border-0 shadow-lg overflow-hidden relative group cursor-pointer h-[240px]">
           <img 
             src="https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://placehold.co/600x350/0052ff/FFF?text=Live+Dealers" 
             alt="Casino" 
             className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
           />
           <div className="absolute inset-0 bg-gradient-to-t from-[#000000]/80 via-transparent to-transparent" />
           <CardContent className="relative h-full flex flex-col justify-end p-4">
              <div className="flex justify-between items-end">
                 <div className="flex items-center gap-2 text-white font-bold text-lg">
                    <Dices className="w-5 h-5" /> Casino
                 </div>
                 <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                    <div className="w-2 h-2 rounded-full bg-[#00e701]" /> 39,406
                 </div>
              </div>
           </CardContent>
        </Card>

        {/* 3. Sports Banner */}
        <Card className="lg:col-span-4 bg-[#00b894] border-0 shadow-lg overflow-hidden relative group cursor-pointer h-[240px]">
           <img 
             src="https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://placehold.co/600x350/00b894/FFF?text=UFC+Fighters" 
             alt="Sports" 
             className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
           />
           <div className="absolute inset-0 bg-gradient-to-t from-[#000000]/80 via-transparent to-transparent" />
           <CardContent className="relative h-full flex flex-col justify-end p-4">
              <div className="flex justify-between items-end">
                 <div className="flex items-center gap-2 text-white font-bold text-lg">
                    <Trophy className="w-5 h-5" /> Sports
                 </div>
                 <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                    <div className="w-2 h-2 rounded-full bg-[#00e701]" /> 24,778
                 </div>
              </div>
           </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      <div className="relative flex items-center w-full h-14 bg-[#0f212e] border border-[#2f4553] rounded-full overflow-hidden hover:border-[#b1bad3]/50 transition-colors">
         <div className="flex items-center h-full px-4 border-r border-[#2f4553] cursor-pointer hover:bg-[#213743] transition-colors">
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
            <div className="flex items-center gap-2 text-white font-bold text-lg">
               <div className="bg-[#b1bad3] rounded-full p-0.5">
                 <ChevronRight className="w-3 h-3 text-[#0f212e]" />
               </div>
               Continue Playing
            </div>
            <div className="flex gap-2">
               <Button variant="ghost" size="icon" className="bg-[#1a2c38] hover:bg-[#213743] text-white rounded-md h-8 w-8 border border-[#2f4553]">
                  <ChevronLeft className="w-4 h-4" />
               </Button>
               <Button variant="ghost" size="icon" className="bg-[#1a2c38] hover:bg-[#213743] text-white rounded-md h-8 w-8 border border-[#2f4553]">
                  <ChevronRight className="w-4 h-4" />
               </Button>
            </div>
         </div>

         <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
            {ORIGINALS.map((game) => (
               <Link to={game.link} key={game.id} className="group flex flex-col gap-2 cursor-pointer">
                  <div className={`relative aspect-[3/4] rounded-lg overflow-hidden hover:-translate-y-1 transition-transform duration-300 shadow-lg`}>
                     {/* Card Background */}
                     <div className={`absolute inset-0 ${game.color} flex flex-col items-center justify-center p-4`}>
                        {/* Top "Stake" Tag */}
                        <div className="absolute top-3 right-3 transform rotate-12 bg-white/20 text-[8px] font-black px-1.5 py-0.5 rounded text-white uppercase tracking-wider">
                           Stake
                        </div>
                        
                        {/* Icon */}
                        <div className="text-5xl mb-4 drop-shadow-xl transform group-hover:scale-110 transition-transform duration-300">
                           {game.icon}
                        </div>
                        
                        {/* Name */}
                        <div className="text-white font-black text-xl uppercase tracking-wider drop-shadow-md text-center leading-none">
                           {game.name}
                        </div>
                        
                        {/* Bottom "Originals" Tag */}
                        <div className="absolute bottom-4 text-[9px] font-bold text-white/70 uppercase tracking-[0.2em]">
                           Stake Originals
                        </div>
                     </div>
                     
                     {/* Hover Overlay */}
                     <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                  </div>
                  
                  {/* Playing Count */}
                  <div className="flex items-center gap-1.5 text-[11px] text-[#b1bad3] font-medium px-1">
                     <div className="w-1.5 h-1.5 rounded-full bg-[#00e701]" /> 
                     <span className="text-white font-bold">{game.playing.toLocaleString()}</span> playing
                  </div>
               </Link>
            ))}
         </div>
      </div>

      {/* Trending Games Header (Placeholder for more content) */}
      <div className="space-y-4 pt-4">
         <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white font-bold text-lg">
               <TrendingUp className="w-5 h-5" /> Trending Games
            </div>
            <div className="flex gap-2">
               <Button variant="ghost" size="icon" className="bg-[#1a2c38] hover:bg-[#213743] text-white rounded-md h-8 w-8 border border-[#2f4553]">
                  <ChevronLeft className="w-4 h-4" />
               </Button>
               <Button variant="ghost" size="icon" className="bg-[#1a2c38] hover:bg-[#213743] text-white rounded-md h-8 w-8 border border-[#2f4553]">
                  <ChevronRight className="w-4 h-4" />
               </Button>
            </div>
         </div>
      </div>
    </div>
  );
}
