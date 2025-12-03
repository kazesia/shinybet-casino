import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useWallet } from '@/context/WalletContext';
import { useUI } from '@/context/UIContext';
import { supabase } from '@/lib/supabase';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Lock, ShieldCheck, ArrowRightLeft, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';

export function VaultModal() {
  const { user } = useAuth();
  const { balance, refreshBalance } = useWallet();
  const { isVaultModalOpen, closeVaultModal } = useUI();
  
  const [vaultBalance, setVaultBalance] = useState(0);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('deposit');

  useEffect(() => {
    if (user && isVaultModalOpen) {
      fetchVaultBalance();
    }
  }, [user, isVaultModalOpen]);

  const fetchVaultBalance = async () => {
    const { data, error } = await supabase
      .from('vaults')
      .select('amount')
      .eq('user_id', user?.id)
      .single();
    
    if (!error && data) {
      setVaultBalance(data.amount);
    } else if (error && error.code === 'PGRST116') {
      setVaultBalance(0);
    }
  };

  const handleTransfer = async () => {
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('vault_transfer', {
        p_amount: val,
        p_direction: activeTab // 'deposit' or 'withdraw'
      });

      if (error) throw error;

      setVaultBalance(data);
      await refreshBalance(); // Update main wallet context
      setAmount('');
      toast.success(`Successfully ${activeTab === 'deposit' ? 'deposited to' : 'withdrawn from'} vault!`);
    } catch (error: any) {
      toast.error(error.message || "Transfer failed");
    } finally {
      setLoading(false);
    }
  };

  const setMax = () => {
    if (activeTab === 'deposit') {
      setAmount(balance.toString());
    } else {
      setAmount(vaultBalance.toString());
    }
  };

  return (
    <Dialog open={isVaultModalOpen} onOpenChange={(open) => !open && closeVaultModal()}>
      <DialogContent className="sm:max-w-[480px] bg-[#1a2c38] border-[#2f4553] text-white p-0 gap-0 overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2f4553] bg-[#0f212e]">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-[#F7D979]" />
            <DialogTitle className="text-lg font-bold text-white">Vault</DialogTitle>
          </div>
          <Button variant="ghost" size="icon" onClick={closeVaultModal} className="text-[#b1bad3] hover:text-white hover:bg-[#2f4553] h-8 w-8 rounded-full">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Balance Display */}
        <div className="bg-gradient-to-r from-[#0f212e] to-[#1a2c38] p-8 border-b border-[#2f4553] text-center">
          <p className="text-sm text-[#b1bad3] font-medium uppercase tracking-wider mb-1">Vault Balance</p>
          <h2 className="text-4xl font-bold text-white font-mono">${vaultBalance.toFixed(2)}</h2>
          <div className="flex items-center justify-center gap-2 mt-2 text-[#b1bad3] text-xs">
             <ShieldCheck className="w-3 h-3" /> Secure Storage
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full rounded-none bg-[#0f212e] border-b border-[#2f4553] p-0 h-12">
            <TabsTrigger 
              value="deposit" 
              className="flex-1 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-[#F7D979] data-[state=active]:bg-[#1a2c38] data-[state=active]:text-white"
            >
              Deposit
            </TabsTrigger>
            <TabsTrigger 
              value="withdraw" 
              className="flex-1 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-[#1475e1] data-[state=active]:bg-[#1a2c38] data-[state=active]:text-white"
            >
              Withdraw
            </TabsTrigger>
          </TabsList>

          <div className="p-6 space-y-6 bg-[#1a2c38]">
            <div className="flex justify-between text-sm">
              <span className="text-[#b1bad3]">
                {activeTab === 'deposit' ? 'Available Wallet Balance' : 'Available Vault Balance'}
              </span>
              <span className="font-bold text-white font-mono">
                ${activeTab === 'deposit' ? balance.toFixed(2) : vaultBalance.toFixed(2)}
              </span>
            </div>

            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#b1bad3] font-bold">$</div>
              <Input 
                type="number" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="bg-[#0f212e] border-[#2f4553] h-14 pl-8 pr-20 text-lg font-bold text-white focus-visible:ring-1 focus-visible:ring-[#F7D979]"
              />
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={setMax}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#F7D979] hover:text-[#F7D979] hover:bg-[#F7D979]/10 font-bold"
              >
                MAX
              </Button>
            </div>

            <Button 
              onClick={handleTransfer}
              disabled={loading}
              className={`w-full h-12 font-bold text-base ${
                activeTab === 'deposit' 
                  ? 'bg-[#F7D979] text-black hover:bg-[#F7D979]/90' 
                  : 'bg-[#1475e1] text-white hover:bg-[#1475e1]/90'
              }`}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <span className="flex items-center gap-2">
                  {activeTab === 'deposit' ? 'Deposit to Vault' : 'Withdraw to Wallet'} 
                  <ArrowRightLeft className="w-4 h-4" />
                </span>
              )}
            </Button>

            <p className="text-xs text-center text-[#b1bad3]">
              {activeTab === 'deposit' 
                ? 'Funds in vault are not available for betting.' 
                : 'Withdrawn funds are instantly available for play.'}
            </p>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
