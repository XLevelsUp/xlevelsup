import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export interface InstagramReel {
  id: string;
  caption: string;
  mediaUrl: string;
  thumbnailUrl: string;
  permalink: string;
  timestamp: string;
}

interface IGMediaItem {
  id: string;
  caption?: string;
  media_type: string;
  media_product_type?: string;
  media_url?: string;
  thumbnail_url?: string;
  permalink: string;
  timestamp: string;
}

const REELS_COUNT = 5;

export async function GET() {
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;

  if (!accessToken) {
    return NextResponse.json(
      { error: 'Instagram access token is not configured' },
      { status: 503 },
    );
  }

  try {
    const fields =
      'id,caption,media_type,media_product_type,media_url,thumbnail_url,permalink,timestamp';
    const url = `https://graph.instagram.com/me/media?fields=${fields}&limit=25&access_token=${accessToken}`;

    // Cached for 5 minutes — newly uploaded reels appear automatically
    const res = await fetch(url, { next: { revalidate: 300 } });

    if (!res.ok) {
      const body = await res.text();
      console.error('Instagram API error:', res.status, body);
      return NextResponse.json(
        { error: 'Failed to fetch Instagram media' },
        { status: 502 },
      );
    }

    const json: { data?: IGMediaItem[] } = await res.json();

    const reels: InstagramReel[] = (json.data ?? [])
      .filter(
        (m) =>
          m.media_type === 'VIDEO' &&
          (m.media_product_type ? m.media_product_type === 'REELS' : true) &&
          m.media_url,
      )
      .slice(0, REELS_COUNT)
      .map((m) => ({
        id: m.id,
        caption: m.caption ?? '',
        mediaUrl: m.media_url as string,
        thumbnailUrl: m.thumbnail_url ?? '',
        permalink: m.permalink,
        timestamp: m.timestamp,
      }));

    return NextResponse.json(
      { reels },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      },
    );
  } catch (error) {
    console.error('Instagram reels fetch failed:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Instagram reels' },
      { status: 500 },
    );
  }
}
