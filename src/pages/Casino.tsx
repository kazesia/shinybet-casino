import { useState, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useViewport } from '@/hooks/useViewport';
import { SHINY_ORIGINALS } from '@/lib/games';
import { GameCard } from '@/components/shared/GameCard';
import RecentBets from '@/components/home/LiveBets';
import {
    Search,
    ChevronRight,
    ChevronLeft,
    LayoutGrid,
    Sparkles,
    Gem,
    Gamepad2,
    PlayCircle,
    Star,
    Flame,
    Users,
    Dices,
    TrendingUp,
    Zap,
    Spade,
    CircleDot
} from 'lucide-react';

// Category tabs
const CATEGORIES = [
    { id: 'lobby', label: 'Lobby', icon: LayoutGrid },
    { id: 'new', label: 'New Releases', icon: Sparkles },
    { id: 'originals', label: 'Shiny Originals', icon: Gem },
    { id: 'slots', label: 'Slots', icon: Dices },
    { id: 'live', label: 'Live Casino', icon: PlayCircle },
    { id: 'exclusive', label: 'Only on Shiny', icon: Star },
];

// Promo banners
const PROMO_BANNERS = [
    {
        id: 1,
        badge: 'Only on Shiny',
        badgeColor: 'bg-[#00875a]',
        title: 'Shiny vs Gates of Eddie',
        subtitle: 'Win a share in $100,000!',
        cta: 'Learn More!',
        gradient: 'from-[#1a3a4a] to-[#0f212e]',
    },
    {
        id: 2,
        badge: 'Promotion',
        badgeColor: 'bg-[#1475e1]',
        title: '12 Days of Wins',
        subtitle: '$120,000 Prize Pool!',
        cta: 'Learn More',
        gradient: 'from-[#2a3a4a] to-[#1a2c38]',
    },
    {
        id: 3,
        badge: 'Only on Shiny',
        badgeColor: 'bg-[#00875a]',
        title: 'Million X Pursuit',
        subtitle: '35K Prize Pool',
        cta: 'Learn More!',
        gradient: 'from-[#1a3a4a] to-[#0f212e]',
    },
];

export default function CasinoPage() {
    const { isMobile } = useViewport();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('lobby');
    const scrollRef = useRef<HTMLDivElement>(null);

    // Filter games based on search query
    const filteredGames = SHINY_ORIGINALS.filter(game =>
        game.status === 'active' &&
        game.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const scrollAmount = 600;
            scrollRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    return (
        <div className="min-h-[calc(100vh-64px)] bg-[#0f212e] p-4 md:p-6">
            <div className="max-w-[1400px] mx-auto space-y-6">

                {/* Promo Banners */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {PROMO_BANNERS.map((promo) => (
                        <div
                            key={promo.id}
                            className={cn(
                                "relative rounded-xl p-5 h-[160px] overflow-hidden border border-[#2f4553] hover:border-[#b1bad3]/30 transition-all cursor-pointer group",
                                `bg-gradient-to-r ${promo.gradient}`
                            )}
                        >
                            {/* Badge */}
                            <span className={cn(
                                "inline-block px-2 py-0.5 rounded text-[10px] font-bold text-white mb-3",
                                promo.badgeColor
                            )}>
                                {promo.badge}
                            </span>

                            {/* Content */}
                            <h3 className="text-white font-bold text-lg leading-tight mb-1">{promo.title}</h3>
                            <p className="text-[#b1bad3] text-sm mb-4">{promo.subtitle}</p>

                            {/* CTA */}
                            <Button
                                variant="outline"
                                size="sm"
                                className="bg-transparent border-[#2f4553] text-white hover:bg-[#213743] hover:border-white/30 text-xs font-bold"
                            >
                                {promo.cta}
                            </Button>

                            {/* Decorative image placeholder */}
                            <div className="absolute right-4 bottom-0 w-24 h-24 opacity-50 group-hover:opacity-70 transition-opacity">
                                <div className="w-full h-full bg-gradient-to-t from-transparent to-white/10 rounded-full" />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Search Bar */}
                <div className="relative w-full">
                    <div className="flex items-center w-full h-12 bg-[#0f212e] border border-[#2f4553] rounded-lg overflow-hidden hover:border-[#b1bad3]/50 transition-colors">
                        <div className="pl-4">
                            <Search className="h-5 w-5 text-[#b1bad3]" />
                        </div>
                        <Input
                            type="text"
                            placeholder="Search your game"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="flex-1 bg-transparent border-0 h-full text-white placeholder:text-[#b1bad3] focus-visible:ring-0 focus-visible:ring-offset-0 px-3"
                        />
                    </div>
                </div>

                {/* Category Tabs */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide bg-[#1a2c38] p-1.5 rounded-full w-fit">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className={cn(
                                "flex items-center gap-2.5 px-5 py-2.5 rounded-full font-bold text-sm whitespace-nowrap transition-all duration-200",
                                activeCategory === cat.id
                                    ? "bg-[#2f4553] text-white shadow-lg"
                                    : "bg-transparent text-white/70 hover:text-white"
                            )}
                        >
                            <cat.icon
                                className="h-[18px] w-[18px]"
                                fill={activeCategory === cat.id ? "#ffffff" : "rgba(255,255,255,0.7)"}
                                stroke="none"
                            />
                            <span className="font-bold">{cat.label}</span>
                        </button>
                    ))}
                </div>

                {/* Shiny Originals Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Gem className="h-5 w-5 text-[#1fff20]" />
                            <h2 className="text-white font-bold text-lg">Shiny Originals</h2>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => scroll('left')}
                                className="h-8 w-8 bg-[#1a2c38] border border-[#2f4553] text-[#b1bad3] hover:text-white rounded-md"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => scroll('right')}
                                className="h-8 w-8 bg-[#1a2c38] border border-[#2f4553] text-[#b1bad3] hover:text-white rounded-md"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Game Cards - Horizontal Scroll */}
                    <div
                        ref={scrollRef}
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

                {/* Slots Section (Placeholder) */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Gamepad2 className="h-5 w-5 text-[#b1bad3]" />
                            <h2 className="text-white font-bold text-lg">Slots</h2>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 bg-[#1a2c38] border border-[#2f4553] text-[#b1bad3] hover:text-white rounded-md"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 bg-[#1a2c38] border border-[#2f4553] text-[#b1bad3] hover:text-white rounded-md"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Slots placeholder */}
                    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div
                                key={i}
                                className="flex-shrink-0 w-[160px] aspect-[3/4] rounded-xl bg-gradient-to-b from-[#2f4553] to-[#1a2c38] border border-[#2f4553] flex items-center justify-center"
                            >
                                <span className="text-[#b1bad3] text-sm">Coming Soon</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Bets */}
                <div className="space-y-4 pt-4">
                    <RecentBets />
                </div>

            </div>
        </div>
    );
}
