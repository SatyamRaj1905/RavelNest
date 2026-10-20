import { z } from 'zod';
import { ideaSchema, planSchema, type EventPlan } from './contracts';

const narrativeIdeaSchema = ideaSchema.pick({
  title: true,
  description: true,
  tag: true,
});

export const narrativeSchema = z
  .object({
    summary: planSchema.shape.summary,
    ideas: z.array(narrativeIdeaSchema).length(4),
  })
  .strict();

export type Narrative = z.infer<typeof narrativeSchema>;

/** Copy only reviewed narrative fields, keeping every operational value authoritative. */
export function personalizePlan(plan: EventPlan, input: unknown): EventPlan {
  const narrative = narrativeSchema.parse(input);
  if (plan.ideas.length !== narrative.ideas.length)
    throw new Error('Personalized ideas must match the plan.');
  const ideas = narrative.ideas.map((idea, index) => {
    const original = plan.ideas[index];
    if (!original) throw new Error('Missing plan idea.');
    return { ...original, ...idea };
  });
  return planSchema.parse({ ...plan, summary: narrative.summary, ideas });
}
