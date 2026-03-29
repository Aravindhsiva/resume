import fs from "node:fs/promises";
import path from "node:path";
import { type CountryCode } from "./countries";
import { type ResumeDraft } from "./resume-schema";

function escapeLatex(input: string): string {
  return input
    .replaceAll("\\", "\\textbackslash{}")
    .replaceAll("{", "\\{")
    .replaceAll("}", "\\}")
    .replaceAll("#", "\\#")
    .replaceAll("$", "\\$")
    .replaceAll("%", "\\%")
    .replaceAll("&", "\\&")
    .replaceAll("_", "\\_")
    .replaceAll("^", "\\^{}")
    .replaceAll("~", "\\~{}");
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.stat(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function resolveBaseResumeTexPath(country: CountryCode): Promise<string> {
  const cwd = process.cwd();
  const candidates = [
    path.join(cwd, "templates", country, "resume.tex")
  ];

  for (const candidate of candidates) {
    if (await fileExists(candidate)) return candidate;
  }

  throw new Error(
    `Could not find base resume template for "${country}". Tried: ${candidates.join(", ")}`
  );
}

type Extracted = {
  preamble: string;
  existingSummary?: string;
  existingSkills?: string;
  experienceSection?: string;
  educationSection?: string;
  suffix: string;
  basePath: string;
};

function extractRSection(texBody: string, title: string): string | undefined {
  const begin = `\\begin{rSection}{${title}}`;
  const beginIdx = texBody.indexOf(begin);
  if (beginIdx === -1) return undefined;
  const end = "\\end{rSection}";
  const endIdx = texBody.indexOf(end, beginIdx);
  if (endIdx === -1) return undefined;
  return texBody.slice(beginIdx, endIdx + end.length);
}

function extractRSectionContent(texBody: string, title: string): string | undefined {
  const section = extractRSection(texBody, title);
  if (!section) return undefined;
  const firstNl = section.indexOf("\n");
  const last = section.lastIndexOf("\\end{rSection}");
  if (firstNl === -1 || last === -1) return undefined;
  return section.slice(firstNl + 1, last).trim();
}

export async function extractBaseSections(country: CountryCode): Promise<Extracted> {
  const basePath = await resolveBaseResumeTexPath(country);
  const base = await fs.readFile(basePath, "utf8");

  const beginDoc = "\\begin{document}";
  const endDoc = "\\end{document}";
  const beginIdx = base.indexOf(beginDoc);
  const endIdx = base.lastIndexOf(endDoc);
  if (beginIdx === -1 || endIdx === -1 || endIdx <= beginIdx) {
    throw new Error(`Base resume.tex for "${country}" does not look valid (missing document tags).`);
  }

  const preamble = base.slice(0, beginIdx + beginDoc.length) + "\n\n";
  const body = base.slice(beginIdx + beginDoc.length, endIdx);
  const suffix = "\n\n" + base.slice(endIdx);

  const existingSummary = extractRSectionContent(body, "PROFESSIONAL SUMMARY");
  const existingSkills = extractRSectionContent(body, "TECHNICAL SKILLS");
  const experienceSection = extractRSection(body, "EXPERIENCE");
  const educationSection = extractRSection(body, "EDUCATION");

  return {
    preamble,
    existingSummary,
    existingSkills,
    experienceSection,
    educationSection,
    suffix,
    basePath
  };
}

export function renderTailoredLatex(args: {
  extracted: Extracted;
  draft: ResumeDraft;
}): string {
  const { extracted, draft } = args;

  const summary = escapeLatex(draft.professionalSummary);
  const skills = draft.technicalSkills.map((s) => escapeLatex(s)).join(", ");

  const summarySection = `\\begin{rSection}{PROFESSIONAL SUMMARY}\n\n${summary}\n\n\\end{rSection}\n`;

  const skillsSection = `\\begin{rSection}{TECHNICAL SKILLS}\n\n${skills}\n\n\\end{rSection}\n`;

  const experience = extracted.experienceSection
    ? extracted.experienceSection.trim() + "\n"
    : "\\begin{rSection}{EXPERIENCE}\n\n% (Add experience here)\n\n\\end{rSection}\n";

  const education = extracted.educationSection
    ? extracted.educationSection.trim() + "\n"
    : "\\begin{rSection}{EDUCATION}\n\n% (Add education here)\n\n\\end{rSection}\n";

  return (
    extracted.preamble +
    summarySection +
    "\n%----------------------------------------------------------------------------------------\n" +
    experience +
    "\n%----------------------------------------------------------------------------------------\n" +
    skillsSection +
    "\n%----------------------------------------------------------------------------------------\n" +
    education +
    extracted.suffix
  );
}
