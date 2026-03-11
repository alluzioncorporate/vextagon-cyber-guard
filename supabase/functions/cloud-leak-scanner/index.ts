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

    const cleanName = cleanDomain.replace(/\./g, '-');
    const bucketPatterns = [
      cleanDomain, cleanName, `${cleanName}-backup`, `${cleanName}-assets`,
      `${cleanName}-uploads`, `${cleanName}-files`, `${cleanName}-public`,
      `${cleanName}-private`, `www-${cleanName}`, `dev-${cleanName}`,
      `staging-${cleanName}`, `prod-${cleanName}`,
    ];

    const results = [];

    for (const bucketName of bucketPatterns) {
      try {
        const s3Url = `https://${bucketName}.s3.amazonaws.com`;
        const response = await fetch(s3Url, { 
          method: 'HEAD',
          signal: AbortSignal.timeout(3000)
        });

        if (response.ok || response.status === 403) {
          const isPublic = response.status === 200;
          results.push({
            bucket_name: bucketName, url: s3Url, exists: true, is_public: isPublic,
            status: isPublic ? 'PUBLIC - EXPOSED!' : 'Private (Secure)',
            severity: isPublic ? 'critical' : 'info',
            checked_at: new Date().toISOString()
          });
        }
      } catch {
        continue;
      }
    }

    return new Response(
      JSON.stringify({ 
        domain: cleanDomain, scanned_patterns: bucketPatterns.length,
        found_buckets: results.length,
        public_buckets: results.filter(r => r.is_public).length,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch {
    return new Response(
      JSON.stringify({ error: 'Scan processing failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
