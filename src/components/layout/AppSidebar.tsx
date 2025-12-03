import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUI } from '@/context/UIContext';
import { useAuth } from '@/context/AuthContext';
import { 
  Gift, 
  Users, 
  Crown, 
  Newspaper, 
  MessageSquare, 
  Shield, 
  Headphones, 
  Globe, 
  ChevronDown,
  Dices,
  Bomb,
  Coins,
  Trophy,
  ShieldCheck
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  onLinkClick?: () => void;
}

export function AppSidebar({ className, onLinkClick }: SidebarProps) {
  const location = useLocation();
  const { isSidebarCollapsed } = useUI();
  const { profile, user } = useAuth();
  const isActive = (path: string) => location.pathname === path;
  
  // Check for admin role OR specific email
  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin' || user?.email === 'shinybetting@gmail.com';

  // Helper for rendering nav items with tooltip support when collapsed
  const NavItem = ({ to, icon: Icon, label, badge, color }: { to: string; icon: any; label: string; badge?: string; color?: string }) => {
    const active = isActive(to);
    
    const content = (
      <Link to={to} onClick={onLinkClick} className="w-full block mb-1">
        <Button
          variant="ghost"
          className={cn(
            "w-full h-11 font-semibold transition-all duration-200",
            isSidebarCollapsed ? "justify-center px-0" : "justify-start px-4 gap-3",
            active 
              ? "bg-[#213743] text-white" 
              : "text-[#b1bad3] hover:text-white hover:bg-[#213743]"
          )}
        >
          <Icon className={cn("h-4 w-4 shrink-0", color)} />
          {!isSidebarCollapsed && (
            <>
              <span className="flex-1 text-left truncate">{label}</span>
              {badge && (
                <span className="bg-[#1475e1] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm">
                  {badge}
                </span>
              )}
            </>
          )}
        </Button>
      </Link>
    );

    if (isSidebarCollapsed) {
      return (
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>{content}</TooltipTrigger>
            <TooltipContent side="right" className="bg-[#0f212e] border-[#2f4553] text-white font-bold ml-2">
              {label}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return content;
  };

  return (
    <div className={cn("flex flex-col h-full bg-[#0f212e] w-full py-2 transition-all duration-300", className)}>
      <ScrollArea className="flex-1 px-2">
        <div className="space-y-6 pb-8">
          
          {/* 1. Main Menu */}
          <div className="space-y-0.5 mt-2">
             
             {/* Admin Link (Only for Admins) */}
             {isAdmin && (
               <>
                 <NavItem to="/admin" icon={ShieldCheck} label="Admin Panel" color="text-[#F7D979]" />
                 {!isSidebarCollapsed && <div className="my-2 border-t border-[#1a2c38]" />}
               </>
             )}

             {/* Games Section (First as requested) */}
             {!isSidebarCollapsed && (
               <div className="px-4 py-2 text-xs font-bold text-[#b1bad3] uppercase tracking-wider mt-2">
                 Casino
               </div>
             )}
             <NavItem to="/game/dice" icon={Dices} label="Dice" />
             <NavItem to="/game/mines" icon={Bomb} label="Mines" />
             <NavItem to="/game/coinflip" icon={Coins} label="CoinFlip" />
             <NavItem to="/sports" icon={Trophy} label="Sports" />

             {!isSidebarCollapsed && <div className="my-4 border-t border-[#1a2c38]" />}

             {/* VIP & Promotions (Second) */}
             <NavItem to="/vip-club" icon={Crown} label="VIP Club" />
             <NavItem to="/promotions" icon={Gift} label="Promotions" />

             {!isSidebarCollapsed && <div className="my-4 border-t border-[#1a2c38]" />}

             {/* More Section (Third) */}
             <NavItem to="/affiliate" icon={Users} label="Affiliate" />
             <NavItem to="/blog" icon={Newspaper} label="Blog" />
             <NavItem to="/forum" icon={MessageSquare} label="Forum" />
          </div>

          {/* 2. Bottom Section (Sponsorships & Support) */}
          <div className={cn("pt-4", !isSidebarCollapsed && "border-t border-[#1a2c38] mt-4")}>
             
             {/* Sponsorships Dropdown */}
             {!isSidebarCollapsed ? (
               <Accordion type="single" collapsible className="w-full mb-1">
                  <AccordionItem value="sponsorships" className="border-none">
                     <AccordionTrigger className="px-4 py-2 text-[#b1bad3] hover:text-white hover:no-underline text-sm font-semibold h-11 rounded-md hover:bg-[#213743]">
                        <div className="flex items-center gap-3">
                           <Shield className="h-4 w-4" />
                           Sponsorships
                        </div>
                     </AccordionTrigger>
                     <AccordionContent className="px-4 pb-2 text-[#b1bad3] text-sm">
                        <div className="pl-10 space-y-2 pt-2">
                           <div className="hover:text-white cursor-pointer transition-colors">UFC</div>
                           <div className="hover:text-white cursor-pointer transition-colors">Everton FC</div>
                           <div className="hover:text-white cursor-pointer transition-colors">Alfa Romeo F1</div>
                        </div>
                     </AccordionContent>
                  </AccordionItem>
               </Accordion>
             ) : (
               <NavItem to="#" icon={Shield} label="Sponsorships" />
             )}

             <div className="space-y-0.5">
                <NavItem to="/responsible-gambling" icon={Shield} label="Responsible Gambling" />
                <NavItem to="/help" icon={Headphones} label="Live Support" />
             </div>
             
             {/* Language Selector */}
             {!isSidebarCollapsed && (
               <div className="px-2 py-4">
                  <Button variant="ghost" className="w-full justify-between text-[#b1bad3] hover:text-white hover:bg-[#213743] border border-[#2f4553] bg-[#0f212e]">
                     <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        <span>English</span>
                     </div>
                     <ChevronDown className="h-4 w-4" />
                  </Button>
               </div>
             )}
          </div>

        </div>
      </ScrollArea>
    </div>
  );
}
