import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

serve(async (req) => {
  try {
    const { user_id, stake, odds, selection, event_data } = await req.json()

    // 1. Sync Event (Get or Create) using Service Role
    let { data: event } = await supabase
      .from('sports_events')
      .select('id, commence_time')
      .eq('external_id', event_data.external_id)
      .single()

    if (!event) {
      // Create if doesn't exist
      const { data: newEvent, error: createError } = await supabase
        .from('sports_events')
        .insert({
          external_id: event_data.external_id,
          sport_key: event_data.sport_key,
          commence_time: event_data.commence_time,
          home_team: event_data.home_team,
          away_team: event_data.away_team,
          completed: false
        })
        .select('id, commence_time')
        .single()

      if (createError) {
        // Handle race condition (Code 23505: Unique violation)
        if (createError.code === '23505') {
           const { data: retryEvent } = await supabase
            .from('sports_events')
            .select('id, commence_time')
            .eq('external_id', event_data.external_id)
            .single()
           event = retryEvent
        } else {
           throw createError
        }
      } else {
        event = newEvent
      }
    }

    if (!event) throw new Error('Failed to initialize event')

    // 2. Validate Event Open
    if (new Date(event.commence_time) < new Date()) {
      throw new Error('Event has already started')
    }

    // 3. Call RPC for Atomic Transaction
    const { data, error } = await supabase.rpc('place_sports_bet', {
      p_user_id: user_id,
      p_event_id: event.id,
      p_selection_name: selection,
      p_odds: odds,
      p_stake: stake
    })

    if (error) throw error

    return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { 'Content-Type': 'application/json' } })
  }
})
