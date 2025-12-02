import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, Gem, Star, Shield, Zap, Gift, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useUI } from '@/context/UIContext';
import { Link } from 'react-router-dom';

const TIERS = [
  { name: 'Bronze', minWager: 0, color: 'text-orange-400', icon: Shield, benefits: ['Weekly Cashback 1%', 'Basic Support'] },
  { name: 'Silver', minWager: 10000, color: 'text-gray-300', icon: Star, benefits: ['Weekly Cashback 3%', 'Dedicated Host', 'Level Up Bonus'] },
  { name: 'Gold', minWager: 50000, color: 'text-[#F7D979]', icon: Crown, benefits: ['Weekly Cashback 5%', 'Priority Withdrawals', 'Exclusive Bonuses'] },
  { name: 'Platinum', minWager: 100000, color: 'text-cyan-400', icon: Gem, benefits: ['Daily Cashback', 'Luxury Gifts', 'Personal VIP Manager'] },
  { name: 'Diamond', minWager: 500000, color: 'text-purple-400', icon: Zap, benefits: ['Custom Rewards', 'Invites to Events', 'Highest Limits'] },
];

export default function VIPClub() {
  const { user, profile } = useAuth();
  const { stats } = useDashboardData();
  const { openAuthModal } = useUI();
  const wagered = stats?.total_wagered || 0;

  // Calculate current tier
  const currentTierIndex = TIERS.slice().reverse().findIndex(t => wagered >= t.minWager);
  const actualIndex = currentTierIndex === -1 ? 0 : TIERS.length - 1 - currentTierIndex;
  const currentTier = TIERS[actualIndex];
  const nextTier = TIERS[actualIndex + 1];

  // Calculate progress
  const progress = nextTier 
    ? Math.min(100, Math.max(0, ((wagered - currentTier.minWager) / (nextTier.minWager - currentTier.minWager)) * 100))
    : 100;

  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin';

  return (
    <div className="min-h-screen bg-background pb-12">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#F7D979]/10 rounded-[100%] blur-[100px] -z-10 pointer-events-none" />
        <div className="container text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 w-fit mx-auto">
            <Crown className="w-4 h-4 text-[#F7D979]" />
            <span className="text-xs font-medium text-brand-textSecondary">Elite Rewards Program</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Shiny <span className="text-gold-gradient">VIP Club</span>
          </h1>
          <p className="text-lg text-brand-textSecondary max-w-2xl mx-auto">
            Unlock exclusive rewards, higher limits, and personalized service as you play. The more you wager, the more you receive.
          </p>
        </div>
      </section>

      <div className="container space-y-12">
        {/* Admin Indicator */}
        {isAdmin && (
          <div className="bg-zinc-900/80 border border-[#F7D979]/30 rounded-xl p-4 flex items-center justify-between shadow-[0_0_15px_rgba(247,217,121,0.1)]">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#F7D979]/20 rounded-lg">
                <ShieldCheck className="w-5 h-5 text-[#F7D979]" />
              </div>
              <div>
                <h3 className="font-bold text-white">Admin Access Active</h3>
                <p className="text-xs text-muted-foreground">You have full control over the VIP system settings.</p>
              </div>
            </div>
            <Link to="/admin">
              <Button size="sm" className="bg-[#F7D979] text-black font-bold hover:bg-[#F7D979]/90">
                Go to Admin Panel
              </Button>
            </Link>
          </div>
        )}

        {/* User Progress */}
        {user && (
          <Card className="bg-zinc-900/50 border-white/10 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#F7D979] to-transparent opacity-50" />
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-6">
                <div className="flex items-center gap-4">
                   <div className={`p-4 rounded-full bg-white/5 border border-white/10 ${currentTier.color}`}>
                      <currentTier.icon className="w-8 h-8" />
                   </div>
                   <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-2xl font-bold text-white">{currentTier.name} Member</h3>
                        <Badge variant="secondary" className="bg-white/10 text-xs">Tier {actualIndex + 1}</Badge>
                      </div>
                      <p className="text-muted-foreground">Total Wagered: <span className="text-white font-mono">{wagered.toFixed(2)}</span></p>
                   </div>
                </div>
                {nextTier && (
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground mb-1">Next Level: <span className={nextTier.color}>{nextTier.name}</span></p>
                    <p className="text-xs text-muted-foreground">{(nextTier.minWager - wagered).toFixed(2)} credits to go</p>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Progress value={progress} className="h-3 bg-white/5" />
                <div className="flex justify-between text-xs text-muted-foreground">
                   <span>{currentTier.minWager}</span>
                   <span>{nextTier ? nextTier.minWager : 'MAX'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tiers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {TIERS.map((tier, idx) => (
            <Card key={tier.name} className={`bg-zinc-900/30 border-white/5 hover:border-white/20 transition-all ${actualIndex === idx && user ? 'ring-1 ring-[#F7D979] bg-[#F7D979]/5' : ''}`}>
              <CardHeader className="text-center pb-2">
                <tier.icon className={`w-8 h-8 mx-auto mb-2 ${tier.color}`} />
                <CardTitle className="text-lg">{tier.name}</CardTitle>
                <CardDescription className="text-xs">Wager {tier.minWager}+</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm">
                  {tier.benefits.map((benefit, i) => (
                    <li key={i} className="flex items-start gap-2 text-muted-foreground">
                      <Gift className="w-3 h-3 mt-1 text-[#F7D979]" />
                      <span className="text-xs">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA */}
        {!user && (
          <div className="text-center py-12">
             <h3 className="text-2xl font-bold text-white mb-4">Ready to join the elite?</h3>
             <Button 
               size="lg" 
               onClick={() => openAuthModal('register')}
               className="bg-gold-gradient text-black font-bold hover:scale-105 transition-transform"
             >
               Start Playing Now
             </Button>
          </div>
        )}
      </div>
    </div>
  );
}
