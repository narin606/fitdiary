import { z } from "zod";

const finiteNonnegative = z.number().finite().nonnegative();
export const photoAnalysisSchema = z.object({
  description: z.string().trim().min(1).max(2000),
  confidence: z.enum(["low", "medium", "high"]),
  calorieRange: z.object({min: finiteNonnegative, max: finiteNonnegative}),
  items: z.array(z.object({
    name: z.string().trim().min(1).max(200),
    portion: z.string().trim().min(1).max(200),
    calories: finiteNonnegative,
    proteinG: finiteNonnegative,
    carbsG: finiteNonnegative,
    fatG: finiteNonnegative,
  }).strict()).max(50),
}).strict().refine(value => value.calorieRange.max >= value.calorieRange.min, {
  message: "calorieRange.max must be greater than or equal to min",
  path: ["calorieRange", "max"],
});
export type PhotoAnalysis = z.infer<typeof photoAnalysisSchema>;

const providerSchema = z.object({
  choices: z.array(z.object({message: z.object({content: z.string()})})).min(1),
});

export class AnalysisProviderError extends Error {
  constructor(public readonly kind: "timeout"|"provider"|"malformed", message: string) { super(message); }
}

export function parseProviderResponse(raw: unknown): PhotoAnalysis {
  const envelope = providerSchema.safeParse(raw);
  if (!envelope.success) throw new AnalysisProviderError("malformed", "AI provider returned an invalid response");
  let value: unknown;
  try { value = JSON.parse(envelope.data.choices[0].message.content); }
  catch { throw new AnalysisProviderError("malformed", "AI provider returned invalid JSON"); }
  const parsed = photoAnalysisSchema.safeParse(value);
  if (!parsed.success) throw new AnalysisProviderError("malformed", "AI provider returned an invalid analysis");
  return parsed.data;
}

export async function analyzePhoto(options: {
  baseUrl:string; apiKey:string; model:string; image:Buffer; contentType:string; timeoutMs:number;
  fetchImpl?: typeof fetch;
}): Promise<PhotoAnalysis> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs);
  try {
    const response = await (options.fetchImpl ?? fetch)(`${options.baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST", signal: controller.signal,
      headers: {authorization: `Bearer ${options.apiKey}`, "content-type": "application/json"},
      body: JSON.stringify({
        model: options.model,
        response_format: {type: "json_object"},
        messages: [
          {role:"system",content:"Estimate only foods visibly present, conservatively. Return JSON with exactly description, confidence (low|medium|high), calorieRange {min,max}, and items [{name,portion,calories,proteinG,carbsG,fatG}]. Values must be non-negative numbers. Never claim medical precision."},
          {role:"user",content:[{type:"text",text:"Analyze this meal photo. The result is only a suggestion and requires user confirmation."},{type:"image_url",image_url:{url:`data:${options.contentType};base64,${options.image.toString("base64")}`}}]},
        ],
      }),
    });
    if (!response.ok) throw new AnalysisProviderError("provider", "AI provider request failed");
    let raw: unknown;
    try { raw = await response.json(); }
    catch { throw new AnalysisProviderError("malformed", "AI provider returned invalid JSON"); }
    return parseProviderResponse(raw);
  } catch (error) {
    if (error instanceof AnalysisProviderError) throw error;
    if (controller.signal.aborted) throw new AnalysisProviderError("timeout", "AI provider timed out");
    throw new AnalysisProviderError("provider", "AI provider request failed");
  } finally { clearTimeout(timer); }
}

export class SlidingWindowLimiter {
  private requests = new Map<string, number[]>();
  constructor(private readonly maximum:number, private readonly windowMs:number) {}
  take(key:string, now=Date.now()) {
    const recent=(this.requests.get(key) ?? []).filter(time=>time>now-this.windowMs);
    if(recent.length>=this.maximum) { this.requests.set(key,recent); return false; }
    recent.push(now); this.requests.set(key,recent); return true;
  }
}
