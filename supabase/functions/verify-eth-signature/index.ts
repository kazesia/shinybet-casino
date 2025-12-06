import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { ethers } from 'https://esm.sh/ethers@6.9.0'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { address, message, signature, nonce } = await req.json()

        // Validate inputs
        if (!address || !message || !signature) {
            throw new Error('Missing required fields')
        }

        // Verify the signature
        const recoveredAddress = ethers.verifyMessage(message, signature)

        if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
            throw new Error('Invalid signature')
        }

        // Create Supabase admin client
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            { auth: { autoRefreshToken: false, persistSession: false } }
        )

        // Check if user with this wallet exists
        const { data: existingProfile } = await supabaseAdmin
            .from('profiles')
            .select('id, email')
            .eq('eth_address', address.toLowerCase())
            .single()

        let userId: string
        let isNewUser = false

        if (existingProfile) {
            // Existing user with wallet linked
            userId = existingProfile.id
        } else {
            // Create new user
            isNewUser = true

            // Generate a random email for wallet-only users
            const randomEmail = `${address.toLowerCase().slice(0, 10)}@wallet.shiny.bet`
            const randomPassword = crypto.randomUUID()

            const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
                email: randomEmail,
                password: randomPassword,
                email_confirm: true,
                user_metadata: {
                    username: `ETH_${address.slice(0, 6)}`,
                    eth_address: address.toLowerCase(),
                }
            })

            if (createError) throw createError
            userId = newUser.user.id

            // Update profile with wallet address
            await supabaseAdmin
                .from('profiles')
                .update({ eth_address: address.toLowerCase() })
                .eq('id', userId)
        }

        // Generate session for the user
        const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.generateLink({
            type: 'magiclink',
            email: (await supabaseAdmin.from('profiles').select('email').eq('id', userId).single()).data?.email || '',
        })

        if (sessionError) {
            // Fallback: generate a custom JWT token
            const { data: { session }, error: signInError } = await supabaseAdmin.auth.admin.createSession(userId)

            if (signInError) throw signInError

            return new Response(
                JSON.stringify({ session, isNewUser }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        return new Response(
            JSON.stringify({ success: true, userId, isNewUser }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
