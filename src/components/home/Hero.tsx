import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useUI } from '@/context/UIContext';
import { Facebook, Twitch, Chrome, MessageCircle, Dices, Trophy } from 'lucide-react';

const Hero = () => {
  const { openAuthModal } = useUI();

  return (
    <section className="relative pt-8 pb-12 px-4 md:px-8 max-w-[1400px] mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left Content */}
        <div className="lg:col-span-5 space-y-8">
          <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] font-bold text-white leading-[1.1] tracking-tight">
            World's Largest Online <br />
            Casino and Sportsbook
          </h1>
          
          <Button 
            onClick={() => openAuthModal('register')} 
            className="h-12 px-8 bg-[#1475e1] hover:bg-[#1475e1]/90 text-white font-bold text-base rounded-md w-full sm:w-auto"
          >
            Register
          </Button>

          <div className="space-y-3">
            <p className="text-sm text-[#b1bad3] font-medium">Or sign up with</p>
            <div className="flex gap-3">
              <Button variant="ghost" size="icon" className="bg-[#2f4553] hover:bg-[#3d5565] text-white rounded-md h-12 w-12">
                <Chrome className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="bg-[#2f4553] hover:bg-[#3d5565] text-white rounded-md h-12 w-12">
                <Facebook className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="bg-[#2f4553] hover:bg-[#3d5565] text-white rounded-md h-12 w-12">
                <MessageCircle className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="bg-[#2f4553] hover:bg-[#3d5565] text-white rounded-md h-12 w-12">
                <Twitch className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Right Content - Cards */}
        <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Casino Card */}
          <Card className="bg-[#1a2c38] border-0 overflow-hidden group cursor-pointer hover:-translate-y-1 transition-transform duration-300">
            <div className="relative h-[200px] overflow-hidden">
               <img 
                 src="https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://placehold.co/600x400/1a2c38/FFF?text=Casino+Live+Dealers" 
                 alt="Casino"
                 className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
               />
               {/* Gradient Overlay */}
               <div className="absolute inset-0 bg-gradient-to-t from-[#1a2c38] to-transparent opacity-80" />
            </div>
            <CardContent className="p-4 flex items-center justify-between bg-[#1a2c38] relative z-10">
              <div className="flex items-center gap-2">
                <Dices className="h-5 w-5 text-[#b1bad3]" />
                <span className="text-white font-bold text-lg">Casino</span>
              </div>
              <div className="flex items-center gap-2 text-[#b1bad3] text-sm font-medium">
                <div className="w-2 h-2 rounded-full bg-[#00e701] shadow-[0_0_8px_#00e701]" />
                <span>40,902</span>
              </div>
            </CardContent>
          </Card>

          {/* Sports Card */}
          <Card className="bg-[#1a2c38] border-0 overflow-hidden group cursor-pointer hover:-translate-y-1 transition-transform duration-300">
            <div className="relative h-[200px] overflow-hidden">
               <img 
                 src="https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://placehold.co/600x400/1a2c38/FFF?text=UFC+Fighters" 
                 alt="Sports"
                 className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
               />
               {/* Gradient Overlay */}
               <div className="absolute inset-0 bg-gradient-to-t from-[#1a2c38] to-transparent opacity-80" />
            </div>
            <CardContent className="p-4 flex items-center justify-between bg-[#1a2c38] relative z-10">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-[#b1bad3]" />
                <span className="text-white font-bold text-lg">Sports</span>
              </div>
              <div className="flex items-center gap-2 text-[#b1bad3] text-sm font-medium">
                <div className="w-2 h-2 rounded-full bg-[#00e701] shadow-[0_0_8px_#00e701]" />
                <span>44,626</span>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </section>
  );
};

export default Hero;
