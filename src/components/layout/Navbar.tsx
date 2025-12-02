import { Button } from '@/components/ui/button';
import { Search, Wallet, Bell, MessageSquare, User as UserIcon, Menu } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useWallet } from '@/context/WalletContext';
import { useUI } from '@/context/UIContext';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { AppSidebar } from './AppSidebar';
import { useState } from 'react';

const LOGO_URL = "https://cdn.discordapp.com/attachments/1442155264613814302/1445539875116810392/Collabeco_2_-removebg-preview.png?ex=6930b76b&is=692f65eb&hm=9be06a69591c9fba9edca705a2295c341ddde42e5112db67b58dbc0d77f00ed5";

const Navbar = () => {
  const { user } = useAuth();
  const { balance } = useWallet();
  const { openAuthModal, openWalletModal } = useUI();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 w-full h-16 bg-[#1a2c38] shadow-md flex items-center px-4 gap-4">
      
      {/* Mobile Menu */}
      <div className="lg:hidden">
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-[#b1bad3]">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-[80px] bg-[#0f212e] border-r-[#1a2c38]">
            <AppSidebar onLinkClick={() => setIsMobileMenuOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>

      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 mr-4">
        <img src={LOGO_URL} alt="Shiny Logo" className="h-8 w-auto" />
        <span className="text-2xl font-bold text-white tracking-tight hidden sm:block">Shiny</span>
      </Link>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        
        {user ? (
          <>
             {/* Balance Display */}
            <div className="hidden sm:flex items-center bg-[#0f212e] rounded-md h-10 px-3 gap-2 border border-[#213743]">
              <span className="text-sm font-medium text-white">${balance.toFixed(2)}</span>
              <span className="text-xs text-[#b1bad3]">USD</span>
            </div>

            {/* Wallet Button */}
            <Button 
              onClick={() => openWalletModal('deposit')} 
              className="bg-[#1475e1] hover:bg-[#1475e1]/90 text-white font-semibold h-10 px-6 rounded-md"
            >
              Wallet
            </Button>

            {/* Icons */}
            <div className="flex items-center gap-1 ml-2">
               <Button variant="ghost" size="icon" className="text-[#b1bad3] hover:text-white hover:bg-[#213743]">
                 <Search className="h-5 w-5" />
               </Button>
               <Button variant="ghost" size="icon" className="text-[#b1bad3] hover:text-white hover:bg-[#213743]">
                 <UserIcon className="h-5 w-5" />
               </Button>
               <Button variant="ghost" size="icon" className="text-[#b1bad3] hover:text-white hover:bg-[#213743]">
                 <Bell className="h-5 w-5" />
               </Button>
               <Button variant="ghost" size="icon" className="text-[#b1bad3] hover:text-white hover:bg-[#213743]">
                 <MessageSquare className="h-5 w-5" />
               </Button>
            </div>
          </>
        ) : (
          <>
            <Button variant="ghost" onClick={() => openAuthModal('login')} className="text-white font-semibold hover:bg-[#213743]">
              Log In
            </Button>
            <Button onClick={() => openAuthModal('register')} className="bg-[#1475e1] hover:bg-[#1475e1]/90 text-white font-semibold">
              Register
            </Button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
