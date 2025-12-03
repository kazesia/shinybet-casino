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
  Dices,
  Bomb,
  Coins,
  Gamepad2,
  ShieldCheck
} from 'lucide-react';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui/accordion';

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  onLinkClick?: () => void;
}

export function AppSidebar({ className, onLinkClick }: SidebarProps) {
  const location = useLocation();
  const { isSidebarCollapsed } = useUI();
  const { profile } = useAuth();
  
  const isSports = location.pathname.includes('/sports');
  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin';

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className={cn("flex flex-col h-full bg-[#0f212e] text-[#b1bad3] pt-4", className)}>
      
      <ScrollArea className="flex-1 px-4 pb-4">
        {/* Main Navigation Card */}
        <div className={cn(
          "bg-[#1a2c38] rounded-xl overflow-hidden transition-all duration-300",
          isSidebarCollapsed ? "bg-transparent" : "p-2"
        )}>
          
          {/* Admin Section */}
          {isAdmin && (
            <div className="mb-2">
              <Link to="/admin" onClick={onLinkClick}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-3 font-semibold text-[#F7D979] hover:text-[#F7D979] hover:bg-[#F7D979]/10",
                    isSidebarCollapsed && "justify-center px-0"
                  )}
                >
                  <ShieldCheck className="h-4 w-4" />
                  {!isSidebarCollapsed && "Admin Panel"}
                </Button>
              </Link>
            </div>
          )}

          {/* Games Section */}
          <div className="mb-2">
             <Accordion type="single" collapsible defaultValue={!isSports ? "games" : undefined} className="w-full">
              <AccordionItem value="games" className="border-none">
                {!isSidebarCollapsed ? (
                  <AccordionTrigger className="px-3 py-2 text-sm font-semibold text-[#b1bad3] hover:text-white hover:bg-[#213743] rounded-lg hover:no-underline">
                    <div className="flex items-center gap-3">
                      <Gamepad2 className="h-4 w-4" />
                      <span>Casino Games</span>
                    </div>
                  </AccordionTrigger>
                ) : (
                   <div className="flex justify-center py-2">
                      <Gamepad2 className="h-4 w-4" />
                   </div>
                )}
                <AccordionContent className="pt-1 pb-0">
                  <div className="space-y-1 pl-0">
                    {[
                      { to: '/game/dice', icon: Dices, label: 'Dice' },
                      { to: '/game/mines', icon: Bomb, label: 'Mines' },
                      { to: '/game/coinflip', icon: Coins, label: 'CoinFlip' },
                    ].map((item) => (
                      <Link key={item.to} to={item.to} onClick={onLinkClick} className="block">
                        <Button
                          variant="ghost"
                          className={cn(
                            "w-full justify-start gap-3 h-9 font-medium",
                            isActive(item.to) ? "bg-[#213743] text-white" : "text-[#b1bad3] hover:text-white hover:bg-[#213743]",
                            isSidebarCollapsed && "justify-center px-0"
                          )}
                        >
                          <item.icon className="h-4 w-4 shrink-0" />
                          {!isSidebarCollapsed && item.label}
                        </Button>
                      </Link>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          {/* Main Menu Items */}
          <div className="space-y-1">
            
            {/* Promotions */}
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="promotions" className="border-none">
                {!isSidebarCollapsed ? (
                  <AccordionTrigger className="px-3 py-2 text-sm font-semibold text-[#b1bad3] hover:text-white hover:bg-[#213743] rounded-lg hover:no-underline">
                    <div className="flex items-center gap-3">
                      <Gift className="h-4 w-4" />
                      <span>Promotions</span>
                    </div>
                  </AccordionTrigger>
                ) : (
                   <Link to="/promotions" onClick={onLinkClick} className="flex justify-center py-2">
                      <Gift className="h-4 w-4" />
                   </Link>
                )}
                <AccordionContent className="pt-1 pb-0">
                  <div className="pl-4 space-y-1">
                    <Link to="/promotions" onClick={onLinkClick}>
                      <Button variant="ghost" className="w-full justify-start h-8 text-xs text-[#b1bad3] hover:text-white">View All</Button>
                    </Link>
                    <Button variant="ghost" className="w-full justify-start h-8 text-xs text-[#b1bad3] hover:text-white">Welcome Bonus</Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* Affiliate */}
            <Link to="/affiliate" onClick={onLinkClick} className="block">
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3 h-10 font-semibold",
                  isActive('/affiliate') ? "bg-[#213743] text-white" : "text-[#b1bad3] hover:text-white hover:bg-[#213743]",
                  isSidebarCollapsed && "justify-center px-0"
                )}
              >
                <Users className="h-4 w-4 shrink-0" />
                {!isSidebarCollapsed && "Affiliate"}
              </Button>
            </Link>

            {/* VIP Club */}
            <Link to="/vip-club" onClick={onLinkClick} className="block">
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3 h-10 font-semibold",
                  isActive('/vip-club') ? "bg-[#213743] text-white" : "text-[#b1bad3] hover:text-white hover:bg-[#213743]",
                  isSidebarCollapsed && "justify-center px-0"
                )}
              >
                <Crown className="h-4 w-4 shrink-0" />
                {!isSidebarCollapsed && "VIP Club"}
              </Button>
            </Link>

            {/* Blog */}
            <Link to="/blog" onClick={onLinkClick} className="block">
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3 h-10 font-semibold",
                  isActive('/blog') ? "bg-[#213743] text-white" : "text-[#b1bad3] hover:text-white hover:bg-[#213743]",
                  isSidebarCollapsed && "justify-center px-0"
                )}
              >
                <Newspaper className="h-4 w-4 shrink-0" />
                {!isSidebarCollapsed && "Blog"}
              </Button>
            </Link>

            {/* Forum */}
            <Link to="/forum" onClick={onLinkClick} className="block">
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3 h-10 font-semibold",
                  isActive('/forum') ? "bg-[#213743] text-white" : "text-[#b1bad3] hover:text-white hover:bg-[#213743]",
                  isSidebarCollapsed && "justify-center px-0"
                )}
              >
                <MessageSquare className="h-4 w-4 shrink-0" />
                {!isSidebarCollapsed && "Forum"}
              </Button>
            </Link>

            {/* Divider */}
            {!isSidebarCollapsed && <div className="h-px bg-[#2f4553] my-2 mx-3" />}

            {/* Sponsorships */}
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="sponsorships" className="border-none">
                {!isSidebarCollapsed ? (
                  <AccordionTrigger className="px-3 py-2 text-sm font-semibold text-[#b1bad3] hover:text-white hover:bg-[#213743] rounded-lg hover:no-underline">
                    <div className="flex items-center gap-3">
                      <Shield className="h-4 w-4" />
                      <span>Sponsorships</span>
                    </div>
                  </AccordionTrigger>
                ) : (
                   <div className="flex justify-center py-2">
                      <Shield className="h-4 w-4" />
                   </div>
                )}
                <AccordionContent className="pt-1 pb-0">
                  <div className="pl-4 space-y-1">
                    <Button variant="ghost" className="w-full justify-start h-8 text-xs text-[#b1bad3] hover:text-white">UFC</Button>
                    <Button variant="ghost" className="w-full justify-start h-8 text-xs text-[#b1bad3] hover:text-white">Everton FC</Button>
                    <Button variant="ghost" className="w-full justify-start h-8 text-xs text-[#b1bad3] hover:text-white">Alfa Romeo F1</Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* Responsible Gambling */}
            <Link to="/responsible-gambling" onClick={onLinkClick} className="block">
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3 h-10 font-semibold",
                  isActive('/responsible-gambling') ? "bg-[#213743] text-white" : "text-[#b1bad3] hover:text-white hover:bg-[#213743]",
                  isSidebarCollapsed && "justify-center px-0"
                )}
              >
                <Shield className="h-4 w-4 shrink-0" />
                {!isSidebarCollapsed && "Responsible Gambling"}
              </Button>
            </Link>

            {/* Live Support */}
            <Link to="/help" onClick={onLinkClick} className="block">
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3 h-10 font-semibold",
                  isActive('/help') ? "bg-[#213743] text-white" : "text-[#b1bad3] hover:text-white hover:bg-[#213743]",
                  isSidebarCollapsed && "justify-center px-0"
                )}
              >
                <Headphones className="h-4 w-4 shrink-0" />
                {!isSidebarCollapsed && "Live Support"}
              </Button>
            </Link>

            {/* Language */}
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="language" className="border-none">
                {!isSidebarCollapsed ? (
                  <AccordionTrigger className="px-3 py-2 text-sm font-semibold text-[#b1bad3] hover:text-white hover:bg-[#213743] rounded-lg hover:no-underline">
                    <div className="flex items-center gap-3">
                      <Globe className="h-4 w-4" />
                      <span>Language: English</span>
                    </div>
                  </AccordionTrigger>
                ) : (
                   <div className="flex justify-center py-2">
                      <Globe className="h-4 w-4" />
                   </div>
                )}
                <AccordionContent className="pt-1 pb-0">
                  <div className="pl-4 space-y-1">
                    <Button variant="ghost" className="w-full justify-start h-8 text-xs text-white bg-[#213743]">English</Button>
                    <Button variant="ghost" className="w-full justify-start h-8 text-xs text-[#b1bad3] hover:text-white">Español</Button>
                    <Button variant="ghost" className="w-full justify-start h-8 text-xs text-[#b1bad3] hover:text-white">Français</Button>
                    <Button variant="ghost" className="w-full justify-start h-8 text-xs text-[#b1bad3] hover:text-white">Deutsch</Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
