import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Game {
    id: string;
    name: string;
    path: string;
    color: string;
    icon: string;
    players: number;
}

const GAMES: Game[] = [
    { id: 'dice', name: 'DICE', path: '/game/dice', color: 'bg-blue-600', icon: '🎲', players: 2096 },
    { id: 'mines', name: 'MINES', path: '/game/mines', color: 'bg-orange-600', icon: '💣', players: 2054 },
    { id: 'coinflip', name: 'COINFLIP', path: '/game/coinflip', color: 'bg-purple-600', icon: '🪙', players: 256 },
    { id: 'plinko', name: 'PLINKO', path: '/game/plinko', color: 'bg-pink-600', icon: '⚡', players: 1412 },
    { id: 'crash', name: 'CRASH', path: '/game/crash', color: 'bg-red-600', icon: '📈', players: 3421 },
    { id: 'blackjack', name: 'BLACKJACK', path: '/game/blackjack', color: 'bg-green-600', icon: '♠️', players: 1058 },
    { id: 'roulette', name: 'ROULETTE', path: '/game/roulette', color: 'bg-pink-700', icon: '🎮', players: 892 },
    { id: 'limbo', name: 'LIMBO', path: '/game/limbo', color: 'bg-cyan-600', icon: '🚀', players: 568 },
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
        <div className="relative bg-[#1a2c38] rounded-lg p-6 border border-[#2a3e4e]">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-yellow-500 rounded flex items-center justify-center">
                        <span className="text-black font-black text-sm">⭐</span>
                    </div>
                    <h2 className="text-white font-bold text-lg">Shiny Originals</h2>
                </div>

                {/* Navigation Arrows */}
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => scroll('left')}
                        className="h-8 w-8 bg-[#0f212e] hover:bg-[#2f4553] text-white rounded"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => scroll('right')}
                        className="h-8 w-8 bg-[#0f212e] hover:bg-[#2f4553] text-white rounded"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Game Cards Carousel */}
            <div
                ref={scrollRef}
                className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {GAMES.map((game) => (
                    <Link
                        key={game.id}
                        to={game.path}
                        className="flex-shrink-0 group"
                    >
                        <div className={cn(
                            "w-32 h-40 rounded-lg p-4 flex flex-col items-center justify-between transition-transform hover:scale-105 cursor-pointer relative overflow-hidden",
                            game.color
                        )}>
                            {/* ORIGINAL Badge */}
                            <div className="absolute top-2 left-2 right-2">
                                <div className="bg-black/30 backdrop-blur-sm text-white text-[9px] font-bold px-2 py-0.5 rounded text-center">
                                    ORIGINAL
                                </div>
                            </div>

                            {/* Icon */}
                            <div className="flex-1 flex items-center justify-center mt-4">
                                <span className="text-5xl filter drop-shadow-lg">{game.icon}</span>
                            </div>

                            {/* Game Name */}
                            <div className="text-white font-black text-sm tracking-wide mb-2">
                                {game.name}
                            </div>

                            {/* Player Count */}
                            <div className="flex items-center gap-1 text-white/90 text-xs">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                <span className="font-bold">{game.players.toLocaleString()}</span>
                                <span className="font-normal opacity-80">playing</span>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
