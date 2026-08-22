const fs = require('fs');
const https = require('https');

const envContent = fs.readFileSync('.env.local', 'utf8');
envContent.split('\n').forEach(line => {
  const [key, ...values] = line.split('=');
  if (key && values.length > 0) {
    process.env[key.trim()] = values.join('=').trim().replace(/^"|"$/g, '');
  }
});

async function checkGemini() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return { name: 'Gemini', status: 'Missing Key' };
  
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${key}`;
  const data = JSON.stringify({
    contents: [{ role: "user", parts: [{ text: "Hello" }] }],
    generationConfig: { maxOutputTokens: 10 }
  });

  return new Promise((resolve) => {
    const req = https.request(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, (res) => {
      if (res.statusCode === 200) {
        resolve({ name: 'Gemini', status: 'Active (Free Tier / Default)' });
      } else {
        resolve({ name: 'Gemini', status: `Error ${res.statusCode}` });
      }
    });
    req.on('error', () => resolve({ name: 'Gemini', status: 'Network Error' }));
    req.write(data);
    req.end();
  });
}

async function checkElevenLabs() {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) return { name: 'ElevenLabs', status: 'Missing Key' };

  return new Promise((resolve) => {
    const req = https.request('https://api.elevenlabs.io/v1/user/subscription', {
      method: 'GET',
      headers: { 'xi-api-key': key }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk.toString());
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const json = JSON.parse(body);
            resolve({ name: 'ElevenLabs', status: `Active (Tier: ${json.tier}) - Chars Left: ${json.character_count} / ${json.character_limit}` });
          } catch(e) {
            resolve({ name: 'ElevenLabs', status: 'Active (Unknown Tier)' });
          }
        } else {
          resolve({ name: 'ElevenLabs', status: `Error ${res.statusCode}: Invalid or Exhausted Key` });
        }
      });
    });
    req.on('error', () => resolve({ name: 'ElevenLabs', status: 'Network Error' }));
    req.end();
  });
}

async function checkAnthropic() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return { name: 'Anthropic (Claude)', status: 'Missing Key' };

  const data = JSON.stringify({
    model: "claude-3-haiku-20240307",
    max_tokens: 10,
    messages: [{ role: "user", content: "Hello" }]
  });

  return new Promise((resolve) => {
    const req = https.request('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk.toString());
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve({ name: 'Anthropic (Claude)', status: 'Active (Premium Working!)' });
        } else if (res.statusCode === 401 || res.statusCode === 403) {
          resolve({ name: 'Anthropic (Claude)', status: 'Dead/Invalid Key' });
        } else {
          resolve({ name: 'Anthropic (Claude)', status: `Error ${res.statusCode}` });
        }
      });
    });
    req.on('error', () => resolve({ name: 'Anthropic (Claude)', status: 'Network Error' }));
    req.write(data);
    req.end();
  });
}

async function main() {
  console.log("Checking APIs...");
  const results = await Promise.all([checkGemini(), checkElevenLabs(), checkAnthropic()]);
  console.log("--- RESULTS ---");
  results.forEach(r => console.log(`${r.name}: ${r.status}`));
}

main();
