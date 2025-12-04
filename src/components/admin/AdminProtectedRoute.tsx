import { useAuth } from '@/context/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';

export const AdminProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();
  const [checkingAccess, setCheckingAccess] = useState(true);

  // Timeout after 3 seconds if profile doesn't load
  useEffect(() => {
    if (!loading && user) {
      const timer = setTimeout(() => {
        setCheckingAccess(false);
      }, 3000);

      if (profile) {
        clearTimeout(timer);
        setCheckingAccess(false);
      }

      return () => clearTimeout(timer);
    }
  }, [loading, user, profile]);

  // Show loading while auth state is being determined
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#0f212e]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-[#F7D979]" />
          <p className="text-[#b1bad3] text-sm">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  // Redirect to auth if not logged in
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Show loading while checking access (with timeout)
  if (checkingAccess && !profile) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#0f212e]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-[#F7D979]" />
          <p className="text-[#b1bad3] text-sm">Verifying permissions...</p>
        </div>
      </div>
    );
  }

  // If profile still hasn't loaded after timeout, show error
  if (!profile) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-[#0f212e] gap-6 p-4">
        <div className="flex flex-col items-center gap-4 max-w-md text-center">
          <div className="p-4 bg-red-500/10 rounded-full">
            <ShieldAlert className="h-16 w-16 text-red-500" />
          </div>
          <h1 className="text-3xl font-bold text-white">Profile Load Error</h1>
          <p className="text-[#b1bad3] text-lg">
            Unable to load your profile. Please try refreshing the page.
          </p>
          <div className="flex gap-3 mt-4">
            <Button
              onClick={() => window.location.reload()}
              className="bg-[#1475e1] hover:bg-[#1475e1]/90 text-white font-bold"
            >
              Refresh Page
            </Button>
            <Link to="/">
              <Button variant="outline" className="border-[#2f4553] text-white hover:bg-[#213743]">
                Return to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Check for admin role
  const isAdmin = profile.role === 'admin' || profile.role === 'super_admin';

  if (!isAdmin) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-[#0f212e] gap-6 p-4">
        <div className="flex flex-col items-center gap-4 max-w-md text-center">
          <div className="p-4 bg-red-500/10 rounded-full">
            <ShieldAlert className="h-16 w-16 text-red-500" />
          </div>
          <h1 className="text-3xl font-bold text-white">Access Denied</h1>
          <p className="text-[#b1bad3] text-lg">
            You do not have permission to access the admin panel.
          </p>
          <p className="text-[#b1bad3] text-sm">
            Current role: <span className="text-white font-semibold">{profile.role || 'user'}</span>
          </p>
          <Link to="/">
            <Button className="bg-[#1475e1] hover:bg-[#1475e1]/90 text-white font-bold mt-4">
              Return to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

