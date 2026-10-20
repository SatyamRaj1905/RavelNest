// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { planEvent } from '../../src/application/plan-event';
import { createSampleWorkspace } from '../../src/domain/sample';
import { generatePlan } from '../../src/domain/planner';
import {
  AiFailure,
  aiFailureCodes,
  getAiFallbackNotice,
} from '../../src/domain/ai-failure';
import { narrativeSchema } from '../../src/domain/narrative';

const brief = createSampleWorkspace().events[0]?.brief;
if (!brief) throw new Error('Missing sample.');
const narrative = {
  summary: 'A celebration with thoughtful, personal details.',
  ideas: Array.from({ length: 4 }, (_, index) => ({
    title: `Idea ${index}`,
    description: 'Use reusable details and welcoming guest experiences.',
    tag: 'Personal touch',
  })),
};

describe('application orchestration and canonical fallback parity', () => {
  it('supports demo with exact canonical output', async () => {
    const response = await planEvent({ brief, prompt: 'garden party' });
    expect(response.source).toBe('demo');
    expect(response.plan).toEqual(generatePlan(brief, 'garden party'));
    expect(response.notice).toContain('Demo mode');
  });
  it('only enriches narratives, preserving authoritative facts and IDs', async () => {
    const response = await planEvent({ brief }, async () =>
      narrativeSchema.parse(narrative),
    );
    const canonical = generatePlan(brief);
    expect(response.source).toBe('gemini');
    expect(response.plan.summary).toBe(narrative.summary);
    expect(response.plan.budget).toEqual(canonical.budget);
    expect(response.plan.tasks).toEqual(canonical.tasks);
    expect(response.plan.vendors).toEqual(canonical.vendors);
    expect(response.plan.ideas.map((idea) => idea.id)).toEqual(
      canonical.ideas.map((idea) => idea.id),
    );
    expect(response.plan.ideas.every((idea) => !idea.saved)).toBe(true);
  });
  it('uses the same fallback on provider errors with safe visible notice', async () => {
    const response = await planEvent({ brief }, async () => {
      throw new Error('private key and provider message');
    });
    expect(response.plan).toEqual(generatePlan(brief));
    expect(response.notice).not.toContain('private');
    expect(response.source).toBe('demo');
  });
  it('rejects invalid direct requests before invoking providers', async () => {
    await expect(
      planEvent({ brief: { ...brief, budget: -1 } }),
    ).rejects.toThrow();
  });
});

it.each(aiFailureCodes)(
  'explains %s failures while keeping exact fallback parity and avoiding secret details',
  async (code) => {
    const error = new AiFailure(code);
    const response = await planEvent(
      { brief, prompt: 'A welcoming event' },
      async () => {
        throw error;
      },
    );
    expect(response.source).toBe('demo');
    expect(response.plan).toEqual(generatePlan(brief, 'A welcoming event'));
    expect(response.notice).toBe(getAiFallbackNotice(error));
    expect(response.notice).toContain(
      'Your complete plan is ready from the local planning engine.',
    );
    expect(response.notice).not.toContain('private');
    expect(response.notice.length).toBeLessThanOrEqual(300);
  },
);

it('distinguishes actionable timeout, quota and invalid-output notices', () => {
  expect(getAiFallbackNotice(new AiFailure('timeout'))).toContain(
    'took too long',
  );
  expect(getAiFallbackNotice(new AiFailure('rate-limit'))).toContain(
    'quota limit',
  );
  expect(getAiFallbackNotice(new AiFailure('invalid-output'))).toContain(
    'invalid response',
  );
  expect(
    getAiFallbackNotice(
      new Error('private-key; request details; provider stack'),
    ),
  ).toBe(
    'Gemini is unavailable right now. Your complete plan is ready from the local planning engine.',
  );
});
