import { describe, expect, it } from 'vitest';
import { personalizePlan } from '../../src/domain/narrative';
import { createSampleWorkspace } from '../../src/domain/sample';

const event = createSampleWorkspace().events[0];
if (!event) throw new Error('Missing sample.');
const plan = event.plan;
const narrative = {
  summary: 'An evening built around shared memories.',
  ideas: plan.ideas.map(({ title, description, tag }) => ({
    title: `${title} revisited`,
    description,
    tag,
  })),
};

describe('personalization boundary', () => {
  it('preserves operational values and identity while copying validated narrative', () => {
    const personalized = personalizePlan(plan, narrative);
    expect(personalized.summary).toBe(narrative.summary);
    expect(personalized.budget).toEqual(plan.budget);
    expect(personalized.tasks).toEqual(plan.tasks);
    expect(personalized.vendors).toEqual(plan.vendors);
    expect(personalized.ideas.map(({ id, saved }) => ({ id, saved }))).toEqual(
      plan.ideas.map(({ id, saved }) => ({ id, saved })),
    );
    expect(plan.summary).not.toBe(narrative.summary);
  });

  it('rejects provider identity and operational fields instead of merging them', () => {
    expect(() =>
      personalizePlan(plan, {
        ...narrative,
        ideas: narrative.ideas.map((idea) => ({ ...idea, saved: true })),
      }),
    ).toThrow();
    expect(() => personalizePlan(plan, { ...narrative, budget: [] })).toThrow();
  });

  it('rejects unmatched idea counts rather than silently leaving partial personalization', () => {
    expect(() =>
      personalizePlan({ ...plan, ideas: plan.ideas.slice(0, 3) }, narrative),
    ).toThrow('must match');
    expect(() =>
      personalizePlan(plan, {
        ...narrative,
        ideas: narrative.ideas.slice(0, 3),
      }),
    ).toThrow();
  });
});
