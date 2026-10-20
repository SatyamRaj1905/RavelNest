import {
  parsePlanResponseForBrief,
  type EventBrief,
  type PlanResponse,
} from '@/domain/contracts';
import { generatePlan } from '@/domain/planner';
import { PLAN_REQUEST_DEADLINE_MS } from '@/domain/ai-policy';

export async function requestPlan(
  brief: EventBrief,
  prompt: string,
  signal: AbortSignal,
): Promise<PlanResponse> {
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
    const data: unknown = await response.json();
    const result = parsePlanResponseForBrief(data, brief);
    signal.throwIfAborted();
    return result;
  } catch (error) {
    if (signal.aborted) throw error;
    return {
      plan: generatePlan(brief, prompt),
      source: 'demo',
      notice:
        'The AI service could not be reached. This is a deterministic demo plan, available even offline.',
    };
  }
}
