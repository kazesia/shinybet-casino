import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Gamepad2, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PromoBanner() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full h-full">
            {/* Casino Banner */}
            <Link to="/casino" className="group relative h-full rounded-xl overflow-hidden cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <img
                    src="/game-assets/banners/casino_banner.png"
                    alt="Casino"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
            </Link>

            {/* Sports Banner */}
            <Link to="/sports" className="group relative h-full rounded-xl overflow-hidden cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <img
                    src="/game-assets/banners/sports_banner.png"
                    alt="Sports"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
            </Link>
        </div>
    );
}
