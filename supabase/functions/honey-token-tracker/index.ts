import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token');

    if (!token) {
      return new Response('Invalid token', { 
        status: 400,
        headers: corsHeaders 
      });
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find the honey token
    const { data: honeyToken, error: fetchError } = await supabase
      .from('honey_tokens')
      .select('*')
      .eq('token', token)
      .single();

    if (fetchError || !honeyToken) {
      return new Response('Token not found', { 
        status: 404,
        headers: corsHeaders 
      });
    }

    // Collect access metadata
    const metadata = {
      ip: req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown',
      user_agent: req.headers.get('user-agent') || 'unknown',
      referer: req.headers.get('referer') || 'direct',
      timestamp: new Date().toISOString(),
      method: req.method,
    };

    // Update honey token access
    const { error: updateError } = await supabase
      .from('honey_tokens')
      .update({
        access_count: honeyToken.access_count + 1,
        accessed_at: new Date().toISOString(),
        access_metadata: [...(honeyToken.access_metadata || []), metadata]
      })
      .eq('id', honeyToken.id);

    if (updateError) {
      console.error('Failed to update token:', updateError);
    }

    // Create security alert
    const { error: alertError } = await supabase
      .from('security_alerts')
      .insert({
        user_id: honeyToken.user_id,
        alert_type: 'honey_token',
        severity: 'critical',
        title: '🚨 Honey Token Accessed!',
        description: `Token "${honeyToken.label}" was accessed from IP: ${metadata.ip}. User-Agent: ${metadata.user_agent}`,
      });

    if (alertError) {
      console.error('Failed to create alert:', alertError);
    }

    // Return a 1x1 transparent pixel
    const pixel = Uint8Array.from([
      0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x80, 0x00, 0x00,
      0xFF, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x21, 0xF9, 0x04, 0x01, 0x00, 0x00, 0x00,
      0x00, 0x2C, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02,
      0x44, 0x01, 0x00, 0x3B
    ]);

    return new Response(pixel, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'image/gif',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      }
    });
  } catch (error) {
    console.error('Honey token tracker error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
