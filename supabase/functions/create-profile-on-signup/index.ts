import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.0.0'

// This function is triggered by a Supabase webhook whenever a new user is created.
console.log('Create-profile-on-signup function initializing');

serve(async (req) => {
  try {
    const { record: user } = await req.json();

    // Ensure we have a user record to process
    if (!user || !user.id) {
      console.error('Webhook received invalid user data');
      return new Response('Invalid user data received', { status: 400 });
    }

    console.log(`Processing new user: ${user.id}`);

    // Create a Supabase client with the service role key to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Extract full_name from raw_user_meta_data, default to a generic name if not present
    const fullName = user.raw_user_meta_data?.full_name || 'New User';

    // Insert the new profile into the public.profiles table
    const { data, error } = await supabaseAdmin.from('profiles').insert({
      id: user.id,
      full_name: fullName,
      role: 'customer' // Default role for new sign-ups
    });

    if (error) {
      console.error('Error creating profile:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    console.log(`Successfully created profile for user: ${user.id}`);
    return new Response(JSON.stringify({ message: 'Profile created successfully', data }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (err) {
    console.error('An unexpected error occurred:', err);
    return new Response(String(err?.message ?? err), { status: 500 });
  }
});
