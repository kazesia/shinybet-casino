import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useUI } from '@/context/UIContext';
import { supabase } from '@/lib/supabase';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import QRCode from 'react-qr-code';
import { Copy, Loader2, AlertCircle, Wallet } from 'lucide-react';

export function WalletModal() {
  const { user } = useAuth();
  const { isWalletModalOpen, closeWalletModal, walletTab } = useUI();
  const [activeTab, setActiveTab] = useState(walletTab);
  
  const [balance, setBalance] = useState(0);
  const [depositCurrency, setDepositCurrency] = useState('BTC');
  const [depositAddress, setDepositAddress] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [withdrawCurrency, setWithdrawCurrency] = useState('BTC');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isWalletModalOpen) {
      setActiveTab(walletTab);
      if (user) fetchWalletData();
    }
  }, [isWalletModalOpen, walletTab, user, depositCurrency]);

  const fetchWalletData = async () => {
    // Fetch Balance
    const { data: wallet } = await supabase.from('wallets').select('credits').eq('user_id', user?.id).single();
    if (wallet) setBalance(wallet.credits);

    // Fetch Address
    const { data: addr } = await supabase
      .from('deposit_addresses')
      .select('address')
      .eq('user_id', user?.id)
      .eq('currency', depositCurrency)
      .eq('active', true)
      .single();

    if (addr) {
      setDepositAddress(addr.address);
    } else {
      // Mock address generation
      const mockAddr = `mock_${depositCurrency.toLowerCase()}_${Math.random().toString(36).substring(7)}`;
      setDepositAddress(mockAddr);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(depositAddress);
    toast.success("Address copied to clipboard");
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Invalid amount");
      setIsSubmitting(false);
      return;
    }

    try {
      const { error } = await supabase.rpc('request_withdrawal', {
        p_user_id: user?.id,
        p_amount: amount,
        p_currency: withdrawCurrency,
        p_address: withdrawAddress
      });

      if (error) throw error;

      toast.success("Withdrawal requested successfully");
      setWithdrawAmount('');
      setWithdrawAddress('');
      fetchWalletData();
      closeWalletModal();
    } catch (error: any) {
      toast.error(error.message || "Withdrawal failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isWalletModalOpen} onOpenChange={(open) => !open && closeWalletModal()}>
      <DialogContent className="sm:max-w-[500px] bg-zinc-950 border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-[#F7D979]" /> 
            Wallet
          </DialogTitle>
          <DialogDescription>
            Manage your funds securely. Current Balance: <span className="text-[#F7D979] font-bold">{balance.toFixed(2)}</span>
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'deposit' | 'withdraw')} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 bg-zinc-900/50">
            <TabsTrigger value="deposit">Deposit</TabsTrigger>
            <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
          </TabsList>

          {/* DEPOSIT TAB */}
          <TabsContent value="deposit" className="space-y-4">
            <div className="space-y-2">
              <Label>Select Currency</Label>
              <Select value={depositCurrency} onValueChange={setDepositCurrency}>
                <SelectTrigger className="bg-zinc-900 border-white/10">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BTC">Bitcoin (BTC)</SelectItem>
                  <SelectItem value="ETH">Ethereum (ETH)</SelectItem>
                  <SelectItem value="USDT">Tether (USDT)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col items-center justify-center p-6 bg-white rounded-xl">
              <QRCode value={depositAddress} size={150} />
            </div>

            <div className="space-y-2">
              <Label>Deposit Address</Label>
              <div className="flex gap-2">
                <Input readOnly value={depositAddress} className="bg-zinc-900 border-white/10 font-mono text-xs" />
                <Button size="icon" variant="outline" onClick={handleCopy} className="shrink-0 border-white/10 hover:bg-white/5">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-xs text-yellow-500 bg-yellow-500/10 p-3 rounded-lg border border-yellow-500/20">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Only send {depositCurrency} to this address. Other assets will be lost.</span>
            </div>
          </TabsContent>

          {/* WITHDRAW TAB */}
          <TabsContent value="withdraw">
            <form onSubmit={handleWithdraw} className="space-y-4">
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select value={withdrawCurrency} onValueChange={setWithdrawCurrency}>
                  <SelectTrigger className="bg-zinc-900 border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BTC">Bitcoin (BTC)</SelectItem>
                    <SelectItem value="ETH">Ethereum (ETH)</SelectItem>
                    <SelectItem value="USDT">Tether (USDT)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Amount (Credits)</Label>
                <div className="relative">
                  <Input 
                    type="number" 
                    placeholder="0.00" 
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="bg-zinc-900 border-white/10"
                  />
                  <Button 
                    type="button" 
                    variant="ghost" 
                    className="absolute right-1 top-1 h-7 text-xs text-[#F7D979]"
                    onClick={() => setWithdrawAmount(balance.toString())}
                  >
                    MAX
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Target Address</Label>
                <Input 
                  placeholder={`Enter ${withdrawCurrency} Address`}
                  value={withdrawAddress}
                  onChange={(e) => setWithdrawAddress(e.target.value)}
                  className="bg-zinc-900 border-white/10"
                />
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full bg-[#F7D979] text-black font-bold hover:bg-[#F7D979]/90 mt-4">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Request Withdrawal
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
