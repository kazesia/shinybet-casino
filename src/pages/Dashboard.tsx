import { useAuth } from '@/context/AuthContext';
import { useDashboardData } from '@/hooks/useDashboardData';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, ChevronRight, Star, Info, ChevronLeft, Gamepad2, Dices, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';

// Mock Data for Game Cards
const ORIGINALS = [
  { id: 'blackjack', name: 'Blackjack', color: 'bg-[#ff4d4d]', icon: '♠️', playing: 1415 },
  { id: 'snakes', name: 'Snakes', color: 'bg-[#00b8ff]', icon: '🐍', playing: 303 },
  { id: 'mines', name: 'Mines', color: 'bg-[#0052ff]', icon: '💣', playing: 2701 },
  { id: 'dice', name: 'Dice', color: 'bg-[#9146ff]', icon: '🎲', playing: 2507 },
  { id: 'chicken', name: 'Chicken', color: 'bg-[#5c5cff]', icon: '🐔', playing: 766 },
  { id: 'plinko', name: 'Plinko', color: 'bg-[#ff469f]', icon: '🎯', playing: 1750 },
  { id: 'diamonds', name: 'Diamonds', color: 'bg-[#a359ff]', icon: '💎', playing: 130 },
  { id: 'limbo', name: 'Limbo', color: 'bg-[#ffaa00]', icon: '🚀', playing: 1905 },
];

const SLOTS = [
  { id: 1, name: 'Sweet Bonanza', image: 'https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://placehold.co/200x280/1a2c38/FFF?text=Sweet+Bonanza' },
  { id: 2, name: 'Gates of Olympus', image: 'https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://placehold.co/200x280/1a2c38/FFF?text=Gates+of+Olympus' },
  { id: 3, name: 'Wanted Dead or a Wild', image: 'https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://placehold.co/200x280/1a2c38/FFF?text=Wanted' },
  { id: 4, name: 'Sugar Rush', image: 'https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://placehold.co/200x280/1a2c38/FFF?text=Sugar+Rush' },
  { id: 5, name: 'Fruit Party', image: 'https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://placehold.co/200x280/1a2c38/FFF?text=Fruit+Party' },
  { id: 6, name: 'Big Bass Bonanza', image: 'https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://placehold.co/200x280/1a2c38/FFF?text=Big+Bass' },
];

export default function Dashboard() {
  const { profile } = useAuth();
  const { wallet } = useDashboardData();

  return (
    <div className="container py-6 space-y-8 max-w-[1400px] mx-auto px-4 md:px-8">
      
      {/* Hero Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Profile / VIP Card */}
        <Card className="lg:col-span-4 bg-[#1a2c38] border-0 shadow-lg overflow-hidden relative group">
           <div className="absolute inset-0 bg-gradient-to-br from-[#1a2c38] to-[#0f212e]" />
           <CardContent className="relative p-6 h-full flex flex-col justify-between min-h-[220px]">
              <div className="flex justify-between items-start">
                 <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold text-white">{profile?.username || 'Guest'}</h2>
                 </div>
                 <Star className="w-5 h-5 text-[#b1bad3] hover:text-[#F7D979] cursor-pointer transition-colors" />
              </div>

              <div className="space-y-3 mt-auto">
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-white font-semibold flex items-center gap-1 hover:underline cursor-pointer">
                      Your VIP Progress <ChevronRight className="w-4 h-4" />
                    </span>
                    <span className="text-white font-bold flex items-center gap-1">
                      20.01% <Info className="w-3 h-3 text-[#b1bad3]" />
                    </span>
                 </div>
                 <div className="relative h-2 bg-[#0f212e] rounded-full overflow-hidden">
                    <div className="absolute top-0 left-0 h-full w-[20%] bg-[#b17827] rounded-full" />
                 </div>
                 <div className="flex justify-between text-xs text-[#b1bad3] font-medium">
                    <span className="flex items-center gap-1"><Star className="w-3 h-3 text-[#b17827]" /> Bronze</span>
                    <span className="flex items-center gap-1"><Star className="w-3 h-3" /> Silver</span>
                 </div>
              </div>
           </CardContent>
        </Card>

        {/* Casino Banner */}
        <Card className="lg:col-span-4 bg-[#1a2c38] border-0 shadow-lg overflow-hidden relative group cursor-pointer">
           <img 
             src="https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://placehold.co/600x350/1475e1/FFF?text=Casino+Live" 
             alt="Casino" 
             className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500" 
           />
           <div className="absolute inset-0 bg-gradient-to-t from-[#0f212e] via-transparent to-transparent" />
           <CardContent className="relative h-full flex flex-col justify-end p-4 min-h-[220px]">
              <div className="flex justify-between items-end">
                 <div className="flex items-center gap-2 text-white font-bold text-lg">
                    <Dices className="w-5 h-5" /> Casino
                 </div>
                 <div className="flex items-center gap-1.5 text-xs font-medium text-[#b1bad3]">
                    <div className="w-2 h-2 rounded-full bg-[#00e701]" /> 61,633
                 </div>
              </div>
           </CardContent>
        </Card>

        {/* Sports Banner */}
        <Card className="lg:col-span-4 bg-[#1a2c38] border-0 shadow-lg overflow-hidden relative group cursor-pointer">
           <img 
             src="https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://placehold.co/600x350/00b894/FFF?text=UFC+299" 
             alt="Sports" 
             className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500" 
           />
           <div className="absolute inset-0 bg-gradient-to-t from-[#0f212e] via-transparent to-transparent" />
           <CardContent className="relative h-full flex flex-col justify-end p-4 min-h-[220px]">
              <div className="flex justify-between items-end">
                 <div className="flex items-center gap-2 text-white font-bold text-lg">
                    <Trophy className="w-5 h-5" /> Sports
                 </div>
                 <div className="flex items-center gap-1.5 text-xs font-medium text-[#b1bad3]">
                    <div className="w-2 h-2 rounded-full bg-[#00e701]" /> 21,686
                 </div>
              </div>
           </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      <div className="relative group">
         <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-[#b1bad3]" />
         </div>
         <div className="absolute inset-y-0 left-12 flex items-center">
            <Button variant="ghost" className="h-8 text-sm font-semibold text-white hover:bg-[#213743] px-2">
               Casino <ChevronRight className="ml-1 h-3 w-3" />
            </Button>
         </div>
         <Input 
           className="w-full h-14 pl-36 bg-[#0f212e] border border-[#213743] rounded-full text-white placeholder:text-[#b1bad3] focus-visible:ring-1 focus-visible:ring-[#1475e1] hover:border-[#b1bad3]/30 transition-colors"
           placeholder="Search your game"
         />
      </div>

      {/* Continue Playing (Originals) */}
      <div className="space-y-4">
         <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white font-bold text-lg">
               <Gamepad2 className="w-5 h-5" /> Continue Playing
            </div>
            <div className="flex gap-2">
               <Button variant="ghost" size="icon" className="bg-[#1a2c38] hover:bg-[#213743] text-white rounded-full h-8 w-8">
                  <ChevronLeft className="w-4 h-4" />
               </Button>
               <Button variant="ghost" size="icon" className="bg-[#1a2c38] hover:bg-[#213743] text-white rounded-full h-8 w-8">
                  <ChevronRight className="w-4 h-4" />
               </Button>
            </div>
         </div>

         <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
            {ORIGINALS.map((game) => (
               <Link to={`/game/${game.id}`} key={game.id} className="group relative aspect-[3/4] rounded-lg overflow-hidden hover:-translate-y-1 transition-transform duration-300">
                  <div className={`absolute inset-0 ${game.color} flex flex-col items-center justify-center p-4`}>
                     <div className="absolute top-2 right-2 bg-black/20 text-[10px] font-bold px-1.5 py-0.5 rounded text-white/80">
                        Shiny
                     </div>
                     <div className="text-4xl mb-2 drop-shadow-lg transform group-hover:scale-110 transition-transform">
                        {game.icon}
                     </div>
                     <div className="text-white font-black text-lg uppercase tracking-wider drop-shadow-md">
                        {game.name}
                     </div>
                     <div className="absolute bottom-4 text-[10px] font-medium text-white/60 uppercase tracking-widest">
                        Shiny Originals
                     </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-[#1a2c38] flex items-center gap-1.5 text-[10px] text-[#b1bad3] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                     <div className="w-1.5 h-1.5 rounded-full bg-[#00e701]" /> {game.playing.toLocaleString()} playing
                  </div>
               </Link>
            ))}
         </div>
      </div>

      {/* Trending Games */}
      <div className="space-y-4">
         <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white font-bold text-lg">
               <TrendingUpIcon className="w-5 h-5" /> Trending Games
            </div>
            <div className="flex gap-2">
               <Button variant="ghost" size="icon" className="bg-[#1a2c38] hover:bg-[#213743] text-white rounded-full h-8 w-8">
                  <ChevronLeft className="w-4 h-4" />
               </Button>
               <Button variant="ghost" size="icon" className="bg-[#1a2c38] hover:bg-[#213743] text-white rounded-full h-8 w-8">
                  <ChevronRight className="w-4 h-4" />
               </Button>
            </div>
         </div>

         <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {SLOTS.map((game) => (
               <div key={game.id} className="group relative aspect-[3/4] rounded-lg overflow-hidden bg-[#1a2c38] hover:-translate-y-1 transition-transform duration-300 cursor-pointer">
                  <img src={game.image} alt={game.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                     <div className="text-white font-bold text-sm truncate">{game.name}</div>
                  </div>
               </div>
            ))}
         </div>
      </div>
    </div>
  );
}

function TrendingUpIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  )
}
