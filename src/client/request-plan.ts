import {
  eventSchema,
  planResponseSchema,
  type EventBrief,
} from '@/domain/contracts';
import { generatePlan } from '@/domain/planner';
import { PLAN_REQUEST_DEADLINE_MS } from '@/domain/ai-policy';

export async function requestPlan(
  brief: EventBrief,
  prompt: string,
  signal: AbortSignal,
) {
  signal.throwIfAborted();
  try {
    const response = await fetch('/api/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brief, prompt }),
      signal: AbortSignal.any([
        signal,
        AbortSignal.timeout(PLAN_REQUEST_DEADLINE_MS),
      ]),
    });
    if (!response.ok) throw new Error('Plan request unavailable');
    const result = planResponseSchema.parse(await response.json());
    signal.throwIfAborted();
    eventSchema.parse({
      id: 'draft-response',
      brief,
      plan: result.plan,
      source: result.source,
      createdAt: new Date().toISOString(),
    });
    return result;
  } catch (error) {
    if (signal.aborted) throw error;
    return {
      plan: generatePlan(brief, prompt),
      source: 'demo' as const,
      notice:
        'The AI service could not be reached. This is a deterministic demo plan, available even offline.',
    };
  }
}
