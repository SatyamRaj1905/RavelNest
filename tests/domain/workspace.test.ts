import { describe, expect, it } from 'vitest';
import { createSampleWorkspace } from '../../src/domain/sample';
import {
  addEvent,
  createEvent,
  deleteEvent,
  getBudgetTotals,
  getTaskProgress,
  MAX_EVENTS,
  selectEvent,
  updateActiveEvent,
} from '../../src/domain/workspace';
import {
  applySuggestions,
  setBudgetSpent,
  toggleIdea,
  toggleTask,
  updateVendor,
} from '../../src/domain/plan-updates';

const workspace = createSampleWorkspace(new Date('2026-10-20T00:00:00Z'));
const event = workspace.events[0];
if (!event) throw new Error('Missing sample.');

describe('bounded immutable workspace operations', () => {
  it('creates validated independent event records with optional generated plans', () => {
    const generated = createEvent(event.brief);
    const supplied = createEvent(event.brief, event.plan, 'gemini');
    expect(generated.id).not.toBe(supplied.id);
    expect(generated.source).toBe('demo');
    expect(supplied.plan).toEqual(event.plan);
    expect(supplied.source).toBe('gemini');
    expect(() =>
      createEvent({ ...event.brief, budget: 100 }, event.plan),
    ).toThrow();
  });
  it('adds and switches events and keeps original unchanged', () => {
    const created = createEvent(event.brief);
    const added = addEvent(workspace, created);
    expect(added.events).toHaveLength(4);
    expect(added.activeEventId).toBe(created.id);
    expect(workspace.events).toHaveLength(3);
    expect(selectEvent(added, event.id).activeEventId).toBe(event.id);
    expect(() => selectEvent(workspace, 'missing')).toThrow();
    expect(() => addEvent(workspace, event)).toThrow();
  });
  it('enforces capacity without evicting events silently', () => {
    let filled = workspace;
    while (filled.events.length < MAX_EVENTS)
      filled = addEvent(filled, createEvent(event.brief));
    expect(() => addEvent(filled, createEvent(event.brief))).toThrow(
      'up to 12',
    );
  });
  it('mutates only active record, validates changes and chooses a survivor when deleting', () => {
    const updated = updateActiveEvent(workspace, (record) => ({
      ...record,
      plan: toggleTask(record.plan, 'task-1'),
    }));
    expect(updated.events[0]?.plan.tasks[0]?.completed).toBe(false);
    expect(updated.events[1]).toEqual(workspace.events[1]);
    expect(deleteEvent(workspace, event.id).activeEventId).toBe(
      'sample-birthday',
    );
    expect(deleteEvent(workspace, 'sample-community').activeEventId).toBe(
      event.id,
    );
    expect(deleteEvent(workspace, 'missing')).toEqual(workspace);
    expect(() =>
      deleteEvent({ ...workspace, events: [event] }, event.id),
    ).toThrow('at least one');
  });
});

describe('canonical plan edits and totals', () => {
  it('keeps exact allocations while tracking spending including overspend', () => {
    const category = event.plan.budget[0]?.category ?? '';
    const plan = setBudgetSpent(event.plan, category, 900000);
    expect(getBudgetTotals(plan.budget).remaining).toBeLessThan(0);
    expect(setBudgetSpent(plan, category, -5).budget[0]?.spent).toBe(0);
    expect(setBudgetSpent(plan, category, 12.6).budget[0]?.spent).toBe(13);
    expect(setBudgetSpent(plan, category, 1e12).budget[0]?.spent).toBe(
      1000000000,
    );
    expect(setBudgetSpent(plan, category, NaN)).toEqual(plan);
    expect(setBudgetSpent(plan, 'missing', 50)).toEqual(plan);
    expect(getBudgetTotals([])).toEqual({
      allocated: 0,
      spent: 0,
      remaining: 0,
    });
  });
  it('tracks task, vendor and idea edits without touching unrelated fields', () => {
    const toggled = toggleTask(event.plan, 'task-1');
    expect(getTaskProgress(toggled.tasks)).toEqual({
      completed: 2,
      total: 8,
      percent: 25,
    });
    expect(getTaskProgress([])).toEqual({ completed: 0, total: 0, percent: 0 });
    expect(toggleTask(event.plan, 'missing')).toEqual(event.plan);
    expect(toggleTask(toggled, 'task-1')).toEqual(event.plan);
    expect(
      updateVendor(event.plan, 'vendor-1', {
        status: 'contacted',
        notes: 'Call on Monday',
      }).vendors[0]?.notes,
    ).toBe('Call on Monday');
    expect(updateVendor(event.plan, 'missing', {})).toEqual(event.plan);
    expect(() =>
      updateVendor(event.plan, 'vendor-1', { notes: 'x'.repeat(501) }),
    ).toThrow();
    expect(toggleIdea(event.plan, 'idea-1').ideas[0]?.saved).toBe(true);
    expect(toggleIdea(event.plan, 'missing')).toEqual(event.plan);
  });
});

it('applies only narrative suggestions, preserving saved flags by ID and every operational field', () => {
  const plan = toggleIdea(event.plan, 'idea-1');
  const proposed = {
    ...event.plan,
    summary: 'A newly personalized summary.',
    budget: event.plan.budget.map((item) => ({ ...item, amount: 0, spent: 0 })),
    tasks: event.plan.tasks.map((task) => ({ ...task, completed: false })),
    vendors: event.plan.vendors.map((vendor) => ({
      ...vendor,
      notes: 'Untrusted replacement',
    })),
    ideas: event.plan.ideas.map((idea) => ({
      ...idea,
      title: 'New idea',
      saved: true,
    })),
  };
  const applied = applySuggestions(plan, proposed);
  expect(applied.summary).toBe(proposed.summary);
  expect(applied.ideas[0]?.saved).toBe(true);
  expect(applied.ideas[1]?.saved).toBe(false);
  expect(applied.ideas.every((idea) => idea.title === 'New idea')).toBe(true);
  expect(applied.budget).toEqual(plan.budget);
  expect(applied.tasks).toEqual(plan.tasks);
  expect(applied.vendors).toEqual(plan.vendors);
  expect(plan.summary).not.toBe(proposed.summary);
  expect(
    applySuggestions(plan, {
      ...proposed,
      ideas: [
        {
          ...proposed.ideas[0],
          id: 'brand-new',
          title: 'New',
          description: 'A new detail',
          tag: 'New',
          saved: true,
        },
      ],
    }).ideas[0]?.saved,
  ).toBe(false);
});
