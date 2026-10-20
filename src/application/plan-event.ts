import {
  planRequestSchema,
  planResponseSchema,
  type EventBrief,
  type EventPlan,
  type PlanRequest,
  type PlanResponse,
} from '../domain/contracts';
import { personalizePlan, type Narrative } from '../domain/narrative';
import { generatePlan } from '../domain/planner';
import { getAiFallbackNotice } from '../domain/ai-failure';

export type NarrativeProvider = (
  brief: EventBrief,
  plan: EventPlan,
  prompt: string,
) => Promise<Narrative>;

export async function planEvent(
  input: PlanRequest,
  provider?: NarrativeProvider,
): Promise<PlanResponse> {
  const { brief, prompt } = planRequestSchema.parse(input);
  const plan = generatePlan(brief, prompt);
  if (!provider)
    return {
      plan,
      source: 'demo',
      notice:
        'Demo mode · Built with the local planning engine. Add a Gemini API key to enable live personalization.',
    };
  try {
    return planResponseSchema.parse({
      plan: personalizePlan(plan, await provider(brief, plan, prompt ?? '')),
      source: 'gemini',
      notice:
        'Personalized with Gemini · Review this draft before saving it. Budgets and milestones use the planning engine.',
    });
  } catch (error) {
    return {
      plan,
      source: 'demo',
      notice: getAiFallbackNotice(error),
    };
  }
}
