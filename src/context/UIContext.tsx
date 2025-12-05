import React, { createContext, useContext, useState, useEffect } from 'react';

interface UIContextType {
  isAuthModalOpen: boolean;
  openAuthModal: (view?: 'login' | 'register') => void;
  closeAuthModal: () => void;
  authView: 'login' | 'register';

  isWalletModalOpen: boolean;
  openWalletModal: (tab?: 'overview' | 'deposit' | 'withdraw') => void;
  closeWalletModal: () => void;
  walletTab: 'overview' | 'deposit' | 'withdraw';

  isVaultModalOpen: boolean;
  openVaultModal: () => void;
  closeVaultModal: () => void;

  isStatsModalOpen: boolean;
  openStatsModal: () => void;
  closeStatsModal: () => void;

  isFairnessModalOpen: boolean;
  openFairnessModal: () => void;
  closeFairnessModal: () => void;

  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  isChatOpen: boolean;
  toggleChat: () => void;
  setChatOpen: (open: boolean) => void;

  selectedFiat: string;
  setSelectedFiat: (currency: string) => void;
}

const UIContext = createContext<UIContextType>({
  isAuthModalOpen: false,
  openAuthModal: () => { },
  closeAuthModal: () => { },
  authView: 'login',

  isWalletModalOpen: false,
  openWalletModal: () => { },
  closeWalletModal: () => { },
  walletTab: 'overview',

  isVaultModalOpen: false,
  openVaultModal: () => { },
  closeVaultModal: () => { },

  isStatsModalOpen: false,
  openStatsModal: () => { },
  closeStatsModal: () => { },

  isFairnessModalOpen: false,
  openFairnessModal: () => { },
  closeFairnessModal: () => { },

  isSidebarCollapsed: false,
  toggleSidebar: () => { },
  setSidebarCollapsed: () => { },

  isChatOpen: true,
  toggleChat: () => { },
  setChatOpen: () => { },

  selectedFiat: 'USD',
  setSelectedFiat: () => { },
});

export const useUI = () => useContext(UIContext);

export const UIProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authView, setAuthView] = useState<'login' | 'register'>('login');

  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [walletTab, setWalletTab] = useState<'overview' | 'deposit' | 'withdraw'>('overview');

  const [isVaultModalOpen, setIsVaultModalOpen] = useState(false);

  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [isFairnessModalOpen, setIsFairnessModalOpen] = useState(false);

  // Sidebar state - default to false (expanded) on desktop
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebarCollapsed');
      return saved ? JSON.parse(saved) : false;
    }
    return false;
  });

  // Chat state - default to true (open) on desktop
  const [isChatOpen, setIsChatOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('chatOpen');
      // Default to true for larger screens if not set
      return saved ? JSON.parse(saved) : window.innerWidth > 1280;
    }
    return true;
  });

  // Fiat Currency state
  const [selectedFiat, setSelectedFiat] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('selectedFiat') || 'USD';
    }
    return 'USD';
  });

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  useEffect(() => {
    localStorage.setItem('chatOpen', JSON.stringify(isChatOpen));
  }, [isChatOpen]);

  useEffect(() => {
    localStorage.setItem('selectedFiat', selectedFiat);
  }, [selectedFiat]);

  const openAuthModal = (view: 'login' | 'register' = 'login') => {
    setAuthView(view);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => setIsAuthModalOpen(false);

  const openWalletModal = (tab: 'overview' | 'deposit' | 'withdraw' = 'overview') => {
    setWalletTab(tab);
    setIsWalletModalOpen(true);
  };

  const closeWalletModal = () => setIsWalletModalOpen(false);

  const openVaultModal = () => setIsVaultModalOpen(true);
  const closeVaultModal = () => setIsVaultModalOpen(false);

  const openStatsModal = () => setIsStatsModalOpen(true);
  const closeStatsModal = () => setIsStatsModalOpen(false);

  const openFairnessModal = () => setIsFairnessModalOpen(true);
  const closeFairnessModal = () => setIsFairnessModalOpen(false);

  const toggleSidebar = () => setIsSidebarCollapsed(prev => !prev);
  const setSidebarCollapsed = (val: boolean) => setIsSidebarCollapsed(val);

  const toggleChat = () => setIsChatOpen(prev => !prev);
  const setChatOpen = (val: boolean) => setIsChatOpen(val);

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
      isVaultModalOpen,
      openVaultModal,
      closeVaultModal,
      isStatsModalOpen,
      openStatsModal,
      closeStatsModal,
      isFairnessModalOpen,
      openFairnessModal,
      closeFairnessModal,
      isSidebarCollapsed,
      toggleSidebar,
      setSidebarCollapsed,
      isChatOpen,
      toggleChat,
      setChatOpen,
      selectedFiat,
      setSelectedFiat
    }}>
      {children}
    </UIContext.Provider>
  );
};
