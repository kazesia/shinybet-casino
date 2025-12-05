import { X, Home, Gamepad2, HelpCircle, Wallet, Trophy, Users, Gift, BarChart2, FileText, Settings, Headset, Shield, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useUI } from '@/context/UIContext';
import { cn } from '@/lib/utils';

interface MobileNavProps {
    isOpen: boolean;
    onClose: () => void;
}

const MENU_SECTIONS = [
    {
        title: 'Main',
        items: [
            { icon: Home, label: 'Home', link: '/' },
            { icon: Gamepad2, label: 'Games', link: '/dashboard' },
            { icon: Gift, label: 'Promotions', link: '/promotions' },
            { icon: Trophy, label: 'VIP Club', link: '/vip-club' },
            { icon: Users, label: 'Affiliate', link: '/affiliate' },
            { icon: HelpCircle, label: 'Help', link: '/help' },
        ],
    },
    {
        title: 'Account',
        items: [
            { icon: BarChart2, label: 'Statistics', action: 'stats' },
            { icon: FileText, label: 'Transactions', link: '/transactions' },
            { icon: Settings, label: 'Settings', link: '/settings' },
        ],
    },
    {
        title: 'Support',
        items: [
            { icon: Headset, label: 'Help Center', link: '/help' },
            { icon: Shield, label: 'Responsible Gaming', link: '/responsible-gambling' },
        ],
    },
];

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
    const { user } = useAuth();
    const { openStatsModal } = useUI();

    const handleItemClick = (item: any) => {
        if (item.action === 'stats') {
            openStatsModal();
        }
        onClose();
    };

    const handleSignOut = async () => {
        const { supabase } = await import('@/lib/supabase');
        await supabase.auth.signOut();
        onClose();
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className={cn(
                    "fixed inset-0 bg-black/60 z-50 transition-opacity md:hidden",
                    isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={onClose}
            />

            {/* Slide-in Menu */}
            <div
                className={cn(
                    "fixed top-0 left-0 bottom-0 w-[280px] bg-[#0f212e] z-50 transition-transform duration-300 md:hidden safe-area-inset",
                    isOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-[#2f4553]">
                    <div className="flex items-center gap-2">
                        <img
                            src="https://media.discordapp.net/attachments/1446113430150054081/1446113527676010557/Collabeco_2_-removebg-preview.png?ex=6932cdac&is=69317c2c&hm=38303892f78abdbe443b156f1d743bf3b5e6e24eed548173ae79df6013bc646c&=&format=webp&quality=lossless&width=750&height=750"
                            alt="Shiny"
                            className="h-8 w-auto"
                        />
                        <span className="text-white font-bold text-lg">Shiny</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="tap-target flex items-center justify-center text-[#b1bad3] hover:text-white transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* User Info */}
                {user && (
                    <div className="p-4 border-b border-[#2f4553]">
                        <div className="text-white font-bold text-sm mb-1">
                            {user.email?.split('@')[0]}
                        </div>
                        <div className="text-[#b1bad3] text-xs">
                            {user.email}
                        </div>
                    </div>
                )}

                {/* Menu Items */}
                <div className="overflow-y-auto h-[calc(100vh-180px)] safe-area-pb">
                    {MENU_SECTIONS.map((section, sectionIndex) => (
                        <div key={sectionIndex} className="py-2">
                            <div className="px-4 py-2 text-[#b1bad3] text-xs font-bold uppercase tracking-wider">
                                {section.title}
                            </div>
                            {section.items.map((item, itemIndex) => {
                                const Icon = item.icon;
                                const content = (
                                    <>
                                        <Icon className="w-5 h-5 text-[#b1bad3] group-hover:text-white transition-colors" />
                                        <span className="text-[#b1bad3] group-hover:text-white transition-colors font-medium">
                                            {item.label}
                                        </span>
                                    </>
                                );

                                if (item.link) {
                                    return (
                                        <Link
                                            key={itemIndex}
                                            to={item.link}
                                            onClick={onClose}
                                            className="flex items-center gap-3 px-4 py-3 tap-target hover:bg-[#213743] transition-colors group"
                                        >
                                            {content}
                                        </Link>
                                    );
                                }

                                return (
                                    <button
                                        key={itemIndex}
                                        onClick={() => handleItemClick(item)}
                                        className="flex items-center gap-3 px-4 py-3 w-full tap-target hover:bg-[#213743] transition-colors group"
                                    >
                                        {content}
                                    </button>
                                );
                            })}
                        </div>
                    ))}

                    {/* Logout */}
                    {user && (
                        <div className="py-2 border-t border-[#2f4553] mt-2">
                            <button
                                onClick={handleSignOut}
                                className="flex items-center gap-3 px-4 py-3 w-full tap-target hover:bg-[#213743] transition-colors group"
                            >
                                <LogOut className="w-5 h-5 text-[#b1bad3] group-hover:text-white transition-colors" />
                                <span className="text-[#b1bad3] group-hover:text-white transition-colors font-medium">
                                    Logout
                                </span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
