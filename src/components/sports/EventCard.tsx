import { SportsEvent } from '@/types/sports';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useBetSlip } from '@/context/BetSlipContext';
import { cn } from '@/lib/utils';

interface EventCardProps {
  event: SportsEvent;
}

export default function EventCard({ event }: EventCardProps) {
  const { addSelection, selections, removeSelection } = useBetSlip();
  
  // Find H2H market
  const h2h = event.bookmakers.find(b => b.key === 'draftkings' || b.key === 'fanduel' || b.key === 'bovada')?.markets.find(m => m.key === 'h2h');
  
  // Fallback to first available if specific bookmakers not found
  const market = h2h || event.bookmakers[0]?.markets?.find(m => m.key === 'h2h');

  const outcomes = market?.outcomes || [];
  const homeOdds = outcomes.find(o => o.name === event.home_team)?.price;
  const awayOdds = outcomes.find(o => o.name === event.away_team)?.price;
  const drawOdds = outcomes.find(o => o.name === 'Draw')?.price;

  const isSelected = (selectionName: string) => 
    selections.some(s => s.eventId === event.id && s.selection === selectionName);

  const toggleBet = (selection: string, odds: number) => {
    if (isSelected(selection)) {
      removeSelection(event.id);
    } else {
      addSelection({
        eventId: event.id,
        eventTitle: `${event.home_team} vs ${event.away_team}`,
        selection,
        odds,
        marketKey: 'h2h',
        sportKey: event.sport_key,
        commenceTime: event.commence_time,
        homeTeam: event.home_team,
        awayTeam: event.away_team
      });
    }
  };

  const isLive = new Date(event.commence_time) < new Date();

  const OddsButton = ({ label, odds, selectionName }: { label: string, odds?: number, selectionName: string }) => {
    const selected = isSelected(selectionName);
    
    return (
      <Button 
        variant="outline" 
        className={cn(
          "flex flex-col h-14 gap-1 transition-all duration-200",
          selected 
            ? "bg-[#F7D979] border-[#F7D979] hover:bg-[#F7D979]/90" 
            : "bg-[#0f212e] border-white/5 hover:bg-[#213743] hover:text-white hover:border-[#F7D979]"
        )}
        onClick={() => odds && toggleBet(selectionName, odds)}
        disabled={!odds}
      >
        <span className={cn("text-[10px]", selected ? "text-black/70 font-bold" : "text-muted-foreground")}>
          {label}
        </span>
        <span className={cn("font-bold", selected ? "text-black" : "text-[#F7D979]")}>
          {odds?.toFixed(2) || '-'}
        </span>
      </Button>
    );
  };

  return (
    <Card className="bg-[#1a2c38] border-white/5 hover:border-[#F7D979]/30 transition-all">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2">
            {isLive ? (
              <Badge variant="destructive" className="animate-pulse">LIVE</Badge>
            ) : (
              <span className="text-xs text-muted-foreground">
                {format(new Date(event.commence_time), 'MMM d, HH:mm')}
              </span>
            )}
          </div>
          <span className="text-xs text-muted-foreground uppercase tracking-wider">{event.sport_title}</span>
        </div>

        <div className="space-y-3 mb-4">
          <div className="flex justify-between items-center">
            <span className="font-bold text-white">{event.home_team}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-bold text-white">{event.away_team}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <OddsButton 
            label="1" 
            odds={homeOdds} 
            selectionName={event.home_team} 
          />
          
          <OddsButton 
            label="X" 
            odds={drawOdds} 
            selectionName="Draw" 
          />

          <OddsButton 
            label="2" 
            odds={awayOdds} 
            selectionName={event.away_team} 
          />
        </div>
      </CardContent>
    </Card>
  );
}
