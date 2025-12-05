import { Input } from '@/components/ui/input';
import { Search, ChevronRight, ChevronLeft, Flame, PlayCircle } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import RecentBets from '@/components/home/LiveBets';
import PromoBanner from '@/components/home/PromoBanner';
import VIPProgressCard from '@/components/dashboard/VIPProgressCard';
import { VIPProgressCard as MobileVIPCard } from '@/components/VIPProgressCard';
import { Button } from '@/components/ui/button';
import { useRef, useState } from 'react';
import { useViewport } from '@/hooks/useViewport';

import { SHINY_ORIGINALS } from '@/lib/games';
import { GameCard } from '@/components/shared/GameCard';

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
   const { isMobile } = useViewport();
   const location = useLocation();
   const searchParams = new URLSearchParams(location.search);
   const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');

   // Filter games based on search query
   const filteredGames = SHINY_ORIGINALS.filter(game =>
      game.status === 'active' &&
      game.name.toLowerCase().includes(searchQuery.toLowerCase())
   );

   return (
      <div className="container py-6 md:py-12 space-y-8 md:space-y-12 max-w-[1400px] mx-auto px-4 md:px-8">

         {/* Mobile VIP Progress Card */}
         {isMobile && (
            <div className="lg:hidden">
               <MobileVIPCard />
            </div>
         )}

         {/* Desktop: Top Section - VIP & Promos */}
         <div className="hidden lg:grid grid-cols-3 gap-4 h-[240px] mb-8">
            {/* VIP Card */}
            <VIPProgressCard />

            {/* Casino Banner */}
            <Link to="/game/dice" className="group relative h-full rounded-xl overflow-hidden cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 bg-[#1a2c38]">
               <img
                  src="/game-assets/banners/casino_banner.png"
                  alt="Casino"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
               />
            </Link>

            {/* Sports Banner */}
            <Link to="/sports" className="group relative h-full rounded-xl overflow-hidden cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 bg-[#1a2c38]">
               <img
                  src="/game-assets/banners/sports_banner.png"
                  alt="Sports"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
               />
            </Link>
         </div>

         {/* Search Bar */}
         <div className="relative w-full">
            <div className="flex items-center w-full h-12 md:h-14 bg-[#0f212e] border border-[#2f4553] rounded-lg overflow-hidden hover:border-[#b1bad3]/50 transition-colors shadow-sm group">
               <div className="hidden md:flex items-center h-full px-4 border-r border-[#2f4553] bg-[#1a2c38] text-white font-medium text-sm cursor-pointer hover:bg-[#213743] transition-colors min-w-[120px]">
                  <select className="bg-transparent border-none outline-none text-white cursor-pointer">
                     <option value="casino">Casino</option>
                     <option value="sports">Sports</option>
                  </select>
               </div>
               <div className="pl-4">
                  <Search className="h-5 w-5 text-[#b1bad3] group-focus-within:text-white transition-colors" />
               </div>
               <Input
                  type="text"
                  placeholder="Search your game or event"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent border-0 h-full text-white placeholder:text-[#b1bad3] focus-visible:ring-0 focus-visible:ring-offset-0 px-3 text-sm md:text-base"
               />
            </div>
         </div>

         {/* Continue Playing Section */}
         <div className="space-y-4 mt-8">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-2">
                  <PlayCircle className="w-5 h-5 text-[#b1bad3]" />
                  <h2 className="text-white font-bold text-lg">Continue Playing</h2>
               </div>
               <div className="flex gap-2">
                  <Button
                     variant="ghost"
                     size="icon"
                     onClick={() => {
                        const container = document.getElementById('continue-playing-scroll');
                        container?.scrollBy({ left: -600, behavior: 'smooth' });
                     }}
                     className="bg-[#1a2c38] hover:bg-[#2f4553] text-white rounded-full h-8 w-8 border border-[#2f4553]"
                  >
                     <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                     variant="ghost"
                     size="icon"
                     onClick={() => {
                        const container = document.getElementById('continue-playing-scroll');
                        container?.scrollBy({ left: 600, behavior: 'smooth' });
                     }}
                     className="bg-[#1a2c38] hover:bg-[#2f4553] text-white rounded-full h-8 w-8 border border-[#2f4553]"
                  >
                     <ChevronRight className="w-4 h-4" />
                  </Button>
               </div>
            </div>

            <div
               id="continue-playing-scroll"
               className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x"
               style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
               {filteredGames.length > 0 ? (
                  filteredGames.map((game) => (
                     <GameCard key={game.id} game={game} isOriginal={true} />
                  ))
               ) : (
                  <div className="w-full text-center py-12 text-[#b1bad3]">
                     No games found matching "{searchQuery}"
                  </div>
               )}
            </div>
         </div>

         {/* Recent Bets Table */}
         <div className="space-y-4 pt-4">
            <RecentBets />
         </div>
      </div>
   );
}
