import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface IGMediaItem {
  media_url?: string;
  media_type?: string;
}

// Instagram's media_url is a short-lived signed CDN link (expires within hours,
// sometimes sooner for Reels). Resolving it fresh on every request — instead of
// handing the browser the signed URL directly — means playback never 403s
// regardless of how long a visitor's tab has been open.
async function resolveMediaUrl(mediaId: string, accessToken: string): Promise<string | null> {
  const url = `https://graph.instagram.com/${mediaId}?fields=media_url,media_type&access_token=${accessToken}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) return null;
  const json: IGMediaItem = await res.json();
  return json.media_url ?? null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  if (!accessToken) {
    return NextResponse.json(
      { error: 'Instagram access token is not configured' },
      { status: 503 },
    );
  }

  const { id } = await params;

  let mediaUrl: string | null;
  try {
    mediaUrl = await resolveMediaUrl(id, accessToken);
  } catch (error) {
    console.error('Failed to resolve Instagram media URL:', error);
    return NextResponse.json({ error: 'Failed to resolve media' }, { status: 502 });
  }

  if (!mediaUrl) {
    return NextResponse.json({ error: 'Media not found' }, { status: 404 });
  }

  const range = request.headers.get('range');
  const upstream = await fetch(mediaUrl, {
    headers: range ? { range } : undefined,
    cache: 'no-store',
  });

  if (!upstream.ok && upstream.status !== 206) {
    return NextResponse.json(
      { error: 'Failed to fetch video from Instagram' },
      { status: 502 },
    );
  }

  const headers = new Headers();
  const passthrough = [
    'content-type',
    'content-length',
    'content-range',
    'accept-ranges',
  ];
  for (const key of passthrough) {
    const value = upstream.headers.get(key);
    if (value) headers.set(key, value);
  }
  headers.set('Cache-Control', 'private, max-age=60');

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers,
  });
}
