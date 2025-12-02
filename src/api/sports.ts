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

  // Place a bet (Calls Supabase RPC)
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
      // 1. Ensure Event Exists (Mocking the sync)
      const { data: event } = await supabase
        .from('sports_events')
        .select('id')
        .eq('external_id', betData.eventId)
        .single();
      
      let internalEventId = event?.id;

      if (!internalEventId) {
        // Create a placeholder event so the FK constraint works
        // Using actual team names passed from the frontend
        const { data: newEvent, error: createError } = await supabase
          .from('sports_events')
          .insert({
            external_id: betData.eventId,
            sport_key: betData.sportKey,
            commence_time: betData.commenceTime,
            home_team: betData.homeTeam,
            away_team: betData.awayTeam,
            completed: false
          })
          .select()
          .single();
          
        if (createError) {
           // If we can't create it (e.g. unique constraint race condition), try fetching again
           if (createError.code === '23505') {
              const { data: retryEvent } = await supabase
                .from('sports_events')
                .select('id')
                .eq('external_id', betData.eventId)
                .single();
              internalEventId = retryEvent?.id;
           } else {
              console.error("Failed to create event record:", createError);
              throw new Error("Failed to initialize event for betting");
           }
        } else {
           internalEventId = newEvent?.id;
        }
      }

      if (!internalEventId) throw new Error("Event ID not found");

      // 2. Place Bet
      const { data, error } = await supabase.rpc('place_sports_bet', {
        p_user_id: userId,
        p_event_id: internalEventId,
        p_selection_name: betData.selection,
        p_odds: betData.odds,
        p_stake: betData.stake
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Bet placement error:', error);
      throw error;
    }
  }
};
