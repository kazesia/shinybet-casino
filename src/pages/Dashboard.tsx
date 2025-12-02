import { useAuth } from '@/context/AuthContext';
import { useDashboardData } from '@/hooks/useDashboardData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Wallet, ArrowUpRight, ArrowDownLeft, Trophy, TrendingUp, History, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { profile } = useAuth();
  const { wallet, stats, recentBets, transactions, loading } = useDashboardData();

  if (loading) {
    return (
      <div className="container py-8 space-y-8">
        <Skeleton className="h-12 w-1/3 bg-white/5" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-32 bg-white/5" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Welcome back, <span className="text-[#FFD700]">{profile?.username}</span></h1>
          <p className="text-muted-foreground">Here's what's happening with your account.</p>
        </div>
        <div className="flex gap-3">
          <Link to="/wallet">
            <Button variant="outline" className="border-[#FFD700] text-[#FFD700] hover:bg-[#FFD700]/10">
              <ArrowDownLeft className="mr-2 h-4 w-4" /> Withdraw
            </Button>
          </Link>
          <Link to="/wallet">
            <Button className="bg-[#FFD700] text-black hover:bg-[#FFD700]/90 font-bold">
              <ArrowUpRight className="mr-2 h-4 w-4" /> Deposit
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-zinc-900/50 border-white/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Balance</CardTitle>
            <Wallet className="h-4 w-4 text-[#FFD700]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{wallet?.credits?.toFixed(2) || '0.00'}</div>
            <p className="text-xs text-muted-foreground">Credits</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/50 border-white/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Wagered</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats?.total_wagered?.toFixed(2) || '0.00'}</div>
            <p className="text-xs text-muted-foreground">Lifetime Volume</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/50 border-white/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Biggest Win</CardTitle>
            <Trophy className="h-4 w-4 text-brand-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-brand-success">{stats?.biggest_win?.toFixed(2) || '0.00'}</div>
            <p className="text-xs text-muted-foreground">Credits</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/50 border-white/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Net P/L</CardTitle>
            <CreditCard className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats?.net_pl >= 0 ? 'text-brand-success' : 'text-brand-danger'}`}>
              {stats?.net_pl > 0 ? '+' : ''}{stats?.net_pl?.toFixed(2) || '0.00'}
            </div>
            <p className="text-xs text-muted-foreground">Profit / Loss</p>
          </CardContent>
        </Card>
      </div>

      {/* Activity Tabs */}
      <Card className="bg-zinc-900/30 border-white/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5 text-[#FFD700]" /> Activity Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="bets" className="w-full">
            <TabsList className="bg-zinc-900 mb-4">
              <TabsTrigger value="bets">Recent Bets</TabsTrigger>
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
            </TabsList>
            
            <TabsContent value="bets">
              {recentBets.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No bets placed yet.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-white/10">
                      <TableHead>Game</TableHead>
                      <TableHead>Stake</TableHead>
                      <TableHead>Payout</TableHead>
                      <TableHead>Result</TableHead>
                      <TableHead className="text-right">Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentBets.map((bet) => (
                      <TableRow key={bet.id} className="hover:bg-white/5 border-white/10">
                        <TableCell className="font-medium text-white">{bet.game_type}</TableCell>
                        <TableCell>{bet.stake_credits}</TableCell>
                        <TableCell className={bet.result === 'win' ? 'text-brand-success' : ''}>
                          {bet.payout_credits}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={
                            bet.result === 'win' ? 'border-brand-success text-brand-success bg-brand-success/10' : 'border-brand-danger text-brand-danger bg-brand-danger/10'
                          }>
                            {bet.result}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {new Date(bet.created_at).toLocaleTimeString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
            
            <TabsContent value="transactions">
              {transactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No transactions yet.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-white/10">
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead className="text-right">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx) => (
                      <TableRow key={tx.id} className="hover:bg-white/5 border-white/10">
                        <TableCell className="capitalize text-white">{tx.type}</TableCell>
                        <TableCell className={tx.type === 'deposit' || tx.type === 'payout' ? 'text-brand-success' : 'text-white'}>
                          {tx.type === 'withdrawal' || tx.type === 'bet' ? '-' : '+'}{tx.amount_credits}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {new Date(tx.created_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
