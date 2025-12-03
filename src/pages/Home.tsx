import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Hero from '@/components/home/Hero';
import GameGrid from '@/components/home/GameGrid';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#F7D979]" />
      </div>
    );
  }

  // If user is logged in, redirect to Dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  // Otherwise show Landing Page
  return (
    <main>
      <Hero />
      <GameGrid />
    </main>
  );
}
