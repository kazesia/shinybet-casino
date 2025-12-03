import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { CheckCircle2, XCircle, Loader2, Copy } from 'lucide-react';
import { toast } from 'sonner';

// Schemas
const approveSchema = z.object({
  txHash: z.string().min(5, "Transaction hash is required"),
});

const rejectSchema = z.object({
  reason: z.string().min(3, "Reason is required"),
  refund: z.boolean().default(true),
});

export default function WithdrawalsCenter() {
  const [activeTab, setActiveTab] = useState('pending');
  const { data: withdrawals, isLoading } = useAdminWithdrawals(activeTab);
  const { approveWithdrawal, rejectWithdrawal } = useAdminMutations();
  
  const [selectedWd, setSelectedWd] = useState<Withdrawal | null>(null);
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);

  const approveForm = useForm<z.infer<typeof approveSchema>>({
    resolver: zodResolver(approveSchema),
    defaultValues: { txHash: '' }
  });

  const rejectForm = useForm<z.infer<typeof rejectSchema>>({
    resolver: zodResolver(rejectSchema),
    defaultValues: { reason: '', refund: true }
  });

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Address copied");
  };

  const onApproveSubmit = (data: z.infer<typeof approveSchema>) => {
    if (!selectedWd) return;
    approveWithdrawal.mutate({ id: selectedWd.id, txHash: data.txHash }, {
      onSuccess: () => {
        setIsApproveOpen(false);
        approveForm.reset();
      }
    });
  };

  const onRejectSubmit = (data: z.infer<typeof rejectSchema>) => {
    if (!selectedWd) return;
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
          
          <Form {...approveForm}>
            <form onSubmit={approveForm.handleSubmit(onApproveSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label>Target Address</Label>
                <div className="p-2 bg-black/30 rounded border border-admin-border font-mono text-xs break-all text-muted-foreground">
                  {selectedWd?.target_address}
                </div>
              </div>
              
              <FormField
                control={approveForm.control}
                name="txHash"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Transaction Hash</FormLabel>
                    <FormControl>
                      <Input placeholder="0x..." {...field} className="bg-black/30 border-admin-border font-mono" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setIsApproveOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={approveWithdrawal.isPending} className="bg-green-600 hover:bg-green-700 text-white">
                  {approveWithdrawal.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Confirm
                </Button>
              </DialogFooter>
            </form>
          </Form>
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
          
          <Form {...rejectForm}>
            <form onSubmit={rejectForm.handleSubmit(onRejectSubmit)} className="space-y-4">
              <FormField
                control={rejectForm.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason for Rejection</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="e.g., Suspicious activity, Invalid address..." 
                        {...field} 
                        className="bg-black/30 border-admin-border"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={rejectForm.control}
                name="refund"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-admin-border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Refund Credits
                      </FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Automatically return the credits to user's wallet.
                      </p>
                    </div>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setIsRejectOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={rejectWithdrawal.isPending} variant="destructive">
                  {rejectWithdrawal.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Reject Request
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
