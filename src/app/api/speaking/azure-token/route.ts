import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const key = body.key || process.env.AZURE_SPEECH_KEY;
    const region = body.region || process.env.AZURE_SPEECH_REGION;

    if (!key || !region) {
      return NextResponse.json(
        { error: 'Azure Speech is not configured (Key/Region missing)' },
        { status: 404 }
      );
    }

    const response = await fetch(
      `https://${region}.api.cognitive.microsoft.com/sts/v1.0/issueToken`,
      {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': key,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    if (!response.ok) {
      const err = await response.text();
      return NextResponse.json(
        { error: 'Failed to issue Azure token: ' + err },
        { status: response.status }
      );
    }

    const token = await response.text();
    return NextResponse.json({ token, region });
  } catch (error: any) {
    console.error('Error fetching Azure Speech token:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch token' },
      { status: 500 }
    );
  }
}

export async function GET() {
  const key = process.env.AZURE_SPEECH_KEY;
  const region = process.env.AZURE_SPEECH_REGION;

  if (!key || !region) {
    return NextResponse.json(
      { error: 'Azure Speech is not configured' },
      { status: 404 }
    );
  }

  try {
    const response = await fetch(
      `https://${region}.api.cognitive.microsoft.com/sts/v1.0/issueToken`,
      {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': key,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    if (!response.ok) {
      const err = await response.text();
      return NextResponse.json(
        { error: 'Failed to issue Azure token: ' + err },
        { status: response.status }
      );
    }

    const token = await response.text();
    return NextResponse.json({ token, region });
  } catch (error: any) {
    console.error('Error fetching Azure Speech token:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch token' },
      { status: 500 }
    );
  }
}
