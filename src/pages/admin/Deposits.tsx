import { useState } from 'react';
import { useAdminDeposits } from '@/hooks/useAdmin';
import { Deposit } from '@/types';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Eye, ExternalLink, Copy } from 'lucide-react';
import { toast } from 'sonner';

export default function Deposits() {
  const { data: deposits, isLoading } = useAdminDeposits();
  const [selectedDeposit, setSelectedDeposit] = useState<Deposit | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const columns: ColumnDef<Deposit>[] = [
    {
      accessorKey: "created_at",
      header: "Date",
      cell: ({ row }) => <span className="text-xs text-muted-foreground">{new Date(row.original.created_at).toLocaleString()}</span>
    },
    {
      accessorKey: "username",
      header: "User",
      cell: ({ row }) => <span className="font-medium text-white">{row.original.profiles?.username}</span>
    },
    {
      accessorKey: "amount_credits",
      header: "Amount (Credits)",
      cell: ({ row }) => <span className="font-mono text-admin-accent font-bold">{row.original.amount_credits.toFixed(2)}</span>
    },
    {
      accessorKey: "currency",
      header: "Crypto",
      cell: ({ row }) => (
        <div className="flex flex-col">
           <span className="text-xs font-bold">{row.original.currency}</span>
           <span className="text-[10px] text-muted-foreground">{row.original.amount_crypto}</span>
        </div>
      )
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant="outline" className={
          row.original.status === 'confirmed' ? 'border-green-500 text-green-500' : 'border-yellow-500 text-yellow-500'
        }>
          {row.original.status}
        </Badge>
      )
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => { setSelectedDeposit(row.original); setIsSheetOpen(true); }}
          className="h-8 w-8 p-0 hover:bg-white/10"
        >
          <Eye className="h-4 w-4" />
        </Button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Deposits</h1>
      
      <DataTable 
        columns={columns} 
        data={deposits || []} 
        isLoading={isLoading}
      />

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-[400px] sm:w-[540px] bg-admin-surface border-l-admin-border text-white">
          <SheetHeader>
            <SheetTitle className="text-white">Deposit Details</SheetTitle>
            <SheetDescription>Transaction ID: {selectedDeposit?.id}</SheetDescription>
          </SheetHeader>
          
          {selectedDeposit && (
            <div className="mt-8 space-y-6">
              <div className="p-4 rounded-lg bg-black/30 border border-admin-border space-y-4">
                 <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <Badge className={selectedDeposit.status === 'confirmed' ? 'bg-green-500' : 'bg-yellow-500'}>
                       {selectedDeposit.status}
                    </Badge>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">User</span>
                    <span className="font-bold">{selectedDeposit.profiles?.username}</span>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Amount</span>
                    <span className="font-bold text-admin-accent text-lg">{selectedDeposit.amount_credits} Credits</span>
                 </div>
              </div>

              <div className="space-y-2">
                 <h4 className="text-sm font-bold text-white">Blockchain Data</h4>
                 <div className="p-4 rounded-lg bg-black/30 border border-admin-border space-y-3">
                    <div>
                       <span className="text-xs text-muted-foreground block mb-1">Transaction Hash</span>
                       <div className="flex items-center gap-2">
                          <code className="text-xs bg-black/50 p-1 rounded flex-1 truncate font-mono">
                             {selectedDeposit.tx_hash || 'Pending...'}
                          </code>
                          {selectedDeposit.tx_hash && (
                             <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleCopy(selectedDeposit.tx_hash!)}>
                                <Copy className="h-3 w-3" />
                             </Button>
                          )}
                       </div>
                    </div>
                    {selectedDeposit.tx_hash && (
                       <Button variant="outline" className="w-full border-admin-border hover:bg-white/5 text-xs" onClick={() => window.open(`https://etherscan.io/tx/${selectedDeposit.tx_hash}`, '_blank')}>
                          <ExternalLink className="mr-2 h-3 w-3" /> View on Block Explorer
                       </Button>
                    )}
                 </div>
              </div>

              <div className="space-y-2">
                 <h4 className="text-sm font-bold text-white">Raw Data</h4>
                 <pre className="bg-black/50 p-4 rounded-lg border border-admin-border text-[10px] font-mono overflow-auto max-h-[200px] text-muted-foreground">
                    {JSON.stringify(selectedDeposit, null, 2)}
                 </pre>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
