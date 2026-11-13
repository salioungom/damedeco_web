import { headers } from 'next/headers';
import type { MetadataRoute } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://damedeco.shop';
const publicPaths = ['/', '/shop', '/about', '/contact', '/mentions-legales', '/cgv', '/confidentialite'];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const requestHeaders = await headers();
    const requestHost = (requestHeaders.get('x-forwarded-host') ?? requestHeaders.get('host') ?? '')
        .split(',')[0]
        .trim()
        .toLowerCase()
        .replace(/:\d+$/, '');

    if (requestHost !== 'damedeco.shop' || new URL(siteUrl).hostname !== 'damedeco.shop') {
        return [];
    }

    return publicPaths.map((path) => ({
        url: new URL(path, siteUrl).toString(),
        changeFrequency: 'weekly',
        priority: path === '/' ? 1 : 0.7,
    }));
}
