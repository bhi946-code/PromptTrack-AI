export const GEMINI_MODEL = 'google/gemini-3.5-flash';
export const GPT_MODEL = 'openai/gpt-4o-mini';

export function getOpenRouterApiKey() {
  return localStorage.getItem('openrouter_api_key') || '';
}

export async function runPromptWithModel(promptText, modelName) {
  const apiKey = getOpenRouterApiKey();
  if (!apiKey) {
    throw new Error('OpenRouter API Key is not configured. Please open Settings.');
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173',
      'X-Title': 'AI Prompt Tracking Platform',
    },
    body: JSON.stringify({
      model: modelName,
      messages: [
        {
          role: 'user',
          content: promptText
        }
      ],
      ...(modelName === GEMINI_MODEL ? { max_tokens: 1024, temperature: 0.7 } : {})
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.error?.message || `HTTP error ${response.status}`;
    throw new Error(`OpenRouter API error (${modelName}): ${errorMessage}`);
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(`OpenRouter API error (${modelName}): ${data.error.message || JSON.stringify(data.error)}`);
  }

  const rawResponseText = data.choices?.[0]?.message?.content || '';
  return rawResponseText;
}
