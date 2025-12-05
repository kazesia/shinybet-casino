import { useState } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationItem } from './NotificationItem';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function NotificationDropdown() {
    const { notifications, loading, markAsRead, markAllAsRead } = useNotifications();
    const [activeTab, setActiveTab] = useState('all');
    const navigate = useNavigate();

    const filteredNotifications = notifications.filter(n => {
        if (activeTab === 'all') return true;
        if (activeTab === 'unread') return !n.read;
        if (activeTab === 'promo') return n.type === 'promo';
        if (activeTab === 'system') return n.type === 'system';
        return true;
    });

    const handleNotificationClick = (notification: typeof notifications[0]) => {
        if (notification.link) {
            navigate(notification.link);
        }
    };

    return (
        <div className="w-[400px] max-w-[calc(100vw-2rem)] bg-[#0f212e] border border-[#2f4553] rounded-lg shadow-2xl">
            {/* Header */}
            <div className="p-4 border-b border-[#2f4553] flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-white" />
                    <h3 className="text-white font-bold text-lg">Notifications</h3>
                </div>
                {notifications.some(n => !n.read) && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={markAllAsRead}
                        className="text-[#1475e1] hover:text-[#1475e1]/80 hover:bg-[#1a2c38] text-xs"
                    >
                        Mark all read
                    </Button>
                )}
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="px-4 pt-3 pb-2 border-b border-[#2f4553]">
                    <TabsList className="w-full bg-[#1a2c38] p-1">
                        <TabsTrigger value="all" className="flex-1 text-xs data-[state=active]:bg-[#2f4553]">
                            All
                        </TabsTrigger>
                        <TabsTrigger value="unread" className="flex-1 text-xs data-[state=active]:bg-[#2f4553]">
                            Unread
                        </TabsTrigger>
                        <TabsTrigger value="promo" className="flex-1 text-xs data-[state=active]:bg-[#2f4553]">
                            Promos
                        </TabsTrigger>
                        <TabsTrigger value="system" className="flex-1 text-xs data-[state=active]:bg-[#2f4553]">
                            System
                        </TabsTrigger>
                    </TabsList>
                </div>

                {/* Content */}
                <TabsContent value={activeTab} className="m-0">
                    <ScrollArea className="h-[400px]">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-6 h-6 text-[#b1bad3] animate-spin" />
                            </div>
                        ) : filteredNotifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                                <div className="w-16 h-16 rounded-full bg-[#1a2c38] flex items-center justify-center mb-4">
                                    <Bell className="w-8 h-8 text-[#b1bad3]/30" />
                                </div>
                                <h4 className="text-white font-medium mb-1">No Notifications Available</h4>
                                <p className="text-[#b1bad3] text-sm">Your interactions will be visible here</p>
                            </div>
                        ) : (
                            <div>
                                {filteredNotifications.map(notification => (
                                    <NotificationItem
                                        key={notification.id}
                                        notification={notification}
                                        onMarkAsRead={markAsRead}
                                        onClick={() => handleNotificationClick(notification)}
                                    />
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </TabsContent>
            </Tabs>
        </div>
    );
}
