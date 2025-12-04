import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Dices, Sparkles, Trophy, Gamepad2, Users, Star } from 'lucide-react';

interface CategoryTabsProps {
    onCategoryChange?: (category: string) => void;
    className?: string;
}

const CATEGORIES = [
    { id: 'lobby', label: 'Lobby', icon: Dices },
    { id: 'new', label: 'New Releases', icon: Sparkles },
    { id: 'originals', label: 'Shiny Originals', icon: Star },
    { id: 'slots', label: 'Slots', icon: Trophy },
    { id: 'live', label: 'Live Casino', icon: Users },
    { id: 'exclusive', label: 'Only on Shiny', icon: Gamepad2 },
];

export default function CategoryTabs({ onCategoryChange, className }: CategoryTabsProps) {
    const [activeCategory, setActiveCategory] = useState('originals');

    const handleCategoryClick = (categoryId: string) => {
        setActiveCategory(categoryId);
        onCategoryChange?.(categoryId);
    };

    return (
        <div className={cn("flex gap-2 overflow-x-auto scrollbar-hide pb-2", className)}>
            {CATEGORIES.map((category) => {
                const Icon = category.icon;
                const isActive = activeCategory === category.id;

                return (
                    <button
                        key={category.id}
                        onClick={() => handleCategoryClick(category.id)}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm whitespace-nowrap transition-all",
                            isActive
                                ? "bg-[#2f4553] text-white shadow-lg"
                                : "bg-[#1a2c38] text-[#b1bad3] hover:bg-[#213743] hover:text-white"
                        )}
                    >
                        <Icon className="w-4 h-4" />
                        {category.label}
                    </button>
                );
            })}
        </div>
    );
}
