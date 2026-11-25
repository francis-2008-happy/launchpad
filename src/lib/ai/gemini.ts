// Calls Google's Gemini API to generate text (issue #76).
// SERVER ONLY: it reads GEMINI_API_KEY, which must never reach the browser.
// The key has no NEXT_PUBLIC_ prefix, so Next.js never includes it in browser code.
//
// We call the REST API with fetch instead of adding an SDK, so there is no
// extra dependency. To switch AI providers later, only this file changes.

// Shown to users when the AI cannot answer. The details go to the server log.
export class AiUnavailableError extends Error {}

const API_URL = "https://generativelanguage.googleapis.com/v1beta/models";
// Fast and reliable on the free tier, and plenty for a few sentences.
// Override it in .env.local with GEMINI_MODEL.
const DEFAULT_MODEL = "gemini-3.1-flash-lite";
// Tried once if the main model is busy (503) or too slow. Free-tier models
// are sometimes overloaded, so a second model means fewer errors for users.
const BACKUP_MODEL = "gemini-flash-lite-latest";
const TIMEOUT_MS = 20_000;

type GeminiResponse = {
  candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] } }[];
};

// What one attempt returned: the text, or whether it's worth trying the backup model.
type Attempt = { text: string } | { error: AiUnavailableError; tryBackup: boolean };

export async function generateText({ system, prompt }: { system: string; prompt: string }): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY is not set. Add it to .env.local (see .env.example).");
    throw new AiUnavailableError("AI analysis isn't set up yet. Please try again later.");
  }
  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;

  let attempt = await callModel(model, apiKey, system, prompt);
  if ("error" in attempt && attempt.tryBackup && model !== BACKUP_MODEL) {
    console.warn(`Gemini model ${model} is busy, trying ${BACKUP_MODEL}.`);
    attempt = await callModel(BACKUP_MODEL, apiKey, system, prompt);
  }
  if ("error" in attempt) throw attempt.error;
  return attempt.text;
}

async function callModel(model: string, apiKey: string, system: string, prompt: string): Promise<Attempt> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}/${model}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        // Low temperature: steadier, more factual wording.
        generationConfig: { temperature: 0.3 },
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (error) {
    // Timeout or network failure.
    console.error(`Gemini request to ${model} failed:`, error);
    return {
      error: new AiUnavailableError("The AI service didn't respond. Please try again in a moment."),
      tryBackup: true,
    };
  }

  if (!response.ok) {
    console.error(`Gemini ${model} returned ${response.status}:`, await response.text().catch(() => ""));
    if (response.status === 429) {
      // Our free quota is used up; another model on the same key won't help.
      return {
        error: new AiUnavailableError("The AI service is busy right now. Please try again in a minute."),
        tryBackup: false,
      };
    }
    return {
      error: new AiUnavailableError("The AI service is unavailable right now. Please try again later."),
      // 5xx means Google's side is overloaded or down, so another model may work.
      tryBackup: response.status >= 500,
    };
  }

  const data = (await response.json()) as GeminiResponse;
  // Join the text parts, skipping any "thinking" parts the model may include.
  const text = (data.candidates?.[0]?.content?.parts ?? [])
    .filter((part) => !part.thought)
    .map((part) => part.text ?? "")
    .join("")
    .trim();

  if (!text) {
    console.error(`Gemini ${model} returned no text:`, JSON.stringify(data).slice(0, 500));
    return {
      error: new AiUnavailableError("The AI service couldn't write a response. Please try again."),
      tryBackup: false,
    };
  }
  return { text };
}
