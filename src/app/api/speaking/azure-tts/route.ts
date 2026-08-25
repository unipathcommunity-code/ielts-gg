import { NextResponse } from 'next/server';
import { checkQuota } from '@/lib/entitlements';

/**
 * Multilingual TTS route.
 * - `autoLang: true` (or language === 'auto'): splits the text into sentences, detects the language
 *   of EACH sentence (Uzbek vs English etc.) and speaks each in its own native voice, so mixed-language
 *   replies are pronounced correctly. Uses free Microsoft Edge TTS (no key needed).
 * - Otherwise: single voice. Uses Azure Neural TTS if AZURE_SPEECH_KEY is set, else Edge TTS fallback.
 */

function pickVoice(lang: string, uzbekVoice?: string, female?: boolean): string {
  if (lang === 'uzbek') return uzbekVoice === 'madina' ? 'uz-UZ-MadinaNeural' : 'uz-UZ-SardorNeural';
  if (lang === 'korean') return female ? 'ko-KR-SunHiNeural' : 'ko-KR-InJoonNeural';
  if (lang === 'chinese') return female ? 'zh-CN-XiaoxiaoNeural' : 'zh-CN-YunxiNeural';
  if (lang === 'japanese') return female ? 'ja-JP-NanamiNeural' : 'ja-JP-KeitaNeural';
  if (lang === 'russian') return female ? 'ru-RU-SvetlanaNeural' : 'ru-RU-DmitryNeural';
  if (lang === 'german') return female ? 'de-DE-AmalaNeural' : 'de-DE-KillianNeural';
  return female ? 'en-GB-SoniaNeural' : 'en-GB-RyanNeural';
}

// Lightweight Uzbek-vs-English detector for a short text segment.
function classifyLang(text: string): 'uzbek' | 'english' {
  // Uzbek-specific letters (oʻ, gʻ with apostrophe variants) strongly indicate Uzbek.
  if (/o['ʻʼ`]|g['ʻʼ`]/i.test(text)) return 'uzbek';
  const t = ' ' + text.toLowerCase().replace(/[^a-z'ʻʼ`\s]/g, ' ').replace(/\s+/g, ' ') + ' ';
  const uz = [' va ', ' ham ', ' uchun ', ' bilan ', ' men ', ' sen ', ' biz ', ' bu ', ' shu ', ' nima ', ' qanday ', ' kerak ', ' juda ', ' yaxshi ', ' rahmat ', ' salom ', ' bor ', ' qil', ' qanaqa ', ' qaysi ', ' nega ', ' lekin ', ' ammo ', ' mumkin ', ' degan ', ' qiziq ', ' albatta '];
  const en = [' the ', ' is ', ' are ', ' you ', ' your ', ' do ', ' does ', ' what ', ' how ', ' and ', ' for ', ' with ', ' this ', ' that ', ' good ', ' very ', ' can ', ' will ', ' would ', ' to ', ' of ', ' in ', ' on ', ' a ', ' i ', ' it ', ' have ', ' my ', ' about ', ' really ', ' think '];
  let u = 0, e = 0;
  for (const m of uz) if (t.includes(m)) u++;
  for (const m of en) if (t.includes(m)) e++;
  return u >= e ? 'uzbek' : 'english';
}

async function edgeSynth(text: string, voiceName: string): Promise<Buffer> {
  // msedge-tts faqat CommonJS eksport qiladi — dinamik require ataylab (PROJECT_RULES).
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { MsEdgeTTS, OUTPUT_FORMAT } = require('msedge-tts');
  const tts = new MsEdgeTTS();
  await tts.setMetadata(voiceName, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
  return new Promise<Buffer>((resolve, reject) => {
    try {
      const { audioStream } = tts.toStream(text);
      const chunks: Buffer[] = [];
      audioStream.on('data', (c: Buffer) => chunks.push(c));
      audioStream.on('close', () => resolve(Buffer.concat(chunks)));
      audioStream.on('error', reject);
    } catch (e) { reject(e); }
  });
}

export async function POST(request: Request) {
  try {
    // Kvota tekshiruvi: kim so'rayapti va bugungi limitidan oshmadimi.
    // Limit tugagan bo'lsa 402 qaytadi va AI umuman chaqirilmaydi.
    const gate = await checkQuota(request, 'tts');
    if (gate.denied) return gate.denied.response;

    const { text, language, gender, uzbekVoice, key, region, autoLang } = await request.json();
    if (!text || !text.trim()) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const female = gender === 'female';
    const azureKey = key || process.env.AZURE_SPEECH_KEY;
    const azureRegion = region || process.env.AZURE_SPEECH_REGION;
    const auto = autoLang === true || language === 'auto';

    // ── AUTO multilingual: pronounce each sentence in its own language (free Edge TTS) ──
    if (auto) {
      try {
        const sentences = String(text).split(/(?<=[.!?…])\s+/).map((s: string) => s.trim()).filter(Boolean);
        const segments = sentences.length ? sentences : [text];
        const buffers: Buffer[] = [];
        for (const seg of segments) {
          const lang = classifyLang(seg);
          buffers.push(await edgeSynth(seg, pickVoice(lang, uzbekVoice, female)));
        }
        return new NextResponse(new Uint8Array(Buffer.concat(buffers)), {
          headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'no-store' },
        });
      } catch (err: any) {
        console.error('Auto Edge TTS error:', err);
        return NextResponse.json({ error: 'Auto TTS failed: ' + err.message }, { status: 500 });
      }
    }

    const lang = language || 'english';
    const voiceName = pickVoice(lang, uzbekVoice, female);

    // ── No Azure key → single-voice Edge TTS fallback ──
    if (!azureKey || !azureRegion) {
      try {
        const buf = await edgeSynth(text, voiceName);
        return new NextResponse(new Uint8Array(buf), { headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'no-store' } });
      } catch (err: any) {
        console.error('Edge TTS error:', err);
        return NextResponse.json({ error: 'Edge TTS failed: ' + err.message }, { status: 500 });
      }
    }

    // ── Azure Neural TTS (when a key is configured) ──
    const xmlLang = lang === 'uzbek' ? 'uz-UZ' : lang === 'korean' ? 'ko-KR' : lang === 'chinese' ? 'zh-CN' : lang === 'japanese' ? 'ja-JP' : lang === 'russian' ? 'ru-RU' : lang === 'german' ? 'de-DE' : 'en-GB';
    const ssml = `<speak version='1.0' xml:lang='${xmlLang}'><voice name='${voiceName}'><prosody rate='0%' pitch='0%'>${escapeXml(text)}</prosody></voice></speak>`;
    const ttsResponse = await fetch(`https://${azureRegion}.tts.speech.microsoft.com/cognitiveservices/v1`, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': azureKey,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
        'User-Agent': 'kmwbb-AzureTTS/1.0',
      },
      body: ssml,
    });
    if (!ttsResponse.ok) {
      const errText = await ttsResponse.text();
      return NextResponse.json({ error: 'Azure TTS failed: ' + errText }, { status: ttsResponse.status });
    }
    const audioBuffer = await ttsResponse.arrayBuffer();
    return new NextResponse(audioBuffer, { headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'no-store' } });
  } catch (error: any) {
    console.error('TTS route error:', error);
    return NextResponse.json({ error: error.message || 'An error occurred during synthesis' }, { status: 500 });
  }
}

function escapeXml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}
