import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4'

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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create Supabase client with service role key to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    console.log('Received test results:', body);

    const { 
      email, 
      payment_code, 
      participant_name,
      duration,
      omission_errors, 
      commission_errors, 
      response_time, 
      variability 
    } = body;

    // Validate required fields
    if (!email || !payment_code) {
      return new Response(
        JSON.stringify({ error: 'Email and payment_code are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert test results using service role (bypasses RLS)
    const { data, error } = await supabase
      .from('test_results')
      .insert({
        email,
        payment_code,
        participant_name: participant_name || 'Peserta',
        duration,
        omission_errors: omission_errors || 0,
        commission_errors: commission_errors || 0,
        response_time: response_time || 0,
        variability: variability || 0,
        status: 'completed'
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving test results:', error);
      return new Response(
        JSON.stringify({ error: error.message, code: error.code }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Test results saved successfully:', data);

    return new Response(
      JSON.stringify({ data }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});