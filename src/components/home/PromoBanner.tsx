import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Gamepad2, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PromoBanner() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full h-full">
            {/* Casino Banner */}
            <Link to="/casino" className="group relative h-[200px] rounded-xl overflow-hidden cursor-pointer">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1596838132731-3301c3fd4317?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#0f212e] via-[#0f212e]/80 to-transparent" />

                <div className="relative h-full p-6 flex flex-col justify-between z-10">
                    <div className="flex flex-col gap-2">
                        <span className="text-blue-400 font-bold tracking-wider text-xs uppercase">Casino</span>
                        <h3 className="text-white font-black text-2xl md:text-3xl italic">
                            WIN BIG <br /> <span className="text-blue-500">TODAY</span>
                        </h3>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10">
                            <Gamepad2 className="w-4 h-4 text-white" />
                            <span className="text-white font-bold text-sm">Casino</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-white font-medium text-sm">51,762 Playing</span>
                        </div>
                    </div>
                </div>

                {/* Character Image Overlay (Simulated) */}
                <img
                    src="https://png.pngtree.com/png-vector/20230906/ourmid/pngtree-casino-dealer-man-png-image_9998458.png"
                    alt="Casino Dealer"
                    className="absolute bottom-0 right-4 h-[110%] object-contain drop-shadow-2xl transition-transform duration-500 group-hover:translate-x-2"
                />
            </Link>

            {/* Sports Banner */}
            <Link to="/sports" className="group relative h-[200px] rounded-xl overflow-hidden cursor-pointer">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=2005&auto=format&fit=crop')] bg-cover bg-center transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#0f212e] via-[#0f212e]/80 to-transparent" />

                <div className="relative h-full p-6 flex flex-col justify-between z-10">
                    <div className="flex flex-col gap-2">
                        <span className="text-green-400 font-bold tracking-wider text-xs uppercase">Sports</span>
                        <h3 className="text-white font-black text-2xl md:text-3xl italic">
                            UFC 300 <br /> <span className="text-green-500">LIVE NOW</span>
                        </h3>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10">
                            <Trophy className="w-4 h-4 text-white" />
                            <span className="text-white font-bold text-sm">Sports</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-white font-medium text-sm">42,092 Live</span>
                        </div>
                    </div>
                </div>

                {/* Character Image Overlay (Simulated) */}
                <img
                    src="https://png.pngtree.com/png-vector/20240913/ourmid/pngtree-ufc-fighter-sport-athlete-png-image_13826019.png"
                    alt="UFC Fighter"
                    className="absolute bottom-0 right-4 h-[110%] object-contain drop-shadow-2xl transition-transform duration-500 group-hover:translate-x-2"
                />
            </Link>
        </div>
    );
}
