import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
// import { SportsBet } from '@/types/sports';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export const UserBetsTable = () => {
  const { user } = useAuth();

  const { data: bets, isLoading } = useQuery({
    queryKey: ['sports-bets', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('sports_bets')
        .select('*, sports_events(home_team, away_team, sport_key)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  if (isLoading) return <div className="text-center py-8 text-[#b1bad3]">Loading history...</div>;

  return (
    <div className="rounded-md border border-[#213743] bg-[#1a2c38] overflow-hidden">
      <Table>
        <TableHeader className="bg-[#0f212e]">
          <TableRow className="border-[#213743] hover:bg-transparent">
            <TableHead className="text-[#b1bad3]">Event</TableHead>
            <TableHead className="text-[#b1bad3]">Selection</TableHead>
            <TableHead className="text-[#b1bad3] text-right">Odds</TableHead>
            <TableHead className="text-[#b1bad3] text-right">Stake</TableHead>
            <TableHead className="text-[#b1bad3] text-right">Payout</TableHead>
            <TableHead className="text-[#b1bad3] text-right">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bets?.length === 0 ? (
            <TableRow className="border-[#213743]">
              <TableCell colSpan={6} className="text-center py-8 text-[#b1bad3]">No bets placed yet.</TableCell>
            </TableRow>
          ) : (
            bets?.map((bet) => (
              <TableRow key={bet.id} className="border-[#213743] hover:bg-[#213743]">
                <TableCell className="font-medium text-white">
                  <div className="flex flex-col">
                    <span>{bet.sports_events?.home_team} vs {bet.sports_events?.away_team}</span>
                    <span className="text-xs text-[#b1bad3]">{format(new Date(bet.created_at), 'MMM d, HH:mm')}</span>
                  </div>
                </TableCell>
                <TableCell className="text-[#F7D979]">{bet.selection_name}</TableCell>
                <TableCell className="text-right text-white">{bet.odds.toFixed(2)}</TableCell>
                <TableCell className="text-right text-white">{bet.stake.toFixed(2)}</TableCell>
                <TableCell className="text-right font-bold text-[#00e701]">
                  {bet.status === 'won' ? bet.potential_payout.toFixed(2) : '-'}
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant="outline" className={
                    bet.status === 'won' ? 'border-[#00e701] text-[#00e701]' :
                      bet.status === 'lost' ? 'border-red-500 text-red-500' :
                        'border-[#b1bad3] text-[#b1bad3]'
                  }>
                    {bet.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};
