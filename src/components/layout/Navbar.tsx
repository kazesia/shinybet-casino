import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Wallet, User as UserIcon, LogOut, Settings, Gamepad2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useWallet } from '@/context/WalletContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const Navbar = () => {
  const { user, profile, signOut } = useAuth();
  const { balance } = useWallet();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gold-gradient flex items-center justify-center shadow-gold">
            <Gamepad2 className="h-5 w-5 text-black" />
          </div>
          <span className="text-xl font-bold tracking-tight">
            Shiny<span className="text-gold-gradient">.bet</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
          <Link to="/" className="hover:text-primary transition-colors">Casino</Link>
          <Link to="/game/dice" className="hover:text-primary transition-colors">Dice</Link>
          <a href="#" className="hover:text-primary transition-colors">Sports</a>
          <a href="#" className="hover:text-primary transition-colors">VIP Club</a>
        </div>

        {/* Auth / User Balance */}
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <>
              <Link to="/wallet">
                <div className="flex items-center gap-3 bg-brand-surface px-3 py-1.5 rounded-full border border-border hover:border-[#FFD700]/50 transition-colors cursor-pointer group">
                  <span className="text-sm font-bold text-white group-hover:text-[#FFD700] transition-colors">
                    {balance.toFixed(2)} Credits
                  </span>
                  <Button size="sm" className="h-7 bg-gold-gradient text-black hover:opacity-90 font-bold rounded-full text-xs">
                    <Wallet className="w-3 h-3 mr-1" /> Deposit
                  </Button>
                </div>
              </Link>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8 border border-border">
                      <AvatarImage src="" alt="@user" />
                      <AvatarFallback className="bg-[#FFD700] text-black font-bold">{profile?.username?.substring(0, 2).toUpperCase() || 'US'}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{profile?.username}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {profile?.role === 'admin' || profile?.role === 'super_admin' ? (
                    <Link to="/admin">
                      <DropdownMenuItem className="text-[#FFD700] focus:text-[#FFD700]">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Admin Panel</span>
                      </DropdownMenuItem>
                    </Link>
                  ) : null}
                  <Link to="/dashboard">
                    <DropdownMenuItem>
                      <UserIcon className="mr-2 h-4 w-4" />
                      <span>Dashboard</span>
                    </DropdownMenuItem>
                  </Link>
                  <Link to="/wallet">
                    <DropdownMenuItem>
                      <Wallet className="mr-2 h-4 w-4" />
                      <span>Wallet</span>
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-brand-danger focus:text-brand-danger">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link to="/auth">
                <Button variant="ghost" className="text-muted-foreground hover:text-white">Log In</Button>
              </Link>
              <Link to="/auth">
                <Button className="bg-gold-gradient text-black font-bold hover:opacity-90 shadow-gold transition-all">
                  Sign Up
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu */}
        <div className="md:hidden flex items-center gap-4">
           {user && (
             <div className="flex items-center gap-2 bg-brand-surface px-2 py-1 rounded-full border border-border">
                <span className="text-xs font-bold text-white">{balance.toFixed(0)}</span>
             </div>
           )}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-muted-foreground">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px] border-l border-border bg-background/95 backdrop-blur-xl">
              <nav className="flex flex-col gap-4 mt-8">
                <Link to="/" className="text-lg font-medium hover:text-gold-gradient">Casino</Link>
                <Link to="/game/dice" className="text-lg font-medium hover:text-gold-gradient">Dice</Link>
                {user ? (
                  <>
                    <Link to="/dashboard" className="text-lg font-medium hover:text-gold-gradient">Dashboard</Link>
                    <Link to="/wallet" className="text-lg font-medium hover:text-gold-gradient">Wallet</Link>
                    {profile?.role === 'admin' && (
                        <Link to="/admin" className="text-lg font-medium text-[#FFD700]">Admin Panel</Link>
                    )}
                    <div className="h-px bg-border my-2" />
                    <Button onClick={handleSignOut} variant="destructive" className="w-full">Log Out</Button>
                  </>
                ) : (
                  <div className="flex flex-col gap-3 mt-4">
                    <Link to="/auth" className="w-full">
                      <Button variant="outline" className="w-full border-border">Log In</Button>
                    </Link>
                    <Link to="/auth" className="w-full">
                      <Button className="w-full bg-gold-gradient text-black font-bold">Sign Up</Button>
                    </Link>
                  </div>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
