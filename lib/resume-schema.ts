import { z } from "zod";
import { COUNTRY_CODES } from "./countries";

export const generateRequestSchema = z.object({
  jobDescription: z.string().trim().min(50, "Please paste a more complete job description."),
  country: z.enum(COUNTRY_CODES),
  mode: z.enum(["tailor", "draft"]).optional().default("tailor")
});

export type GenerateRequest = z.infer<typeof generateRequestSchema>;

export const resumeDraftSchema = z.object({
  professionalSummary: z.string().trim().min(20),
  technicalSkills: z.array(z.string().trim()).min(5),
  keywords: z.array(z.string().trim()).optional()
});

export type ResumeDraft = z.infer<typeof resumeDraftSchema>;
