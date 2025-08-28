import { z } from "zod";

export const mermaidOptionsSchema = z.object({
  fontFamily: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
  fontSize: z.number().optional(),
  color: z.string().optional(),
  lineHeight: z.number().optional(),
});

export const markdownRequestSchema = z.object({
  markdown: z.string().min(1, "Markdown input is required"),
  options: mermaidOptionsSchema.optional(),
});

export type MermaidOptions = z.infer<typeof mermaidOptionsSchema>;
export type MarkdownRequest = z.infer<typeof markdownRequestSchema>;
