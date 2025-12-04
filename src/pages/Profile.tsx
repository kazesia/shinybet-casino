import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useWallet } from '@/context/WalletContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { LogOut, Mail, User, Wallet, Shield, Calendar, Edit2, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function Profile() {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const { balance } = useWallet();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [newUsername, setNewUsername] = useState(profile?.username || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success("Logged out successfully");
      navigate('/auth');
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to log out");
    }
  };

  const handleUpdateProfile = async () => {
    if (!user) return;
    if (newUsername.length < 3) {
      toast.error("Username must be at least 3 characters");
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ username: newUsername })
        .eq('id', user.id);

      if (error) throw error;

      await refreshProfile(); // Refresh context instead of page reload
      toast.success("Profile updated successfully");
      setIsEditing(false);
    } catch (error: any) {
      console.error("Update error:", error);
      toast.error(error.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) return null;

  const joinDate = new Date(user.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="container py-12 max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">My Profile</h1>
          <p className="text-muted-foreground">Manage your account settings and preferences.</p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Main Profile Card */}
        <Card className="bg-[#1a2c38] border-[#2f4553] overflow-hidden shadow-xl">
          <div className="h-24 md:h-32 bg-gradient-to-r from-[#1475e1] to-[#0f212e] relative">
            <div className="absolute -bottom-12 left-8">
              <Avatar className="h-20 w-20 md:h-24 md:w-24 border-4 border-[#1a2c38] shadow-xl">
                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`} />
                <AvatarFallback className="bg-[#F7D979] text-black text-xl font-bold">
                  {profile?.username?.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
          <CardHeader className="pt-12 md:pt-16 pb-4 px-4 md:px-8">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3">
                  <CardTitle className="text-2xl font-bold text-white flex items-center gap-2">
                    {profile?.username || 'User'}
                  </CardTitle>
                  <Badge variant="secondary" className="bg-[#F7D979] text-black hover:bg-[#F7D979]/90">
                    {profile?.role === 'super_admin' ? 'Super Admin' : profile?.role === 'admin' ? 'Admin' : 'Player'}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-white"
                    onClick={() => { setNewUsername(profile?.username || ''); setIsEditing(true); }}
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                </div>
                <CardDescription className="flex items-center gap-2 mt-1">
                  <Mail className="w-4 h-4" /> {user.email}
                </CardDescription>
              </div>
              <div className="text-right hidden sm:block">
                <p className="text-sm text-muted-foreground">Member since</p>
                <p className="font-medium text-white flex items-center justify-end gap-1">
                  <Calendar className="w-3 h-3" /> {joinDate}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-4 md:px-8 pb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {/* Balance Section */}
              <div className="bg-[#0f212e] p-4 rounded-xl border border-[#2f4553] flex items-center justify-between shadow-inner">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#00e701]/10 rounded-lg border border-[#00e701]/20">
                    <Wallet className="w-5 h-5 text-[#00e701]" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Current Balance</p>
                    <p className="text-xl font-bold text-white">${balance.toFixed(2)}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="border-[#2f4553] hover:bg-[#2f4553] text-white" onClick={() => navigate('/wallet')}>
                  Top Up
                </Button>
              </div>

              {/* Security Section */}
              <div className="bg-[#0f212e] p-4 rounded-xl border border-[#2f4553] flex items-center justify-between shadow-inner">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#F7D979]/10 rounded-lg border border-[#F7D979]/20">
                    <Shield className="w-5 h-5 text-[#F7D979]" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Account Status</p>
                    <p className="text-xl font-bold text-white">Verified</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-green-500 border-green-500 bg-green-500/5">Active</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Details */}
        <Card className="bg-[#1a2c38] border-[#2f4553]">
          <CardHeader>
            <CardTitle className="text-white">Personal Information</CardTitle>
            <CardDescription>Your personal account details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Username</label>
                <div className="flex items-center justify-between p-3 rounded-md bg-[#0f212e] border border-[#2f4553] text-white group">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    {profile?.username}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => { setNewUsername(profile?.username || ''); setIsEditing(true); }}
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Email Address</label>
                <div className="flex items-center gap-2 p-3 rounded-md bg-[#0f212e] border border-[#2f4553] text-white">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  {user.email}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">User ID</label>
                <div className="flex items-center gap-2 p-3 rounded-md bg-[#0f212e] border border-[#2f4553] text-muted-foreground font-mono text-xs">
                  {user.id}
                </div>
              </div>
            </div>
          </CardContent>
          <Separator className="bg-[#2f4553]" />
          <CardFooter className="py-6 flex justify-between items-center bg-[#0f212e]/30">
            <p className="text-sm text-muted-foreground">
              Need to take a break? You can sign out of your account here.
            </p>
            <Button
              variant="destructive"
              onClick={handleLogout}
              className="bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 font-bold shadow-[0_0_10px_rgba(239,68,68,0.1)]"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="bg-[#1a2c38] border-[#2f4553] text-white">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>Update your public profile information.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Username</label>
              <Input
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                className="bg-[#0f212e] border-[#2f4553] text-white focus-visible:ring-[#F7D979]"
                placeholder="Enter new username"
              />
              <p className="text-xs text-muted-foreground">This is how you will appear to other players.</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsEditing(false)} className="text-muted-foreground hover:text-white">
              Cancel
            </Button>
            <Button
              onClick={handleUpdateProfile}
              disabled={isSaving || !newUsername || newUsername === profile?.username}
              className="bg-[#F7D979] text-black font-bold hover:bg-[#F7D979]/90"
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
