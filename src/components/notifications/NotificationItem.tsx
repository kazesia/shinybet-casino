import { Notification } from '@/types/notification';
import { cn } from '@/lib/utils';
import { Bell, AlertTriangle, Gift, Info } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface NotificationItemProps {
    notification: Notification;
    onMarkAsRead: (id: string) => void;
    onClick?: () => void;
}

const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
        case 'warning':
            return <AlertTriangle className="w-4 h-4 text-orange-500" />;
        case 'promo':
            return <Gift className="w-4 h-4 text-purple-500" />;
        case 'system':
            return <Bell className="w-4 h-4 text-blue-500" />;
        default:
            return <Info className="w-4 h-4 text-[#1475e1]" />;
    }
};

export function NotificationItem({ notification, onMarkAsRead, onClick }: NotificationItemProps) {
    const handleClick = () => {
        if (!notification.read) {
            onMarkAsRead(notification.id);
        }
        onClick?.();
    };

    return (
        <div
            onClick={handleClick}
            className={cn(
                "p-4 border-b border-[#2f4553] hover:bg-[#1a2c38] transition-colors cursor-pointer",
                !notification.read && "bg-[#0f212e]"
            )}
        >
            <div className="flex items-start gap-3">
                <div className="mt-1">{getNotificationIcon(notification.type)}</div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <h4 className={cn(
                            "text-sm font-medium",
                            notification.read ? "text-[#b1bad3]" : "text-white"
                        )}>
                            {notification.title}
                        </h4>
                        {!notification.read && (
                            <div className="w-2 h-2 rounded-full bg-[#1475e1] shrink-0 mt-1" />
                        )}
                    </div>
                    <p className="text-xs text-[#b1bad3] mt-1 line-clamp-2">
                        {notification.message}
                    </p>
                    <p className="text-xs text-[#b1bad3]/60 mt-2">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    </p>
                </div>
            </div>
        </div>
    );
}
