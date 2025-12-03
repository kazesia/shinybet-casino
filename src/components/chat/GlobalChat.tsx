import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAuth } from '@/context/AuthContext';
import { useUI } from '@/context/UIContext';
import { Send, X, Users, MessageSquare, ChevronDown, Smile, Shield, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

// Mock Messages for Initial State
const MOCK_MESSAGES = [
  { id: '1', user: 'CryptoKing', role: 'vip', message: 'Anyone playing Dice right now?', time: new Date(Date.now() - 1000 * 60 * 5).toISOString() },
  { id: '2', user: 'Admin', role: 'admin', message: 'Welcome to Shiny.bet! Check out our new promotions.', time: new Date(Date.now() - 1000 * 60 * 4).toISOString() },
  { id: '3', user: 'LuckyLuke', role: 'user', message: 'Just hit a 100x on Plinko! 🚀', time: new Date(Date.now() - 1000 * 60 * 2).toISOString() },
];

const CHANNELS = [
  { id: 'en', label: 'English', flag: '🇺🇸' },
  { id: 'sports', label: 'Sports', flag: '⚽' },
  { id: 'trading', label: 'Trading', flag: '📈' },
  { id: 'vip', label: 'VIP Lounge', flag: '👑' },
];

export default function GlobalChat() {
  const { user, profile } = useAuth();
  const { toggleChat, openAuthModal } = useUI();
  const [messages, setMessages] = useState(MOCK_MESSAGES);
  const [newMessage, setNewMessage] = useState('');
  const [activeChannel, setActiveChannel] = useState(CHANNELS[0]);
  const [onlineCount, setOnlineCount] = useState(1420);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  // Fake incoming messages
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        const randomUser = ['Whale_01', 'Satoshi_Fan', 'MoonBoy', 'HODLer', 'BetMaster'][Math.floor(Math.random() * 5)];
        const randomMsg = ['Good luck everyone!', 'LTC pumping!', 'Rigged? jk', 'Nice win!', 'Who wants to race?'][Math.floor(Math.random() * 5)];
        
        const msg = {
          id: Date.now().toString(),
          user: randomUser,
          role: Math.random() > 0.8 ? 'vip' : 'user',
          message: randomMsg,
          time: new Date().toISOString()
        };
        
        setMessages(prev => [...prev.slice(-49), msg]); // Keep last 50
      }
      // Fluctuating online count
      setOnlineCount(prev => prev + Math.floor(Math.random() * 5) - 2);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMessage.trim()) return;
    if (!user) {
      openAuthModal('login');
      return;
    }

    const msg = {
      id: Date.now().toString(),
      user: profile?.username || 'Me',
      role: profile?.role || 'user',
      message: newMessage,
      time: new Date().toISOString()
    };

    setMessages(prev => [...prev, msg]);
    setNewMessage('');
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'super_admin':
      case 'admin':
        return <Shield className="w-3 h-3 text-green-500 fill-green-500/20" />;
      case 'vip':
        return <Crown className="w-3 h-3 text-[#F7D979] fill-[#F7D979]/20" />;
      default:
        return null;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin':
      case 'admin':
        return 'text-green-500';
      case 'vip':
        return 'text-[#F7D979]';
      default:
        return 'text-white';
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0f212e] border-l border-[#1a2c38] w-full">
      
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-[#1a2c38] bg-[#1a2c38]">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" className="h-9 px-2 text-sm font-bold text-white hover:bg-[#213743] gap-2">
              <span>{activeChannel.flag}</span>
              <span>{activeChannel.label}</span>
              <ChevronDown className="w-3 h-3 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-1 bg-[#213743] border-[#2f4553] text-white" align="start">
            {CHANNELS.map(channel => (
              <div 
                key={channel.id}
                onClick={() => setActiveChannel(channel)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded cursor-pointer text-sm font-medium transition-colors",
                  activeChannel.id === channel.id ? "bg-[#0f212e] text-white" : "text-[#b1bad3] hover:bg-[#0f212e]/50 hover:text-white"
                )}
              >
                <span>{channel.flag}</span>
                {channel.label}
              </div>
            ))}
          </PopoverContent>
        </Popover>

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
        <div className="space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className="group flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <Avatar className="w-8 h-8 border border-[#2f4553] mt-0.5 shrink-0">
                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.user}`} />
                <AvatarFallback className="bg-[#213743] text-[10px]">{msg.user.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  {getRoleBadge(msg.role)}
                  <span className={cn("text-xs font-bold truncate cursor-pointer hover:underline", getRoleColor(msg.role))}>
                    {msg.user}
                  </span>
                  <span className="text-[10px] text-[#b1bad3]/50 ml-auto">
                    {format(new Date(msg.time), 'HH:mm')}
                  </span>
                </div>
                <div className="bg-[#1a2c38] px-3 py-2 rounded-r-lg rounded-bl-lg text-sm text-[#b1bad3] break-words leading-relaxed group-hover:bg-[#213743] transition-colors">
                  {msg.message}
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 bg-[#1a2c38] border-t border-[#2f4553]">
        {user ? (
          <form onSubmit={handleSendMessage} className="relative">
            <Input 
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..." 
              className="bg-[#0f212e] border-[#2f4553] text-white pr-12 h-11 focus-visible:ring-[#1475e1]"
            />
            <div className="absolute right-1 top-1 flex items-center h-9">
              <Button 
                type="submit" 
                size="icon" 
                variant="ghost" 
                className="h-8 w-8 text-[#1475e1] hover:text-white hover:bg-[#1475e1] rounded-md transition-all"
                disabled={!newMessage.trim()}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </form>
        ) : (
          <Button 
            onClick={() => openAuthModal('login')} 
            className="w-full bg-[#2f4553] hover:bg-[#3d5565] text-white font-bold"
          >
            Login to Chat
          </Button>
        )}
        
        <div className="flex justify-between items-center mt-2 px-1">
           <div className="flex gap-2">
              <Smile className="w-4 h-4 text-[#b1bad3] hover:text-white cursor-pointer transition-colors" />
              <span className="text-[10px] text-[#b1bad3] cursor-pointer hover:text-white">Rules</span>
           </div>
           <span className="text-[10px] text-[#b1bad3]">{newMessage.length}/200</span>
        </div>
      </div>

    </div>
  );
}
