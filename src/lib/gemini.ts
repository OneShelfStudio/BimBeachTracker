import { z } from "zod";
import { AIVisionGrade } from "./scoring";

export const GeminiBeachGradeSchema = z.object({
  sargassumScore: z.number().min(0).max(100),
  waterClarity: z.enum(["Turquoise", "Brown Tide", "Choppy"]),
  tractorPresent: z.boolean(),
  summary: z.string().min(5).max(360),
});

export type GeminiBeachGradeOutput = z.infer<typeof GeminiBeachGradeSchema>;

/**
 * Calls the Google Gemini 2.5 Flash API with structured JSON output (`responseSchema`)
 * to grade a beach camera frame for Sargassum coverage (0-100), Water Clarity,
 * NCC tractor presence, and a concise ground-truth summary.
 */
export async function gradeBeachFrameWithGemini(params: {
  beachSlug: string;
  beachName: string;
  cameraId: string;
  imageBase64: string;
  mimeType?: string;
}): Promise<AIVisionGrade> {
  const apiKey = process.env.GEMINI_API_KEY;
  const nowIso = new Date().toISOString();

  if (!apiKey || apiKey === "your-gemini-2.5-flash-api-key") {
    throw new Error("GEMINI_API_KEY is not configured in environment variables.");
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(
    apiKey
  )}`;

  const prompt = `You are a coastal oceanographer analyzing a live camera frame from ${params.beachName} (${params.cameraId}) in Barbados.
Evaluate the shoreline and inshore swimming zone strictly and output JSON matching the required schema:
- sargassumScore: integer 0 to 100 representing sargassum seaweed coverage on the foreshore and water's edge (0 = completely clean sand and water, 30 = light wrack line, 65 = heavy mats on beach/waterline, 95 = severe brown-tide inundation).
- waterClarity: one of "Turquoise", "Brown Tide", or "Choppy".
- tractorPresent: true if an NCC beach-cleaning tractor, front-end loader, or heavy rake equipment is visible on the sand, otherwise false.
- summary: 1-2 sentence ground-truth field report for Barbados beachgoers.`;

  const payload = {
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: params.mimeType || "image/jpeg",
              data: params.imageBase64,
            },
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          sargassumScore: {
            type: "INTEGER",
            description: "0 to 100 sargassum seaweed accumulation score",
          },
          waterClarity: {
            type: "STRING",
            enum: ["Turquoise", "Brown Tide", "Choppy"],
          },
          tractorPresent: {
            type: "BOOLEAN",
            description: "Whether an NCC tractor or seaweed clearing vehicle is visible",
          },
          summary: {
            type: "STRING",
            description: "Concise 1-2 sentence coastal telemetry summary",
          },
        },
        required: ["sargassumScore", "waterClarity", "tractorPresent", "summary"],
      },
    },
  };

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini 2.5 Flash API error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    throw new Error("Gemini 2.5 Flash returned an empty response candidate.");
  }

  const parsed = GeminiBeachGradeSchema.parse(JSON.parse(rawText));

  return {
    beachSlug: params.beachSlug,
    sargassumScore: Math.round(parsed.sargassumScore),
    waterClarity: parsed.waterClarity,
    tractorPresent: parsed.tractorPresent,
    summary: parsed.summary,
    gradedAtIso: nowIso,
    cameraId: params.cameraId,
    source: "gemini-2.5-flash",
  };
}
