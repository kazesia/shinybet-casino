import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import { AppSidebar } from './AppSidebar';
import { BottomNav } from './BottomNav';
import GlobalChat from '@/components/chat/GlobalChat';
import { useLocation } from 'react-router-dom';
import { useUI } from '@/context/UIContext';
import { cn } from '@/lib/utils';

export const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const { isSidebarCollapsed, isChatOpen } = useUI();
  const isGamePage = location.pathname.includes('/game/');

  return (
    <div className="min-h-screen bg-[#0f212e] text-white font-sans flex flex-col overflow-hidden">
      <Navbar />

      <div className="flex flex-1 pt-16 h-[calc(100vh)]">
        {/* Left Sidebar */}
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
            "flex-1 flex flex-col overflow-y-auto overflow-x-hidden transition-all duration-300 ease-in-out h-full",
            isSidebarCollapsed ? "lg:ml-[72px]" : "lg:ml-[240px]",
            isChatOpen ? "lg:mr-[320px]" : "lg:mr-0"
          )}
        >
          <div className="flex-1 min-h-0">
            {children}
          </div>
          {!isGamePage && <Footer />}
        </main>

        {/* Right Sidebar (Chat) */}
        <aside
          className={cn(
            "fixed inset-y-0 right-0 top-16 z-30 bg-[#0f212e] border-l border-[#1a2c38] shadow-xl transition-transform duration-300 ease-in-out w-[320px]",
            isChatOpen ? "translate-x-0" : "translate-x-full"
          )}
        >
          <GlobalChat />
        </aside>
      </div>
      <BottomNav />
    </div>
  );
};
