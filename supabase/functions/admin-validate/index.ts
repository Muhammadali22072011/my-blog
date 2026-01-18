// ============================================================================
// ADMIN SESSION VALIDATION - EDGE FUNCTION
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  try {
    const { sessionToken } = await req.json()

    if (!sessionToken) {
      return new Response(
        JSON.stringify({ valid: false, message: 'No session token provided' }),
        { status: 400, headers: CORS_HEADERS }
      )
    }

    // Валидируем сессию
    const { data, error } = await supabase.rpc('validate_admin_session', {
      p_session_token: sessionToken,
    })

    if (error) {
      console.error('Validation error:', error)
      return new Response(
        JSON.stringify({ valid: false, message: 'Validation error' }),
        { status: 500, headers: CORS_HEADERS }
      )
    }

    return new Response(
      JSON.stringify({ valid: data === true }),
      { headers: CORS_HEADERS }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ valid: false, message: 'Internal server error' }),
      { status: 500, headers: CORS_HEADERS }
    )
  }
})
