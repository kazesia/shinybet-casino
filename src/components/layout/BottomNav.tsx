import { Home, Gamepad2, Wallet, Gift, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Gamepad2, label: 'Games', path: '/dice' },
    { icon: Wallet, label: 'Wallet', path: '/wallet' },
    { icon: Gift, label: 'Promos', path: '/promotions' },
    { icon: User, label: 'Profile', path: '/dashboard' },
];

export function BottomNav() {
    const location = useLocation();

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0f212e] border-t border-[#2f4553] safe-area-pb md:hidden">
            <div className="flex items-center justify-around h-16">
                {NAV_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path ||
                        (item.path !== '/' && location.pathname.startsWith(item.path));

                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={cn(
                                "flex flex-col items-center justify-center flex-1 h-full tap-target transition-colors",
                                isActive
                                    ? "text-[#1475e1]"
                                    : "text-[#b1bad3] active:text-white"
                            )}
                        >
                            <Icon className={cn(
                                "w-6 h-6 mb-1 transition-transform",
                                isActive && "scale-110"
                            )} />
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
