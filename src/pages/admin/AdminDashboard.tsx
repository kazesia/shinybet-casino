import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Wallet, TrendingUp, ArrowDownLeft } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalDeposits: 0,
    totalWithdrawals: 0,
    houseProfit: 0
  });
  const [recentDeposits, setRecentDeposits] = useState<any[]>([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // 1. Basic Counts
        const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
        
        // 2. Financial Aggregates
        // We use safe optional chaining and default values to prevent crashes if tables are empty or restricted
        const { data: deposits } = await supabase.from('deposits').select('amount_credits').eq('status', 'confirmed');
        const totalDep = deposits?.reduce((sum, d) => sum + (d.amount_credits || 0), 0) || 0;

        const { data: withdrawals } = await supabase.from('withdrawals').select('amount_credits').eq('status', 'paid');
        const totalWith = withdrawals?.reduce((sum, w) => sum + (w.amount_credits || 0), 0) || 0;

        const { data: bets } = await supabase.from('bets').select('stake_credits, payout_credits');
        const totalStaked = bets?.reduce((sum, b) => sum + (b.stake_credits || 0), 0) || 0;
        const totalPayout = bets?.reduce((sum, b) => sum + (b.payout_credits || 0), 0) || 0;

        setStats({
          totalUsers: userCount || 0,
          activeUsers: Math.floor((userCount || 0) * 0.8), // Mock active count
          totalDeposits: totalDep,
          totalWithdrawals: totalWith,
          houseProfit: totalStaked - totalPayout
        });

        // 3. Recent Lists
        const { data: recentDep } = await supabase
          .from('deposits')
          .select('*, profiles(username)')
          .order('created_at', { ascending: false })
          .limit(5);
        if (recentDep) setRecentDeposits(recentDep);

        const { data: pendingWith } = await supabase
          .from('withdrawals')
          .select('*, profiles(username)')
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(5);
        if (pendingWith) setPendingWithdrawals(pendingWith);

      } catch (error) {
        console.error('Error fetching admin stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) return <div className="grid grid-cols-1 md:grid-cols-4 gap-4"><Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" /></div>;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Dashboard Overview</h1>
      
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-zinc-900/50 border-white/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
            <Users className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">{stats.activeUsers} Active recently</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 border-white/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">House Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-brand-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-brand-success">
              {stats.houseProfit >= 0 ? '+' : ''}{stats.houseProfit.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Credits (GGR)</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 border-white/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Deposits</CardTitle>
            <Wallet className="h-4 w-4 text-[#F7D979]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDeposits.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Credits</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 border-white/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Withdrawals</CardTitle>
            <ArrowDownLeft className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalWithdrawals.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Credits Paid</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Deposits */}
        <Card className="bg-zinc-900/50 border-white/5">
          <CardHeader>
            <CardTitle>Recent Deposits</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead>User</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentDeposits.map((d) => (
                  <TableRow key={d.id} className="border-white/10 hover:bg-white/5">
                    <TableCell className="font-medium">{d.profiles?.username || 'Unknown'}</TableCell>
                    <TableCell>{d.amount_credits} Credits</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline" className="border-brand-success text-brand-success">{d.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {recentDeposits.length === 0 && <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">No recent deposits</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Pending Withdrawals */}
        <Card className="bg-zinc-900/50 border-white/5">
          <CardHeader>
            <CardTitle>Pending Withdrawals</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead>User</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingWithdrawals.map((w) => (
                  <TableRow key={w.id} className="border-white/10 hover:bg-white/5">
                    <TableCell className="font-medium">{w.profiles?.username || 'Unknown'}</TableCell>
                    <TableCell>{w.amount_credits} Credits</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500">Review</Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {pendingWithdrawals.length === 0 && <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">No pending withdrawals</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
