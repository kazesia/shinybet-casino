import { useState } from 'react';
import { useAdminUsers, useAdminMutations } from '@/hooks/useAdmin';
import { useAuth } from '@/context/AuthContext';
import { Profile } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Search, Shield, Ban, Eye, UserCheck, Wallet } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export default function UsersManager() {
  const { profile: currentAdmin } = useAuth();
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  
  const { data, isLoading } = useAdminUsers(page, 20, search);
  const { toggleBan, changeRole } = useAdminMutations();

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
          row.original.role === 'super_admin' ? 'text-[#F7D979] border-[#F7D979]' : 
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
        <span className="font-mono text-brand-success">
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
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-zinc-950 border-white/10">
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
            className="pl-8 bg-zinc-900/50 border-white/10"
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
        <SheetContent className="w-[400px] sm:w-[540px] bg-zinc-950 border-l-white/10 text-white">
          <SheetHeader>
            <SheetTitle className="text-white">User Profile</SheetTitle>
            <SheetDescription>Detailed information for {selectedUser?.username}</SheetDescription>
          </SheetHeader>
          {selectedUser && (
            <div className="mt-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                 <div className="p-4 rounded-lg bg-white/5 border border-white/5">
                    <div className="text-xs text-muted-foreground mb-1">Wallet Balance</div>
                    <div className="text-2xl font-bold text-[#F7D979]">{selectedUser.wallet_balance?.toFixed(2)}</div>
                 </div>
                 <div className="p-4 rounded-lg bg-white/5 border border-white/5">
                    <div className="text-xs text-muted-foreground mb-1">Account Status</div>
                    <div className="flex items-center gap-2">
                       {selectedUser.banned ? <Ban className="w-4 h-4 text-red-500" /> : <UserCheck className="w-4 h-4 text-green-500" />}
                       <span className={selectedUser.banned ? 'text-red-500 font-bold' : 'text-green-500 font-bold'}>
                         {selectedUser.banned ? 'Banned' : 'Active'}
                       </span>
                    </div>
                 </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <Label className="text-muted-foreground">User ID</Label>
                  <div className="font-mono text-sm bg-black/30 p-2 rounded border border-white/5">{selectedUser.id}</div>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Email</Label>
                  <div className="text-sm bg-black/30 p-2 rounded border border-white/5">{selectedUser.email || 'N/A'}</div>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Role</Label>
                  <div className="text-sm capitalize">{selectedUser.role.replace('_', ' ')}</div>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Joined Date</Label>
                  <div className="text-sm">{new Date(selectedUser.created_at).toLocaleString()}</div>
                </div>
              </div>

              <div className="pt-6 border-t border-white/10">
                 <h4 className="font-bold mb-4">Quick Actions</h4>
                 <div className="flex items-center justify-between p-4 rounded-lg bg-red-500/5 border border-red-500/20">
                    <div className="flex flex-col">
                       <span className="font-medium text-red-200">Ban User</span>
                       <span className="text-xs text-red-300/60">Prevent this user from logging in</span>
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
