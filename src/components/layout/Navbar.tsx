import { Button } from '@/components/ui/button';
import { StarButton } from '@/components/ui/star-button';
import { Search, Bell, Menu, User, MessageSquare, ChevronDown, Settings, LogOut, Wallet, Crown, Users, Trophy, BarChart2, FileText, ClipboardCheck, Shield, Headset, Lock, ShieldCheck } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useWallet } from '@/context/WalletContext';
import { useUI } from '@/context/UIContext';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { AppSidebar } from './AppSidebar';
import { useState } from 'react';
import { VIPModal } from '@/components/VIPModal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { WalletDropdown } from '@/components/wallet/WalletDropdown';
import { useDashboardData } from '@/hooks/useDashboardData';
import { SearchModal } from '@/components/search/SearchModal';
import { NotificationBell } from '@/components/notifications/NotificationBell';

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
  const { openAuthModal, openWalletModal, toggleSidebar, openStatsModal, toggleChat, isChatOpen, openVaultModal, isSidebarCollapsed } = useUI();
  const { stats } = useDashboardData();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isVIPModalOpen, setIsVIPModalOpen] = useState(false);
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
    { label: 'Wallet', icon: Wallet, action: () => openWalletModal('overview'), imageIcon: '/icons/wallet.png' },
    { label: 'Vault', icon: Lock, action: () => openVaultModal(), imageIcon: '/icons/vault.png' },
    { label: 'VIP', icon: Trophy, action: () => setIsVIPModalOpen(true), imageIcon: '/icons/vip.png' },
    { label: 'Affiliate', icon: Users, link: '/affiliate', imageIcon: '/icons/affiliate.png', invertToWhite: true },
    { label: 'Statistics', icon: BarChart2, action: () => openStatsModal(), imageIcon: '/icons/statistics.png', invertToWhite: true },
    { label: 'Transactions', icon: FileText, link: '/transactions', imageIcon: '/icons/transactions.png' },
    { label: 'My Bets', icon: ClipboardCheck, link: '/my-bets', imageIcon: '/icons/mybets.png' },
    { label: 'Settings', icon: Settings, link: '/settings', imageIcon: '/icons/settings.png', invertToWhite: true },
    { label: 'Play Smart', icon: Shield, link: '/responsible-gambling', imageIcon: '/icons/playsmart.png' },
    { label: 'Live Support', icon: Headset, link: '/help', imageIcon: '/icons/livesupport.png', invertToWhite: true },
  ];

  // Admin-only menu items
  const ADMIN_ITEMS = [
    { label: 'Admin Panel', icon: ShieldCheck, link: '/admin/dashboard' },
    { label: 'Wallet Settings', icon: Settings, link: '/admin/wallet' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 w-full h-14 bg-[#1a2c38] flex items-center px-3 border-b border-[#0f212e]/50">

      {/* === LEFT SECTION: Menu + Casino/Sports Toggle === */}
      <div className="flex items-center gap-2">

        {/* Hamburger Menu (Mobile) */}
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-[#b1bad3] hover:text-white hover:bg-[#2f4553] h-9 w-9 rounded lg:hidden">
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
          className="text-[#b1bad3] hover:text-white hover:bg-[#2f4553] h-9 w-9 rounded hidden lg:flex"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Casino / Sports Toggle - Gradient Style (hidden when sidebar collapsed) */}
        {!isSidebarCollapsed && (
          <div className="hidden md:flex items-center gap-1">
            <Link to="/casino">
              <StarButton
                variant={!isSports ? "green" : "default"}
                className={cn(
                  "h-9 px-6 min-w-[100px]",
                  isSports && "opacity-70 grayscale hover:opacity-100 hover:grayscale-0 transition-all font-medium"
                )}
                backgroundColor={isSports ? "#2f4553" : undefined}
                lightColor={isSports ? "#b1bad3" : undefined}
              >
                Casino
              </StarButton>
            </Link>
            <Link to="/sports">
              <StarButton
                variant={isSports ? "orange" : "default"}
                className={cn(
                  "h-9 px-6 min-w-[100px]",
                  !isSports && "opacity-70 grayscale hover:opacity-100 hover:grayscale-0 transition-all font-medium"
                )}
                backgroundColor={!isSports ? "#2f4553" : undefined}
                lightColor={!isSports ? "#b1bad3" : undefined}
              >
                Sports
              </StarButton>
            </Link>
          </div>
        )}
      </div>

      {/* === CENTER: Logo (Left-aligned after toggle) === */}
      {/* === CENTER: Logo (Left-aligned after toggle) === */}
      <Link to="/" className="flex items-center gap-3 ml-4">
        <img src="/logo.png" alt="Shiny.bet Logo" className="h-10 w-auto" />
        <span className="text-2xl font-black italic tracking-tight hidden sm:block">
          <span className="text-white">Shiny</span>
          <span className="text-[#FFD700]">.bet</span>
        </span>
      </Link>

      {/* === ABSOLUTE CENTER: Balance + Wallet (Logged in only) === */}
      {
        user && (
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
            {/* Balance Display with Dropdown */}
            <div className="hidden sm:flex items-center">
              <WalletDropdown />
            </div>

            {/* Wallet Button - Gold */}
            <StarButton
              onClick={() => openWalletModal('overview')}
              variant="gold"
              className="h-9 px-6 shadow-[0_2px_0_#B8860B]"
            >
              Wallet
            </StarButton>
          </div>
        )
      }

      {/* === SPACER === */}
      <div className="flex-1" />

      {/* === RIGHT SECTION: Icons === */}
      <div className="flex items-center gap-2">

        {user ? (
          <>

            {/* Icon Group */}
            <div className="flex items-center gap-0.5">
              {/* Search */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSearchOpen(true)}
                className="text-[#b1bad3] hover:text-white hover:bg-[#2f4553] h-9 w-9 rounded"
              >
                <Search className="h-5 w-5 text-white" strokeWidth={2.5} />
              </Button>

              {/* User Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-[#b1bad3] hover:text-white hover:bg-[#2f4553] h-9 w-9 rounded">
                    <User className="h-5 w-5 text-white" fill="white" stroke="none" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60 bg-[#1a2c38] border-[#2f4553] text-white p-2 shadow-xl mt-2">
                  <DropdownMenuLabel className="font-normal mb-2">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-bold leading-none text-white">{profile?.username || 'User'}</p>
                      <p className="text-xs leading-none text-[#b1bad3] opacity-70">{user.email}</p>
                    </div>
                    <div className="mt-3 h-1.5 w-full bg-[#0f212e] rounded-full overflow-hidden">
                      <div className="h-full bg-[#1fff20] transition-all duration-500" style={{ width: `${vipProgressPercent}%` }} />
                    </div>
                    <div className="flex justify-between mt-1 text-[10px] text-[#b1bad3]">
                      <span>VIP Progress</span>
                      <span>{vipProgressPercent.toFixed(0)}%</span>
                    </div>
                  </DropdownMenuLabel>

                  {/* Admin Items */}
                  {(profile?.role === 'admin' || profile?.role === 'super_admin') && (
                    <>
                      <DropdownMenuSeparator className="bg-[#2f4553] my-2" />
                      {ADMIN_ITEMS.map((item, index) => (
                        <Link key={`admin-${index}`} to={item.link || '#'} className="block">
                          <DropdownMenuItem className="flex items-center w-full cursor-pointer hover:bg-[#213743] focus:bg-[#213743] p-2 rounded-md group transition-colors">
                            <item.icon className="mr-3 h-4 w-4 text-[#1fff20] group-hover:text-[#1fff20] transition-colors" />
                            <span className="font-medium text-sm text-[#1fff20] group-hover:text-[#1fff20] transition-colors">{item.label}</span>
                          </DropdownMenuItem>
                        </Link>
                      ))}
                    </>
                  )}

                  <DropdownMenuSeparator className="bg-[#2f4553] mb-2" />

                  <div className="space-y-1">
                    {MENU_ITEMS.map((item, index) => {
                      const ItemContent = (
                        <>
                          {item.imageIcon ? (
                            <img
                              src={item.imageIcon}
                              alt={item.label}
                              className={`mr-3 h-5 w-5 object-contain ${item.invertToWhite ? 'brightness-0 invert' : ''}`}
                            />
                          ) : (
                            <item.icon
                              className="mr-3 h-5 w-5 text-white"
                              strokeWidth={2}
                            />
                          )}
                          <span className="font-semibold text-sm text-white">{item.label}</span>
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
                      <LogOut className="mr-3 h-5 w-5 text-white" strokeWidth={2} />
                      <span className="font-semibold text-sm text-white">Logout</span>
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Notifications */}
              <NotificationBell />

              {/* Chat Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleChat}
                className={cn(
                  "text-[#b1bad3] hover:text-white hover:bg-[#2f4553] h-9 w-9 rounded hidden md:inline-flex",
                  isChatOpen && "bg-[#2f4553] text-white"
                )}
              >
                <MessageSquare className="h-5 w-5 text-white" fill="white" stroke="none" />
              </Button>
            </div>
          </>
        ) : (
          <>
            <Button variant="ghost" onClick={() => openAuthModal('login')} className="text-white font-bold hover:bg-[#2f4553] h-9">
              Sign In
            </Button>
            <StarButton onClick={() => openAuthModal('register')} variant="gold" className="h-9 shadow-[0_2px_0_#B8860B]">
              Register
            </StarButton>
          </>
        )}
      </div>

      {/* Search Modal */}
      <SearchModal open={isSearchOpen} onOpenChange={setIsSearchOpen} />

      {/* VIP Modal */}
      <VIPModal open={isVIPModalOpen} onOpenChange={setIsVIPModalOpen} />
    </nav >
  );
};

export default Navbar;
