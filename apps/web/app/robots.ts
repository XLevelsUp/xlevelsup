import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    const baseUrl = 'https://www.xlevelsup.com';

    return {
        rules: [
            // Traditional search engines — full access
            {
                userAgent: ['Googlebot', 'Bingbot', 'Applebot', 'DuckDuckBot', 'Slurp'],
                allow: '/',
            },
            // AI search / RAG agents — allow (drives citations and brand discovery)
            {
                userAgent: [
                    'ChatGPT-User',
                    'OAI-SearchBot',
                    'PerplexityBot',
                    'Claude-SearchBot',
                    'Amazonbot',
                    'Google-Extended',     // Required for Google AI Overviews
                ],
                allow: '/',
            },
            // AI model training scrapers — block (unauthorised IP extraction)
            {
                userAgent: [
                    'GPTBot',              // OpenAI training
                    'ClaudeBot',           // Anthropic training
                    'CCBot',               // Common Crawl (feeds many training datasets)
                    'Bytespider',          // ByteDance/TikTok
                    'Meta-ExternalAgent',  // Meta AI training
                    'Applebot-Extended',   // Apple AI training
                    'FacebookBot',         // Meta/Facebook
                    'DataForSeoBot',       // Bulk data extraction
                    'PetalBot',            // Huawei
                    'Scrapy',              // Generic scraper framework
                    'ia_archiver',         // Internet Archive
                ],
                disallow: '/',
            },
            // Generic wildcard — allow with Next.js internal path exclusions
            {
                userAgent: '*',
                allow: '/',
                disallow: [
                    '/_next/',             // Internal Next.js assets — no crawl value
                    '/api/',               // API routes
                ],
            },
        ],
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}
