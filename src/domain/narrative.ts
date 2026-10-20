import { z } from 'zod';

export const narrativeSchema = z
  .object({
    summary: z.string().trim().min(1).max(1800),
    ideas: z
      .array(
        z
          .object({
            title: z.string().trim().min(1).max(100),
            description: z.string().trim().min(1).max(600),
            tag: z.string().trim().min(1).max(60),
          })
          .strict(),
      )
      .length(4),
  })
  .strict();

export type Narrative = z.infer<typeof narrativeSchema>;
