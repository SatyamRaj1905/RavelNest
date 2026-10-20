import {
  eventSchema,
  MAX_EVENTS,
  workspaceSchema,
  type BudgetItem,
  type EventBrief,
  type EventPlan,
  type EventRecord,
  type PlanTask,
  type Workspace,
} from './contracts';
import { generatePlan } from './planner';

export { MAX_EVENTS } from './contracts';

export function createEvent(
  brief: EventBrief,
  plan: EventPlan = generatePlan(brief),
  source: EventRecord['source'] = 'demo',
): EventRecord {
  return eventSchema.parse({
    id: crypto.randomUUID(),
    brief,
    plan,
    source,
    createdAt: new Date().toISOString(),
  });
}

export function addEvent(workspace: Workspace, event: EventRecord): Workspace {
  if (workspace.events.length >= MAX_EVENTS)
    throw new Error(
      `You can keep up to ${MAX_EVENTS} events. Remove an event to make room.`,
    );
  return workspaceSchema.parse({
    ...workspace,
    events: [...workspace.events, event],
    activeEventId: event.id,
  });
}

export function updateActiveEvent(
  workspace: Workspace,
  transform: (event: EventRecord) => EventRecord,
): Workspace {
  return workspaceSchema.parse({
    ...workspace,
    events: workspace.events.map((event) =>
      event.id === workspace.activeEventId ? transform(event) : event,
    ),
  });
}

export function selectEvent(workspace: Workspace, id: string): Workspace {
  return workspaceSchema.parse({ ...workspace, activeEventId: id });
}

export function deleteEvent(workspace: Workspace, id: string): Workspace {
  const events = workspace.events.filter((event) => event.id !== id);
  if (events.length === 0)
    throw new Error('Keep at least one event in your workspace.');
  const first = events[0];
  return workspaceSchema.parse({
    ...workspace,
    events,
    activeEventId:
      workspace.activeEventId === id && first
        ? first.id
        : workspace.activeEventId,
  });
}

export function getBudgetTotals(budget: BudgetItem[]): {
  allocated: number;
  spent: number;
  remaining: number;
} {
  const totals = budget.reduce(
    (result, item) => ({
      allocated: result.allocated + item.amount,
      spent: result.spent + item.spent,
    }),
    { allocated: 0, spent: 0 },
  );
  return { ...totals, remaining: totals.allocated - totals.spent };
}

export function getTaskProgress(tasks: PlanTask[]): {
  completed: number;
  total: number;
  percent: number;
} {
  const completed = tasks.reduce(
    (total, task) => total + Number(task.completed),
    0,
  );
  return {
    completed,
    total: tasks.length,
    percent: tasks.length ? Math.round((completed / tasks.length) * 100) : 0,
  };
}
