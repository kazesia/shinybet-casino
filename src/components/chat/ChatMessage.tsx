import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

export interface ChatMessageProps {
    id: string;
    username: string;
    message: string;
    country: string;
    created_at: string;
    isOwnMessage?: boolean;
}

export function ChatMessage({ username, message, country, created_at, isOwnMessage }: ChatMessageProps) {
    // Simple mention highlighting
    const renderMessage = (text: string) => {
        const parts = text.split(/(@\w+)/g);
        return parts.map((part, i) => {
            if (part.startsWith('@')) {
                return (
                    <span key={i} className="text-[#F7D979] font-bold bg-[#F7D979]/10 px-1 rounded">
                        {part}
                    </span>
                );
            }
            return part;
        });
    };

    return (
        <div className={cn(
            "group flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200",
            isOwnMessage && "bg-[#1a2c38]/30 -mx-4 px-4 py-1"
        )}>
            <Avatar className="w-8 h-8 border border-[#2f4553] mt-0.5 shrink-0">
                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`} />
                <AvatarFallback className="bg-[#213743] text-[10px]">{username.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm">{country}</span>
                    <span className={cn(
                        "text-xs font-bold truncate cursor-pointer hover:underline",
                        isOwnMessage ? "text-[#1475e1]" : "text-white"
                    )}>
                        {username}
                    </span>
                    <span className="text-[10px] text-[#b1bad3]/50 ml-auto">
                        {format(new Date(created_at), 'HH:mm')}
                    </span>
                </div>
                <div className="bg-[#1a2c38] px-3 py-2 rounded-r-lg rounded-bl-lg text-sm text-[#b1bad3] break-words leading-relaxed group-hover:bg-[#213743] transition-colors">
                    {renderMessage(message)}
                </div>
            </div>
        </div>
    );
}
