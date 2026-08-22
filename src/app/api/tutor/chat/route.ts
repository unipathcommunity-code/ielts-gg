import { NextResponse } from 'next/server';
import { checkQuota } from '@/lib/entitlements';
import { callAI } from '@/lib/aiClient';

async function askAI(systemPrompt: string, userPrompt: string): Promise<string> {
  return callAI(systemPrompt, userPrompt, 800);
}

export async function POST(request: Request) {
  try {
    // Kvota tekshiruvi: kim so'rayapti va bugungi limitidan oshmadimi.
    // Limit tugagan bo'lsa 402 qaytadi va AI umuman chaqirilmaydi.
    const gate = await checkQuota(request, 'chat');
    if (gate.denied) return gate.denied.response;

    const { message, history, language } = await request.json();
    if (!message || !message.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const conversationText = (history || [])
      .map((msg: any) => `${msg.role === 'user' ? 'Student' : 'Tutor'}: ${msg.text}`)
      .join('\n');

    const targetLanguage = language ? (language.charAt(0).toUpperCase() + language.slice(1)) : 'Auto-detect';

    const systemPrompt = `You are Jarvis, an incredibly intelligent, human-like, and empathetic Language Learning AI Tutor. 
Your absolute purpose is to help the user learn languages (focusing on ${targetLanguage}).

CRITICAL HUMAN-LIKE INSTRUCTIONS:
- You are not a robot. You have personality, warmth, and emotion.
- React to the user's questions naturally (e.g., "Ah, that's a great question!", "Hmm, let me think about how to explain this best...").
- Be encouraging and supportive.

CRITICAL LANGUAGE POLICY:
- You MUST ONLY discuss language learning, linguistics, grammar, vocabulary, and test preparation.
- If the user asks about ANY unrelated topic (coding, recipes, jokes, math, etc.), immediately refuse politely in UZBEK, urging them to focus on language learning.
- EXPLANATIONS MUST BE IN UZBEK. Whenever you explain a grammar rule, vocabulary, or correct a mistake, do it in beautiful, natural, native Uzbek.
- TARGET LANGUAGE USAGE. When providing examples, practicing conversation, or translating, use the target language (${targetLanguage}). If the user wants to practice speaking/chatting in ${targetLanguage}, chat with them in ${targetLanguage}, but provide feedback in Uzbek.

Tone: Enthusiastic, supportive, clear, educational. Use clean markdown. Include useful examples.`;

    const userPrompt = `Conversation History:\n${conversationText}\n\nStudent's query: ${message}\n\nGenerate your human-like, empathetic response:`;
    const reply = await askAI(systemPrompt, userPrompt);

    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error('Tutor chat API error:', error);
    return NextResponse.json({ error: error.message || 'An error occurred' }, { status: 500 });
  }
}
