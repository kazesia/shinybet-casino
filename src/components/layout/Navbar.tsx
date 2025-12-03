import { Button } from '@/components/ui/button';
import { Search, Bell, Menu, User, MessageSquare, ChevronDown, Settings, LogOut, Wallet, Crown, Users } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useWallet } from '@/context/WalletContext';
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

// Use the logo from the previous context or a placeholder that matches the "Stake" text style if image fails
const LOGO_URL = "https://cdn.discordapp.com/attachments/1442155264613814302/1445539875116810392/Collabeco_2_-removebg-preview.png?ex=6930b76b&is=692f65eb&hm=9be06a69591c9fba9edca705a2295c341ddde42e5112db67b58dbc0d77f00ed5";

const MOCK_NOTIFICATIONS = [
  { id: 1, title: "Welcome Bonus", message: "Claim your 100% deposit bonus!", time: "2m ago", read: false },
  { id: 2, title: "Security Alert", message: "New login detected from Chrome.", time: "1h ago", read: true },
];

const Navbar = () => {
  const { user, profile, signOut } = useAuth();
  const { balance } = useWallet();
  const { openAuthModal, openWalletModal, toggleSidebar } = useUI();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isSports = location.pathname.includes('/sports');

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Logged out successfully");
      navigate('/');
    } catch (error) {
      toast.error("Failed to log out");
    }
  };

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

        {/* 2. Casino / Sports Toggles (Pill Buttons) */}
        <div className="hidden md:flex items-center gap-2">
           <Link to="/">
             <div className={cn(
               "h-10 px-6 rounded-full flex items-center justify-center font-bold text-sm transition-all cursor-pointer",
               !isSports 
                 ? "bg-[#213743] text-white shadow-inner" // Active State (Casino)
                 : "bg-transparent text-[#b1bad3] hover:bg-[#213743] hover:text-white"
             )}>
               Casino
             </div>
           </Link>
           <Link to="/sports">
             <div className={cn(
               "h-10 px-6 rounded-full flex items-center justify-center font-bold text-sm transition-all cursor-pointer",
               isSports 
                 ? "bg-[#213743] text-white shadow-inner" // Active State (Sports)
                 : "bg-transparent text-[#b1bad3] hover:bg-[#213743] hover:text-white"
             )}>
               Sports
             </div>
           </Link>
        </div>

        {/* 3. Logo */}
        <Link to="/" className="flex items-center ml-2">
          <img src={LOGO_URL} alt="Shiny Logo" className="h-6 md:h-8 w-auto" />
        </Link>
      </div>

      {/* --- SPACER --- */}
      <div className="flex-1" />

      {/* --- RIGHT SECTION --- */}
      <div className="flex items-center gap-2 md:gap-3">
        
        {user ? (
          <>
             {/* Balance Selector */}
            <div className="hidden sm:flex items-center bg-[#0f212e] rounded-[4px] h-10 px-2 gap-3 border border-[#2f4553] cursor-pointer hover:border-[#b1bad3]/50 transition-colors mr-2">
              <div className="flex items-center gap-2">
                 <span className="text-sm font-bold text-white">${balance.toFixed(2)}</span>
                 {/* Litecoin Icon Placeholder */}
                 <div className="w-5 h-5 rounded-full bg-[#345d9d] flex items-center justify-center text-white text-[10px] font-bold">
                    Ł
                 </div>
              </div>
              <ChevronDown className="h-4 w-4 text-[#b1bad3]" />
            </div>

            {/* Wallet Button */}
            <Button 
              onClick={() => openWalletModal('deposit')} 
              className="bg-[#1475e1] hover:bg-[#1475e1]/90 text-white font-bold h-10 px-6 rounded-[4px] shadow-sm mr-2"
            >
              Wallet
            </Button>

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
                 <DropdownMenuContent align="end" className="w-64 bg-[#1a2c38] border-[#2f4553] text-white p-2">
                    <DropdownMenuLabel className="font-normal">
                       <div className="flex flex-col space-y-1">
                          <p className="text-sm font-bold leading-none text-white">{profile?.username || 'User'}</p>
                          <p className="text-xs leading-none text-[#b1bad3]">{user.email}</p>
                       </div>
                       {/* Progress Bar Mock */}
                       <div className="mt-3 h-1.5 w-full bg-[#0f212e] rounded-full overflow-hidden">
                          <div className="h-full bg-[#F7D979] w-[20%]" />
                       </div>
                       <div className="flex justify-between mt-1 text-[10px] text-[#b1bad3]">
                          <span>VIP Progress</span>
                          <span>20%</span>
                       </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-[#2f4553]" />
                    
                    <DropdownMenuItem onClick={() => openWalletModal('deposit')} className="cursor-pointer hover:bg-[#213743] focus:bg-[#213743] focus:text-white text-[#b1bad3]">
                       <Wallet className="mr-2 h-4 w-4" />
                       <span>Wallet</span>
                    </DropdownMenuItem>
                    
                    <Link to="/vip-club">
                      <DropdownMenuItem className="cursor-pointer hover:bg-[#213743] focus:bg-[#213743] focus:text-white text-[#b1bad3]">
                         <Crown className="mr-2 h-4 w-4" />
                         <span>VIP Club</span>
                      </DropdownMenuItem>
                    </Link>

                    <Link to="/affiliate">
                      <DropdownMenuItem className="cursor-pointer hover:bg-[#213743] focus:bg-[#213743] focus:text-white text-[#b1bad3]">
                         <Users className="mr-2 h-4 w-4" />
                         <span>Affiliate</span>
                      </DropdownMenuItem>
                    </Link>

                    <Link to="/profile">
                      <DropdownMenuItem className="cursor-pointer hover:bg-[#213743] focus:bg-[#213743] focus:text-white text-[#b1bad3]">
                         <Settings className="mr-2 h-4 w-4" />
                         <span>Settings</span>
                      </DropdownMenuItem>
                    </Link>

                    <DropdownMenuSeparator className="bg-[#2f4553]" />
                    
                    <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer hover:bg-red-500/10 focus:bg-red-500/10 text-red-500 focus:text-red-500">
                       <LogOut className="mr-2 h-4 w-4" />
                       <span>Log out</span>
                    </DropdownMenuItem>
                 </DropdownMenuContent>
               </DropdownMenu>

               {/* Notifications */}
               <Popover>
                 <PopoverTrigger asChild>
                   <Button variant="ghost" size="icon" className="text-[#b1bad3] hover:text-white hover:bg-[#213743] h-10 w-10 rounded-[4px] relative">
                     <Bell className="h-5 w-5" />
                     {/* Notification Dot */}
                     <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-[#1a2c38]" />
                   </Button>
                 </PopoverTrigger>
                 <PopoverContent className="w-80 p-0 bg-[#1a2c38] border-[#2f4553] text-white" align="end">
                   <div className="p-3 border-b border-[#2f4553] flex justify-between items-center">
                     <h4 className="font-bold text-sm">Notifications</h4>
                     <span className="text-xs text-[#1475e1] cursor-pointer hover:underline">Mark all read</span>
                   </div>
                   <ScrollArea className="h-[300px]">
                     <div className="flex flex-col">
                       {MOCK_NOTIFICATIONS.map((notif) => (
                         <div key={notif.id} className={`p-3 border-b border-[#2f4553] hover:bg-[#213743] cursor-pointer transition-colors ${!notif.read ? 'bg-[#213743]/50' : ''}`}>
                           <div className="flex justify-between items-start mb-1">
                             <span className={`text-sm font-semibold ${!notif.read ? 'text-white' : 'text-[#b1bad3]'}`}>{notif.title}</span>
                             <span className="text-[10px] text-[#b1bad3]">{notif.time}</span>
                           </div>
                           <p className="text-xs text-[#b1bad3] line-clamp-2">{notif.message}</p>
                         </div>
                       ))}
                     </div>
                   </ScrollArea>
                 </PopoverContent>
               </Popover>

               {/* Chat / Messages */}
               <Button variant="ghost" size="icon" className="text-[#b1bad3] hover:text-white hover:bg-[#213743] h-10 w-10 rounded-[4px] hidden md:inline-flex">
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
