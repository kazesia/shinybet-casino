import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';
import LiveBets from './LiveBets';

const Hero = () => {
  return (
    <section className="relative py-12 md:py-24 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-primary/10 rounded-[100%] blur-[100px] -z-10 pointer-events-none" />
      
      <div className="container grid lg:grid-cols-2 gap-12 items-center">
        {/* Left Content */}
        <div className="flex flex-col gap-6 text-center lg:text-left z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 w-fit mx-auto lg:mx-0">
            <Sparkles className="w-4 h-4 text-[#F7D979]" />
            <span className="text-xs font-medium text-brand-textSecondary">Premier Crypto Casino</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight">
            Fair Play, <br />
            <span className="text-gold-gradient">Instant Wins.</span>
          </h1>
          
          <p className="text-lg text-brand-textSecondary max-w-xl mx-auto lg:mx-0 leading-relaxed">
            Experience the next generation of crypto gambling. Provably fair games, instant withdrawals, and 24/7 support. Join the winning side today.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start mt-4">
            <Button size="lg" className="w-full sm:w-auto bg-gold-gradient text-black font-bold text-base h-12 px-8 shadow-gold hover:scale-105 transition-transform">
              Start Playing Now
            </Button>
            <Button size="lg" variant="outline" className="w-full sm:w-auto border-white/20 text-white hover:bg-white/5 h-12 px-8 group">
              View Games <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
          
          <div className="flex items-center justify-center lg:justify-start gap-8 mt-8 opacity-70 grayscale hover:grayscale-0 transition-all duration-500">
             {/* Mock Trust Badges */}
             <div className="flex items-center gap-2"><span className="font-bold text-xl">BTC</span></div>
             <div className="flex items-center gap-2"><span className="font-bold text-xl">ETH</span></div>
             <div className="flex items-center gap-2"><span className="font-bold text-xl">USDT</span></div>
             <div className="flex items-center gap-2"><span className="font-bold text-xl">LTC</span></div>
          </div>
        </div>

        {/* Right Content - Live Bets */}
        <div className="relative z-10">
           {/* Decorative blob behind the table */}
           <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-purple-500/20 rounded-xl blur-2xl -z-10" />
           <LiveBets />
        </div>
      </div>
    </section>
  );
};

export default Hero;
