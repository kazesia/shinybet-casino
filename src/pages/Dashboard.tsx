import { Input } from '@/components/ui/input';
import { Search, ChevronRight, ChevronLeft, Flame, PlayCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import RecentBets from '@/components/home/LiveBets';
import PromoBanner from '@/components/home/PromoBanner';
import VIPProgressCard from '@/components/dashboard/VIPProgressCard';
import { Button } from '@/components/ui/button';
import { useRef } from 'react';

// --- Game Data ---
const SHINY_ORIGINALS = [
   {
      id: 'mines',
      name: 'Mines',
      link: '/game/mines',
      color: 'text-blue-400',
      bgGradient: 'from-blue-600 to-blue-900',
      icon: '💣',
      playing: 2383,
      status: 'active'
   },
   {
      id: 'dice',
      name: 'Dice',
      link: '/game/dice',
      color: 'text-purple-400',
      bgGradient: 'from-purple-600 to-purple-900',
      icon: '🎲',
      playing: 2107,
      status: 'active'
   },
   {
      id: 'plinko',
      name: 'Plinko',
      link: '/game/plinko',
      color: 'text-pink-400',
      bgGradient: 'from-pink-600 to-pink-900',
      icon: '⚡',
      playing: 1671,
      status: 'active'
   },
   {
      id: 'limbo',
      name: 'Limbo',
      link: '/game/limbo',
      color: 'text-yellow-400',
      bgGradient: 'from-yellow-500 to-orange-700',
      icon: '🚀',
      playing: 1651,
      status: 'coming_soon'
   },
   {
      id: 'blackjack',
      name: 'Blackjack',
      link: '/game/blackjack',
      color: 'text-red-400',
      bgGradient: 'from-red-600 to-red-900',
      icon: '♠️',
      playing: 1312,
      status: 'active'
   },
   {
      id: 'coinflip',
      name: 'CoinFlip',
      link: '/game/coinflip',
      color: 'text-yellow-400',
      bgGradient: 'from-yellow-400 to-yellow-700',
      icon: '🪙',
      playing: 491,
      status: 'active'
   },
   {
      id: 'crash',
      name: 'Crash',
      link: '/game/crash',
      color: 'text-orange-400',
      bgGradient: 'from-orange-500 to-red-700',
      icon: '📈',
      playing: 3421,
      status: 'active'
   },
   {
      id: 'roulette',
      name: 'Roulette',
      link: '/game/roulette',
      color: 'text-green-400',
      bgGradient: 'from-green-600 to-green-900',
      icon: '🎮',
      playing: 892,
      status: 'coming_soon'
   },
];



// --- Components ---

const GameCard = ({ game, isOriginal = false }: { game: any, isOriginal?: boolean }) => {
   if (isOriginal) {
      return (
         <Link
            to={game.status === 'active' ? game.link : '#'}
            className={cn(
               "group relative flex-shrink-0 w-[180px] h-[240px] rounded-2xl overflow-hidden transition-all duration-300",
               game.status === 'active' ? "hover:-translate-y-2 hover:shadow-2xl cursor-pointer" : "cursor-not-allowed opacity-80"
            )}
         >
            {/* Background Gradient */}
            <div className={cn(
               "absolute inset-0 bg-gradient-to-br transition-transform duration-500 group-hover:scale-110",
               game.bgGradient
            )} />

            {/* Overlay Pattern */}
            <div className="absolute inset-0 opacity-10" style={{
               backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 80%, white 1px, transparent 1px)',
               backgroundSize: '50px 50px'
            }} />

            {/* Content Container */}
            <div className="absolute inset-0 p-5 flex flex-col justify-between">

               {/* Top Section: Name & Badge */}
               <div className="z-10 space-y-2">
                  <h3 className="text-white font-black text-2xl tracking-tight uppercase drop-shadow-lg">
                     {game.name}
                  </h3>
                  <div className="inline-block">
                     <div className="text-[9px] font-bold text-white/70 tracking-wider uppercase bg-black/20 px-2 py-0.5 rounded-full backdrop-blur-sm">
                        Shiny Originals
                     </div>
                  </div>
               </div>

               {/* Middle Section: Large Icon */}
               <div className="absolute inset-0 flex items-center justify-center z-0">
                  <span className="text-[120px] filter drop-shadow-2xl transform group-hover:scale-110 transition-transform duration-300 opacity-90">
                     {game.icon}
                  </span>
               </div>

               {/* Bottom Section: Player Count or Coming Soon */}
               <div className="z-10">
                  {game.status === 'active' ? (
                     <div className="flex items-center gap-1.5 text-white/90 text-xs font-medium">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#00e701] shadow-[0_0_6px_#00e701] animate-pulse" />
                        <span className="font-bold">{game.playing.toLocaleString()}</span>
                        <span className="opacity-70">playing</span>
                     </div>
                  ) : (
                     <div className="flex items-center gap-1.5 text-white/60 text-xs font-medium">
                        <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
                        <span className="font-bold">Coming Soon</span>
                     </div>
                  )}
               </div>
            </div>

            {/* Coming Soon Overlay */}
            {game.status === 'coming_soon' && (
               <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex flex-col items-center justify-center z-20">
                  <div className="w-10 h-10 text-white/50 mb-3">🔒</div>
                  <span className="text-white font-bold text-sm uppercase tracking-wider border border-white/20 px-4 py-1.5 rounded-full bg-black/40">
                     Coming Soon
                  </span>
               </div>
            )}

            {/* Hover Shine Effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

            {/* Border Glow on Hover */}
            <div className="absolute inset-0 rounded-2xl border-2 border-white/0 group-hover:border-white/30 transition-all duration-300" />
         </Link>
      );
   }

   // Standard Card for Trending Games (External Images)
   return (
      <Link to={game.link} className="group relative flex-shrink-0 w-[160px] md:w-[180px] cursor-pointer">
         <div className={cn(
            "relative aspect-[3/4] rounded-xl overflow-hidden transition-transform duration-300 group-hover:-translate-y-1.5",
            "shadow-lg group-hover:shadow-2xl group-hover:shadow-[#00e701]/20",
            "bg-[#1a2c38]"
         )}>
            {/* Image */}
            <img
               src={game.image}
               alt={game.name}
               className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
               onError={(e) => {
                  e.currentTarget.src = `https://placehold.co/280x400/1a2c38/FFF?text=${game.name}`;
               }}
            />

            {/* Overlay */}
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />

            {/* Play Button Overlay */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/40 backdrop-blur-[1px]">
               <div className="bg-[#00e701] text-black rounded-full p-3 transform scale-50 group-hover:scale-100 transition-transform duration-300 shadow-[0_0_20px_#00e701]">
                  <PlayCircle className="w-8 h-8 fill-black" />
               </div>
            </div>
         </div>
      </Link>
   );
};

const ScrollSection = ({ title, icon: Icon, games, isOriginal = false }: { title: string, icon: any, games: any[], isOriginal?: boolean }) => {
   const scrollRef = useRef<HTMLDivElement>(null);

   const scroll = (direction: 'left' | 'right') => {
      if (scrollRef.current) {
         const { current } = scrollRef;
         const scrollAmount = 600;
         current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
      }
   };

   return (
      <div className="space-y-4">
         <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white font-bold text-xl">
               {Icon && <Icon className="w-5 h-5 text-[#b1bad3]" />}
               {title}
            </div>
            <div className="flex gap-2">
               <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => scroll('left')}
                  className="bg-[#1a2c38] hover:bg-[#2f4553] text-white rounded-full h-8 w-8 border border-[#2f4553]"
               >
                  <ChevronLeft className="w-4 h-4" />
               </Button>
               <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => scroll('right')}
                  className="bg-[#1a2c38] hover:bg-[#2f4553] text-white rounded-full h-8 w-8 border border-[#2f4553]"
               >
                  <ChevronRight className="w-4 h-4" />
               </Button>
            </div>
         </div>

         <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
         >
            {games.map((game) => (
               <GameCard key={game.id} game={game} isOriginal={isOriginal} />
            ))}
         </div>
      </div>
   );
};

export default function Dashboard() {

   return (
      <div className="container py-4 md:py-8 space-y-6 md:space-y-10 max-w-[1400px] mx-auto px-4 md:px-8">

         {/* Top Section: VIP & Promos */}
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-auto lg:h-[200px]">
            {/* VIP Card (1 Col) */}
            <div className="lg:col-span-1 h-full">
               <VIPProgressCard />
            </div>

            {/* Promo Banners (2 Cols) */}
            <div className="lg:col-span-2 h-full">
               <PromoBanner />
            </div>
         </div>

         {/* Search Bar */}
         <div className="relative w-full">
            <div className="flex items-center w-full h-12 md:h-14 bg-[#0f212e] border border-[#2f4553] rounded-lg overflow-hidden hover:border-[#b1bad3]/50 transition-colors shadow-sm group focus-within:border-[#00e701]/50 focus-within:shadow-[0_0_10px_rgba(0,231,1,0.1)]">
               <div className="flex items-center h-full px-4 border-r border-[#2f4553] bg-[#1a2c38] text-white font-medium text-sm gap-2 cursor-pointer hover:bg-[#213743] transition-colors">
                  <span>Casino</span>
                  <ChevronRight className="w-4 h-4 rotate-90 text-[#b1bad3]" />
               </div>
               <div className="pl-4">
                  <Search className="h-5 w-5 text-[#b1bad3] group-focus-within:text-white transition-colors" />
               </div>
               <Input
                  className="flex-1 h-full border-0 bg-transparent text-white placeholder:text-[#b1bad3] focus-visible:ring-0 text-sm font-medium pl-3"
                  placeholder="Search your game"
               />
            </div>
         </div>

         {/* Shiny Originals */}
         <ScrollSection
            title="Shiny Originals"
            icon={Flame}
            games={SHINY_ORIGINALS}
            isOriginal={true}
         />

         {/* Recent Bets Table */}
         <div className="space-y-4 pt-4">
            <RecentBets />
         </div>
      </div>
   );
}
