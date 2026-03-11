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

    const url = `https://${cleanDomain}`;
    const response = await fetch(url, {
      method: 'GET',
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      await response.body?.cancel();
      return new Response(JSON.stringify({ error: 'Failed to reach domain' }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const html = await response.text();
    const headers = Object.fromEntries(response.headers.entries());

    const technologies = [];
    const vulnerabilities = [];

    if (headers['server']) {
      technologies.push({ name: 'Server', value: headers['server'], category: 'Web Server', source: 'header' });
      if (headers['server'].toLowerCase().includes('apache/2.2') || headers['server'].toLowerCase().includes('nginx/1.1')) {
        vulnerabilities.push({ type: 'Outdated Server', severity: 'high', description: 'Server version is outdated and may contain vulnerabilities' });
      }
    }

    if (headers['x-powered-by']) {
      technologies.push({ name: 'X-Powered-By', value: headers['x-powered-by'], category: 'Framework', source: 'header' });
      vulnerabilities.push({ type: 'Version Disclosure', severity: 'medium', description: 'X-Powered-By header exposes technology stack information' });
    }

    const metaRegex = /<meta\s+([^>]*)>/gi;
    const matches = html.matchAll(metaRegex);
    for (const match of matches) {
      const metaTag = match[1];
      if (metaTag.includes('name="generator"')) {
        const contentMatch = metaTag.match(/content="([^"]*)"/i);
        if (contentMatch) {
          technologies.push({ name: 'Generator', value: contentMatch[1], category: 'CMS/Framework', source: 'meta' });
        }
      }
    }

    const frameworkChecks = [
      { pattern: /wp-content/i, name: 'WordPress', category: 'CMS' },
      { pattern: /joomla/i, name: 'Joomla', category: 'CMS' },
      { pattern: /drupal/i, name: 'Drupal', category: 'CMS' },
      { pattern: /_next/i, name: 'Next.js', category: 'Framework' },
      { pattern: /react/i, name: 'React', category: 'Library' },
      { pattern: /vue/i, name: 'Vue.js', category: 'Framework' },
      { pattern: /angular/i, name: 'Angular', category: 'Framework' },
    ];

    frameworkChecks.forEach(check => {
      if (check.pattern.test(html)) {
        technologies.push({ name: check.name, value: 'Detected', category: check.category, source: 'html' });
      }
    });

    const securityHeaders = ['x-frame-options', 'x-content-type-options', 'strict-transport-security', 'content-security-policy'];
    const missingHeaders = securityHeaders.filter(h => !headers[h]);
    if (missingHeaders.length > 0) {
      vulnerabilities.push({ type: 'Missing Security Headers', severity: 'medium', description: `Missing headers: ${missingHeaders.join(', ')}` });
    }

    return new Response(
      JSON.stringify({ 
        domain: cleanDomain, technologies, vulnerabilities,
        security_score: Math.max(0, 100 - (vulnerabilities.length * 15)),
        scanned_at: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch {
    return new Response(
      JSON.stringify({ error: 'Profiling failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
