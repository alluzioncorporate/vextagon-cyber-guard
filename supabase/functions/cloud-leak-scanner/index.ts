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

    // Generate common bucket name patterns
    const cleanDomain = domain.replace(/\./g, '-');
    const bucketPatterns = [
      domain,
      cleanDomain,
      `${cleanDomain}-backup`,
      `${cleanDomain}-assets`,
      `${cleanDomain}-uploads`,
      `${cleanDomain}-files`,
      `${cleanDomain}-public`,
      `${cleanDomain}-private`,
      `www-${cleanDomain}`,
      `dev-${cleanDomain}`,
      `staging-${cleanDomain}`,
      `prod-${cleanDomain}`,
    ];

    const results = [];

    for (const bucketName of bucketPatterns) {
      try {
        const s3Url = `https://${bucketName}.s3.amazonaws.com`;
        const response = await fetch(s3Url, { 
          method: 'HEAD',
          signal: AbortSignal.timeout(3000) // 3 second timeout
        });

        if (response.ok || response.status === 403) {
          // Bucket exists (403 means it exists but is private)
          const isPublic = response.status === 200;
          
          results.push({
            bucket_name: bucketName,
            url: s3Url,
            exists: true,
            is_public: isPublic,
            status: isPublic ? 'PUBLIC - EXPOSED!' : 'Private (Secure)',
            severity: isPublic ? 'critical' : 'info',
            checked_at: new Date().toISOString()
          });
        }
      } catch (error) {
        // Bucket doesn't exist or request failed - skip
        continue;
      }
    }

    return new Response(
      JSON.stringify({ 
        domain,
        scanned_patterns: bucketPatterns.length,
        found_buckets: results.length,
        public_buckets: results.filter(r => r.is_public).length,
        results: results
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
