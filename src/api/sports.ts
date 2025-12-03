import { SportsEvent, Sport } from '@/types/sports';
import { supabase } from '@/lib/supabase';

// TEMPORARY API KEY FOR DEMO PURPOSES
// In production, this should be handled via Edge Functions to hide the key
const API_KEY = '43c96c3db1198591420f6ce0578cf66d';
const BASE_URL = 'https://api.the-odds-api.com/v4/sports';

export const sportsApi = {
  // Fetch list of active sports
  getSports: async (): Promise<Sport[]> => {
    try {
      const response = await fetch(`${BASE_URL}/?apiKey=${API_KEY}`);
      if (!response.ok) throw new Error('Failed to fetch sports');
      return await response.json();
    } catch (error) {
      console.error('Error fetching sports:', error);
      return [];
    }
  },

  // Fetch odds for a specific sport
  getOdds: async (sportKey: string): Promise<SportsEvent[]> => {
    try {
      const response = await fetch(
        `${BASE_URL}/${sportKey}/odds/?apiKey=${API_KEY}&regions=us&markets=h2h&oddsFormat=decimal`
      );
      if (!response.ok) throw new Error('Failed to fetch odds');
      return await response.json();
    } catch (error) {
      console.error('Error fetching odds:', error);
      return [];
    }
  },

  // Place a bet (Calls Supabase Edge Function)
  placeBet: async (userId: string, betData: {
    eventId: string;
    selection: string;
    odds: number;
    stake: number;
    sportKey: string;
    homeTeam: string;
    awayTeam: string;
    commenceTime: string;
  }) => {
    try {
      // Delegate event creation and betting to the Edge Function to bypass RLS
      const { data, error } = await supabase.functions.invoke('place-bet', {
        body: {
          user_id: userId,
          stake: betData.stake,
          odds: betData.odds,
          selection: betData.selection,
          event_data: {
            external_id: betData.eventId,
            sport_key: betData.sportKey,
            commence_time: betData.commenceTime,
            home_team: betData.homeTeam,
            away_team: betData.awayTeam
          }
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Bet placement error:', error);
      throw error;
    }
  }
};
