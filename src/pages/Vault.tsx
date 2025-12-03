import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useWallet } from '@/context/WalletContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Lock, ShieldCheck, ArrowRightLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Vault() {
  const { user } = useAuth();
  const { balance, refreshBalance } = useWallet();
  const [vaultBalance, setVaultBalance] = useState(0);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('deposit');

  useEffect(() => {
    if (user) {
      fetchVaultBalance();
    }
  }, [user]);

  const fetchVaultBalance = async () => {
    const { data, error } = await supabase
      .from('vaults')
      .select('amount')
      .eq('user_id', user?.id)
      .single();
    
    if (!error && data) {
      setVaultBalance(data.amount);
    } else if (error && error.code === 'PGRST116') {
      // No rows found, balance is 0
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
    <div className="container py-12 max-w-2xl">
      <div className="text-center space-y-4 mb-12">
        <div className="w-20 h-20 bg-[#213743] rounded-full flex items-center justify-center mx-auto border border-[#2f4553] shadow-xl">
          <Lock className="w-10 h-10 text-[#F7D979]" />
        </div>
        <h1 className="text-4xl font-bold text-white">Vault</h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Store your funds securely. Money in the vault cannot be used for betting until you withdraw it back to your wallet.
        </p>
      </div>

      <Card className="bg-[#1a2c38] border-[#2f4553] shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-[#0f212e] to-[#1a2c38] p-8 border-b border-[#2f4553]">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-[#b1bad3] font-medium uppercase tracking-wider mb-1">Vault Balance</p>
              <h2 className="text-4xl font-bold text-white font-mono">${vaultBalance.toFixed(2)}</h2>
            </div>
            <ShieldCheck className="w-16 h-16 text-[#2f4553] opacity-50" />
          </div>
        </div>

        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full rounded-none bg-[#0f212e] border-b border-[#2f4553] p-0 h-14">
              <TabsTrigger 
                value="deposit" 
                className="flex-1 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-[#F7D979] data-[state=active]:bg-[#1a2c38] data-[state=active]:text-white"
              >
                Deposit to Vault
              </TabsTrigger>
              <TabsTrigger 
                value="withdraw" 
                className="flex-1 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-[#1475e1] data-[state=active]:bg-[#1a2c38] data-[state=active]:text-white"
              >
                Withdraw from Vault
              </TabsTrigger>
            </TabsList>

            <div className="p-8 space-y-6">
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
                    {activeTab === 'deposit' ? 'Deposit Funds' : 'Withdraw Funds'} 
                    <ArrowRightLeft className="w-4 h-4" />
                  </span>
                )}
              </Button>

              <p className="text-xs text-center text-[#b1bad3]">
                {activeTab === 'deposit' 
                  ? 'Funds deposited to the vault are safe from betting.' 
                  : 'Funds withdrawn will be available in your main wallet immediately.'}
              </p>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
