import { useState } from 'react';
import { useAdminBets } from '@/hooks/useAdmin';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { Bet } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ActivityLogs() {
  const [gameFilter, setGameFilter] = useState('all');
  const { data: bets, isLoading } = useAdminBets(gameFilter);

  const columns: ColumnDef<Bet>[] = [
    {
      accessorKey: "created_at",
      header: "Time",
      cell: ({ row }) => <span className="text-xs text-muted-foreground">{new Date(row.original.created_at).toLocaleString()}</span>
    },
    {
      accessorKey: "username",
      header: "User",
      cell: ({ row }) => <span className="font-medium text-white">{row.original.profiles?.username}</span>
    },
    {
      accessorKey: "game_type",
      header: "Game",
      cell: ({ row }) => <span className="capitalize">{row.original.game_type}</span>
    },
    {
      accessorKey: "stake_credits",
      header: "Stake",
      cell: ({ row }) => <span className="font-mono">{row.original.stake_credits.toFixed(2)}</span>
    },
    {
      accessorKey: "payout_credits",
      header: "Payout",
      cell: ({ row }) => {
        const isWin = row.original.result === 'win';
        // Highlight big wins (> 100x or > 1000 credits)
        const isBigWin = row.original.payout_credits > 1000;
        return (
          <div className="flex items-center gap-2">
            <span className={`font-mono font-bold ${isWin ? 'text-brand-success' : 'text-muted-foreground'}`}>
              {row.original.payout_credits.toFixed(2)}
            </span>
            {isBigWin && <Badge className="bg-[#F7D979] text-black hover:bg-[#F7D979]">Big Win</Badge>}
          </div>
        )
      }
    },
    {
      accessorKey: "result",
      header: "Result",
      cell: ({ row }) => (
        <Badge variant="outline" className={
          row.original.result === 'win' ? 'border-brand-success text-brand-success' : 'border-brand-danger text-brand-danger'
        }>
          {row.original.result}
        </Badge>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Betting History</h1>
        <Select value={gameFilter} onValueChange={setGameFilter}>
          <SelectTrigger className="w-[180px] bg-zinc-900/50 border-white/10">
            <SelectValue placeholder="Filter by Game" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Games</SelectItem>
            <SelectItem value="Dice">Dice</SelectItem>
            <SelectItem value="CoinFlip">CoinFlip</SelectItem>
            <SelectItem value="Mines">Mines</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable 
        columns={columns} 
        data={bets || []} 
        isLoading={isLoading}
      />
    </div>
  );
}
