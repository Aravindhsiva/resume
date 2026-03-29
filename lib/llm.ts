import { resumeDraftSchema, type ResumeDraft } from "./resume-schema";

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replaceAll(/[^a-z0-9+\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

const STOPWORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "you",
  "your",
  "our",
  "are",
  "will",
  "this",
  "that",
  "from",
  "have",
  "has",
  "had",
  "but",
  "not",
  "all",
  "any",
  "can",
  "able",
  "must",
  "should",
  "may",
  "etc",
  "job",
  "role",
  "work",
  "years",
  "year",
  "experience",
  "team",
  "teams",
  "using",
  "use",
  "build",
  "building",
  "design",
  "develop",
  "development",
  "engineering",
  "engineer",
  "software"
]);

function topKeywords(jobDescription: string, n: number): string[] {
  const counts = new Map<string, number>();
  for (const token of tokenize(jobDescription)) {
    if (token.length < 3) continue;
    if (STOPWORDS.has(token)) continue;
    counts.set(token, (counts.get(token) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([word]) => word);
}

export async function generateResumeDraft(args: {
  jobDescription: string;
  existingSummary?: string;
  existingSkills?: string;
}): Promise<{ draft: ResumeDraft; provider: string; raw?: string }> {
  const provider = (process.env.LLM_PROVIDER ?? "openrouter").toLowerCase();

  if (provider === "ollama") {
    const baseUrl = process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434";
    const model = process.env.OLLAMA_MODEL ?? "llama3.1";

    const keywords = topKeywords(args.jobDescription, 14);
    const prompt = [
      "You are a resume tailoring assistant.",
      "Return STRICT JSON only (no markdown, no extra keys).",
      "",
      "Schema:",
      '{ "professionalSummary": string, "technicalSkills": string[], "keywords": string[] }',
      "",
      "Rules:",
      "- professionalSummary: 2-3 sentences, ATS-friendly, specific, no fluff.",
      "- technicalSkills: 12-20 items, concise tokens (e.g., 'AWS', 'TypeScript', 'GraphQL').",
      "- keywords: 8-16 items derived from the job description.",
      "",
      "Job Description:",
      args.jobDescription,
      "",
      "Existing Summary (optional):",
      args.existingSummary ?? "",
      "",
      "Existing Skills (optional):",
      args.existingSkills ?? "",
      "",
      "Suggested Keywords:",
      keywords.join(", ")
    ].join("\n");

    const res = await fetch(`${baseUrl}/api/generate`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        model,
        prompt,
        stream: false
      })
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Ollama request failed (${res.status}): ${body || res.statusText}`);
    }

    const data = (await res.json()) as { response?: string };
    const raw = data.response ?? "";
    const parsedJson = safeParseJson(raw);
    const parsed = resumeDraftSchema.safeParse(parsedJson);
    if (!parsed.success) {
      throw new Error(
        `Ollama returned invalid JSON for ResumeDraft: ${parsed.error.message}\nRaw: ${raw}`
      );
    }
    return { draft: parsed.data, provider: "ollama", raw };
  }

  if (provider === "openrouter") {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error("Missing OPENROUTER_API_KEY (required when LLM_PROVIDER=openrouter).");
    }

    const baseUrl = (process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1").replace(
      /\/+$/,
      ""
    );
    const model =
      process.env.OPENROUTER_MODEL ?? "nvidia/nemotron-3-super-120b-a12b:free";

    const keywords = topKeywords(args.jobDescription, 16);
    const system = [
      "You are a resume tailoring assistant.",
      "Return STRICT JSON only (no markdown, no prose, no surrounding backticks).",
      "",
      "Schema:",
      '{ "professionalSummary": string, "technicalSkills": string[], "keywords": string[] }',
      "",
      "Rules:",
      "- professionalSummary: 2-3 sentences, ATS-friendly, specific, no fluff.",
      "- technicalSkills: 12-20 items, concise tokens (e.g., 'AWS', 'TypeScript', 'GraphQL').",
      "- keywords: 8-16 items derived from the job description."
    ].join("\n");

    const user = [
      "Job Description:",
      args.jobDescription,
      "",
      "Existing Summary (optional):",
      args.existingSummary ?? "",
      "",
      "Existing Skills (optional):",
      args.existingSkills ?? "",
      "",
      "Suggested Keywords:",
      keywords.join(", ")
    ].join("\n");

    const headers: Record<string, string> = {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json"
    };

    const siteUrl = process.env.OPENROUTER_SITE_URL;
    const appName = process.env.OPENROUTER_APP_NAME;
    if (siteUrl) headers["HTTP-Referer"] = siteUrl;
    if (appName) headers["X-Title"] = appName;

    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model,
        temperature: 0.2,
        max_tokens: 800,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user }
        ]
      })
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`OpenRouter request failed (${res.status}): ${body || res.statusText}`);
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      error?: unknown;
    };
    const raw = data.choices?.[0]?.message?.content ?? "";
    const parsedJson = safeParseJson(raw);
    const parsed = resumeDraftSchema.safeParse(parsedJson);
    if (!parsed.success) {
      throw new Error(
        `OpenRouter returned invalid JSON for ResumeDraft: ${parsed.error.message}\nRaw: ${raw}`
      );
    }
    return { draft: parsed.data, provider: "openrouter", raw };
  }

  const keywords = topKeywords(args.jobDescription, 12);
  const technicalSkills = [
    ...new Set(
      keywords
        .map((k) => k.toUpperCase() === k ? k : k)
        .slice(0, 14)
        .concat(["AWS", "CI/CD", "Microservices", "REST", "Testing"])
    )
  ].slice(0, 14);

  const professionalSummary =
    "Engineering lead delivering scalable systems and automation platforms. " +
    `Strengths across ${keywords.slice(0, 4).join(", ")}, cloud-native design, and reliable delivery through modern CI/CD. ` +
    "Known for ownership, cross-team collaboration, and shipping measurable business impact.";

  const draft = resumeDraftSchema.parse({
    professionalSummary,
    technicalSkills,
    keywords
  });

  return { draft, provider: "mock" };
}

function safeParseJson(text: string): unknown {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    // Best-effort: extract the first {...} block.
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
      const slice = trimmed.slice(start, end + 1);
      try {
        return JSON.parse(slice);
      } catch {
        return null;
      }
    }
    return null;
  }
}
