import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

serve(async (req) => {
  try {
    const { event_id, selection, stake, odds, user_id } = await req.json()

    // 1. Validate Event Open
    const { data: event } = await supabase
      .from('sports_events')
      .select('commence_time')
      .eq('id', event_id)
      .single()

    if (new Date(event.commence_time) < new Date()) {
      throw new Error('Event has already started')
    }

    // 2. Call RPC for Atomic Transaction
    const { data, error } = await supabase.rpc('place_sports_bet', {
      p_event_id: event_id,
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
