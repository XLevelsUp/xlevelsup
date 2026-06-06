import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://www.xlevelsup.com';

    return [
        {
            url: baseUrl,
            lastModified: new Date('2026-06-06'),
            changeFrequency: 'weekly',
            priority: 1.0,
        },
        {
            url: `${baseUrl}/about`,
            lastModified: new Date('2026-06-06'),
            changeFrequency: 'monthly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/contact`,
            lastModified: new Date('2026-06-06'),
            changeFrequency: 'monthly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/work`,
            lastModified: new Date('2026-06-06'),
            changeFrequency: 'weekly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/careers`,
            lastModified: new Date('2026-06-06'),
            changeFrequency: 'weekly',
            priority: 0.7,
        },
        {
            url: `${baseUrl}/privacy`,
            lastModified: new Date('2026-06-06'),
            changeFrequency: 'yearly',
            priority: 0.3,
        },
        {
            url: `${baseUrl}/solutions/marketing-architecture`,
            lastModified: new Date('2026-06-06'),
            changeFrequency: 'monthly',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/solutions/growth-systems`,
            lastModified: new Date('2026-06-06'),
            changeFrequency: 'monthly',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/solutions/search-engineering`,
            lastModified: new Date('2026-06-06'),
            changeFrequency: 'monthly',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/solutions/ai-automation`,
            lastModified: new Date('2026-06-06'),
            changeFrequency: 'monthly',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/solutions/digital-marketing`,
            lastModified: new Date('2026-06-06'),
            changeFrequency: 'monthly',
            priority: 0.9,
        },
    ];
}
