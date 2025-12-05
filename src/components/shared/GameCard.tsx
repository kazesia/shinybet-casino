import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { PlayCircle } from 'lucide-react';
import { usePlayerCount } from '@/context/PlayerCountContext';

export const GameCard = ({ game, isOriginal = false }: { game: any, isOriginal?: boolean }) => {
    const { getGamePlayers } = usePlayerCount();
    const livePlayerCount = getGamePlayers(game.id);

    if (isOriginal) {
        return (
            <Link
                to={game.status === 'active' ? game.link : '#'}
                className={cn(
                    "group relative flex-shrink-0 w-[140px] md:w-[180px] rounded-xl md:rounded-2xl overflow-hidden transition-all duration-300 flex flex-col",
                    game.status === 'active' ? "hover:-translate-y-2 hover:shadow-2xl cursor-pointer" : "cursor-not-allowed opacity-80"
                )}
            >
                {/* Main Image/Game Area */}
                <div className="relative h-[180px] md:h-[240px] overflow-hidden">
                    {/* Background Gradient */}
                    <div className={cn(
                        "absolute inset-0 bg-gradient-to-br transition-transform duration-500 group-hover:scale-110",
                        game.bgGradient
                    )} />

                    {/* Overlay Pattern */}
                    <div className="absolute inset-0 opacity-10" style={{
                        backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 80%, white 1px, transparent 1px)',
                        backgroundSize: '50px 50px'
                    }} />

                    {/* Content Container */}
                    <div className="absolute inset-0 p-5 flex flex-col justify-between">

                        {/* Top Section: Name & Badge (Only if no image) */}
                        {!game.image && (
                            <div className="z-10 space-y-2">
                                <h3 className="text-white font-black text-2xl tracking-tight uppercase drop-shadow-lg">
                                    {game.name}
                                </h3>
                                <div className="inline-block">
                                    <div className="text-[9px] font-bold text-white/70 tracking-wider uppercase bg-black/20 px-2 py-0.5 rounded-full backdrop-blur-sm">
                                        Shiny Originals
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Middle Section: Image or Icon */}
                        <div className="absolute inset-0 flex items-center justify-center z-0">
                            {game.image ? (
                                <img
                                    src={game.image}
                                    alt={game.name}
                                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                            ) : (
                                <span className="text-[80px] md:text-[120px] filter drop-shadow-2xl transform group-hover:scale-110 transition-transform duration-300 opacity-90">
                                    {game.icon}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Coming Soon Overlay */}
                    {game.status === 'coming_soon' && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex flex-col items-center justify-center z-20">
                            <div className="w-10 h-10 text-white/50 mb-3">🔒</div>
                            <span className="text-white font-bold text-sm uppercase tracking-wider border border-white/20 px-4 py-1.5 rounded-full bg-black/40">
                                Coming Soon
                            </span>
                        </div>
                    )}

                    {/* Hover Shine Effect */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                    {/* Border Glow on Hover */}
                    <div className="absolute inset-0 rounded-t-2xl border-2 border-white/0 group-hover:border-white/30 transition-all duration-300" />
                </div>

                {/* Bottom Section: Player Count (Below Image) */}
                <div className={cn(
                    "px-3 py-2.5 flex items-center justify-center gap-1.5 text-xs font-medium transition-colors",
                    game.image ? "bg-[#1a2c38] border-t border-[#213743]" : "bg-black/20 backdrop-blur-sm"
                )}>
                    {game.status === 'active' ? (
                        <>
                            <div className="w-1.5 h-1.5 rounded-full bg-[#00e701] shadow-[0_0_6px_#00e701] animate-pulse" />
                            <span className="font-bold text-white">{livePlayerCount.toLocaleString()}</span>
                            <span className="text-white/70">playing</span>
                        </>
                    ) : (
                        <>
                            <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
                            <span className="font-bold text-white/60">Coming Soon</span>
                        </>
                    )}
                </div>
            </Link>
        );
    }

    // Standard Card for Trending Games (External Images)
    return (
        <Link to={game.link} className="group relative flex-shrink-0 w-[160px] md:w-[180px] cursor-pointer">
            <div className={cn(
                "relative aspect-[3/4] rounded-xl overflow-hidden transition-transform duration-300 group-hover:-translate-y-1.5",
                "shadow-lg group-hover:shadow-2xl group-hover:shadow-[#00e701]/20",
                "bg-[#1a2c38]"
            )}>
                {/* Image */}
                <img
                    src={game.image}
                    alt={game.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    onError={(e) => {
                        e.currentTarget.src = `https://placehold.co/280x400/1a2c38/FFF?text=${game.name}`;
                    }}
                />

                {/* Overlay */}
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />

                {/* Play Button Overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/40 backdrop-blur-[1px]">
                    <div className="bg-[#00e701] text-black rounded-full p-3 transform scale-50 group-hover:scale-100 transition-transform duration-300 shadow-[0_0_20px_#00e701]">
                        <PlayCircle className="w-8 h-8 fill-black" />
                    </div>
                </div>
            </div>
        </Link>
    );
};
