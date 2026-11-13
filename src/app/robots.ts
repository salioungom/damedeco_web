import { headers } from 'next/headers';
import type { MetadataRoute } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://damedeco.shop';

export default async function robots(): Promise<MetadataRoute.Robots> {
    const requestHeaders = await headers();
    const requestHost = (requestHeaders.get('x-forwarded-host') ?? requestHeaders.get('host') ?? '')
        .split(',')[0]
        .trim()
        .toLowerCase()
        .replace(/:\d+$/, '');
    const isCanonicalProduction =
        requestHost === 'damedeco.shop' && new URL(siteUrl).hostname === 'damedeco.shop';

    return {
        rules: {
            userAgent: '*',
            ...(isCanonicalProduction ? { allow: '/' } : { disallow: '/' }),
        },
        ...(isCanonicalProduction ? { sitemap: `${siteUrl.replace(/\/+$/, '')}/sitemap.xml` } : {}),
    };
}
