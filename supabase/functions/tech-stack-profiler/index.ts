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

    const url = domain.startsWith('http') ? domain : `https://${domain}`;
    const response = await fetch(url, {
      method: 'GET',
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch domain: ${response.status}`);
    }

    const html = await response.text();
    const headers = Object.fromEntries(response.headers.entries());

    // Analyze headers
    const technologies = [];
    const vulnerabilities = [];

    // Server header
    if (headers['server']) {
      technologies.push({
        name: 'Server',
        value: headers['server'],
        category: 'Web Server',
        source: 'header'
      });

      // Check for outdated servers
      if (headers['server'].toLowerCase().includes('apache/2.2') ||
          headers['server'].toLowerCase().includes('nginx/1.1')) {
        vulnerabilities.push({
          type: 'Outdated Server',
          severity: 'high',
          description: `${headers['server']} is outdated and may contain vulnerabilities`
        });
      }
    }

    // X-Powered-By header
    if (headers['x-powered-by']) {
      technologies.push({
        name: 'X-Powered-By',
        value: headers['x-powered-by'],
        category: 'Framework',
        source: 'header'
      });

      // Check for version disclosure
      vulnerabilities.push({
        type: 'Version Disclosure',
        severity: 'medium',
        description: `X-Powered-By header exposes: ${headers['x-powered-by']}`
      });
    }

    // Parse meta tags
    const metaRegex = /<meta\s+([^>]*)>/gi;
    const matches = html.matchAll(metaRegex);

    for (const match of matches) {
      const metaTag = match[1];
      
      // Generator meta tag
      if (metaTag.includes('name="generator"')) {
        const contentMatch = metaTag.match(/content="([^"]*)"/i);
        if (contentMatch) {
          technologies.push({
            name: 'Generator',
            value: contentMatch[1],
            category: 'CMS/Framework',
            source: 'meta'
          });
        }
      }
    }

    // Check for common frameworks in HTML
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
        technologies.push({
          name: check.name,
          value: 'Detected',
          category: check.category,
          source: 'html'
        });
      }
    });

    // Security headers check
    const securityHeaders = ['x-frame-options', 'x-content-type-options', 'strict-transport-security', 'content-security-policy'];
    const missingHeaders = securityHeaders.filter(h => !headers[h]);

    if (missingHeaders.length > 0) {
      vulnerabilities.push({
        type: 'Missing Security Headers',
        severity: 'medium',
        description: `Missing headers: ${missingHeaders.join(', ')}`
      });
    }

    return new Response(
      JSON.stringify({ 
        domain,
        technologies: technologies,
        vulnerabilities: vulnerabilities,
        security_score: Math.max(0, 100 - (vulnerabilities.length * 15)),
        scanned_at: new Date().toISOString()
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
