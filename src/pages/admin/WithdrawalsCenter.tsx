import { useState } from 'react';
import { useAdminWithdrawals, useAdminMutations } from '@/hooks/useAdmin';
import { Withdrawal } from '@/types';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2, XCircle, Loader2, Copy } from 'lucide-react';
import { toast } from 'sonner';

export default function WithdrawalsCenter() {
  const [activeTab, setActiveTab] = useState('pending');
  const { data: withdrawals, isLoading } = useAdminWithdrawals(activeTab);
  const { approveWithdrawal, rejectWithdrawal } = useAdminMutations();
  
  const [selectedWd, setSelectedWd] = useState<Withdrawal | null>(null);
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [rejectReason, setRejectReason] = useState('');

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Address copied");
  };

  const onApprove = () => {
    if (!selectedWd || !txHash) return;
    approveWithdrawal.mutate({ id: selectedWd.id, txHash }, {
      onSuccess: () => {
        setIsApproveOpen(false);
        setTxHash('');
      }
    });
  };

  const onReject = () => {
    if (!selectedWd || !rejectReason) return;
    rejectWithdrawal.mutate({ id: selectedWd.id, reason: rejectReason }, {
      onSuccess: () => {
        setIsRejectOpen(false);
        setRejectReason('');
      }
    });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Withdrawals Center</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-zinc-900/50 border border-white/5">
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="paid">Paid</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="all">All History</TabsTrigger>
        </TabsList>
        
        <div className="mt-6 rounded-md border border-white/5 bg-zinc-900/30">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead>User</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Target Address</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions / Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                 <TableRow><TableCell colSpan={5} className="text-center h-24">Loading...</TableCell></TableRow>
              ) : withdrawals?.length === 0 ? (
                 <TableRow><TableCell colSpan={5} className="text-center h-24 text-muted-foreground">No records found.</TableCell></TableRow>
              ) : (
                withdrawals?.map((w) => (
                  <TableRow key={w.id} className="border-white/10 hover:bg-white/5">
                    <TableCell className="font-medium text-white">{w.profiles?.username}</TableCell>
                    <TableCell className="font-mono text-[#F7D979]">{w.amount_credits} {w.currency}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-muted-foreground max-w-[150px] truncate" title={w.target_address}>
                          {w.target_address}
                        </span>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleCopy(w.target_address)}>
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(w.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {w.status === 'pending' ? (
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" className="border-green-500/50 text-green-500 hover:bg-green-500/10" onClick={() => { setSelectedWd(w); setIsApproveOpen(true); }}>
                            <CheckCircle2 className="w-4 h-4 mr-1" /> Approve
                          </Button>
                          <Button size="sm" variant="outline" className="border-red-500/50 text-red-500 hover:bg-red-500/10" onClick={() => { setSelectedWd(w); setIsRejectOpen(true); }}>
                            <XCircle className="w-4 h-4 mr-1" /> Reject
                          </Button>
                        </div>
                      ) : (
                        <Badge variant="outline" className={
                          w.status === 'paid' ? 'border-green-500 text-green-500' : 'border-red-500 text-red-500'
                        }>
                          {w.status}
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Tabs>

      {/* Approve Dialog */}
      <Dialog open={isApproveOpen} onOpenChange={setIsApproveOpen}>
        <DialogContent className="bg-zinc-950 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Confirm Payment</DialogTitle>
            <DialogDescription>
              Enter the transaction hash to confirm that {selectedWd?.amount_credits} {selectedWd?.currency} has been sent.
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
              <Label>Blockchain Transaction Hash</Label>
              <Input 
                placeholder="0x..." 
                value={txHash} 
                onChange={(e) => setTxHash(e.target.value)}
                className="bg-zinc-900 border-white/10 font-mono"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsApproveOpen(false)}>Cancel</Button>
            <Button onClick={onApprove} disabled={!txHash || approveWithdrawal.isPending} className="bg-green-600 hover:bg-green-700 text-white">
              {approveWithdrawal.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <DialogContent className="bg-zinc-950 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Reject Withdrawal</DialogTitle>
            <DialogDescription>
              Funds will be returned to the user's balance. Please provide a reason.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Reason for Rejection</Label>
              <Textarea 
                placeholder="e.g., Suspicious activity, Invalid address..." 
                value={rejectReason} 
                onChange={(e) => setRejectReason(e.target.value)}
                className="bg-zinc-900 border-white/10"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsRejectOpen(false)}>Cancel</Button>
            <Button onClick={onReject} disabled={!rejectReason || rejectWithdrawal.isPending} variant="destructive">
              {rejectWithdrawal.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Reject Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
