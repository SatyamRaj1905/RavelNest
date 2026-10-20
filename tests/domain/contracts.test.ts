import { describe, expect, it } from 'vitest';
import {
  apiErrorSchema,
  briefSchema,
  eventSchema,
  planRequestSchema,
  planResponseSchema,
  planSchema,
  workspaceSchema,
} from '../../src/domain/contracts';
import { createSampleWorkspace } from '../../src/domain/sample';

const workspace = createSampleWorkspace(new Date('2026-10-20T00:00:00Z'));
const event = workspace.events[0];
if (!event) throw new Error('Missing sample event.');

describe('strict runtime contracts', () => {
  it('rejects unknown fields at every boundary', () => {
    const brief = { ...event.brief, administrator: true };
    expect(briefSchema.safeParse(brief).success).toBe(false);
    expect(
      planRequestSchema.safeParse({ brief: event.brief, injected: true })
        .success,
    ).toBe(false);
    expect(planSchema.safeParse({ ...event.plan, unknown: true }).success).toBe(
      false,
    );
    expect(eventSchema.safeParse({ ...event, token: 'secret' }).success).toBe(
      false,
    );
    expect(
      workspaceSchema.safeParse({ ...workspace, unknown: true }).success,
    ).toBe(false);
    expect(
      planResponseSchema.safeParse({
        plan: event.plan,
        source: 'demo',
        notice: 'Ready',
        key: 'secret',
      }).success,
    ).toBe(false);
    expect(
      apiErrorSchema.safeParse({
        error: { code: 'INVALID', message: 'Try again', stack: 'private' },
      }).success,
    ).toBe(false);
  });
  it.each([
    '2027-02-29',
    '2026-13-01',
    '2026-00-01',
    '2026-04-31',
    'no-date',
    '1800-01-01',
  ])('rejects invalid date %s', (date) => {
    expect(briefSchema.safeParse({ ...event.brief, date }).success).toBe(false);
  });
  it('accepts real leap day, trims text, rejects invalid limits and enum values', () => {
    expect(
      briefSchema.parse({
        ...event.brief,
        date: '2028-02-29',
        name: '  Party  ',
      }).name,
    ).toBe('Party');
    for (const patch of [
      { name: '' },
      { name: 'a'.repeat(101) },
      { guests: 0 },
      { guests: 10001 },
      { guests: 1.5 },
      { budget: 99 },
      { budget: 100000001 },
      { currency: 'BTC' },
      { type: 'conference' },
      { preferences: 'a'.repeat(1201) },
    ]) {
      expect(briefSchema.safeParse({ ...event.brief, ...patch }).success).toBe(
        false,
      );
    }
    expect(
      planRequestSchema.safeParse({
        brief: event.brief,
        prompt: 'a'.repeat(1201),
      }).success,
    ).toBe(false);
  });
  it('checks totals, nested uniqueness and active workspace consistency', () => {
    expect(
      eventSchema.safeParse({
        ...event,
        brief: { ...event.brief, budget: 101 },
      }).success,
    ).toBe(false);
    expect(
      workspaceSchema.safeParse({ ...workspace, activeEventId: 'missing' })
        .success,
    ).toBe(false);
    expect(
      workspaceSchema.safeParse({ ...workspace, events: [event, event] })
        .success,
    ).toBe(false);
    expect(
      workspaceSchema.safeParse({ ...workspace, events: [] }).success,
    ).toBe(false);
    for (const field of ['budget', 'tasks', 'vendors', 'ideas'] as const) {
      const first = event.plan[field][0];
      expect(
        planSchema.safeParse({ ...event.plan, [field]: [first, first] })
          .success,
      ).toBe(false);
    }
  });
  it('allows actual spending above allocation but rejects fractional or unreasonable amounts', () => {
    const [item] = event.plan.budget;
    expect(
      planSchema.safeParse({
        ...event.plan,
        budget: [{ ...item, spent: 1000000000 }],
      }).success,
    ).toBe(true);
    expect(
      planSchema.safeParse({
        ...event.plan,
        budget: [{ ...item, spent: 1000000001 }],
      }).success,
    ).toBe(false);
    expect(
      planSchema.safeParse({
        ...event.plan,
        budget: [{ ...item, spent: 1.25 }],
      }).success,
    ).toBe(false);
  });
});
