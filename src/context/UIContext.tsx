import React, { createContext, useContext, useState, useEffect } from 'react';

interface UIContextType {
  isAuthModalOpen: boolean;
  openAuthModal: (view?: 'login' | 'register') => void;
  closeAuthModal: () => void;
  authView: 'login' | 'register';
  
  isWalletModalOpen: boolean;
  openWalletModal: (tab?: 'deposit' | 'withdraw') => void;
  closeWalletModal: () => void;
  walletTab: 'deposit' | 'withdraw';

  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

const UIContext = createContext<UIContextType>({
  isAuthModalOpen: false,
  openAuthModal: () => {},
  closeAuthModal: () => {},
  authView: 'login',
  
  isWalletModalOpen: false,
  openWalletModal: () => {},
  closeWalletModal: () => {},
  walletTab: 'deposit',

  isSidebarCollapsed: false,
  toggleSidebar: () => {},
  setSidebarCollapsed: () => {},
});

export const useUI = () => useContext(UIContext);

export const UIProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [walletTab, setWalletTab] = useState<'deposit' | 'withdraw'>('deposit');

  // Sidebar state - default to false (expanded) on desktop
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebarCollapsed');
      return saved ? JSON.parse(saved) : false;
    }
    return false;
  });

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  const openAuthModal = (view: 'login' | 'register' = 'login') => {
    setAuthView(view);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => setIsAuthModalOpen(false);

  const openWalletModal = (tab: 'deposit' | 'withdraw' = 'deposit') => {
    setWalletTab(tab);
    setIsWalletModalOpen(true);
  };

  const closeWalletModal = () => setIsWalletModalOpen(false);

  const toggleSidebar = () => setIsSidebarCollapsed(prev => !prev);
  const setSidebarCollapsed = (val: boolean) => setIsSidebarCollapsed(val);

  return (
    <UIContext.Provider value={{
      isAuthModalOpen,
      openAuthModal,
      closeAuthModal,
      authView,
      isWalletModalOpen,
      openWalletModal,
      closeWalletModal,
      walletTab,
      isSidebarCollapsed,
      toggleSidebar,
      setSidebarCollapsed
    }}>
      {children}
    </UIContext.Provider>
  );
};
