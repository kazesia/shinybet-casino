import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Flame, Gift, Timer, Trophy } from 'lucide-react';

const PROMOS = [
  {
    id: 1,
    title: "100% Welcome Bonus",
    description: "Double your first deposit up to 1 BTC. The perfect way to start your journey.",
    code: "WELCOME100",
    expiry: "No Expiry",
    color: "text-[#F7D979]",
    icon: Gift,
    tag: "New Players"
  },
  {
    id: 2,
    title: "Daily Wager Race",
    description: "$10,000 Prize Pool every 24 hours. Top 10 players take home the cash.",
    code: "AUTO-ENTRY",
    expiry: "Ends in 4h 23m",
    color: "text-red-400",
    icon: Trophy,
    tag: "Live Now"
  },
  {
    id: 3,
    title: "Weekly Cashback",
    description: "Get up to 15% of your losses back every Friday. No wagering requirements.",
    code: "VIP ONLY",
    expiry: "Weekly",
    color: "text-blue-400",
    icon: Timer,
    tag: "VIP"
  },
  {
    id: 4,
    title: "Free Spins Friday",
    description: "Deposit $50+ on Friday and get 50 Free Spins on Sweet Bonanza.",
    code: "FRIDAY50",
    expiry: "Every Friday",
    color: "text-purple-400",
    icon: Flame,
    tag: "Slots"
  }
];

export default function Promotions() {
  return (
    <div className="container py-12 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-white">Active <span className="text-gold-gradient">Promotions</span></h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Boost your bankroll with our exclusive offers. From deposit bonuses to daily races, there's always a way to win more.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {PROMOS.map((promo) => (
          <Card key={promo.id} className="bg-zinc-900/50 border-white/10 hover:border-[#F7D979]/30 transition-all group">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className={`p-3 rounded-xl bg-white/5 ${promo.color}`}>
                  <promo.icon className="w-8 h-8" />
                </div>
                <Badge variant="secondary" className="bg-white/10 text-white">{promo.tag}</Badge>
              </div>
              <CardTitle className="text-2xl mt-4">{promo.title}</CardTitle>
              <CardDescription className="text-base">{promo.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 text-sm text-muted-foreground bg-black/20 p-3 rounded-lg border border-white/5">
                <div className="flex-1">
                  <span className="block text-xs uppercase tracking-wider mb-1">Code</span>
                  <span className="font-mono font-bold text-white">{promo.code}</span>
                </div>
                <div className="text-right">
                  <span className="block text-xs uppercase tracking-wider mb-1">Expires</span>
                  <span className="text-white">{promo.expiry}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full bg-white/5 hover:bg-[#F7D979] hover:text-black transition-colors font-bold">
                Claim Bonus
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
