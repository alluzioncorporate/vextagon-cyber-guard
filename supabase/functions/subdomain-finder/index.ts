import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { domain } = await req.json();

    if (!domain) {
      throw new Error('Domain is required');
    }

    // Query crt.sh API for certificate transparency logs
    const crtshUrl = `https://crt.sh/?q=%.${domain}&output=json`;
    const response = await fetch(crtshUrl);
    
    if (!response.ok) {
      throw new Error('Failed to fetch certificate data');
    }

    const data = await response.json();
    
    // Extract unique subdomains
    const subdomains = new Set<string>();
    
    data.forEach((cert: any) => {
      if (cert.name_value) {
        // Handle wildcard and multiple names
        const names = cert.name_value.split('\n');
        names.forEach((name: string) => {
          const cleanName = name.trim().toLowerCase();
          if (cleanName.includes(domain) && !cleanName.startsWith('*')) {
            subdomains.add(cleanName);
          }
        });
      }
    });

    const results = Array.from(subdomains).map(subdomain => ({
      subdomain,
      discovered_at: new Date().toISOString(),
      source: 'crt.sh'
    }));

    return new Response(
      JSON.stringify({ 
        domain,
        count: results.length,
        subdomains: results.sort((a, b) => a.subdomain.localeCompare(b.subdomain))
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
