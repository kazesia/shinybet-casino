import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ChevronDown, ChevronLeft, ChevronRight, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

const TRENDING_GAMES = [
  { id: 1, title: 'Sweet Bonanza', provider: 'Pragmatic Play', image: 'https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://placehold.co/200x280/1a2c38/FFF?text=Sweet+Bonanza' },
  { id: 2, title: 'Gates of Olympus', provider: 'Pragmatic Play', image: 'https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://placehold.co/200x280/1a2c38/FFF?text=Gates+of+Olympus' },
  { id: 3, title: 'Wanted Dead or a Wild', provider: 'Hacksaw', image: 'https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://placehold.co/200x280/1a2c38/FFF?text=Wanted' },
  { id: 4, title: 'Sugar Rush', provider: 'Pragmatic Play', image: 'https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://placehold.co/200x280/1a2c38/FFF?text=Sugar+Rush' },
  { id: 5, title: 'Fruit Party', provider: 'Pragmatic Play', image: 'https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://placehold.co/200x280/1a2c38/FFF?text=Fruit+Party' },
  { id: 6, title: 'Big Bass Bonanza', provider: 'Pragmatic Play', image: 'https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://placehold.co/200x280/1a2c38/FFF?text=Big+Bass' },
  { id: 7, title: 'Dice', provider: 'Shiny Originals', image: 'https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://placehold.co/200x280/1475e1/FFF?text=Dice', link: '/game/dice' },
  { id: 8, title: 'Mines', provider: 'Shiny Originals', image: 'https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://placehold.co/200x280/ff4d4d/FFF?text=Mines', link: '/game/mines' },
];

const GameGrid = () => {
  return (
    <section className="pb-16 px-4 md:px-8 max-w-[1400px] mx-auto space-y-8">
      
      {/* Search Bar */}
      <div className="relative flex items-center w-full">
         <div className="absolute inset-y-0 left-0 flex items-center z-10">
            <Button 
              variant="ghost" 
              className="h-14 rounded-l-md rounded-r-none border-r border-[#213743] bg-[#0f212e] text-white font-bold hover:bg-[#213743] px-6 gap-2"
            >
               Casino <ChevronDown className="h-4 w-4 text-[#b1bad3]" />
            </Button>
         </div>
         <div className="absolute left-[130px] top-1/2 -translate-y-1/2 z-10 pointer-events-none">
            <Search className="h-5 w-5 text-[#b1bad3]" />
         </div>
         <Input 
           className="w-full h-14 pl-[160px] bg-[#0f212e] border border-[#213743] rounded-md text-white placeholder:text-[#b1bad3] focus-visible:ring-1 focus-visible:ring-[#1475e1] hover:border-[#b1bad3]/30 transition-colors text-base"
           placeholder="Search your game"
         />
      </div>

      {/* Trending Games Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
           <TrendingUp className="h-6 w-6 text-white" />
           <h2 className="text-xl font-bold text-white">Trending Games</h2>
        </div>
        <div className="flex gap-2">
           <Button variant="ghost" size="icon" className="bg-[#1a2c38] hover:bg-[#213743] text-white rounded-md h-10 w-10 border border-[#213743]">
              <ChevronLeft className="h-5 w-5" />
           </Button>
           <Button variant="ghost" size="icon" className="bg-[#1a2c38] hover:bg-[#213743] text-white rounded-md h-10 w-10 border border-[#213743]">
              <ChevronRight className="h-5 w-5" />
           </Button>
        </div>
      </div>

      {/* Games Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
        {TRENDING_GAMES.map((game) => (
          <Link 
            to={game.link || '#'} 
            key={game.id} 
            className="group relative aspect-[3/4] rounded-lg overflow-hidden bg-[#1a2c38] hover:-translate-y-1 transition-transform duration-300 cursor-pointer shadow-lg"
          >
            <img src={game.image} alt={game.title} className="w-full h-full object-cover" />
            
            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
               <div className="bg-[#1475e1] rounded-full p-3 shadow-lg transform scale-0 group-hover:scale-100 transition-transform duration-300">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-white">
                    <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                  </svg>
               </div>
            </div>

            {/* Info Overlay (Bottom) */}
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 via-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
               <div className="text-white font-bold text-sm truncate">{game.title}</div>
               <div className="text-[#b1bad3] text-xs truncate">{game.provider}</div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default GameGrid;
