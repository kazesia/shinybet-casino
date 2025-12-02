import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import QRCode from 'react-qr-code';
import { Copy, Loader2, AlertCircle } from 'lucide-react';

export default function WalletPage() {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [depositCurrency, setDepositCurrency] = useState('BTC');
  const [depositAddress, setDepositAddress] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [withdrawCurrency, setWithdrawCurrency] = useState('BTC');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [deposits, setDeposits] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchWalletData();
      fetchHistory();
    }
  }, [user, depositCurrency]);

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
      // Generate new address (Mock implementation for frontend)
      const mockAddr = `mock_${depositCurrency.toLowerCase()}_${Math.random().toString(36).substring(7)}`;
      setDepositAddress(mockAddr);
      // In real app: Call Edge Function to generate and save
    }
  };

  const fetchHistory = async () => {
    const { data: wData } = await supabase.from('withdrawals').select('*').eq('user_id', user?.id).order('created_at', { ascending: false });
    if (wData) setWithdrawals(wData);

    const { data: dData } = await supabase.from('deposits').select('*').eq('user_id', user?.id).order('created_at', { ascending: false });
    if (dData) setDeposits(dData);
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
      fetchWalletData(); // Refresh balance
      fetchHistory(); // Refresh history
    } catch (error: any) {
      toast.error(error.message || "Withdrawal failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container py-8 max-w-4xl">
      <h1 className="text-3xl font-bold text-white mb-8">Wallet</h1>

      <Tabs defaultValue="deposit" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8 bg-zinc-900">
          <TabsTrigger value="deposit">Deposit</TabsTrigger>
          <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
        </TabsList>

        {/* DEPOSIT TAB */}
        <TabsContent value="deposit">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="bg-zinc-900/50 border-white/5">
              <CardHeader>
                <CardTitle>Deposit Crypto</CardTitle>
                <CardDescription>Send crypto to the address below to credit your account.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Select Currency</Label>
                  <Select value={depositCurrency} onValueChange={setDepositCurrency}>
                    <SelectTrigger className="bg-zinc-950 border-white/10">
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
                  <QRCode value={depositAddress} size={180} />
                </div>

                <div className="space-y-2">
                  <Label>Deposit Address</Label>
                  <div className="flex gap-2">
                    <Input readOnly value={depositAddress} className="bg-zinc-950 border-white/10 font-mono text-xs" />
                    <Button size="icon" variant="outline" onClick={handleCopy} className="shrink-0">
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-xs text-yellow-500 bg-yellow-500/10 p-3 rounded-lg border border-yellow-500/20">
                   <AlertCircle className="w-4 h-4" />
                   <span>Only send {depositCurrency} to this address. Other assets will be lost.</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900/50 border-white/5">
              <CardHeader>
                <CardTitle>Deposit History</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-white/10">
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deposits.length === 0 ? (
                       <TableRow className="border-0"><TableCell colSpan={3} className="text-center text-muted-foreground">No deposits found.</TableCell></TableRow>
                    ) : (
                      deposits.map((dep) => (
                        <TableRow key={dep.id} className="hover:bg-white/5 border-white/10">
                          <TableCell>{dep.amount_crypto} {dep.currency}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={dep.status === 'confirmed' ? 'text-green-500 border-green-500' : 'text-yellow-500 border-yellow-500'}>
                              {dep.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground text-xs">
                            {new Date(dep.created_at).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* WITHDRAW TAB */}
        <TabsContent value="withdraw">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <Card className="bg-zinc-900/50 border-white/5">
              <CardHeader>
                <CardTitle>Withdraw Funds</CardTitle>
                <CardDescription>Available Balance: <span className="text-[#FFD700] font-bold">{balance.toFixed(2)} Credits</span></CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleWithdraw} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Currency</Label>
                    <Select value={withdrawCurrency} onValueChange={setWithdrawCurrency}>
                      <SelectTrigger className="bg-zinc-950 border-white/10">
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
                    <Input 
                      type="number" 
                      placeholder="0.00" 
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      className="bg-zinc-950 border-white/10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Target Address</Label>
                    <Input 
                      placeholder={`Enter ${withdrawCurrency} Address`}
                      value={withdrawAddress}
                      onChange={(e) => setWithdrawAddress(e.target.value)}
                      className="bg-zinc-950 border-white/10"
                    />
                  </div>

                  <Button type="submit" disabled={isSubmitting} className="w-full bg-[#FFD700] text-black font-bold hover:bg-[#FFD700]/90">
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Request Withdrawal
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900/50 border-white/5">
              <CardHeader>
                <CardTitle>Withdrawal History</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-white/10">
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {withdrawals.length === 0 ? (
                       <TableRow className="border-0"><TableCell colSpan={3} className="text-center text-muted-foreground">No withdrawals found.</TableCell></TableRow>
                    ) : (
                      withdrawals.map((wd) => (
                        <TableRow key={wd.id} className="hover:bg-white/5 border-white/10">
                          <TableCell>{wd.amount_credits} Credits</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {wd.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground text-xs">
                            {new Date(wd.created_at).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
