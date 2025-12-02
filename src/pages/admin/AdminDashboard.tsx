import { useAdminStats, useAdminWithdrawals, useAdminDeposits } from '@/hooks/useAdmin';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Wallet, TrendingUp, DollarSign, Percent, ArrowUpRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Mock data for the chart since we don't have a time-series RPC yet
const chartData = [
  { name: 'Mon', revenue: 4000 },
  { name: 'Tue', revenue: 3000 },
  { name: 'Wed', revenue: 2000 },
  { name: 'Thu', revenue: 2780 },
  { name: 'Fri', revenue: 1890 },
  { name: 'Sat', revenue: 2390 },
  { name: 'Sun', revenue: 3490 },
];

export default function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: recentWithdrawals, isLoading: wdLoading } = useAdminWithdrawals('all');
  const { data: recentDeposits, isLoading: depLoading } = useAdminDeposits();

  if (statsLoading) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32 bg-white/5" />)}
        </div>
        <Skeleton className="h-[300px] bg-white/5" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Overview</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
           <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
           System Operational
        </div>
      </div>
      
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-zinc-900/50 border-white/5 hover:border-[#F7D979]/30 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
            <Users className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats?.total_users || 0}</div>
            <p className="text-xs text-muted-foreground">{stats?.active_users_24h || 0} Active (24h)</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 border-white/5 hover:border-[#F7D979]/30 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Net Profit</CardTitle>
            <DollarSign className="h-4 w-4 text-brand-success" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats?.net_profit && stats.net_profit >= 0 ? 'text-brand-success' : 'text-brand-danger'}`}>
              {stats?.net_profit && stats.net_profit >= 0 ? '+' : ''}{stats?.net_profit?.toFixed(2) || '0.00'}
            </div>
            <p className="text-xs text-muted-foreground">Total Revenue</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 border-white/5 hover:border-[#F7D979]/30 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Wagered</CardTitle>
            <TrendingUp className="h-4 w-4 text-[#F7D979]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats?.total_wagered?.toFixed(2) || '0.00'}</div>
            <p className="text-xs text-muted-foreground">Volume</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 border-white/5 hover:border-[#F7D979]/30 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">House Edge Profit</CardTitle>
            <Percent className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats?.house_edge_profit?.toFixed(2) || '0.00'}</div>
            <p className="text-xs text-muted-foreground">Theoretical Profit</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card className="bg-zinc-900/50 border-white/5">
        <CardHeader>
          <CardTitle>Revenue Overview</CardTitle>
          <CardDescription>Weekly revenue performance (Simulated Data)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F7D979" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#F7D979" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="name" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0D1016', borderColor: '#333', color: '#fff' }}
                  itemStyle={{ color: '#F7D979' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#F7D979" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Deposits */}
        <Card className="bg-zinc-900/50 border-white/5">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Latest Deposits</CardTitle>
            <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {depLoading ? <Skeleton className="h-48 bg-white/5" /> : (
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead>User</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentDeposits?.slice(0, 5).map((d) => (
                    <TableRow key={d.id} className="border-white/10 hover:bg-white/5">
                      <TableCell className="font-medium text-white">{d.profiles?.username || 'Unknown'}</TableCell>
                      <TableCell>{d.amount_credits} Credits</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline" className="border-brand-success text-brand-success">{d.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!recentDeposits || recentDeposits.length === 0) && (
                    <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">No data</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Recent Withdrawals */}
        <Card className="bg-zinc-900/50 border-white/5">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Latest Withdrawals</CardTitle>
            <Wallet className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {wdLoading ? <Skeleton className="h-48 bg-white/5" /> : (
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead>User</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentWithdrawals?.slice(0, 5).map((w) => (
                    <TableRow key={w.id} className="border-white/10 hover:bg-white/5">
                      <TableCell className="font-medium text-white">{w.profiles?.username || 'Unknown'}</TableCell>
                      <TableCell>{w.amount_credits} Credits</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline" className={
                          w.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500' :
                          w.status === 'paid' ? 'bg-green-500/10 text-green-500 border-green-500' :
                          'text-red-500 border-red-500'
                        }>
                          {w.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!recentWithdrawals || recentWithdrawals.length === 0) && (
                    <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">No data</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
