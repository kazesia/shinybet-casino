import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface SearchModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const GAMES = [
    { id: 'dice', name: 'Dice', link: '/game/dice', image: '/game-assets/thumbnails/dice_new.png' },
    { id: 'mines', name: 'Mines', link: '/game/mines', image: '/game-assets/thumbnails/mines_new.jpg' },
    { id: 'crash', name: 'Crash', link: '/game/crash', image: '/game-assets/thumbnails/crash_new.jpg' },
    { id: 'plinko', name: 'Plinko', link: '/game/plinko', image: '/game-assets/thumbnails/plinko_new.jpg' },
    { id: 'coinflip', name: 'Flip', link: '/game/coinflip', image: '/game-assets/thumbnails/flip.png' },
    { id: 'blackjack', name: 'Blackjack', link: '/game/blackjack', image: '/game-assets/thumbnails/blackjack_new.jpg' },
];

export function SearchModal({ open, onOpenChange }: SearchModalProps) {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredGames = GAMES.filter(game =>
        game.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-[#1a2c38] border-[#2f4553] text-white max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="text-white">Search Games</DialogTitle>
                </DialogHeader>

                <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#b1bad3]" />
                    <Input
                        type="text"
                        placeholder="Search your game..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-[#0f212e] border-[#2f4553] text-white h-12"
                        autoFocus
                    />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto">
                    {filteredGames.length > 0 ? (
                        filteredGames.map((game) => (
                            <Link
                                key={game.id}
                                to={game.link}
                                onClick={() => onOpenChange(false)}
                                className="group relative rounded-lg overflow-hidden hover:ring-2 hover:ring-[#00e701] transition-all"
                            >
                                <div className="aspect-[3/4] relative">
                                    <img
                                        src={game.image}
                                        alt={game.name}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                    <div className="absolute bottom-2 left-2 text-white font-bold text-sm">
                                        {game.name}
                                    </div>
                                </div>
                            </Link>
                        ))
                    ) : (
                        <div className="col-span-full text-center py-8 text-[#b1bad3]">
                            No games found matching "{searchQuery}"
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
