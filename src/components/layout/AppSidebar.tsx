import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUI } from '@/context/UIContext';
import { useAuth } from '@/context/AuthContext';
import UserProfileCard from '@/components/sidebar/UserProfileCard';
import {
  Gift,
  Newspaper,
  MessageSquare,
  Headphones,
  Globe,
  Users,
  ShieldCheck,
  Gem,
  Flame,
  Zap,
  TrendingUp,
  Spade,
  Star,
  Trophy,
  Clock,
  Swords,
  LayoutList,
  Sparkles,
  Gamepad2,
  CircleDot,
  Dices,
  Target,
  Rocket,
  Coins,
  RotateCcw,
  CirclePlay,
  Lock
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

  const isCasino = location.pathname === '/casino' || location.pathname.startsWith('/game/');
  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin';

  const isActive = (path: string) => location.pathname === path;

  // Shared styles
  const menuItemClass = "w-full justify-start gap-3 h-11 font-bold text-[14px] rounded-lg transition-all";
  const iconClass = "h-5 w-5 shrink-0 [&>*]:fill-current [&>*]:stroke-none";
  const accordionTriggerClass = "px-3 py-2.5 text-[14px] font-bold text-white hover:text-white hover:bg-[#213743] rounded-lg hover:no-underline [&[data-state=open]]:bg-[#213743]";
  const dropdownItemClass = "w-full justify-start h-10 text-sm font-medium text-[#b1bad3] hover:text-white hover:bg-[#1a2c38] rounded-md";
  const sectionTitleClass = "px-3 py-2 text-[11px] font-bold text-[#b1bad3] uppercase tracking-wider";

  // Games list with proper order - available flag for coming soon
  const CASINO_GAMES = [
    { name: 'New Releases', icon: Sparkles, link: '/casino?filter=new', available: true },
    { name: 'Shiny Originals', icon: Gem, link: '/casino?filter=originals', available: true },
    { name: 'Slots', icon: Gamepad2, link: '/casino?filter=slots', available: true },
    { name: 'Dice', icon: Dices, link: '/game/dice', available: true },
    { name: 'Mines', icon: Flame, link: '/game/mines', available: true },
    { name: 'Crash', icon: TrendingUp, link: '/game/crash', available: true },
    { name: 'Plinko', icon: Zap, link: '/game/plinko', available: false },
    { name: 'Limbo', icon: Rocket, link: '/game/limbo', available: true },
    { name: 'Blackjack', icon: Spade, link: '/game/blackjack', available: true },
    { name: 'Keno', icon: Target, link: '/game/keno', available: false },
    { name: 'Dragon Tower', icon: Flame, link: '/game/dragon-tower', available: true },
    { name: 'Flip', icon: Coins, link: '/game/coinflip', available: true },
    { name: 'Wheel', icon: RotateCcw, link: '/game/wheel', available: false },
    { name: 'Snakes', icon: CirclePlay, link: '/game/snakes', available: false },
  ];

  return (
    <div className={cn("flex flex-col h-full bg-[#0f212e] text-white pt-4", className)}>

      <ScrollArea className="flex-1 px-3 pb-4">
        {/* User Profile Card */}
        {!isSidebarCollapsed && <UserProfileCard />}

        {/* Main Navigation */}
        <div className={cn(
          "rounded-xl overflow-hidden transition-all duration-300 mt-2",
          isSidebarCollapsed ? "bg-transparent" : ""
        )}>

          <div className="space-y-0.5">

            {/* Casino-specific menu items */}
            {isCasino && (
              <>
                {/* Top Section - User Actions */}
                <Link to="/favourites" onClick={onLinkClick} className="block">
                  <Button
                    variant="ghost"
                    className={cn(
                      menuItemClass,
                      isActive('/favourites') ? "bg-[#213743] text-white" : "text-white hover:text-white hover:bg-[#213743]",
                      isSidebarCollapsed && "justify-center px-0"
                    )}
                  >
                    <Star className={iconClass} />
                    {!isSidebarCollapsed && "Favourites"}
                  </Button>
                </Link>

                <Link to="/recent" onClick={onLinkClick} className="block">
                  <Button
                    variant="ghost"
                    className={cn(
                      menuItemClass,
                      isActive('/recent') ? "bg-[#213743] text-white" : "text-white hover:text-white hover:bg-[#213743]",
                      isSidebarCollapsed && "justify-center px-0"
                    )}
                  >
                    <Clock className={iconClass} />
                    {!isSidebarCollapsed && "Recent"}
                  </Button>
                </Link>

                <Link to="/challenges" onClick={onLinkClick} className="block">
                  <Button
                    variant="ghost"
                    className={cn(
                      menuItemClass,
                      isActive('/challenges') ? "bg-[#213743] text-white" : "text-white hover:text-white hover:bg-[#213743]",
                      isSidebarCollapsed && "justify-center px-0"
                    )}
                  >
                    <Swords className={iconClass} />
                    {!isSidebarCollapsed && "Challenges"}
                  </Button>
                </Link>

                <Link to="/my-bets" onClick={onLinkClick} className="block">
                  <Button
                    variant="ghost"
                    className={cn(
                      menuItemClass,
                      isActive('/my-bets') ? "bg-[#213743] text-white" : "text-white hover:text-white hover:bg-[#213743]",
                      isSidebarCollapsed && "justify-center px-0"
                    )}
                  >
                    <LayoutList className={iconClass} />
                    {!isSidebarCollapsed && "My Bets"}
                  </Button>
                </Link>

                {/* Divider + Games Section */}
                {!isSidebarCollapsed && (
                  <>
                    <div className="h-px bg-[#2f4553] my-3 mx-1" />
                    <div className={sectionTitleClass}>Games</div>
                  </>
                )}

                {/* Games List */}
                {CASINO_GAMES.map((game) => (
                  game.available ? (
                    <Link key={game.name} to={game.link} onClick={onLinkClick} className="block">
                      <Button
                        variant="ghost"
                        className={cn(
                          menuItemClass,
                          isActive(game.link) ? "bg-[#213743] text-white" : "text-white hover:text-white hover:bg-[#213743]",
                          isSidebarCollapsed && "justify-center px-0"
                        )}
                      >
                        <game.icon className={iconClass} />
                        {!isSidebarCollapsed && game.name}
                      </Button>
                    </Link>
                  ) : (
                    <div key={game.name} className="block">
                      <Button
                        variant="ghost"
                        disabled
                        className={cn(
                          menuItemClass,
                          "text-[#b1bad3]/50 cursor-not-allowed hover:bg-transparent",
                          isSidebarCollapsed && "justify-center px-0"
                        )}
                      >
                        <game.icon className="h-5 w-5 shrink-0 opacity-50" />
                        {!isSidebarCollapsed && (
                          <span className="flex items-center gap-2">
                            {game.name}
                            <span className="text-[10px] bg-[#2f4553] px-1.5 py-0.5 rounded text-[#b1bad3]">Soon</span>
                          </span>
                        )}
                      </Button>
                    </div>
                  )
                ))}

                {/* Divider */}
                {!isSidebarCollapsed && <div className="h-px bg-[#2f4553] my-3 mx-1" />}
              </>
            )}

            {/* Common Menu Items */}

            {/* Promotions Dropdown */}
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="promotions" className="border-none">
                {!isSidebarCollapsed ? (
                  <AccordionTrigger className={accordionTriggerClass}>
                    <div className="flex items-center gap-3">
                      <Gift className={iconClass} />
                      <span>Promotions</span>
                    </div>
                  </AccordionTrigger>
                ) : (
                  <Link to="/promotions" onClick={onLinkClick} className="flex justify-center py-3 hover:bg-[#213743] rounded-lg">
                    <Gift className={iconClass} />
                  </Link>
                )}
                <AccordionContent className="pt-1 pb-2 px-2">
                  <div className="bg-[#1a2c38] rounded-lg p-2 space-y-1">
                    <Link to="/promotions" onClick={onLinkClick}>
                      <Button variant="ghost" className={dropdownItemClass}>View All Promos</Button>
                    </Link>
                    <Button variant="ghost" className={dropdownItemClass}>Welcome Bonus</Button>
                    <Button variant="ghost" className={dropdownItemClass}>Daily Rewards</Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* Affiliate */}
            <Link to="/affiliate" onClick={onLinkClick} className="block">
              <Button
                variant="ghost"
                className={cn(
                  menuItemClass,
                  isActive('/affiliate') ? "bg-[#213743] text-white" : "text-white hover:text-white hover:bg-[#213743]",
                  isSidebarCollapsed && "justify-center px-0"
                )}
              >
                <Users className={iconClass} />
                {!isSidebarCollapsed && "Affiliate"}
              </Button>
            </Link>

            {/* VIP Club */}
            <Link to="/vip-club" onClick={onLinkClick} className="block">
              <Button
                variant="ghost"
                className={cn(
                  menuItemClass,
                  isActive('/vip-club') ? "bg-[#213743] text-white" : "text-white hover:text-white hover:bg-[#213743]",
                  isSidebarCollapsed && "justify-center px-0"
                )}
              >
                <Trophy className={iconClass} />
                {!isSidebarCollapsed && "VIP Club"}
              </Button>
            </Link>

            {/* Blog */}
            <Link to="/blog" onClick={onLinkClick} className="block">
              <Button
                variant="ghost"
                className={cn(
                  menuItemClass,
                  isActive('/blog') ? "bg-[#213743] text-white" : "text-white hover:text-white hover:bg-[#213743]",
                  isSidebarCollapsed && "justify-center px-0"
                )}
              >
                <Newspaper className={iconClass} />
                {!isSidebarCollapsed && "Blog"}
              </Button>
            </Link>

            {/* Forum */}
            <Link to="/forum" onClick={onLinkClick} className="block">
              <Button
                variant="ghost"
                className={cn(
                  menuItemClass,
                  isActive('/forum') ? "bg-[#213743] text-white" : "text-white hover:text-white hover:bg-[#213743]",
                  isSidebarCollapsed && "justify-center px-0"
                )}
              >
                <MessageSquare className={iconClass} />
                {!isSidebarCollapsed && "Forum"}
              </Button>
            </Link>

            {/* Divider */}
            {!isSidebarCollapsed && <div className="h-px bg-[#2f4553] my-3 mx-1" />}

            {/* Sponsorships Dropdown */}
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="sponsorships" className="border-none">
                {!isSidebarCollapsed ? (
                  <AccordionTrigger className={accordionTriggerClass}>
                    <div className="flex items-center gap-3">
                      <Gem className={iconClass} />
                      <span>Sponsorships</span>
                    </div>
                  </AccordionTrigger>
                ) : (
                  <div className="flex justify-center py-3 hover:bg-[#213743] rounded-lg cursor-pointer">
                    <Gem className={iconClass} />
                  </div>
                )}
                <AccordionContent className="pt-1 pb-2 px-2">
                  <div className="bg-[#1a2c38] rounded-lg p-2 space-y-1">
                    <Button variant="ghost" className={dropdownItemClass}>UFC</Button>
                    <Button variant="ghost" className={dropdownItemClass}>Everton FC</Button>
                    <Button variant="ghost" className={dropdownItemClass}>Alfa Romeo F1</Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* Responsible Gambling */}
            <Link to="/responsible-gambling" onClick={onLinkClick} className="block">
              <Button
                variant="ghost"
                className={cn(
                  menuItemClass,
                  isActive('/responsible-gambling') ? "bg-[#213743] text-white" : "text-white hover:text-white hover:bg-[#213743]",
                  isSidebarCollapsed && "justify-center px-0"
                )}
              >
                <ShieldCheck className={iconClass} />
                {!isSidebarCollapsed && "Responsible Gambling"}
              </Button>
            </Link>

            {/* Live Support */}
            <Link to="/help" onClick={onLinkClick} className="block">
              <Button
                variant="ghost"
                className={cn(
                  menuItemClass,
                  isActive('/help') ? "bg-[#213743] text-white" : "text-white hover:text-white hover:bg-[#213743]",
                  isSidebarCollapsed && "justify-center px-0"
                )}
              >
                <Headphones className={iconClass} />
                {!isSidebarCollapsed && "Live Support"}
              </Button>
            </Link>

            {/* Language Dropdown */}
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="language" className="border-none">
                {!isSidebarCollapsed ? (
                  <AccordionTrigger className={accordionTriggerClass}>
                    <div className="flex items-center gap-3">
                      <Globe className={iconClass} />
                      <span>Language: English</span>
                    </div>
                  </AccordionTrigger>
                ) : (
                  <div className="flex justify-center py-3 hover:bg-[#213743] rounded-lg cursor-pointer">
                    <Globe className={iconClass} />
                  </div>
                )}
                <AccordionContent className="pt-1 pb-2 px-2">
                  <div className="bg-[#1a2c38] rounded-lg p-2 space-y-1">
                    <Button variant="ghost" className={cn(dropdownItemClass, "text-white bg-[#213743]")}>English</Button>
                    <Button variant="ghost" className={dropdownItemClass}>Español</Button>
                    <Button variant="ghost" className={dropdownItemClass}>Français</Button>
                    <Button variant="ghost" className={dropdownItemClass}>Deutsch</Button>
                    <Button variant="ghost" className={dropdownItemClass}>Português</Button>
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
