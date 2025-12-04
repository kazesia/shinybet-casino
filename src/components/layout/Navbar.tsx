import { Button } from '@/components/ui/button';
import { Search, Bell, Menu, User, MessageSquare, ChevronDown, Settings, LogOut, Wallet, Crown, Users, Trophy, BarChart2, FileText, ClipboardCheck, Shield, Headset, Lock } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useWallet } from '@/context/WalletContext';
import LanguageSelector from '@/components/LanguageSelector';
import { useUI } from '@/context/UIContext';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { AppSidebar } from './AppSidebar';
import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { WalletDropdown } from '@/components/wallet/WalletDropdown';
import { useDashboardData } from '@/hooks/useDashboardData';

const LOGO_URL = "https://cdn.discordapp.com/attachments/1442155264613814302/1445539875116810392/Collabeco_2_-removebg-preview.png?ex=6930b76b&is=692f65eb&hm=9be06a69591c9fba9edca705a2295c341ddde42e5112db67b58dbc0d77f00ed5";

// VIP Tiers for progress calculation
const VIP_TIERS = [
  { name: 'Bronze', minWager: 0 },
  { name: 'Silver', minWager: 10000 },
  { name: 'Gold', minWager: 50000 },
  { name: 'Platinum', minWager: 100000 },
  { name: 'Diamond', minWager: 500000 },
];

const Navbar = () => {
  const { user, profile, signOut } = useAuth();
  const { balance } = useWallet();
  const { openAuthModal, openWalletModal, toggleSidebar, openStatsModal, toggleChat, isChatOpen, openVaultModal } = useUI();
  const { stats } = useDashboardData();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isSports = location.pathname.includes('/sports');

  // Calculate VIP Progress
  const wagered = stats?.total_wagered || 0;
  const currentTierIndex = VIP_TIERS.slice().reverse().findIndex(t => wagered >= t.minWager);
  const actualIndex = currentTierIndex === -1 ? 0 : VIP_TIERS.length - 1 - currentTierIndex;
  const currentTier = VIP_TIERS[actualIndex];
  const nextTier = VIP_TIERS[actualIndex + 1];

  let vipProgressPercent = 0;
  if (nextTier) {
    const totalNeeded = nextTier.minWager - currentTier.minWager;
    const currentProgress = wagered - currentTier.minWager;
    vipProgressPercent = Math.min(100, Math.max(0, (currentProgress / totalNeeded) * 100));
  } else {
    vipProgressPercent = 100;
  }

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Logged out successfully");
      navigate('/');
    } catch (error) {
      toast.error("Failed to log out");
    }
  };

  // Dropdown Menu Items Configuration
  const MENU_ITEMS = [
    { label: 'Wallet', icon: Wallet, action: () => openWalletModal('overview') },
    { label: 'Vault', icon: Lock, action: () => openVaultModal() },
    { label: 'VIP', icon: Trophy, link: '/vip-club' },
    { label: 'Affiliate', icon: Users, link: '/affiliate' },
    { label: 'Statistics', icon: BarChart2, action: () => openStatsModal() },
    { label: 'Transactions', icon: FileText, link: '/transactions' },
    { label: 'My Bets', icon: ClipboardCheck, link: '/my-bets' },
    { label: 'Settings', icon: Settings, link: '/settings' },
    { label: 'Play Smart', icon: Shield, link: '/responsible-gambling' },
    { label: 'Live Support', icon: Headset, link: '/help' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 w-full h-16 bg-[#1a2c38] shadow-md flex items-center px-4 gap-4 border-b border-[#1a2c38]">

      {/* --- LEFT SECTION --- */}
      <div className="flex items-center gap-2 md:gap-4">

        {/* 1. Hamburger Menu */}
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-[#b1bad3] hover:text-white lg:hidden shrink-0">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-[280px] bg-[#0f212e] border-r-[#1a2c38]">
            <AppSidebar onLinkClick={() => setIsMobileMenuOpen(false)} />
          </SheetContent>
        </Sheet>

        {/* Desktop Sidebar Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="text-[#b1bad3] hover:text-white hidden lg:flex shrink-0"
        >
          <Menu className="h-5 w-5" />
        </Button>



        {/* 2. Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <img
            src="https://media.discordapp.net/attachments/1442506658155855925/1446069962493005844/Collabeco_2_-removebg-preview.png?ex=6932a519&is=69315399&hm=cab9148f2cdcafb486a7ff6e92852c787bcb0e5b193af549d467c257f8913b73&=&format=webp&quality=lossless&width=750&height=750"
            alt="Shiny.bet Logo"
            className="h-8 w-8 object-contain"
          />
          <span className="hidden sm:block text-xl font-bold text-white">
            Shiny<span className="text-[#ffd700]">.bet</span>
          </span>
        </Link>
      </div>

      {/* --- SPACER --- */}
      <div className="flex-1" />

      {/* --- CENTER: Balance & Wallet (Absolute Positioned) --- */}
      {user && (
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
          <WalletDropdown />
          <Button
            onClick={() => openWalletModal('overview')}
            className="bg-[#1475e1] hover:bg-[#1266c9] text-white font-bold h-10 px-4 md:px-6 rounded-lg shadow-lg transition-all active:scale-95"
          >
            <Wallet className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">Wallet</span>
          </Button>
        </div>
      )}

      {/* --- RIGHT SECTION --- */}
      <div className="flex items-center gap-2 md:gap-3">

        {user ? (
          <>
            {/* Icons Group */}
            <div className="flex items-center gap-1">
              {/* Search */}
              <Button variant="ghost" size="icon" className="text-[#b1bad3] hover:text-white hover:bg-[#213743] h-10 w-10 rounded-[4px]">
                <Search className="h-5 w-5" />
              </Button>

              {/* User Dropdown Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-[#b1bad3] hover:text-white hover:bg-[#213743] h-10 w-10 rounded-[4px]">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60 bg-[#1a2c38] border-[#2f4553] text-white p-2 shadow-xl mt-2">
                  <DropdownMenuLabel className="font-normal mb-2">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-bold leading-none text-white">{profile?.username || 'User'}</p>
                      <p className="text-xs leading-none text-[#b1bad3] opacity-70">{user.email}</p>
                    </div>
                    <div className="mt-3 h-1.5 w-full bg-[#0f212e] rounded-full overflow-hidden">
                      <div className="h-full bg-[#F7D979] transition-all duration-500" style={{ width: `${vipProgressPercent}%` }} />
                    </div>
                    <div className="flex justify-between mt-1 text-[10px] text-[#b1bad3]">
                      <span>VIP Progress</span>
                      <span>{vipProgressPercent.toFixed(0)}%</span>
                    </div>
                  </DropdownMenuLabel>

                  <DropdownMenuSeparator className="bg-[#2f4553] mb-2" />

                  <div className="space-y-1">
                    {MENU_ITEMS.map((item, index) => {
                      const ItemContent = (
                        <>
                          <item.icon className="mr-3 h-4 w-4 text-[#b1bad3] group-hover:text-white transition-colors" />
                          <span className="font-medium text-sm text-[#b1bad3] group-hover:text-white transition-colors">{item.label}</span>
                        </>
                      );

                      const className = "flex items-center w-full cursor-pointer hover:bg-[#213743] focus:bg-[#213743] p-2 rounded-md group transition-colors";

                      if (item.action) {
                        return (
                          <DropdownMenuItem key={index} onClick={item.action} className={className}>
                            {ItemContent}
                          </DropdownMenuItem>
                        );
                      }

                      return (
                        <Link key={index} to={item.link || '#'} className="block">
                          <DropdownMenuItem className={className}>
                            {ItemContent}
                          </DropdownMenuItem>
                        </Link>
                      );
                    })}

                    <DropdownMenuItem onClick={handleSignOut} className="flex items-center w-full cursor-pointer hover:bg-[#213743] focus:bg-[#213743] p-2 rounded-md group transition-colors mt-2">
                      <LogOut className="mr-3 h-4 w-4 text-[#b1bad3] group-hover:text-white transition-colors" />
                      <span className="font-medium text-sm text-[#b1bad3] group-hover:text-white transition-colors">Logout</span>
                    </DropdownMenuItem>
                  </div>

                </DropdownMenuContent>
              </DropdownMenu>

              {/* Notifications */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-[#b1bad3] hover:text-white hover:bg-[#213743] h-10 w-10 rounded-[4px] relative">
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-[#1a2c38]" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0 bg-[#1a2c38] border-[#2f4553] text-white mt-2" align="end">
                  <div className="p-3 border-b border-[#2f4553] flex justify-between items-center">
                    <h4 className="font-bold text-sm">Notifications</h4>
                    <span className="text-xs text-[#1475e1] cursor-pointer hover:underline">Mark all read</span>
                  </div>
                  <ScrollArea className="h-[300px]">
                    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                      <Bell className="h-12 w-12 text-[#2f4553] mb-3" />
                      <p className="text-sm text-[#b1bad3]">No notifications yet</p>
                      <p className="text-xs text-[#2f4553] mt-1">We'll notify you when something important happens</p>
                    </div>
                  </ScrollArea>
                </PopoverContent>
              </Popover>

              {/* Chat Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleChat}
                className={cn(
                  "text-[#b1bad3] hover:text-white hover:bg-[#213743] h-10 w-10 rounded-[4px] hidden md:inline-flex",
                  isChatOpen && "bg-[#213743] text-white"
                )}
              >
                <MessageSquare className="h-5 w-5" />
              </Button>
            </div>
          </>
        ) : (
          <>
            <Button variant="ghost" onClick={() => openAuthModal('login')} className="text-white font-bold hover:bg-[#213743]">
              Log In
            </Button>
            <Button onClick={() => openAuthModal('register')} className="bg-[#1475e1] hover:bg-[#1475e1]/90 text-white font-bold">
              Register
            </Button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
