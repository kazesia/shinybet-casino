import { useState } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import {
  LayoutDashboard,
  Users,
  ArrowDownLeft,
  ArrowUpRight,
  History,
  Settings,
  LogOut,
  Menu,
  Shield,
  Home,
  Dices
} from 'lucide-react';
import { cn } from '@/lib/utils';

const LOGO_URL = "https://cdn.discordapp.com/attachments/1442155264613814302/1445539875116810392/Collabeco_2_-removebg-preview.png?ex=6930b76b&is=692f65eb&hm=9be06a69591c9fba9edca705a2295c341ddde42e5112db67b58dbc0d77f00ed5";

const NAV_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
  { label: 'Users', icon: Users, path: '/admin/users' },
  { label: 'Withdrawals', icon: ArrowDownLeft, path: '/admin/withdrawals' },
  { label: 'Deposits', icon: ArrowUpRight, path: '/admin/deposits' },
  { label: 'Casino Bets', icon: Dices, path: '/admin/bets/casino' },
  { label: 'Sports Bets', icon: Dices, path: '/admin/bets/sports' },
  { label: 'Transactions', icon: History, path: '/admin/transactions' },
  { label: 'Affiliates', icon: Users, path: '/admin/affiliates' },
  { label: 'Settings', icon: Settings, path: '/admin/settings' },
];

export default function AdminLayout() {
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  // Safe access to profile data
  const username = profile?.username || 'Admin';
  const role = profile?.role?.replace('_', ' ') || 'Staff';
  const initials = username.substring(0, 2).toUpperCase();

  const NavContent = () => (
    <div className="flex flex-col h-full bg-admin-surface border-r border-admin-border">
      <div className="flex items-center gap-2 px-6 py-6 border-b border-admin-border">
        <img src={LOGO_URL} alt="Shiny Admin" className="h-8 w-auto" />
        <span className="text-xl font-bold tracking-tight text-white">
          Shiny<span className="text-admin-accent">.admin</span>
        </span>
      </div>

      <div className="flex-1 py-6 px-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link key={item.path} to={item.path} onClick={() => setOpen(false)}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3 mb-1 transition-all duration-200",
                  isActive
                    ? "bg-admin-accent/10 text-admin-accent hover:bg-admin-accent/20 hover:text-admin-accent border-r-2 border-admin-accent rounded-r-none"
                    : "text-muted-foreground hover:text-white hover:bg-white/5"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Button>
            </Link>
          );
        })}

        <div className="my-4 border-t border-admin-border mx-3" />

        <Link to="/" onClick={() => setOpen(false)}>
          <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground hover:text-white hover:bg-white/5">
            <Home className="h-4 w-4" />
            Back to Casino
          </Button>
        </Link>
      </div>

      <div className="p-4 border-t border-admin-border bg-black/20">
        <div className="flex items-center gap-3 mb-4 px-2">
          <Avatar className="h-9 w-9 border border-white/10">
            <AvatarImage src="" />
            <AvatarFallback className="bg-admin-accent text-black font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-medium truncate text-white">{username}</span>
            <div className="flex items-center gap-1">
              <Shield className="h-3 w-3 text-admin-accent" />
              <span className="text-xs text-muted-foreground capitalize">{role}</span>
            </div>
          </div>
        </div>
        <Button variant="outline" className="w-full border-admin-border bg-transparent hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/50" onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" /> Sign Out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-admin-bg w-full font-sans text-white">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 fixed inset-y-0 left-0 z-50 flex-col">
        <NavContent />
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 border-b border-admin-border bg-admin-surface/80 backdrop-blur-md z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <img src={LOGO_URL} alt="Shiny Admin" className="h-8 w-auto" />
          <span className="font-bold text-white">Admin Panel</span>
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-white">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 bg-admin-surface border-r-admin-border w-72">
            <NavContent />
          </SheetContent>
        </Sheet>
      </div>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 p-4 lg:p-8 pt-20 lg:pt-8 overflow-x-hidden w-full bg-admin-bg min-h-screen">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
    </div>
  );
}
