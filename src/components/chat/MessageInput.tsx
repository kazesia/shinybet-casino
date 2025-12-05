import { useState, useRef } from 'react';
import { Send, Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface MessageInputProps {
    onSendMessage: (message: string) => void;
    isLoading?: boolean;
    disabled?: boolean;
}

const COMMON_EMOJIS = ['😀', '😂', '❤️', '🔥', '👍', '🎉', '💯', '🚀', '💰', '🎰', '🎲', '⭐', '💎', '🏆', '🤑', '😎'];

export function MessageInput({ onSendMessage, isLoading, disabled }: MessageInputProps) {
    const [message, setMessage] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim() || isLoading || disabled) return;

        onSendMessage(message);
        setMessage('');
    };

    const handleEmojiClick = (emoji: string) => {
        setMessage((prev) => {
            const newValue = prev + emoji;
            if (newValue.length > 160) return prev;
            return newValue;
        });
        inputRef.current?.focus();
    };

    return (
        <div className="p-4 bg-[#1a2c38] border-t border-[#2f4553]">
            <form onSubmit={handleSubmit} className="relative">
                <Input
                    ref={inputRef}
                    value={message}
                    onChange={(e) => {
                        if (e.target.value.length <= 160) {
                            setMessage(e.target.value);
                        }
                    }}
                    placeholder={disabled ? "Please login to chat" : "Type a message..."}
                    disabled={disabled || isLoading}
                    className="bg-[#0f212e] border-[#2f4553] text-white pr-12 h-11 focus-visible:ring-[#1475e1]"
                />
                <div className="absolute right-1 top-1 flex items-center h-9 gap-1">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-[#b1bad3] hover:text-white hover:bg-[#213743] rounded-md transition-all"
                                disabled={disabled}
                            >
                                <Smile className="w-4 h-4" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent
                            side="top"
                            align="end"
                            className="w-64 p-2 bg-[#213743] border-[#2f4553]"
                        >
                            <div className="grid grid-cols-8 gap-1">
                                {COMMON_EMOJIS.map((emoji, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => handleEmojiClick(emoji)}
                                        className="text-2xl hover:bg-[#2f4553] rounded p-1 transition-colors"
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        </PopoverContent>
                    </Popover>

                    <Button
                        type="submit"
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-[#1475e1] hover:text-white hover:bg-[#1475e1] rounded-md transition-all"
                        disabled={!message.trim() || isLoading || disabled}
                    >
                        <Send className="w-4 h-4" />
                    </Button>
                </div>
            </form>

            <div className="flex justify-between items-center mt-2 px-1">
                <div className="flex gap-2">
                    <span className="text-[10px] text-[#b1bad3] cursor-pointer hover:text-white">Rules</span>
                </div>
                <span className={`text-[10px] ${message.length >= 160 ? 'text-red-500' : 'text-[#b1bad3]'}`}>
                    {message.length}/160
                </span>
            </div>
        </div>
    );
}
