// Updated: 2025-07-29 16:30:00
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Get user from JWT token
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
    
    if (userError || !user) {
      throw new Error('Invalid user token')
    }

    console.log(`Starting account deletion for user: ${user.id}`)

    // Start a transaction-like process to delete all user data
    // 1. Get all user's orders
    const { data: userOrders, error: ordersError } = await supabaseClient
      .from('orders')
      .select('id')
      .eq('user_id', user.id)

    if (ordersError) {
      console.error('Error fetching user orders:', ordersError)
      throw new Error('Failed to fetch user orders')
    }

    console.log(`Found ${userOrders?.length || 0} orders to delete`)

    // 2. Delete order items for all user orders
    if (userOrders && userOrders.length > 0) {
      const orderIds = userOrders.map(order => order.id)
      
      const { error: orderItemsError } = await supabaseClient
        .from('order_items')
        .delete()
        .in('order_id', orderIds)

      if (orderItemsError) {
        console.error('Error deleting order items:', orderItemsError)
        throw new Error('Failed to delete order items')
      }

      console.log('Successfully deleted order items')
    }

    // 3. Delete all user orders
    const { error: deleteOrdersError } = await supabaseClient
      .from('orders')
      .delete()
      .eq('user_id', user.id)

    if (deleteOrdersError) {
      console.error('Error deleting orders:', deleteOrdersError)
      throw new Error('Failed to delete orders')
    }

    console.log('Successfully deleted orders')

    // 4. Delete push subscriptions
    const { error: subscriptionsError } = await supabaseClient
      .from('push_subscriptions')
      .delete()
      .eq('user_id', user.id)

    if (subscriptionsError) {
      console.error('Error deleting push subscriptions:', subscriptionsError)
      // Don't throw error for this, it's not critical
    }

    console.log('Successfully deleted push subscriptions')

    // 5. Delete user profile
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .delete()
      .eq('id', user.id)

    if (profileError) {
      console.error('Error deleting profile:', profileError)
      throw new Error('Failed to delete profile')
    }

    console.log('Successfully deleted profile')

    // 6. Finally delete the user from auth
    const { error: deleteUserError } = await supabaseClient.auth.admin.deleteUser(user.id)

    if (deleteUserError) {
      console.error('Error deleting user from auth:', deleteUserError)
      throw new Error('Failed to delete user account')
    }

    console.log('Successfully deleted user from auth')

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Account and all associated data deleted successfully' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error in delete-user-account function:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to delete account',
        success: false 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})