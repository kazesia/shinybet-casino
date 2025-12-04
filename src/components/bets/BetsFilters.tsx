import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';

interface BetsFiltersProps {
    gameFilter: string;
    setGameFilter: (value: string) => void;
    searchQuery: string;
    setSearchQuery: (value: string) => void;
    timeFilter: string;
    setTimeFilter: (value: string) => void;
}

export function BetsFilters({
    gameFilter,
    setGameFilter,
    searchQuery,
    setSearchQuery,
    timeFilter,
    setTimeFilter
}: BetsFiltersProps) {
    return (
        <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#b1bad3]" />
                <Input
                    type="text"
                    placeholder="Search by bet ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-[#1a2c38] border-[#2f4553] text-white placeholder:text-[#b1bad3]"
                />
            </div>

            {/* Game Filter */}
            <Select value={gameFilter} onValueChange={setGameFilter}>
                <SelectTrigger className="w-40 bg-[#1a2c38] border-[#2f4553] text-white">
                    <SelectValue placeholder="All Games" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a2c38] border-[#2f4553]">
                    <SelectItem value="all">All Games</SelectItem>
                    <SelectItem value="Dice">Dice</SelectItem>
                    <SelectItem value="Plinko">Plinko</SelectItem>
                    <SelectItem value="Mines">Mines</SelectItem>
                    <SelectItem value="Crash">Crash</SelectItem>
                    <SelectItem value="Blackjack">Blackjack</SelectItem>
                    <SelectItem value="CoinFlip">Coin Flip</SelectItem>
                </SelectContent>
            </Select>

            {/* Time Filter */}
            <Select value={timeFilter} onValueChange={setTimeFilter}>
                <SelectTrigger className="w-40 bg-[#1a2c38] border-[#2f4553] text-white">
                    <SelectValue placeholder="All Time" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a2c38] border-[#2f4553]">
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="1h">Last Hour</SelectItem>
                    <SelectItem value="24h">Last 24 Hours</SelectItem>
                    <SelectItem value="7d">Last 7 Days</SelectItem>
                </SelectContent>
            </Select>
        </div>
    );
}
