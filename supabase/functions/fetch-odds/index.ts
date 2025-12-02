import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ODDS_API_KEY = Deno.env.get('ODDS_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

serve(async (req) => {
  try {
    const { sport_key } = await req.json()
    
    // 1. Check Cache (DB)
    const { data: cachedEvents } = await supabase
      .from('sports_events')
      .select('*, sports_markets(*)')
      .eq('sport_key', sport_key)
      .gt('updated_at', new Date(Date.now() - 5 * 60 * 1000).toISOString()) // 5 min cache
    
    if (cachedEvents && cachedEvents.length > 0) {
      return new Response(JSON.stringify({ data: cachedEvents, source: 'cache' }), { headers: { 'Content-Type': 'application/json' } })
    }

    // 2. Fetch from API
    const response = await fetch(
      `https://api.the-odds-api.com/v4/sports/${sport_key}/odds/?apiKey=${ODDS_API_KEY}&regions=us&markets=h2h&oddsFormat=decimal`
    )
    const apiData = await response.json()

    // 3. Upsert Data
    for (const event of apiData) {
      // Upsert Event
      const { data: eventData, error: eventError } = await supabase
        .from('sports_events')
        .upsert({
          external_id: event.id,
          sport_key: event.sport_key,
          commence_time: event.commence_time,
          home_team: event.home_team,
          away_team: event.away_team,
          updated_at: new Date().toISOString()
        }, { onConflict: 'external_id, sport_key' })
        .select()
        .single()

      if (eventError || !eventData) continue

      // Upsert Market (H2H)
      const h2h = event.bookmakers[0]?.markets?.find((m: any) => m.key === 'h2h')
      if (h2h) {
        await supabase.from('sports_markets').insert({
          event_id: eventData.id,
          market_key: 'h2h',
          outcomes: h2h.outcomes,
          last_update: new Date().toISOString()
        })
      }
    }

    // 4. Return Fresh Data
    const { data: freshData } = await supabase
      .from('sports_events')
      .select('*, sports_markets(*)')
      .eq('sport_key', sport_key)

    return new Response(JSON.stringify({ data: freshData, source: 'api' }), { headers: { 'Content-Type': 'application/json' } })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
})
