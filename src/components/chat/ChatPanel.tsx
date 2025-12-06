import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useUI } from '@/context/UIContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { X, Users } from 'lucide-react';
import { ChatMessage, ChatMessageProps } from './ChatMessage';
import { MessageInput } from './MessageInput';
import { CountrySelector } from './CountrySelector';
import { StatisticsModal } from '@/components/profile/StatisticsModal';

export default function ChatPanel() {
    const { user, profile } = useAuth();
    const { toggleChat } = useUI();
    const [messages, setMessages] = useState<ChatMessageProps[]>([]);
    const [onlineCount, setOnlineCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [userCountry, setUserCountry] = useState('🇺🇸'); // Default
    const scrollRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [selectedUsername, setSelectedUsername] = useState<string>('');
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

    const handleUsernameClick = (userId: string, username: string) => {
        setSelectedUserId(userId);
        setSelectedUsername(username);
        setIsProfileModalOpen(true);
    };

    // Fetch initial messages
    useEffect(() => {
        const fetchMessages = async () => {
            const { data, error } = await supabase
                .from('chat_messages')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(100);

            if (error) {
                console.error('Error fetching messages:', error);
            } else if (data) {
                setMessages(data.reverse());
            }
        };

        fetchMessages();
    }, []);

    // Subscribe to realtime updates
    useEffect(() => {
        console.log('🔌 Setting up Supabase Realtime subscription...');

        const channel = supabase.channel('chat-messages', {
            config: {
                broadcast: { self: true }
            }
        })
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'chat_messages'
            }, (payload) => {
                console.log('📨 New message received via Realtime:', payload);
                const newMessage = payload.new as ChatMessageProps;
                setMessages((prev) => {
                    // Avoid duplicates
                    if (prev.some(msg => msg.id === newMessage.id)) {
                        console.log('⚠️ Duplicate message, skipping');
                        return prev;
                    }
                    console.log('✅ Adding new message to state');
                    return [...prev, newMessage];
                });
            })
            .subscribe((status, err) => {
                console.log('📡 Subscription status:', status);
                if (err) {
                    console.error('❌ Subscription error:', err);
                }
                if (status === 'SUBSCRIBED') {
                    console.log('✅ Successfully subscribed to chat_messages');
                }
            });

        // Mock online count for now, or use presence if available
        // For simplicity, we'll just set a static number or random fluctuation
        setOnlineCount(Math.floor(Math.random() * 500) + 1000);

        return () => {
            console.log('🔌 Cleaning up Realtime subscription');
            supabase.removeChannel(channel);
        };
    }, []);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (scrollContainer) {
                scrollContainer.scrollTop = scrollContainer.scrollHeight;
            }
        }
    }, [messages]);

    const handleSendMessage = async (text: string) => {
        if (!user || !profile) return;

        setIsLoading(true);
        try {
            const { error } = await supabase
                .from('chat_messages')
                .insert({
                    user_id: user.id,
                    username: profile.username || 'Anonymous',
                    message: text,
                    country: userCountry
                });

            if (error) throw error;

            // Optimistic update is handled by the realtime subscription
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#0f212e] border-l border-[#1a2c38] w-full">
            {/* Header */}
            <div className="h-16 flex items-center justify-between px-4 border-b border-[#1a2c38] bg-[#1a2c38]">
                <div className="flex items-center gap-2">
                    <CountrySelector value={userCountry} onChange={setUserCountry} />
                    <span className="text-sm font-bold text-white">Global Chat</span>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 bg-[#0f212e] px-2 py-1 rounded text-xs font-bold text-[#b1bad3]">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        {onlineCount.toLocaleString()}
                    </div>
                    <Button variant="ghost" size="icon" onClick={toggleChat} className="h-8 w-8 text-[#b1bad3] hover:text-white hover:bg-[#213743]">
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 px-4 py-4" ref={scrollRef}>
                <div className="space-y-4 pb-4">
                    {messages.map((msg) => (
                        <ChatMessage
                            key={msg.id}
                            {...msg}
                            userId={(msg as any).user_id}
                            isOwnMessage={user?.id === (msg as any).user_id}
                            onUsernameClick={handleUsernameClick}
                        />
                    ))}
                    <div ref={messagesEndRef} />
                </div>
            </ScrollArea>

            {/* Input Area */}
            <MessageInput
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
                disabled={!user}
            />

            {/* User Profile Modal */}
            <StatisticsModal
                externalUserId={selectedUserId}
                externalUsername={selectedUsername}
                isExternalOpen={isProfileModalOpen}
                onExternalClose={() => setIsProfileModalOpen(false)}
            />
        </div>
    );
}
