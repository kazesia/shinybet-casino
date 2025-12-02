import React, { createContext, useContext, useState } from 'react';

interface UIContextType {
  isAuthModalOpen: boolean;
  openAuthModal: (view?: 'login' | 'register') => void;
  closeAuthModal: () => void;
  authView: 'login' | 'register';
  
  isWalletModalOpen: boolean;
  openWalletModal: (tab?: 'deposit' | 'withdraw') => void;
  closeWalletModal: () => void;
  walletTab: 'deposit' | 'withdraw';
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
});

export const useUI = () => useContext(UIContext);

export const UIProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [walletTab, setWalletTab] = useState<'deposit' | 'withdraw'>('deposit');

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

  return (
    <UIContext.Provider value={{
      isAuthModalOpen,
      openAuthModal,
      closeAuthModal,
      authView,
      isWalletModalOpen,
      openWalletModal,
      closeWalletModal,
      walletTab
    }}>
      {children}
    </UIContext.Provider>
  );
};
