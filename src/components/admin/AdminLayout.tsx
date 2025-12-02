import { useState } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  LayoutDashboard, 
  Users, 
  Wallet, 
  ArrowDownLeft, 
  History, 
  Settings, 
  LogOut, 
  Menu, 
  Gamepad2,
  Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
  { label: 'Users', icon: Users, path: '/admin/users' },
  { label: 'Withdrawals', icon: ArrowDownLeft, path: '/admin/withdrawals' },
  { label: 'Activity Logs', icon: History, path: '/admin/activity' },
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

  const NavContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-6 py-6 border-b border-white/5">
        <div className="h-8 w-8 rounded-lg bg-gold-gradient flex items-center justify-center shadow-gold">
          <Gamepad2 className="h-5 w-5 text-black" />
        </div>
        <span className="text-xl font-bold tracking-tight">
          Shiny<span className="text-gold-gradient">.admin</span>
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
                  "w-full justify-start gap-3 mb-1",
                  isActive 
                    ? "bg-[#F7D979]/10 text-[#F7D979] hover:bg-[#F7D979]/20 hover:text-[#F7D979]" 
                    : "text-muted-foreground hover:text-white hover:bg-white/5"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Button>
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-white/5">
        <div className="flex items-center gap-3 mb-4 px-2">
          <Avatar className="h-9 w-9 border border-white/10">
            <AvatarImage src="" />
            <AvatarFallback className="bg-[#F7D979] text-black font-bold">
              {profile?.username?.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-medium truncate">{profile?.username}</span>
            <div className="flex items-center gap-1">
              <Shield className="h-3 w-3 text-[#F7D979]" />
              <span className="text-xs text-muted-foreground capitalize">{profile?.role?.replace('_', ' ')}</span>
            </div>
          </div>
        </div>
        <Button variant="outline" className="w-full border-white/10 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/50" onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" /> Sign Out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 border-r border-white/5 bg-brand-surface fixed inset-y-0 left-0 z-50">
        <NavContent />
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 border-b border-white/5 bg-brand-surface/80 backdrop-blur-md z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gold-gradient flex items-center justify-center">
            <Gamepad2 className="h-5 w-5 text-black" />
          </div>
          <span className="font-bold">Admin Panel</span>
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 bg-brand-surface border-r-white/10 w-72">
            <NavContent />
          </SheetContent>
        </Sheet>
      </div>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 p-4 lg:p-8 pt-20 lg:pt-8 overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
}
