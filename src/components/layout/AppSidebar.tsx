import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Gamepad2, 
  Trophy, 
  Users, 
  FileText, 
  MessageSquare, 
  Dices,
  Gift,
  MonitorPlay,
  Newspaper,
  Headphones,
  Globe
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  onLinkClick?: () => void;
}

export function AppSidebar({ className, onLinkClick }: SidebarProps) {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  const NavItem = ({ to, icon: Icon, label }: { to: string; icon: any; label: string }) => {
    const active = isActive(to);
    
    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link to={to} onClick={onLinkClick} className="w-full flex justify-center">
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-10 w-10 rounded-lg transition-all duration-200",
                  active 
                    ? "bg-[#213743] text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]" 
                    : "text-[#b1bad3] hover:text-white hover:bg-[#213743]"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="sr-only">{label}</span>
              </Button>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right" className="bg-black text-white border-0 font-semibold">
            <p>{label}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <div className={cn("flex flex-col h-full bg-[#0f212e] border-r border-[#1a2c38] w-[60px] items-center py-4 gap-4", className)}>
      
      <div className="space-y-2 w-full flex flex-col items-center">
        <NavItem to="/game/dice" icon={Dices} label="Casino" />
        <NavItem to="/sports" icon={Trophy} label="Sports" />
      </div>

      <div className="w-8 h-[1px] bg-[#1a2c38]" />

      <ScrollArea className="flex-1 w-full">
        <div className="flex flex-col items-center gap-2 px-2">
          <NavItem to="/promotions" icon={Gift} label="Promotions" />
          <NavItem to="/affiliate" icon={Users} label="Affiliate" />
          <NavItem to="/vip-club" icon={MonitorPlay} label="VIP Club" />
          <NavItem to="/blog" icon={Newspaper} label="Blog" />
          <NavItem to="/forum" icon={MessageSquare} label="Forum" />
        </div>
      </ScrollArea>

      <div className="w-8 h-[1px] bg-[#1a2c38]" />

      <div className="space-y-2 w-full flex flex-col items-center pb-4">
        <NavItem to="/help" icon={Headphones} label="Live Support" />
        <NavItem to="/language" icon={Globe} label="Language" />
      </div>
    </div>
  );
}
