import { NextResponse } from "next/server";
import { generateRequestSchema } from "@/lib/resume-schema";
import { extractBaseSections, renderTailoredLatex } from "@/lib/latex";
import { generateResumeDraft } from "@/lib/llm";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = generateRequestSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { jobDescription, country } = parsed.data;
    const extracted = await extractBaseSections(country);

    const { draft, provider } = await generateResumeDraft({
      jobDescription,
      existingSummary: extracted.existingSummary,
      existingSkills: extracted.existingSkills
    });

    const latex = renderTailoredLatex({ extracted, draft });

    return NextResponse.json({
      provider,
      country,
      baseTemplate: extracted.basePath,
      draft,
      latex
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

