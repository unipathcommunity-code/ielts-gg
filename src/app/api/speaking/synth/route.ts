import { NextResponse } from 'next/server';
import { checkQuota } from '@/lib/entitlements';

export async function POST(request: Request) {
  try {
    // Kvota tekshiruvi: kim so'rayapti va bugungi limitidan oshmadimi.
    // Limit tugagan bo'lsa 402 qaytadi va AI umuman chaqirilmaydi.
    const gate = await checkQuota(request, 'tts');
    if (gate.denied) return gate.denied.response;

    const { 
      text, 
      gender
    } = await request.json();

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'OpenAI API key is missing' }, { status: 500 });
    }

    // Determine voice based on gender
    let voice = 'onyx'; // Deep male voice (great for Akaxon/brat style)
    if (gender === 'female') {
      voice = 'nova'; // Warm female voice
    }

    // Call OpenAI TTS API
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: text,
        voice: voice,
        response_format: 'mp3',
        speed: 1.0 // Normal speed
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('OpenAI TTS failed:', errText);
      return NextResponse.json({ error: `OpenAI TTS Error: ${response.statusText}` }, { status: 500 });
    }

    const audioBuffer = await response.arrayBuffer();
    return new NextResponse(audioBuffer, {
      headers: { 
        'Content-Type': 'audio/mpeg',
        'X-TTS-Provider': 'openai'
      }
    });

  } catch (error: any) {
    console.error('Synth API Error:', error);
    return NextResponse.json({ error: error.message || 'An error occurred during synthesis' }, { status: 500 });
  }
}

