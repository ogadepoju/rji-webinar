/**
 * netlify/functions/webinar-extract.js
 *
 * Reads an uploaded flyer image and asks Gemini to pull out the fields
 * the webinar page template needs. This is a convenience autofill only —
 * the admin page always shows the extracted fields for review/edit before
 * anything is published, since stylized flyer text can be misread.
 *
 * Reuses the GEMINI_API_KEY env var already set up for pulse-sync.
 *
 * Expects: POST body = { imageBase64: "...", mimeType: "image/png" }
 * Returns: { title, headline, subtitle, dateDisplay, dateShort,
 *            timeDisplay, platformDisplay, speakerName, speakerTitle }
 *
 * NOTE: untested against a live Gemini endpoint (no API key in this
 * session). The model name and thinkingConfig below match the current
 * working config in pulse-sync.yml for TEXT generation; vision input
 * may need the non-"lite" model (gemini-2.5-flash) if "lite" rejects
 * image parts — try "lite" first since it's cheaper, fall back to
 * "gemini-2.5-flash" if extraction errors out. See the "No JSON in
 * response" gotchas already documented in the project skill file;
 * the same fixes (thinkingBudget: 0, fence-stripping) apply here.
 */

const MODEL = process.env.GEMINI_VISION_MODEL || "gemini-2.5-flash-lite";

const EXTRACTION_PROMPT = `You are reading a webinar flyer image for "Research Junction Institute". Extract the following fields and return ONLY a JSON object, no markdown fences, no commentary:

{
  "title": "the plain-text session title, e.g. 'How to Do a High-Impact Study Using the NIH Library'",
  "headlineHighlight": "the portion of the title that is visually highlighted/colored differently on the flyer (often the last line or a key phrase) — just that substring, exactly as it appears in 'title'",
  "subtitle": "the one or two sentence description under the title",
  "dateDisplay": "the date formatted like 'October 31, 2026' — if the flyer has no year, use the most sensible upcoming year",
  "dateShort": "the date formatted like 'October 31' (no year)",
  "timeDisplay": "the time exactly as shown, e.g. '12 Noon EST'",
  "platformDisplay": "the platform line, e.g. 'Virtual &bull; Google Meet' (use &bull; for any middle dot)",
  "speakerName": "the speaker's name with credentials, e.g. 'Sandra Bakare, MD, MBA'",
  "speakerTitle": "the speaker's role line, e.g. 'Lead Investigator, Research Junction Institute'"
}

If a field is not visible on the flyer, use your best reasonable guess based on the rest of the flyer and Research Junction Institute's usual format, and never leave a field empty.`;

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  let payload;
  try {
    payload = JSON.parse(event.body);
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON body" }) };
  }

  const { imageBase64, mimeType } = payload;
  if (!imageBase64 || !mimeType) {
    return { statusCode: 400, body: JSON.stringify({ error: "imageBase64 and mimeType are required" }) };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: "GEMINI_API_KEY not configured" }) };
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;

  const body = {
    contents: [
      {
        parts: [
          { text: EXTRACTION_PROMPT },
          { inlineData: { mimeType, data: imageBase64 } },
        ],
      },
    ],
    generationConfig: {
      thinkingConfig: { thinkingBudget: 0 },
    },
  };

  let geminiRes;
  try {
    geminiRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (e) {
    return { statusCode: 502, body: JSON.stringify({ error: "Could not reach Gemini", detail: String(e) }) };
  }

  if (!geminiRes.ok) {
    const errText = await geminiRes.text();
    return { statusCode: 502, body: JSON.stringify({ error: "Gemini request failed", detail: errText }) };
  }

  const geminiJson = await geminiRes.json();
  const parts = geminiJson?.candidates?.[0]?.content?.parts || [];
  const rawText = parts
    .filter((p) => !p.thought)
    .map((p) => p.text || "")
    .join("");

  // Strip markdown fences if the model added them, then find the JSON object.
  const stripped = rawText.replace(/```json|```/g, "");
  const start = stripped.indexOf("{");
  const end = stripped.lastIndexOf("}");
  if (start === -1 || end === -1) {
    return { statusCode: 502, body: JSON.stringify({ error: "No JSON in Gemini response", raw: rawText }) };
  }

  let extracted;
  try {
    extracted = JSON.parse(stripped.slice(start, end + 1));
  } catch (e) {
    return { statusCode: 502, body: JSON.stringify({ error: "Gemini JSON did not parse", raw: stripped }) };
  }

  // Turn title + headlineHighlight into the **...** convention the template expects.
  let headline = extracted.title || "";
  if (extracted.headlineHighlight && headline.includes(extracted.headlineHighlight)) {
    headline = headline.replace(
      extracted.headlineHighlight,
      `**${extracted.headlineHighlight}**`
    );
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: extracted.title || "",
      headline,
      subtitle: extracted.subtitle || "",
      dateDisplay: extracted.dateDisplay || "",
      dateShort: extracted.dateShort || "",
      timeDisplay: extracted.timeDisplay || "",
      platformDisplay: extracted.platformDisplay || "",
      speakerName: extracted.speakerName || "",
      speakerTitle: extracted.speakerTitle || "",
    }),
  };
};
