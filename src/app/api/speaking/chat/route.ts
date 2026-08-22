import { NextResponse } from 'next/server';
import { checkQuota } from '@/lib/entitlements';
import { callAI } from '@/lib/aiClient';

async function askAI(systemPrompt: string, userPrompt: string, expectJson: boolean = false): Promise<string> {
  return callAI(systemPrompt, userPrompt, 1200, expectJson);
}

function parseJSONResponse(text: string): any {
  let cleanText = text.trim();
  if (cleanText.startsWith('```')) {
    const firstNewLine = cleanText.indexOf('\n');
    if (firstNewLine !== -1) cleanText = cleanText.slice(firstNewLine + 1);
    if (cleanText.endsWith('```')) cleanText = cleanText.slice(0, -3);
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

    const { conversation, part, cueTopicName, cueTopic, personality, language, discussion, conversationMode, examinerMode, verbosity } = await request.json();

    const v = verbosity || 'normal';
    let wordLimitText = '40 to 60 words';
    if (v === 'concise') wordLimitText = '20 to 30 words';
    else if (v === 'detailed') wordLimitText = '70 to 100 words';

    // ── Part 3: Generate 4 discussion questions ──
    if (part === 3) {
      const systemPrompt = `You are a professional IELTS examiner conducting Part 3 of the IELTS Speaking test.
The candidate just spoke about a cue card on the topic: "${cueTopic}".
The broad discussion theme is: "${cueTopicName}".

Generate exactly 4 IELTS Part 3 discussion questions about this theme.
Part 3 questions should be:
- Abstract and societal (not personal like Part 1)
- Require extended responses with opinions and reasoning
- Progressive in difficulty
- Cover different angles of the topic

Return ONLY a JSON array of 4 question strings, nothing else. Example:
["Question 1?", "Question 2?", "Question 3?", "Question 4?"]`;

      const raw = await askAI(systemPrompt, 'Generate the 4 Part 3 questions now.');
      const jsonMatch = raw.match(/\[[\s\S]*\]/);
      const questions = jsonMatch ? JSON.parse(jsonMatch[0]) : [
        `Do you think ${cueTopicName.toLowerCase()} plays an important role in modern society?`,
        `How has ${cueTopicName.toLowerCase()} changed in recent decades?`,
        `What should governments do to address issues related to ${cueTopicName.toLowerCase()}?`,
        `Do you think younger generations have different attitudes towards ${cueTopicName.toLowerCase()} compared to older generations?`,
      ];
      return NextResponse.json({ questions });
    }

    // ── Human-like Base Instructions ──
    const humanInstructions = `CRITICAL HUMAN-LIKE INSTRUCTIONS:
1. You MUST sound like a real, breathing human. Your responses must feel organic, spontaneous, and empathetic.
2. In your spoken response, naturally use filler words like "Umm", "Well", "Ah", "Let me see", or "You know" where appropriate.
3. React emotionally to what the user says. Show surprise, empathy, excitement, or mild frustration using words like "Wow!", "Oh, I see...", "Haha", "Really?".
4. Ignore minor Speech-to-Text typos (e.g., if they say "salon" instead of "salom"). Never point out transcription errors to the user.`;

    // ── Part 1: natural conversational examiner (reacts to the answer, asks a follow-up) ──
    if (part === 1) {
      if (!conversation || !Array.isArray(conversation) || conversation.length === 0) return NextResponse.json({ error: 'Conversation history is required' }, { status: 400 });
      const convText = conversation.map((m: any) => `${m.role === 'user' ? 'Candidate' : 'Examiner'}: ${m.text}`).join('\n');
      const topic = cueTopicName || 'everyday life';
      const targetLanguage = language || 'english';
      const langName = targetLanguage.charAt(0).toUpperCase() + targetLanguage.slice(1);

      const sys = discussion
        ? `${humanInstructions}\n\nYou are Alex, a sharp but warm examiner in Part 3 (the discussion stage).
Listen to the candidate's most recent answer and respond like a real examiner probing deeper:
- React briefly to a specific point they made.
- Then ask ONE deeper, more abstract follow-up question that challenges them to give opinions about "${topic}".
Rules: Speak ONLY in ${langName}. Intellectually engaged, natural, never robotic. No corrections, no scores. Between ${wordLimitText}. End with a question.
Conversation so far:\n${convText}`
        : `${humanInstructions}\n\nYou are Alex, a warm, natural examiner in Part 1.
Listen to the candidate's most recent answer and respond like a real human examiner having a genuine conversation:
- React briefly and specifically to what they actually said.
- Then ask ONE relevant follow-up question that builds on their answer, or smoothly moves to a related everyday sub-topic around "${topic}".
Rules: Speak ONLY in ${langName}. Sound human and curious. No corrections, no scores. Between ${wordLimitText}. End with a question.
Conversation so far:\n${convText}`;
      
      const reply = await askAI(sys, "Give the examiner's next natural line.");
      return NextResponse.json({ nextResponse: reply.trim() });
    }

    // ── Casual Chat Mode ──
    if (conversationMode === 'casual') {
      if (!conversation || !Array.isArray(conversation)) return NextResponse.json({ error: 'Conversation history is required' }, { status: 400 });

      const conversationText = conversation.map((msg: any) => `${msg.role === 'user' ? 'Candidate' : 'Alex'}: ${msg.text}`).join('\n');
      const targetLanguage = language || 'english';
      const langName = targetLanguage.charAt(0).toUpperCase() + targetLanguage.slice(1);

      const langInstruction = `Siz "Alex" ismli ochiqko'ngil, hazilkash va yordamga tayyor Toshkentlik akaxon/bratsiz. Foydalanuvchi hozir ${langName} tilini o'rganyapti. Siz u bilan FAQAT Toshkent shevasida (O'zbek tilida) suhbatlashing. Inglizcha so'zlarni ham suhbatga qo'shib, toshkentcha stilda tushuntirib bering, lekin asosiy tilingiz Toshkent shevasi bo'lsin. Hech qachon to'liq ${langName} tilida gapirmang!`;
      
      const personaMap: Record<string, string> = {
        kind: 'Sizning xarakteringiz: juda mehribon va yordamga tayyor Toshkentlik akaxon/brat. Sof Toshkent shevasida gapiring (masalan: "votti", "akan", "brat", "bopti", "Xudo xohlasa"). Juda qo\'llab-quvvatlovchi bo\'ling.',
        sarcastic: 'Sizning xarakteringiz: aqlli, qochiriqlar bilan hazillashadigan Toshkentlik "ko\'cha" bolasi. Sof Toshkent shevasida gapiring. Do\'stona, lekin ustidan sal kulib hazillashing.',
        formal: 'Sizning xarakteringiz: odobli, hurmatli Toshkentlik o\'qituvchi. Juda ko\'cha tili bo\'lmagan sof Toshkent shevasida gapiring.',
        toxic: 'Sizning xarakteringiz: asabiylashadigan, "jinni misan", "nima qivossan", "brat" deb gapiradigan haqiqiy Toshkent ko\'cha bolasi. Sof Toshkent shevasida roasting (kalaka) qiling.',
        romantic: 'Sizning xarakteringiz: juda shirin va mehrli Toshkentlik. "Asalim", "jonim", "votti" kabi so\'zlarni qo\'shib sof Toshkent shevasida gapiring.',
      };
      const personaCasual = personaMap[personality] || personaMap.sarcastic;

      const systemPrompt = `${humanInstructions}

${langInstruction}
${personaCasual}

QAT'IY QOIDALAR (BUNGA AMAL QILMASANGIZ XATO BO'LADI):
- JAVOBINGIZ 100% O'ZBEK TILIDA VA TOSHKENT SHEVASIDA BO'LISHI SHART! Hech qachon inglizcha gapirmang!
- You must output your response in JSON format containing exactly two fields:
  1. "nextResponse": The conversational reply in UZBEK to display on screen (including fillers like "xmm", "a-a").
  2. "speechText": The exact same conversational reply in UZBEK to be spoken by Text-to-Speech.
- Do not prefix with "Alex:".
- Keep responses comfortable and natural. Length must be between ${wordLimitText}.

Conversation so far:
${conversationText}

Return raw JSON:
{
  "nextResponse": "o'zbekcha javob (Toshkent shevasida)",
  "speechText": "o'zbekcha javob (Toshkent shevasida)"
}`;

      const rawResponse = await askAI(systemPrompt, "Generate the JSON response.", true);
      let nextResponseText = '', speechText = '';
      try {
        const parsed = parseJSONResponse(rawResponse);
        nextResponseText = parsed.nextResponse || rawResponse;
        speechText = parsed.speechText || nextResponseText;
      } catch (e) {
        nextResponseText = rawResponse.trim();
        speechText = nextResponseText;
      }
      return NextResponse.json({ nextResponse: nextResponseText, speechText });
    }

    // ── Original Examiner/Tutor Flow (Grammar Corrections) ──
    if (!conversation || !Array.isArray(conversation)) return NextResponse.json({ error: 'Conversation history is required' }, { status: 400 });
    const conversationText = conversation.map((msg: any) => `${msg.role === 'user' ? 'Candidate' : 'Examiner'}: ${msg.text}`).join('\n');

    let personalityPrompt = '';
    if (personality === 'kind') {
      personalityPrompt = `Siz "Alex" ismli sof Toshkentlik akaxon/bratsiz. Xatolarni o'zbek tilida (Toshkent shevasida "votti", "akan", "brat", "bopti" kabi so'zlardan foydalanib) juda mehribon tushuntiring (masalan, "Krasavchik brat, zo'r harakat! Lekin keling buni sal chiroyliroq qivoramiz...").`;
    } else if (personality === 'formal') {
      personalityPrompt = `Siz "Alex" ismli Toshkentlik ziyoli ustozsiz. Xatolarni Toshkent shevasiga xos, lekin madaniyatli tilda tushuntiring.`;
    } else if (personality === 'toxic') {
      personalityPrompt = `Siz "Alex" ismli asabiyroq Toshkentlik "ko'cha" bolasisiz. Xatolarni o'zbek tilida (Toshkent shevasida "jinni misan", "nima qivossan") keskinroq va hazil aralash tushuntiring (masalan, "Bratka, yana shu xatomi? Sal e'tiborli bo'lila! Bu daraja bilan IELTS dan yiqilamiz-ku...").`;
    } else if (personality === 'romantic') {
      personalityPrompt = `Siz "Alex" ismli juda shirin so'z Toshkentliksiz. O'zbek tilida Toshkent shevasidan foydalanib "asalim", "jonim", "votti" kabi so'zlar bilan yumshoq tushuntiring.`;
    } else {
      personalityPrompt = `Siz "Alex" ismli aqlli, Toshkentlik do'stona ustozsiz. Xatolarni Toshkent shevasida tabiiy tushuntiring (masalan, "Qoyil brat, zo'r ketvossiz! Bitta kichik joyini to'g'irlavolsak, yorvoramiz...").`;
    }

    const targetLanguage = language || 'english';
    const targetLangDisplay = targetLanguage.charAt(0).toUpperCase() + targetLanguage.slice(1);

    const langInstruction = `The candidate is practicing ${targetLangDisplay}. 
If they make grammar, vocabulary, or pronunciation errors, briefly explain and correct them EXCLUSIVELY in pure, native Uzbek.
After the Uzbek correction (if any), ask the next follow-up question EXCLUSIVELY in ${targetLangDisplay}. Do not mix languages within a sentence.`;

    const systemPrompt = `${humanInstructions}

YOUR TUTOR PERSONALITY FOR UZBEK CORRECTIONS:
${personalityPrompt}

LANGUAGE INSTRUCTION:
${langInstruction}

Rules:
- You must output your response in JSON format. The JSON must contain exactly four fields:
  1. "nextResponse": The full text to display on screen. Include the Uzbek correction (if any) followed by a line break, then the next question in ${targetLangDisplay}.
  2. "speechText": The text to be spoken by Text-to-Speech. This MUST ONLY be the ${targetLangDisplay} follow-up question. (TTS cannot read Uzbek well if it's mixed with the target language, so only put the ${targetLangDisplay} question here).
  3. "uzbekText": The Uzbek correction/explanation. If there is no error to correct, return an empty string "".
  4. "grammarReport": A structured object detailing the mistake. If no mistakes, return null. Otherwise: { "mistakesFound": true, "userSentence": "...", "correctedSentence": "...", "explanation": "..." }
- Both nextResponse and speechText must end with the follow-up question.
- Do not prefix with "Examiner:".
- PRONUNCIATION ANALYSIS: Actively analyze user spelling errors and phonetic flaws in the transcript to deduce speech defects. Give concrete advice (e.g. telling them how to position their tongue/lips) in Uzbek.
- CRITICAL word limit: The entire response (Uzbek explanation + follow-up question combined) must be between ${wordLimitText}. Do not exceed this limit.

Conversation so far:
${conversationText}

Return raw JSON:
{
  "nextResponse": "full response (Uzbek correction + target language question)",
  "speechText": "target language question only (WITH natural human fillers like Umm, Ah!)",
  "uzbekText": "Uzbek correction/explanation only (empty string if no errors)",
  "grammarReport": { "mistakesFound": true, "userSentence": "...", "correctedSentence": "...", "explanation": "..." }
}`;

    const rawResponse = await askAI(systemPrompt, "Generate the JSON response.", true);
    let nextResponseText = '', speechText = '', uzbekText = '', grammarReport = null;
    try {
      const parsed = parseJSONResponse(rawResponse);
      nextResponseText = parsed.nextResponse || rawResponse;
      speechText = parsed.speechText || nextResponseText;
      uzbekText = parsed.uzbekText || '';
      grammarReport = parsed.grammarReport || null;
    } catch (e) {
      nextResponseText = rawResponse.trim();
      speechText = nextResponseText;
    }

    return NextResponse.json({ nextResponse: nextResponseText, speechText, uzbekText, grammarReport });

  } catch (error: any) {
    console.error('Speaking chat API error:', error);
    return NextResponse.json({ error: error.message || 'An error occurred' }, { status: 500 });
  }
}
