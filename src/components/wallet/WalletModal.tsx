import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useUI } from '@/context/UIContext';
import { supabase } from '@/lib/supabase';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import QRCode from 'react-qr-code';
import { 
  Copy, 
  Loader2, 
  Wallet, 
  ChevronLeft, 
  ChevronRight, 
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// Mock Data for Coins
const COINS = [
  { id: 'BTC', name: 'Bitcoin', icon: '₿', color: 'bg-orange-500' },
  { id: 'ETH', name: 'Ethereum', icon: 'Ξ', color: 'bg-blue-500' },
  { id: 'LTC', name: 'Litecoin', icon: 'Ł', color: 'bg-gray-400' },
  { id: 'USDT', name: 'Tether', icon: '₮', color: 'bg-green-500' },
  { id: 'SOL', name: 'Solana', icon: '◎', color: 'bg-purple-500' },
];

export function WalletModal() {
  const { user } = useAuth();
  const { isWalletModalOpen, closeWalletModal, walletTab } = useUI();
  const [view, setView] = useState<'overview' | 'deposit' | 'withdraw'>('overview');
  const [balance, setBalance] = useState(0);

  // Deposit State
  const [selectedCoin, setSelectedCoin] = useState(COINS[2]); // Default LTC
  const [depositAddress, setDepositAddress] = useState('');
  const [isAddressLoading, setIsAddressLoading] = useState(false);
  const [openCombobox, setOpenCombobox] = useState(false);

  // Withdraw State
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isWalletModalOpen) {
      if (walletTab === 'deposit' || walletTab === 'withdraw') {
        setView(walletTab);
      } else {
        setView('overview');
      }
      if (user) fetchWalletData();
    }
  }, [isWalletModalOpen, walletTab, user]);

  // Fetch address when coin changes
  useEffect(() => {
    if (view === 'deposit' && user) {
      fetchDepositAddress();
    }
  }, [selectedCoin, view, user]);

  const fetchWalletData = async () => {
    const { data: wallet } = await supabase.from('wallets').select('credits').eq('user_id', user?.id).single();
    if (wallet) setBalance(wallet.credits);
  };

  const fetchDepositAddress = async () => {
    setIsAddressLoading(true);
    try {
      const { data: addr } = await supabase
        .from('deposit_addresses')
        .select('address')
        .eq('user_id', user?.id)
        .eq('currency', selectedCoin.id)
        .eq('active', true)
        .single();

      if (addr) {
        setDepositAddress(addr.address);
      } else {
        // Mock address generation
        const mockAddr = `${selectedCoin.id.toLowerCase()}_${Math.random().toString(36).substring(7)}...`;
        setDepositAddress(mockAddr);
      }
    } finally {
      setIsAddressLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(depositAddress);
    toast.success("Address copied to clipboard");
  };

  const handleWithdraw = async () => {
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
        p_currency: selectedCoin.id,
        p_address: withdrawAddress
      });

      if (error) throw error;

      toast.success("Withdrawal requested successfully");
      setWithdrawAmount('');
      setWithdrawAddress('');
      fetchWalletData();
      setView('overview');
    } catch (error: any) {
      toast.error(error.message || "Withdrawal failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Sub-Components ---

  const CoinIcon = ({ coin, className }: { coin: typeof selectedCoin, className?: string }) => (
    <div className={cn(`flex items-center justify-center rounded-full text-white font-bold ${coin.color}`, className)}>
      {coin.icon}
    </div>
  );

  const OverviewView = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
      {/* Balance Header */}
      <div className="space-y-1">
        <div className="text-sm text-[#b1bad3] font-medium">Balance</div>
        <div className="flex items-center gap-2">
          <span className="text-3xl font-bold text-white">${balance.toFixed(2)}</span>
          <div className="bg-[#00e701] rounded-full p-0.5">
            <div className="w-4 h-4 text-black font-bold flex items-center justify-center text-[10px]">$</div>
          </div>
        </div>
      </div>

      {/* Currency List */}
      <div className="bg-[#0f212e] rounded-xl border border-[#2f4553] overflow-hidden">
        <div className="flex justify-between px-4 py-3 border-b border-[#2f4553] bg-[#1a2c38]">
          <span className="text-sm text-[#b1bad3]">Currency</span>
          <span className="text-sm text-[#b1bad3]">Value</span>
        </div>
        <div className="divide-y divide-[#2f4553]">
          {/* Main Balance (Credits) */}
          <div className="flex items-center justify-between px-4 py-4 hover:bg-[#213743] transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#00e701] flex items-center justify-center text-black font-bold">$</div>
              <div>
                <div className="font-bold text-white">USD</div>
                <div className="text-xs text-[#b1bad3]">US Dollar</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold text-white">{balance.toFixed(2)}</div>
              <div className="text-xs text-[#b1bad3]">$1.00</div>
            </div>
          </div>
          
          {/* Other Coins (Mocked for UI demo) */}
          {COINS.slice(0, 3).map(coin => (
            <div key={coin.id} className="flex items-center justify-between px-4 py-4 hover:bg-[#213743] transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <CoinIcon coin={coin} className="w-8 h-8 text-sm" />
                <div>
                  <div className="font-bold text-white">{coin.id}</div>
                  <div className="text-xs text-[#b1bad3]">{coin.name}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-white">0.00000000</div>
                <div className="text-xs text-[#b1bad3]">$0.00 USD</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <Button 
          onClick={() => setView('withdraw')}
          className="h-12 bg-[#2f4553] hover:bg-[#3d5565] text-white font-bold text-base rounded-lg"
        >
          Withdraw
        </Button>
        <Button 
          onClick={() => setView('deposit')}
          className="h-12 bg-[#1475e1] hover:bg-[#1475e1]/90 text-white font-bold text-base rounded-lg"
        >
          Deposit
        </Button>
      </div>

      {/* 2FA Promo */}
      <div className="bg-gradient-to-r from-[#1a2c38] to-[#0f212e] rounded-xl p-4 border border-[#2f4553] flex flex-col gap-3">
        <p className="text-sm text-[#b1bad3]">Improve your account security with Two-Factor Authentication</p>
        <Button variant="outline" className="w-full border-[#2f4553] bg-[#213743] hover:bg-[#2f4553] text-white font-bold">
          Enable 2FA
        </Button>
      </div>
    </div>
  );

  const DepositView = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <Button variant="ghost" size="icon" onClick={() => setView('overview')} className="h-8 w-8 -ml-2 text-[#b1bad3] hover:text-white">
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h2 className="text-lg font-bold text-white">Deposit</h2>
      </div>

      {/* Coin Selector */}
      <div className="space-y-2">
        <label className="text-sm text-[#b1bad3] font-medium">Currency</label>
        <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={openCombobox}
              className="w-full justify-between bg-[#1a2c38] border-[#2f4553] text-white hover:bg-[#213743] hover:text-white h-14 px-4"
            >
              <div className="flex items-center gap-3">
                <CoinIcon coin={selectedCoin} className="w-8 h-8 text-sm" />
                <div className="flex flex-col items-start">
                  <span className="font-bold leading-none">{selectedCoin.id}</span>
                  <span className="text-xs text-[#b1bad3] leading-none mt-1">{selectedCoin.name}</span>
                </div>
              </div>
              <ChevronRight className="ml-2 h-4 w-4 shrink-0 opacity-50 rotate-90" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[400px] p-0 bg-[#1a2c38] border-[#2f4553]">
            <Command className="bg-[#1a2c38] text-white">
              <CommandInput placeholder="Search coin..." className="h-12 border-b border-[#2f4553]" />
              <CommandList>
                <CommandEmpty>No coin found.</CommandEmpty>
                <CommandGroup>
                  {COINS.map((coin) => (
                    <CommandItem
                      key={coin.id}
                      value={coin.name}
                      onSelect={() => {
                        setSelectedCoin(coin);
                        setOpenCombobox(false);
                      }}
                      className="flex items-center gap-3 px-4 py-3 cursor-pointer aria-selected:bg-[#213743] aria-selected:text-white hover:bg-[#213743]"
                    >
                      <CoinIcon coin={coin} className="w-8 h-8 text-sm" />
                      <div className="flex flex-col">
                        <span className="font-bold text-white">{coin.id}</span>
                        <span className="text-xs text-[#b1bad3]">{coin.name}</span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* QR Code & Address */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6 py-4">
        <div className="bg-white p-4 rounded-xl">
          <QRCode value={depositAddress} size={160} />
        </div>
        
        <div className="w-full space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-[#b1bad3]">Deposit Address</span>
            <span className="text-[#b1bad3] text-xs">Network: <span className="text-white font-bold">{selectedCoin.name}</span></span>
          </div>
          <div className="flex gap-2">
            <div className="flex-1 bg-[#0f212e] border border-[#2f4553] rounded-lg px-4 py-3 text-sm font-mono text-white truncate flex items-center">
               {isAddressLoading ? <Loader2 className="h-4 w-4 animate-spin text-[#b1bad3]" /> : depositAddress}
            </div>
            <Button 
              onClick={handleCopy}
              className="h-full aspect-square bg-[#2f4553] hover:bg-[#3d5565] border border-[#2f4553]"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="bg-[#0f212e] rounded-lg p-3 border border-[#2f4553] flex items-center justify-between text-xs">
        <span className="text-[#b1bad3]">Direct Deposit</span>
        <div className="flex items-center gap-2">
           <div className="flex -space-x-2">
              <div className="w-5 h-5 rounded-full bg-yellow-500 border border-[#0f212e]" />
              <div className="w-5 h-5 rounded-full bg-orange-500 border border-[#0f212e]" />
              <div className="w-5 h-5 rounded-full bg-blue-500 border border-[#0f212e]" />
           </div>
           <span className="text-[#b1bad3]">+300</span>
        </div>
      </div>
    </div>
  );

  const WithdrawView = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex items-center gap-2 mb-2">
        <Button variant="ghost" size="icon" onClick={() => setView('overview')} className="h-8 w-8 -ml-2 text-[#b1bad3] hover:text-white">
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h2 className="text-lg font-bold text-white">Withdraw</h2>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm text-[#b1bad3] font-medium">Currency</label>
          <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={openCombobox}
                className="w-full justify-between bg-[#1a2c38] border-[#2f4553] text-white hover:bg-[#213743] hover:text-white h-14 px-4"
              >
                <div className="flex items-center gap-3">
                  <CoinIcon coin={selectedCoin} className="w-8 h-8 text-sm" />
                  <div className="flex flex-col items-start">
                    <span className="font-bold leading-none">{selectedCoin.id}</span>
                    <span className="text-xs text-[#b1bad3] leading-none mt-1">{selectedCoin.name}</span>
                  </div>
                </div>
                <ChevronRight className="ml-2 h-4 w-4 shrink-0 opacity-50 rotate-90" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0 bg-[#1a2c38] border-[#2f4553]">
              <Command className="bg-[#1a2c38] text-white">
                <CommandInput placeholder="Search coin..." className="h-12 border-b border-[#2f4553]" />
                <CommandList>
                  <CommandEmpty>No coin found.</CommandEmpty>
                  <CommandGroup>
                    {COINS.map((coin) => (
                      <CommandItem
                        key={coin.id}
                        value={coin.name}
                        onSelect={() => {
                          setSelectedCoin(coin);
                          setOpenCombobox(false);
                        }}
                        className="flex items-center gap-3 px-4 py-3 cursor-pointer aria-selected:bg-[#213743] aria-selected:text-white hover:bg-[#213743]"
                      >
                        <CoinIcon coin={coin} className="w-8 h-8 text-sm" />
                        <div className="flex flex-col">
                          <span className="font-bold text-white">{coin.id}</span>
                          <span className="text-xs text-[#b1bad3]">{coin.name}</span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <label className="text-[#b1bad3] font-medium">Amount</label>
            <span className="text-[#b1bad3]">Available: <span className="text-white font-bold">{balance.toFixed(8)}</span></span>
          </div>
          <div className="relative">
            <Input 
              type="number"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              className="bg-[#0f212e] border-[#2f4553] text-white font-bold h-12 pl-4 pr-16 focus-visible:ring-1 focus-visible:ring-[#1475e1]"
              placeholder="0.00000000"
            />
            <Button 
              variant="ghost" 
              className="absolute right-1 top-1 h-10 text-[#1475e1] font-bold hover:text-[#1475e1] hover:bg-[#1475e1]/10"
              onClick={() => setWithdrawAmount(balance.toString())}
            >
              Max
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm text-[#b1bad3] font-medium">Address</label>
          <Input 
            value={withdrawAddress}
            onChange={(e) => setWithdrawAddress(e.target.value)}
            className="bg-[#0f212e] border-[#2f4553] text-white font-mono h-12 focus-visible:ring-1 focus-visible:ring-[#1475e1]"
            placeholder={`Paste your ${selectedCoin.id} address here`}
          />
        </div>
      </div>

      <Button 
        onClick={handleWithdraw}
        disabled={isSubmitting}
        className="w-full h-12 bg-[#1475e1] hover:bg-[#1475e1]/90 text-white font-bold text-base rounded-lg mt-4"
      >
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Withdraw {selectedCoin.id}
      </Button>
    </div>
  );

  return (
    <Dialog open={isWalletModalOpen} onOpenChange={(open) => !open && closeWalletModal()}>
      <DialogContent className="sm:max-w-[480px] bg-[#1a2c38] border-[#2f4553] text-white p-0 gap-0 overflow-hidden shadow-2xl">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2f4553]">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-white" />
            <DialogTitle className="text-lg font-bold text-white">Wallet</DialogTitle>
          </div>
          <Button variant="ghost" size="icon" onClick={closeWalletModal} className="text-[#b1bad3] hover:text-white hover:bg-[#2f4553] h-8 w-8 rounded-full">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Navigation Tabs (Only visible in Overview) */}
        {view === 'overview' && (
          <div className="flex px-6 pt-4 gap-6 border-b border-[#2f4553]/50">
            <button className="pb-3 text-sm font-bold text-white border-b-2 border-[#1475e1]">Overview</button>
            <button className="pb-3 text-sm font-bold text-[#b1bad3] hover:text-white transition-colors">Buy Crypto</button>
            <button className="pb-3 text-sm font-bold text-[#b1bad3] hover:text-white transition-colors">Swap Crypto</button>
            <button className="pb-3 text-sm font-bold text-[#b1bad3] hover:text-white transition-colors">Settings</button>
          </div>
        )}

        {/* Content Area */}
        <div className="p-6 min-h-[400px]">
          {view === 'overview' && <OverviewView />}
          {view === 'deposit' && <DepositView />}
          {view === 'withdraw' && <WithdrawView />}
        </div>

      </DialogContent>
    </Dialog>
  );
}
