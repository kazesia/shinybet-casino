import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Withdrawal } from '@/types';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

export default function WithdrawalsCenter() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWd, setSelectedWd] = useState<Withdrawal | null>(null);
  
  // Action States
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchWithdrawals = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('withdrawals')
      .select('*, profiles(username)')
      .order('created_at', { ascending: false });
    
    if (data) setWithdrawals(data as unknown as Withdrawal[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const handleApprove = async () => {
    if (!selectedWd || !txHash) return;
    setProcessing(true);
    
    try {
      const { error } = await supabase.rpc('admin_approve_withdrawal', {
        p_withdrawal_id: selectedWd.id,
        p_tx_hash: txHash
      });

      if (error) throw error;
      
      toast.success("Withdrawal approved successfully");
      setIsApproveOpen(false);
      setTxHash('');
      fetchWithdrawals();
    } catch (error: any) {
      toast.error(error.message || "Failed to approve");
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedWd || !rejectReason) return;
    setProcessing(true);

    try {
      const { error } = await supabase.rpc('admin_reject_withdrawal', {
        p_withdrawal_id: selectedWd.id,
        p_reason: rejectReason
      });

      if (error) throw error;

      toast.success("Withdrawal rejected successfully");
      setIsRejectOpen(false);
      setRejectReason('');
      fetchWithdrawals();
    } catch (error: any) {
      toast.error(error.message || "Failed to reject");
    } finally {
      setProcessing(false);
    }
  };

  const WithdrawalTable = ({ status }: { status: string }) => {
    const filtered = withdrawals.filter(w => w.status === status);
    
    return (
      <div className="rounded-md border border-white/5 bg-zinc-900/30">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead>User</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Date</TableHead>
              {status === 'pending' && <TableHead className="text-right">Actions</TableHead>}
              {status !== 'pending' && <TableHead className="text-right">Info</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((w) => (
              <TableRow key={w.id} className="border-white/10 hover:bg-white/5">
                <TableCell className="font-medium">{w.profiles?.username}</TableCell>
                <TableCell>{w.amount_credits} ({w.currency})</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground max-w-[200px] truncate" title={w.target_address}>
                  {w.target_address}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {new Date(w.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  {status === 'pending' ? (
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" className="border-green-500/50 text-green-500 hover:bg-green-500/10" onClick={() => { setSelectedWd(w); setIsApproveOpen(true); }}>
                        <CheckCircle2 className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" className="border-red-500/50 text-red-500 hover:bg-red-500/10" onClick={() => { setSelectedWd(w); setIsRejectOpen(true); }}>
                        <XCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {w.tx_hash ? 'Tx: ' + w.tx_hash.substring(0, 8) + '...' : w.rejection_reason || '-'}
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No records found</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Withdrawals Center</h1>
      
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="bg-zinc-900/50 border border-white/5">
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="paid">Paid</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>
        
        <TabsContent value="pending" className="mt-4"><WithdrawalTable status="pending" /></TabsContent>
        <TabsContent value="paid" className="mt-4"><WithdrawalTable status="paid" /></TabsContent>
        <TabsContent value="rejected" className="mt-4"><WithdrawalTable status="rejected" /></TabsContent>
      </Tabs>

      {/* Approve Dialog */}
      <Dialog open={isApproveOpen} onOpenChange={setIsApproveOpen}>
        <DialogContent className="bg-zinc-950 border-white/10">
          <DialogHeader>
            <DialogTitle>Approve Withdrawal</DialogTitle>
            <DialogDescription>
              Enter the blockchain transaction hash to confirm payment of {selectedWd?.amount_credits} {selectedWd?.currency}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Target Address</Label>
              <div className="p-2 bg-zinc-900 rounded border border-white/10 font-mono text-xs break-all">
                {selectedWd?.target_address}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Transaction Hash</Label>
              <Input 
                placeholder="0x..." 
                value={txHash} 
                onChange={(e) => setTxHash(e.target.value)}
                className="bg-zinc-900 border-white/10"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsApproveOpen(false)}>Cancel</Button>
            <Button onClick={handleApprove} disabled={!txHash || processing} className="bg-green-600 hover:bg-green-700">
              {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Confirm Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <DialogContent className="bg-zinc-950 border-white/10">
          <DialogHeader>
            <DialogTitle>Reject Withdrawal</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this request. The funds will be returned to the user's wallet.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Reason</Label>
              <Textarea 
                placeholder="e.g., Invalid address, suspicious activity..." 
                value={rejectReason} 
                onChange={(e) => setRejectReason(e.target.value)}
                className="bg-zinc-900 border-white/10"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsRejectOpen(false)}>Cancel</Button>
            <Button onClick={handleReject} disabled={!rejectReason || processing} variant="destructive">
              {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Reject Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
