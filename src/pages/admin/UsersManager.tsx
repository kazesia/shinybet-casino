import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Profile } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { MoreHorizontal, Search, Shield, Ban, Eye, UserCheck } from 'lucide-react';

export default function UsersManager() {
  const { profile: currentAdmin } = useAuth();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    let query = supabase.from('profiles').select('*').order('created_at', { ascending: false });

    if (search) {
      query = query.or(`username.ilike.%${search}%,id.eq.${search}`);
    }

    const { data, error } = await query.limit(50);
    if (error) toast.error("Failed to fetch users");
    else setUsers(data as unknown as Profile[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, [search]);

  const handleBanToggle = async (user: Profile) => {
    const newStatus = !user.banned;
    const { error } = await supabase.from('profiles').update({ banned: newStatus }).eq('id', user.id);
    
    if (error) {
      toast.error("Failed to update ban status");
    } else {
      toast.success(`User ${newStatus ? 'banned' : 'unbanned'} successfully`);
      fetchUsers();
    }
  };

  const handleRoleChange = async (user: Profile, newRole: 'user' | 'admin') => {
    if (currentAdmin?.role !== 'super_admin') {
      toast.error("Only Super Admins can change roles");
      return;
    }
    
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', user.id);
    if (error) {
      toast.error("Failed to update role");
    } else {
      toast.success("Role updated successfully");
      fetchUsers();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Users Manager</h1>
        <div className="relative w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by username or ID..." 
            className="pl-8 bg-zinc-900/50 border-white/10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border border-white/5 bg-zinc-900/30">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id} className="border-white/10 hover:bg-white/5">
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{user.username}</span>
                    <span className="text-xs text-muted-foreground">{user.id}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={user.role === 'super_admin' ? 'text-[#F7D979] border-[#F7D979]' : user.role === 'admin' ? 'text-blue-400 border-blue-400' : ''}>
                    {user.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  {user.banned ? (
                    <Badge variant="destructive">Banned</Badge>
                  ) : (
                    <Badge variant="outline" className="text-green-500 border-green-500">Active</Badge>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {new Date(user.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => { setSelectedUser(user); setIsSheetOpen(true); }}>
                        <Eye className="mr-2 h-4 w-4" /> View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBanToggle(user)}>
                        {user.banned ? <UserCheck className="mr-2 h-4 w-4" /> : <Ban className="mr-2 h-4 w-4" />}
                        {user.banned ? 'Unban User' : 'Ban User'}
                      </DropdownMenuItem>
                      {currentAdmin?.role === 'super_admin' && user.role !== 'super_admin' && (
                        <>
                          {user.role === 'user' ? (
                            <DropdownMenuItem onClick={() => handleRoleChange(user, 'admin')}>
                              <Shield className="mr-2 h-4 w-4" /> Promote to Admin
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => handleRoleChange(user, 'user')}>
                              <Shield className="mr-2 h-4 w-4" /> Demote to User
                            </DropdownMenuItem>
                          )}
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-[400px] sm:w-[540px] bg-zinc-950 border-l-white/10">
          <SheetHeader>
            <SheetTitle>User Details</SheetTitle>
            <SheetDescription>Detailed information for {selectedUser?.username}</SheetDescription>
          </SheetHeader>
          {selectedUser && (
            <div className="mt-6 space-y-6">
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-muted-foreground">User ID</h3>
                <p className="font-mono text-sm">{selectedUser.id}</p>
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-muted-foreground">Role</h3>
                <Badge>{selectedUser.role}</Badge>
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-muted-foreground">Account Status</h3>
                <p className={selectedUser.banned ? 'text-red-500' : 'text-green-500'}>
                  {selectedUser.banned ? 'Banned' : 'Active'}
                </p>
              </div>
              {/* Add more stats fetching here if needed */}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
