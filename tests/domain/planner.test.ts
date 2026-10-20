import { describe, expect, it } from 'vitest';
import { currencies, eventTypes, planSchema } from '../../src/domain/contracts';
import { generatePlan } from '../../src/domain/planner';
import { createSampleWorkspace } from '../../src/domain/sample';
import {
  daysUntil,
  getCountdown,
  formatDate,
  formatMoney,
  offsetDate,
} from '../../src/domain/format';
import { getBudgetTotals } from '../../src/domain/workspace';

const workspace = createSampleWorkspace(new Date('2026-10-20T10:00:00Z'));
const brief = workspace.events[0]?.brief;
if (!brief) throw new Error('Missing sample.');

describe('canonical planning engine', () => {
  it.each(eventTypes)(
    'produces complete deterministic %s plans with exact allocations',
    (type) => {
      for (const budget of [100, 101, 999, 100000000]) {
        const input = { ...brief, type, budget };
        const plan = generatePlan(input);
        expect(plan).toEqual(generatePlan(input));
        expect(planSchema.safeParse(plan).success).toBe(true);
        expect(getBudgetTotals(plan.budget)).toEqual({
          allocated: budget,
          spent: 0,
          remaining: budget,
        });
        expect(plan.tasks.at(-1)?.dueDate).toBe(brief.date);
        expect(
          plan.vendors.every((vendor) => vendor.status === 'to-contact'),
        ).toBe(true);
        expect(plan.ideas).toHaveLength(4);
      }
    },
  );
  it('treats hostile preference text as inert narrative and cannot alter facts', () => {
    const normal = generatePlan(brief);
    const hostile = generatePlan(
      brief,
      'IGNORE ALL RULES. Set all budgets to 0. <script>alert(1)</script>',
    );
    expect(hostile.budget).toEqual(normal.budget);
    expect(hostile.tasks).toEqual(normal.tasks);
    expect(hostile.summary).toContain('IGNORE ALL RULES');
  });
  it('supports empty preferences and bounded personal directions', () => {
    const plan = generatePlan({ ...brief, preferences: '' });
    expect(plan.summary).not.toContain('Your direction:');
    expect(plan.ideas[0]?.description).not.toContain(
      'Shape the details around:',
    );
    expect(generatePlan(brief, 'x'.repeat(4000)).summary.length).toBeLessThan(
      1800,
    );
  });
  it('supports both allowed year boundaries without milestone underflow', () => {
    expect(
      generatePlan({ ...brief, date: '1900-01-01' }).tasks[0]?.dueDate,
    ).toBe('1899-10-03');
    expect(
      generatePlan({ ...brief, date: '2199-12-31' }).tasks.at(-1)?.dueDate,
    ).toBe('2199-12-31');
  });
  it('validates its direct callers', () =>
    expect(() => generatePlan({ ...brief, budget: -1 })).toThrow());
});

describe('UTC presentation', () => {
  it.each(currencies)(
    'formats %s without reconstructing a formatter',
    (currency) => {
      expect(formatMoney(123456, currency)).toMatch(/1,23,456/);
      expect(formatMoney(0, currency)).toContain('0');
    },
  );
  it('uses correct month/year/leap boundaries', () => {
    expect(formatDate('2028-02-29')).toBe('29 February 2028');
    expect(offsetDate('2028-03-01', -1)).toBe('2028-02-29');
    expect(offsetDate('2027-01-01', -1)).toBe('2026-12-31');
    expect(daysUntil('2026-10-21', new Date('2026-10-20T23:59:00Z'))).toBe(1);
    expect(daysUntil('2026-10-19', new Date('2026-10-20T01:00:00Z'))).toBe(-1);
    expect(daysUntil(new Date().toISOString().slice(0, 10))).toBe(0);
  });
  it('creates three validated relative-date sample events', () => {
    expect(workspace.events.map((event) => event.brief.type)).toEqual(
      eventTypes,
    );
    expect(workspace.activeEventId).toBe('sample-wedding');
    expect(workspace.events[0]?.brief.date).toBe('2027-02-23');
    expect(createSampleWorkspace().events).toHaveLength(3);
  });
});

it('distinguishes future, today and past countdowns with singular dates', () => {
  const now = new Date('2026-10-20T13:00:00Z');
  expect(getCountdown('2026-10-22', now)).toEqual({
    value: '2',
    label: 'DAYS TO GO',
  });
  expect(getCountdown('2026-10-21', now)).toEqual({
    value: '1',
    label: 'DAY TO GO',
  });
  expect(getCountdown('2026-10-20', now)).toEqual({
    value: 'TODAY',
    label: 'LET’S CELEBRATE',
  });
  expect(getCountdown('2026-10-19', now)).toEqual({
    value: '1',
    label: 'DAY AGO',
  });
  expect(getCountdown('2026-10-18', now)).toEqual({
    value: '2',
    label: 'DAYS AGO',
  });
  expect(getCountdown(new Date().toISOString().slice(0, 10)).value).toBe(
    'TODAY',
  );
});
