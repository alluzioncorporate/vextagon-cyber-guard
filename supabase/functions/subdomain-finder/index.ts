import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DOMAIN_REGEX = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;

function sanitizeDomain(raw: string): string | null {
  const cleaned = raw.replace(/^https?:\/\//i, '').replace(/\/.*/, '').replace(/[<>"';&|`$(){}]*/g, '').toLowerCase().trim();
  if (!cleaned || cleaned.length > 253 || !DOMAIN_REGEX.test(cleaned)) return null;
  return cleaned;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { domain } = await req.json();

    if (!domain || typeof domain !== 'string') {
      return new Response(JSON.stringify({ error: 'Domain is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const cleanDomain = sanitizeDomain(domain);
    if (!cleanDomain) {
      return new Response(JSON.stringify({ error: 'Invalid domain format' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const crtshUrl = `https://crt.sh/?q=%.${encodeURIComponent(cleanDomain)}&output=json`;
    const response = await fetch(crtshUrl);
    
    if (!response.ok) {
      await response.body?.cancel();
      return new Response(JSON.stringify({ error: 'Failed to fetch certificate data' }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const data = await response.json();
    const subdomains = new Set<string>();
    
    data.forEach((cert: any) => {
      if (cert.name_value) {
        const names = cert.name_value.split('\n');
        names.forEach((name: string) => {
          const cleanName = name.trim().toLowerCase();
          if (cleanName.includes(cleanDomain) && !cleanName.startsWith('*')) {
            subdomains.add(cleanName);
          }
        });
      }
    });

    const results = Array.from(subdomains).map(subdomain => ({
      subdomain, discovered_at: new Date().toISOString(), source: 'crt.sh'
    }));

    return new Response(
      JSON.stringify({ 
        domain: cleanDomain, count: results.length,
        subdomains: results.sort((a, b) => a.subdomain.localeCompare(b.subdomain))
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch {
    return new Response(
      JSON.stringify({ error: 'Subdomain scan failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
