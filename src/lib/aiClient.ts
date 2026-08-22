// Shared AI text-generation client.
// We are using OpenAI (gpt-4o-mini) as it handles specific dialects (like Toshkent shevasi) excellently.

export async function callAI(systemPrompt: string, userPrompt: string, maxTokens: number = 4000, expectJson: boolean = false): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OpenAI API key is missing. Please add OPENAI_API_KEY to .env.local");

  const response = await fetch(
    "https://api.openai.com/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_tokens: maxTokens,
        ...(expectJson && { response_format: { type: "json_object" } }),
        temperature: 0.7
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API call failed: ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content || "";
  
  if (!text) throw new Error("OpenAI returned an empty response.");
  return text;
}
