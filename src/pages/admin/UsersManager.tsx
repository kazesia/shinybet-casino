import { useState } from 'react';
import { useAdminUsers, useAdminMutations, useUserStats } from '@/hooks/useAdmin';
import { useAuth } from '@/context/AuthContext';
import { Profile } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Search, Shield, Ban, Eye, UserCheck, Wallet, TrendingUp, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';

import { BalanceAdjustment } from '@/components/admin/BalanceAdjustment';

export default function UsersManager() {
  const { profile: currentAdmin } = useAuth();
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const { data, isLoading } = useAdminUsers(page, 20, search);
  const { toggleBan, changeRole } = useAdminMutations();

  // Fetch detailed stats only when sheet is open and user selected
  const { data: userDetails, isLoading: isDetailsLoading } = useUserStats(isSheetOpen ? selectedUser?.id || null : null);

  const columns: ColumnDef<Profile>[] = [
    {
      accessorKey: "username",
      header: "User",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-bold text-white">{row.original.username}</span>
          <span className="text-xs text-muted-foreground font-mono">{row.original.id.substring(0, 8)}...</span>
        </div>
      )
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => (
        <Badge variant="outline" className={
          row.original.role === 'super_admin' ? 'text-admin-accent border-admin-accent' :
            row.original.role === 'admin' ? 'text-blue-400 border-blue-400' : ''
        }>
          {row.original.role}
        </Badge>
      )
    },
    {
      accessorKey: "wallet_balance",
      header: "Balance",
      cell: ({ row }) => (
        <span className="font-mono text-green-500">
          {row.original.wallet_balance?.toFixed(2) || '0.00'}
        </span>
      )
    },
    {
      accessorKey: "banned",
      header: "Status",
      cell: ({ row }) => (
        row.original.banned ?
          <Badge variant="destructive">Banned</Badge> :
          <Badge variant="outline" className="text-green-500 border-green-500 bg-green-500/5">Active</Badge>
      )
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const user = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-white/10">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-admin-surface border-admin-border text-white">
              <DropdownMenuItem onClick={() => { setSelectedUser(user); setIsSheetOpen(true); }}>
                <Eye className="mr-2 h-4 w-4" /> View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toggleBan.mutate({ userId: user.id, status: !user.banned })}>
                {user.banned ? <UserCheck className="mr-2 h-4 w-4" /> : <Ban className="mr-2 h-4 w-4" />}
                {user.banned ? 'Unban User' : 'Ban User'}
              </DropdownMenuItem>
              {currentAdmin?.role === 'super_admin' && user.role !== 'super_admin' && (
                <>
                  {user.role === 'user' ? (
                    <DropdownMenuItem onClick={() => changeRole.mutate({ userId: user.id, role: 'admin' })}>
                      <Shield className="mr-2 h-4 w-4" /> Promote to Admin
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onClick={() => changeRole.mutate({ userId: user.id, role: 'user' })}>
                      <Shield className="mr-2 h-4 w-4" /> Demote to User
                    </DropdownMenuItem>
                  )}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      }
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Users Manager</h1>
        <div className="relative w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search username, email, ID..."
            className="pl-8 bg-admin-surface border-admin-border"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data?.users || []}
        pageCount={Math.ceil((data?.count || 0) / 20)}
        pageIndex={page}
        onPageChange={setPage}
        isLoading={isLoading}
      />

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-[400px] sm:w-[540px] bg-admin-surface border-l-admin-border text-white overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-white">User Profile</SheetTitle>
            <SheetDescription>Detailed information for {selectedUser?.username}</SheetDescription>
          </SheetHeader>
          {selectedUser && (
            <div className="mt-8 space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-4">


                <div className="p-4 rounded-lg bg-black/30 border border-admin-border">
                  <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Wallet className="w-3 h-3" /> Balance</div>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold text-admin-accent">{selectedUser.wallet_balance?.toFixed(2)}</div>
                    <BalanceAdjustment
                      userId={selectedUser.id}
                      username={selectedUser.username}
                      currentBalance={selectedUser.wallet_balance || 0}
                    />
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-black/30 border border-admin-border">
                  <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Net Profit/Loss</div>
                  {isDetailsLoading ? <Skeleton className="h-8 w-20 bg-white/10" /> : (
                    <div className={`text-2xl font-bold ${userDetails?.stats?.net_profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {userDetails?.stats?.net_profit >= 0 ? '+' : ''}{userDetails?.stats?.net_profit?.toFixed(2) || '0.00'}
                    </div>
                  )}
                </div>
              </div>

              {/* Detailed Stats */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-white border-b border-admin-border pb-2">Activity Overview</h4>
                {isDetailsLoading ? <Skeleton className="h-24 w-full bg-white/10" /> : (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between p-2 bg-white/5 rounded">
                      <span className="text-muted-foreground">Total Wagered</span>
                      <span className="font-mono">{userDetails?.stats?.total_wagered?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="flex justify-between p-2 bg-white/5 rounded">
                      <span className="text-muted-foreground">Total Payout</span>
                      <span className="font-mono">{userDetails?.stats?.total_payout?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="flex justify-between p-2 bg-white/5 rounded">
                      <span className="text-muted-foreground">Deposits</span>
                      <span className="font-mono text-green-400 flex items-center gap-1"><ArrowDownLeft className="w-3 h-3" /> {userDetails?.stats?.total_deposits?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="flex justify-between p-2 bg-white/5 rounded">
                      <span className="text-muted-foreground">Withdrawals</span>
                      <span className="font-mono text-red-400 flex items-center gap-1"><ArrowUpRight className="w-3 h-3" /> {userDetails?.stats?.total_withdrawals?.toFixed(2) || '0.00'}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Basic Info */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-white border-b border-admin-border pb-2">Account Info</h4>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">User ID</Label>
                  <div className="font-mono text-xs bg-black/30 p-2 rounded border border-admin-border">{selectedUser.id}</div>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Email</Label>
                  <div className="text-sm bg-black/30 p-2 rounded border border-admin-border">{selectedUser.email || 'N/A'}</div>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Role</Label>
                  <div className="text-sm capitalize">{selectedUser.role.replace('_', ' ')}</div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-white border-b border-admin-border pb-2">Recent Bets</h4>
                <div className="space-y-2">
                  {isDetailsLoading ? <Skeleton className="h-20 w-full bg-white/10" /> :
                    userDetails?.recentActivity?.length === 0 ? <div className="text-xs text-muted-foreground">No recent bets.</div> :
                      userDetails?.recentActivity?.map((bet: any) => (
                        <div key={bet.id} className="flex justify-between items-center p-2 bg-white/5 rounded text-xs">
                          <div className="flex flex-col">
                            <span className="font-bold text-white">{bet.game_type}</span>
                            <span className="text-muted-foreground">{new Date(bet.created_at).toLocaleDateString()}</span>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="font-mono">{bet.stake_credits.toFixed(2)}</span>
                            <span className={bet.result === 'win' ? 'text-green-500 font-bold' : 'text-red-500'}>
                              {bet.result === 'win' ? `+${bet.payout_credits.toFixed(2)}` : '-'}
                            </span>
                          </div>
                        </div>
                      ))
                  }
                </div>
              </div>

              {/* Actions */}
              <div className="pt-6 border-t border-admin-border">
                <h4 className="font-bold mb-4">Security Actions</h4>
                <div className="flex items-center justify-between p-4 rounded-lg bg-red-500/5 border border-red-500/20">
                  <div className="flex flex-col">
                    <span className="font-medium text-red-200">Ban User</span>
                    <span className="text-xs text-red-300/60">Prevent login access</span>
                  </div>
                  <Switch
                    checked={selectedUser.banned}
                    onCheckedChange={(checked) => toggleBan.mutate({ userId: selectedUser.id, status: checked })}
                  />
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
