import { NextResponse } from 'next/server';
import { checkQuota } from '@/lib/entitlements';
import { callAI } from '@/lib/aiClient';

async function askAI(systemPrompt: string, userPrompt: string): Promise<string> {
  return callAI(systemPrompt, userPrompt, 4000);
}

function parseJSONResponse(text: string): any {
  let cleanText = text.trim();
  if (cleanText.startsWith('```')) {
    const firstNewLine = cleanText.indexOf('\n');
    if (firstNewLine !== -1) {
      cleanText = cleanText.slice(firstNewLine + 1);
    }
    if (cleanText.endsWith('```')) {
      cleanText = cleanText.slice(0, -3);
    }
    cleanText = cleanText.trim();
  }
  const startIdx = cleanText.indexOf('{');
  const endIdx = cleanText.lastIndexOf('}');
  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    cleanText = cleanText.slice(startIdx, endIdx + 1);
  }
  return JSON.parse(cleanText);
}

export async function POST(request: Request) {
  try {
    // Kvota tekshiruvi: kim so'rayapti va bugungi limitidan oshmadimi.
    // Limit tugagan bo'lsa 402 qaytadi va AI umuman chaqirilmaydi.
    const gate = await checkQuota(request, 'chat');
    if (gate.denied) return gate.denied.response;

    const { passage, language, targetLevel } = await request.json();
    if (!passage || !language) {
      return NextResponse.json({ error: 'Passage and language are required' }, { status: 400 });
    }

    if (language === 'english') {
      const finalLevel = targetLevel || "7.5";
      
      const systemPrompt = `You are a professional educational assessor and IELTS curriculum designer. Your task is to calibrate the difficulty of the provided IELTS practice test (reading passage, listening transcript, questions, or writing prompts) to align perfectly with the target band score: ${finalLevel}.
      
CRITICAL INSTRUCTIONS:
1. Calibrate difficulty:
   - For high target band scores (7.5, 8.0, 8.5, 9.0): Rephrase/rewrite the passage using complex, high-level vocabulary, academic sentence structures, and design highly challenging distractor options and questions with subtle academic traps (matching the most difficult Cambridge Academic IELTS Reading & Listening items).
   - For low target band scores (5.0, 5.5, 6.0): Simplify complex sentence structures, rewrite using clear and accessible vocabulary (B1/B2 level), and make the questions and options straightforward with less tricky traps.
   - For intermediate target band scores (6.5, 7.0): Keep it at standard, balanced IELTS difficulty.
2. Maintain exact structural keys, paragraph labels, question IDs, array structures, and JSON format.
3. The response MUST be a valid JSON object matching the input structure. Do not add any markdown formatting outside the JSON.`;

      const userPrompt = `Input English IELTS content to Calibrate:\n${JSON.stringify(passage, null, 2)}\n\nCalibrate this content to target level: ${finalLevel}. Return the JSON object only:`;

      try {
        const reply = await askAI(systemPrompt, userPrompt);
        const translated = parseJSONResponse(reply);
        return NextResponse.json({ translated });
      } catch (e) {
        console.warn("English difficulty calibration failed, falling back to original:", e);
        return NextResponse.json({ translated: passage });
      }
    }

    const systemPrompt = `You are a professional educational assessor and exam curriculum designer for ${language} exams (e.g., JLPT for Japanese, TOPIK for Korean, HSK for Chinese, TRKI/CEFR for Russian).
Your task is to transform the provided English IELTS exam content (reading passage, listening transcript, questions, or writing prompts) into an authentic, native, high-quality exam material in the target language (${language}).

CRITICAL CONVERSION INSTRUCTIONS (Do NOT just translate word-for-word!):
1. Transcreate & Localize Content:
   Instead of translating IELTS topics literally (e.g. Origins of the Universe), you MUST map and rewrite the text into a culturally and academically authentic topic for ${language} exams:
   - For Reading Passages (when the input has "paragraphs"):
     * Map 'universe' (Origins of the Universe) -> 'Traditional Philosophy/Aesthetics' (e.g. Wabi-Sabi for Japanese, Pushkin/Tolstoy for Russian, Jeong Culture for Korean, Great Wall/Confucius for Chinese).
     * Map 'ai' (Evolution of AI) -> 'National Traditions & Etiquette' (e.g. Omotenashi for Japanese, Hermitage Museum for Russian, Hanok Architecture for Korean, Traditional Festivities for Chinese).
     * Map 'tea' (History of Tea) -> 'Engineering/Scientific Innovations' (e.g. Shinkansen for Japanese, Trans-Siberian Railway for Russian, Invention of Hangul for Korean, Traditional Medicine for Chinese).
     * Map 'sleep' (Science of Sleep) -> 'Traditional Arts & Folk Crafts' (e.g. Matsuri/Kabuki for Japanese, Matryoshka/Gzhel for Russian, Hanbok Fashion for Korean, Chinese Calligraphy for Chinese).
     * Map 'energy' (Renewable Energy) -> 'Geography, Nature & Livelihood' (e.g. Ikigai/Work Culture for Japanese, Lake Baikal for Russian, Korean Tea Ceremony for Korean, Mid-Autumn Festival for Chinese).
   - For Listening Transcripts (when the input has "transcript"):
     * Transcreate dialogue to take place in a native setting (e.g. Moscow for Russian, Tokyo for Japanese, Seoul for Korean, Beijing for Chinese) between native speakers discussing local topics.
   - For Writing Prompts (when the input has task1/task2 prompts):
     * Adapt prompts to match local exam topics (e.g., TOPIK Task 53/54 style, HSK character writing, or TRKI essays).

2. Calibrate Difficulty:
   - Target Candidate Level: ${targetLevel || 'Intermediate (e.g. B2 / JLPT N2 / TOPIK 4 / HSK 4)'}.
   - Adapt vocabulary, grammar patterns, character density, and complexity to perfectly match this target level of the standard exam for ${language}.

3. Reformulate Questions:
   - For Reading Passages:
     * Standard exams like JLPT, TOPIK, HSK, and TRKI do NOT have matching paragraph info or True/False/Not Given questions. You MUST reformulate these questions into 7 standard Multiple Choice Questions (MCQs) in the target language based on the rewritten text!
     * Remove "matchingQuestions" and "tfQuestions" from the output.
     * Add "mcqQuestions": an array of 7 questions. Each question must look like:
       { "id": "q1", "number": "1.", "text": "Question stem or cloze prompt in the target language", "options": ["Option A", "Option B", "Option C", "Option D"] }
     * Add a "keys" object mapping each question ID to the correct option letter (A, B, C, or D), e.g. { "q1": "A", "q2": "C", ... }.

4. Keep all other structural keys and array structures exactly the same.
5. The response MUST be a valid JSON object. Do not add any markdown formatting outside the JSON.`;

    const userPrompt = `Input Passage to Translate:\n${JSON.stringify(passage, null, 2)}\n\nTranslate the passage into: ${language}. Return the JSON object only:`;

    const reply = await askAI(systemPrompt, userPrompt);
    const translated = parseJSONResponse(reply);

    return NextResponse.json({ translated });
  } catch (error: any) {
    console.error('Translation API error:', error);
    return NextResponse.json({ error: error.message || 'An error occurred' }, { status: 500 });
  }
}
