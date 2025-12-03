import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import { AppSidebar } from './AppSidebar';
import { useLocation } from 'react-router-dom';
import { useUI } from '@/context/UIContext';
import { cn } from '@/lib/utils';

export const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const { isSidebarCollapsed } = useUI();
  const isGamePage = location.pathname.includes('/game/');

  // Sidebar width constants
  const SIDEBAR_WIDTH = 240;
  const SIDEBAR_COLLAPSED_WIDTH = 72;

  return (
    <div className="min-h-screen bg-[#0f212e] text-white font-sans flex flex-col">
      <Navbar />
      
      <div className="flex flex-1 pt-16">
        {/* Desktop Sidebar */}
        <aside 
          className={cn(
            "hidden lg:block fixed inset-y-0 left-0 top-16 z-30 bg-[#0f212e] border-r border-[#1a2c38] shadow-xl transition-all duration-300 ease-in-out",
            isSidebarCollapsed ? "w-[72px]" : "w-[240px]"
          )}
        >
          <AppSidebar />
        </aside>

        {/* Main Content Area */}
        <main 
          className={cn(
            "flex-1 min-h-[calc(100vh-64px)] flex flex-col w-full overflow-x-hidden transition-all duration-300 ease-in-out",
            isSidebarCollapsed ? "lg:ml-[72px]" : "lg:ml-[240px]"
          )}
        >
          <div className="flex-1">
            {children}
          </div>
          {!isGamePage && <Footer />}
        </main>
      </div>
    </div>
  );
};
