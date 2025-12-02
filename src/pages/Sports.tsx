import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { sportsApi } from '@/api/sports';
import { Sport, SportsEvent } from '@/types/sports';
import EventCard from '@/components/sports/EventCard';
import { Loader2, Trophy, RefreshCw } from 'lucide-react';
import { BetSlipProvider } from '@/context/BetSlipContext';
import BetSlip from '@/components/sports/BetSlip';
import { toast } from 'sonner';

export default function SportsPage() {
  const [sports, setSports] = useState<Sport[]>([]);
  const [activeSport, setActiveSport] = useState<string>('');
  const [events, setEvents] = useState<SportsEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch Sports List
  useEffect(() => {
    const loadSports = async () => {
      const data = await sportsApi.getSports();
      // Filter for popular sports for the tabs
      const popular = data.filter(s => 
        s.key === 'soccer_epl' || 
        s.key === 'basketball_nba' || 
        s.key === 'americanfootball_nfl' ||
        s.key === 'mma_mixed_martial_arts'
      );
      setSports(popular);
      if (popular.length > 0 && !activeSport) setActiveSport(popular[0].key);
    };
    loadSports();
  }, []);

  // Fetch Odds
  const loadOdds = async () => {
    if (!activeSport) return;
    setLoading(true);
    try {
      const data = await sportsApi.getOdds(activeSport);
      setEvents(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load odds");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOdds();
  }, [activeSport]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadOdds();
    setRefreshing(false);
    toast.success("Odds refreshed");
  };

  return (
    <BetSlipProvider>
      <div className="container py-8 max-w-[1400px]">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#F7D979]/10 rounded-xl">
              <Trophy className="w-8 h-8 text-[#F7D979]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Sportsbook</h1>
              <p className="text-muted-foreground">Live odds on major leagues</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh} 
            disabled={refreshing || loading}
            className="border-white/10 hover:bg-white/5 gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Odds
          </Button>
        </div>

        <Tabs value={activeSport} onValueChange={setActiveSport} className="space-y-6">
          <TabsList className="bg-[#1a2c38] border border-white/5 p-1 h-auto flex-wrap justify-start">
            {sports.map(sport => (
              <TabsTrigger 
                key={sport.key} 
                value={sport.key}
                className="data-[state=active]:bg-[#F7D979] data-[state=active]:text-black"
              >
                {sport.title}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="min-h-[400px]">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-[#F7D979] animate-spin" />
              </div>
            ) : events.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground bg-[#1a2c38]/50 rounded-xl border border-white/5">
                No active events found for this sport.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {events.map(event => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            )}
          </div>
        </Tabs>
        
        <BetSlip />
      </div>
    </BetSlipProvider>
  );
}
