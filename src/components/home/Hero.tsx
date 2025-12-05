import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useUI } from '@/context/UIContext';
import { useAuth } from '@/context/AuthContext';
import { Facebook, Twitch, Chrome, MessageCircle, Dices, Trophy, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const Hero = () => {
  const { openAuthModal } = useUI();
  const { user } = useAuth();

  return (
    <section className="relative pt-8 pb-12 px-4 md:px-8 max-w-[1400px] mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">

        {/* Left Content */}
        <div className="lg:col-span-5 space-y-8">
          <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] font-bold text-white leading-[1.1] tracking-tight">
            World's Largest Online <br />
            Casino and Sportsbook
          </h1>

          {user ? (
            // Logged In View - Hide Register, Show Play Now
            <div className="space-y-6">
              <div className="flex gap-4">
                <Link to="/game/dice">
                  <Button
                    className="h-12 px-8 bg-[#FFD700] hover:bg-[#DAA520] text-[#0f212e] font-black text-base rounded-md w-full sm:w-auto shadow-[0_0_20px_rgba(0,231,1,0.3)]"
                  >
                    Play Now <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/sports">
                  <Button
                    variant="outline"
                    className="h-12 px-8 border-[#2f4553] bg-[#1a2c38] hover:bg-[#213743] text-white font-bold text-base rounded-md w-full sm:w-auto"
                  >
                    Sportsbook
                  </Button>
                </Link>
              </div>
              <p className="text-[#b1bad3] font-medium flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#00e701] animate-pulse" />
                {Math.floor(Math.random() * 1000) + 2000} players online now
              </p>
            </div>
          ) : (
            // Guest View
            <>
              <Button
                onClick={() => openAuthModal('register')}
                className="h-12 px-8 bg-[#1475e1] hover:bg-[#1475e1]/90 text-white font-bold text-base rounded-md w-full sm:w-auto"
              >
                Register
              </Button>


            </>
          )}
        </div>

        {/* Right Content - Banners */}
        <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-4 h-full">

          {/* Casino Banner */}
          <Link to="/game/dice" className="group relative h-[300px] md:h-full rounded-xl overflow-hidden cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 bg-[#1a2c38]">
            <img
              src="/game-assets/banners/casino_banner.png"
              alt="Casino"
              className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-90" />

            <div className="absolute bottom-0 left-0 right-0 p-6 flex items-end justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Dices className="h-5 w-5 text-[#F7D979]" />
                  <span className="text-white font-bold text-xl">Casino</span>
                </div>
                <p className="text-[#b1bad3] text-sm">Play the best crypto games</p>
              </div>
              <div className="flex items-center gap-2 text-[#00e701] text-sm font-bold bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm border border-[#00e701]/20">
                <div className="w-2 h-2 rounded-full bg-[#00e701] animate-pulse shadow-[0_0_8px_#00e701]" />
                <span>40,902 Playing</span>
              </div>
            </div>
          </Link>

          {/* Sports Banner */}
          <Link to="/sports" className="group relative h-[300px] md:h-full rounded-xl overflow-hidden cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 bg-[#1a2c38]">
            <img
              src="/game-assets/banners/sports_banner.png"
              alt="Sports"
              className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-90" />

            <div className="absolute bottom-0 left-0 right-0 p-6 flex items-end justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Trophy className="h-5 w-5 text-[#F7D979]" />
                  <span className="text-white font-bold text-xl">Sports</span>
                </div>
                <p className="text-[#b1bad3] text-sm">Bet on your favorite teams</p>
              </div>
              <div className="flex items-center gap-2 text-[#00e701] text-sm font-bold bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm border border-[#00e701]/20">
                <div className="w-2 h-2 rounded-full bg-[#00e701] animate-pulse shadow-[0_0_8px_#00e701]" />
                <span>44,626 Live</span>
              </div>
            </div>
          </Link>

        </div>
      </div>
    </section>
  );
};

export default Hero;
