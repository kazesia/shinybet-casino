import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Game {
    id: string;
    name: string;
    path: string;
    color: string;
    icon: string;
    players: number;
    status: 'active' | 'coming_soon';
    bgGradient: string;
}

const GAMES: Game[] = [
    {
        id: 'mines',
        name: 'MINES',
        path: '/game/mines',
        color: 'text-blue-400',
        bgGradient: 'from-blue-600 to-blue-900',
        icon: '💣',
        players: 2121,
        status: 'active'
    },
    {
        id: 'dice',
        name: 'DICE',
        path: '/game/dice',
        color: 'text-purple-400',
        bgGradient: 'from-purple-600 to-purple-900',
        icon: '🎲',
        players: 2079,
        status: 'active'
    },
    {
        id: 'plinko',
        name: 'PLINKO',
        path: '/game/plinko',
        color: 'text-pink-400',
        bgGradient: 'from-pink-600 to-pink-900',
        icon: '⚡',
        players: 1280,
        status: 'active'
    },
    {
        id: 'limbo',
        name: 'LIMBO',
        path: '/game/limbo',
        color: 'text-yellow-400',
        bgGradient: 'from-yellow-500 to-orange-700',
        icon: '🚀',
        players: 1651,
        status: 'coming_soon'
    },
    {
        id: 'blackjack',
        name: 'BLACKJACK',
        path: '/game/blackjack',
        color: 'text-red-400',
        bgGradient: 'from-red-600 to-red-900',
        icon: '♠️',
        players: 893,
        status: 'active'
    },
    {
        id: 'coinflip',
        name: 'COINFLIP',
        path: '/game/coinflip',
        color: 'text-yellow-400',
        bgGradient: 'from-yellow-400 to-yellow-700',
        icon: '🪙',
        players: 491,
        status: 'active'
    },
    {
        id: 'crash',
        name: 'CRASH',
        path: '/game/crash',
        color: 'text-orange-400',
        bgGradient: 'from-orange-500 to-red-700',
        icon: '📈',
        players: 1091,
        status: 'active'
    },
    {
        id: 'roulette',
        name: 'ROULETTE',
        path: '/game/roulette',
        color: 'text-green-400',
        bgGradient: 'from-green-600 to-green-900',
        icon: '🎮',
        players: 95,
        status: 'coming_soon'
    },
];

export default function GameCarousel() {
    const scrollRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const scrollAmount = 300;
            scrollRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    return (
        <div className="relative w-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-2">
                    <h2 className="text-white font-bold text-xl">Shiny Originals</h2>
                </div>

                {/* Navigation Arrows */}
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => scroll('left')}
                        className="h-9 w-9 bg-[#1a2c38] hover:bg-[#2f4553] text-white rounded-md border border-[#2f4553]"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => scroll('right')}
                        className="h-9 w-9 bg-[#1a2c38] hover:bg-[#2f4553] text-white rounded-md border border-[#2f4553]"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </Button>
                </div>
            </div>

            {/* Game Cards Carousel */}
            <div
                ref={scrollRef}
                className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-4"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {GAMES.map((game) => (
                    <Link
                        key={game.id}
                        to={game.status === 'active' ? game.path : '#'}
                        className={cn(
                            "flex-shrink-0 group relative w-[160px] h-[220px] rounded-xl overflow-hidden transition-all duration-300",
                            game.status === 'active' ? "hover:-translate-y-1 hover:shadow-xl cursor-pointer" : "cursor-not-allowed opacity-80"
                        )}
                    >
                        {/* Background Gradient */}
                        <div className={cn(
                            "absolute inset-0 bg-gradient-to-br transition-transform duration-500 group-hover:scale-110",
                            game.bgGradient
                        )} />

                        {/* Content Container */}
                        <div className="absolute inset-0 p-4 flex flex-col justify-between">

                            {/* Top Section: Name */}
                            <div className="z-10">
                                <h3 className="text-white font-black text-xl tracking-wide uppercase drop-shadow-md">
                                    {game.name}
                                </h3>
                            </div>

                            {/* Middle Section: Icon */}
                            <div className="absolute inset-0 flex items-center justify-center z-0">
                                <span className="text-7xl filter drop-shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                                    {game.icon}
                                </span>
                            </div>

                            {/* Bottom Section: Branding & Status */}
                            <div className="z-10 flex flex-col gap-1">
                                <div className="text-[10px] font-bold text-white/60 tracking-wider uppercase">
                                    Shiny Originals
                                </div>

                                {/* Player Count (Active Only) */}
                                {game.status === 'active' && (
                                    <div className="flex items-center gap-1.5 text-white/90 text-[10px]">
                                        <div className="w-1.5 h-1.5 rounded-full bg-[#00e701] shadow-[0_0_4px_#00e701]" />
                                        <span className="font-medium">{game.players.toLocaleString()} playing</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Coming Soon Overlay */}
                        {game.status === 'coming_soon' && (
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex flex-col items-center justify-center z-20">
                                <Lock className="w-8 h-8 text-white/50 mb-2" />
                                <span className="text-white font-bold text-sm uppercase tracking-wider border border-white/20 px-3 py-1 rounded-full bg-black/40">
                                    Coming Soon
                                </span>
                            </div>
                        )}

                        {/* Hover Shine Effect */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    </Link>
                ))}
            </div>
        </div>
    );
}
