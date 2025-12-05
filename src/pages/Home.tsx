import { useAuth } from '@/context/AuthContext';
import Hero from '@/components/home/Hero';
import Dashboard from '@/pages/Dashboard';
import { Loader2, Search, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SHINY_ORIGINALS } from '@/lib/games';
import { GameCard } from '@/components/shared/GameCard';
import { Features } from '@/components/ui/features-8';

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#F7D979]" />
      </div>
    );
  }

  // If user is logged in, show Dashboard (Home view for users)
  if (user) {
    return <Dashboard />;
  }

  // Otherwise show Landing Page
  return (
    <>
      <Hero />

      <div className="container py-8 md:py-12 space-y-8 md:space-y-12 max-w-[1400px] mx-auto px-4 md:px-8">

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
              className="flex-1 bg-transparent border-0 h-full text-white placeholder:text-[#b1bad3] focus-visible:ring-0 focus-visible:ring-offset-0 px-3 text-sm md:text-base"
            />
          </div>
        </div>

        {/* Trending Games (Renamed from Continue Playing) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#F7D979]" />
              <h2 className="text-white font-bold text-lg">Trending Games</h2>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  const container = document.getElementById('trending-games-scroll');
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
                  const container = document.getElementById('trending-games-scroll');
                  container?.scrollBy({ left: 600, behavior: 'smooth' });
                }}
                className="bg-[#1a2c38] hover:bg-[#2f4553] text-white rounded-full h-8 w-8 border border-[#2f4553]"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div
            id="trending-games-scroll"
            className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {SHINY_ORIGINALS.map((game) => (
              <GameCard key={game.id} game={game} isOriginal={true} />
            ))}
          </div>
        </div>

        {/* Features Section */}
        <Features />

      </div>
    </>
  );
}
