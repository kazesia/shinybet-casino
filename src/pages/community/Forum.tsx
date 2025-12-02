import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';

export default function Forum() {
  return (
    <div className="container py-24 text-center space-y-6">
      <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mx-auto border border-white/10">
        <MessageSquare className="w-10 h-10 text-[#F7D979]" />
      </div>
      <h1 className="text-4xl font-bold">Community Forum</h1>
      <p className="text-muted-foreground max-w-lg mx-auto">
        Our dedicated forum is currently under construction. In the meantime, join our Discord server to chat with other players and staff.
      </p>
      <Button size="lg" className="bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold">
        Join Discord
      </Button>
    </div>
  );
}
