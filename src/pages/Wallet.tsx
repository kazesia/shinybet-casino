import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUI } from '@/context/UIContext';

export default function WalletPage() {
  const navigate = useNavigate();
  const { openWalletModal } = useUI();

  useEffect(() => {
    // Open wallet modal and redirect to home
    openWalletModal('overview');
    navigate('/', { replace: true });
  }, [navigate, openWalletModal]);

  return null;
}
