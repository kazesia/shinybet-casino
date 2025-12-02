import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { useUI } from '@/context/UIContext';
import { Copy, Users, DollarSign, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';

export default function Affiliate() {
  const { user } = useAuth();
  const { openAuthModal } = useUI();
  
  // Mock referral link
  const referralLink = user 
    ? `https://shiny.bet/?ref=${user.id.substring(0, 8)}` 
    : 'https://shiny.bet/?ref=YOUR_ID';

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    toast.success("Referral link copied!");
  };

  return (
    <div className="container py-12 space-y-12">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-white">Refer & <span className="text-gold-gradient">Earn</span></h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Invite your friends to Shiny.bet and earn up to 45% commission on every bet they place. Forever.
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-zinc-900/50 border-white/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Referrals</CardTitle>
            <Users className="w-4 h-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{user ? '12' : '0'}</div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/50 border-white/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Commission Rate</CardTitle>
            <BarChart3 className="w-4 h-4 text-[#F7D979]" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#F7D979]">25%</div>
            <p className="text-xs text-muted-foreground">Tier 1 Affiliate</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/50 border-white/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Earnings</CardTitle>
            <DollarSign className="w-4 h-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-400">{user ? '$1,240.50' : '$0.00'}</div>
          </CardContent>
        </Card>
      </div>

      {/* Link Section */}
      <Card className="bg-gradient-to-br from-zinc-900 to-black border-white/10">
        <CardHeader>
          <CardTitle>Your Referral Link</CardTitle>
          <CardDescription>Share this link to start earning commissions.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4">
          <Input value={referralLink} readOnly className="bg-black/50 border-white/10 font-mono" />
          <Button onClick={user ? handleCopy : () => openAuthModal('register')} className="bg-[#F7D979] text-black font-bold hover:bg-[#F7D979]/90 shrink-0">
            {user ? <><Copy className="mr-2 h-4 w-4" /> Copy Link</> : 'Sign Up to Earn'}
          </Button>
        </CardContent>
      </Card>

      {/* How it works */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto">
            <span className="text-xl font-bold text-blue-500">1</span>
          </div>
          <h3 className="font-bold text-lg">Share Link</h3>
          <p className="text-sm text-muted-foreground">Send your unique link to friends or post it on social media.</p>
        </div>
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#F7D979]/10 flex items-center justify-center mx-auto">
            <span className="text-xl font-bold text-[#F7D979]">2</span>
          </div>
          <h3 className="font-bold text-lg">They Play</h3>
          <p className="text-sm text-muted-foreground">Your referrals sign up and start playing our games.</p>
        </div>
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
            <span className="text-xl font-bold text-green-500">3</span>
          </div>
          <h3 className="font-bold text-lg">You Earn</h3>
          <p className="text-sm text-muted-foreground">Receive a percentage of the house edge from every bet.</p>
        </div>
      </div>
    </div>
  );
}
