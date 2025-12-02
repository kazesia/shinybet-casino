import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import { AppSidebar } from './AppSidebar';

export const MainLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen bg-[#0f212e] text-white font-sans flex flex-col">
      <Navbar />
      
      <div className="flex flex-1 pt-16">
        {/* Desktop Sidebar - Compact */}
        <aside className="hidden lg:block w-[60px] fixed inset-y-0 left-0 top-16 z-30 bg-[#0f212e] border-r border-[#1a2c38]">
          <AppSidebar />
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 lg:ml-[60px] min-h-[calc(100vh-64px)] flex flex-col w-full overflow-x-hidden">
          <div className="flex-1">
            {children}
          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
};
