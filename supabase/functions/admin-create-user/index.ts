import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Verify the requesting user is an admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)
    
    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    // Check if user is admin
    const { data: isAdmin } = await supabaseAdmin.rpc('is_admin', { _user_id: user.id })
    if (!isAdmin) {
      throw new Error('Unauthorized: Admin access required')
    }

    const { email, password, full_name, phone, role_id } = await req.json()

    // Create user with admin client
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name,
        phone
      }
    })

    if (createError) throw createError

    // Update profile with role (trigger already created it)
    // Use upsert to handle case where trigger might not have run yet
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: newUser.user.id,
        email,
        full_name,
        phone,
        role_id
      }, {
        onConflict: 'id'
      })

    if (profileError) {
      // Rollback user creation if profile fails
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id)
      throw profileError
    }

    return new Response(
      JSON.stringify({ success: true, user: newUser.user }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error creating user:', error)
    
    // Extract error message and details
    let errorMessage = 'Failed to create user'
    let errorDetails: any = undefined
    
    if (error instanceof Error) {
      errorMessage = error.message
      // Check if it's a Supabase error with details
      if ('details' in error) {
        errorDetails = (error as any).details
      }
      if ('hint' in error) {
        errorDetails = { ...errorDetails, hint: (error as any).hint }
      }
      if ('code' in error) {
        errorDetails = { ...errorDetails, code: (error as any).code }
      }
    } else {
      errorMessage = String(error)
    }
    
    console.error('Error details:', { errorMessage, errorDetails, error })
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: errorDetails 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
