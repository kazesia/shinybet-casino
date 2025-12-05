import { useNotifications } from '@/hooks/useNotifications';
import { NotificationDropdown } from './NotificationDropdown';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

export function NotificationBell() {
    const { unreadCount } = useNotifications();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="relative p-2 hover:bg-[#2f4553] rounded-lg transition-colors">
                    <Bell className="w-5 h-5 text-white" fill="white" stroke="none" />
                    {unreadCount > 0 && (
                        <span className={cn(
                            "absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center",
                            "bg-red-500 text-white text-[10px] font-bold rounded-full px-1"
                        )}>
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="p-0 border-none bg-transparent shadow-none">
                <NotificationDropdown />
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
