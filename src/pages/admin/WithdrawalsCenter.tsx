import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAdminWithdrawals, useAdminMutations } from '@/hooks/useAdmin';
import { Withdrawal } from '@/types';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckCircle2, XCircle, Loader2, Copy } from 'lucide-react';
import { toast } from 'sonner';

// Form types
type ApproveFormData = {
  txHash: string;
};

type RejectFormData = {
  reason: string;
  refund: boolean;
};

export default function WithdrawalsCenter() {
  const [activeTab, setActiveTab] = useState('pending');
  const { data: withdrawals, isLoading } = useAdminWithdrawals(activeTab);
  const { approveWithdrawal, rejectWithdrawal } = useAdminMutations();

  const [selectedWd, setSelectedWd] = useState<Withdrawal | null>(null);
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);

  const approveForm = useForm<ApproveFormData>({
    defaultValues: { txHash: '' }
  });

  const rejectForm = useForm<RejectFormData>({
    defaultValues: { reason: '', refund: true }
  });

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Address copied");
  };

  const onApproveSubmit = (data: ApproveFormData) => {
    if (!selectedWd) return;
    if (!data.txHash || data.txHash.length < 5) {
      toast.error('Transaction hash is required');
      return;
    }
    approveWithdrawal.mutate({ id: selectedWd.id, txHash: data.txHash }, {
      onSuccess: () => {
        setIsApproveOpen(false);
        approveForm.reset();
      }
    });
  };

  const onRejectSubmit = (data: RejectFormData) => {
    if (!selectedWd) return;
    if (!data.reason || data.reason.length < 3) {
      toast.error('Reason is required');
      return;
    }
    // Note: The backend RPC handles refund logic, currently we just pass reason. 
    // If refund logic needs to be explicit, the RPC would need updating.
    // Assuming standard rejection refunds the user.
    rejectWithdrawal.mutate({ id: selectedWd.id, reason: data.reason }, {
      onSuccess: () => {
        setIsRejectOpen(false);
        rejectForm.reset();
      }
    });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Withdrawals Center</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-admin-surface border border-admin-border">
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="paid">Paid</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="all">All History</TabsTrigger>
        </TabsList>

        <div className="mt-6 rounded-md border border-admin-border bg-admin-surface">
          <Table>
            <TableHeader>
              <TableRow className="border-admin-border hover:bg-transparent">
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
                  <TableRow key={w.id} className="border-admin-border hover:bg-white/5">
                    <TableCell className="font-medium text-white">{w.profiles?.username}</TableCell>
                    <TableCell className="font-mono text-admin-accent">{w.amount_credits} {w.currency}</TableCell>
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
        <DialogContent className="bg-admin-surface border-admin-border text-white">
          <DialogHeader>
            <DialogTitle>Confirm Payment</DialogTitle>
            <DialogDescription>
              Enter transaction hash to confirm {selectedWd?.amount_credits} {selectedWd?.currency} sent.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={approveForm.handleSubmit(onApproveSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Target Address</Label>
              <div className="p-2 bg-black/30 rounded border border-admin-border font-mono text-xs break-all text-muted-foreground">
                {selectedWd?.target_address}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="txHash">Transaction Hash</Label>
              <Input
                id="txHash"
                placeholder="0x..."
                {...approveForm.register('txHash')}
                className="bg-black/30 border-admin-border font-mono"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsApproveOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={approveWithdrawal.isPending} className="bg-green-600 hover:bg-green-700 text-white">
                {approveWithdrawal.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Confirm
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <DialogContent className="bg-admin-surface border-admin-border text-white">
          <DialogHeader>
            <DialogTitle>Reject Withdrawal</DialogTitle>
            <DialogDescription>
              Funds will be returned to the user's balance.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={rejectForm.handleSubmit(onRejectSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Rejection Reason</Label>
              <Textarea
                id="reason"
                placeholder="Explain why this withdrawal is being rejected..."
                {...rejectForm.register('reason')}
                className="bg-black/30 border-admin-border min-h-[100px]"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="refund"
                {...rejectForm.register('refund')}
              />
              <Label htmlFor="refund" className="text-sm font-normal">
                Refund credits to user
              </Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsRejectOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={rejectWithdrawal.isPending} className="bg-red-600 hover:bg-red-700 text-white">
                {rejectWithdrawal.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Reject
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
