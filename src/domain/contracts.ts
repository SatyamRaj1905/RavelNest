import { z } from 'zod';

export const eventTypes = ['wedding', 'birthday', 'community'] as const;
export const currencies = ['INR', 'USD', 'EUR', 'GBP'] as const;
export const vendorStatuses = ['to-contact', 'contacted', 'booked'] as const;
export const MAX_EVENTS = 12;
export const EVENT_LIMITS = {
  nameLength: 100,
  locationLength: 120,
  directionLength: 1200,
  minGuests: 1,
  maxGuests: 10000,
  minBudget: 100,
  maxBudget: 100000000,
  minDate: '1900-01-01',
  maxDate: '2199-12-31',
  maxSpent: 1000000000,
} as const;

const text = (max: number) => z.string().trim().min(1).max(max);
const calendarDate = z
  .string()
  .regex(/^[1-9]\d{3}-\d{2}-\d{2}$/)
  .refine((value) => {
    const parsed = new Date(`${value}T00:00:00.000Z`);
    return (
      Number.isFinite(parsed.getTime()) &&
      parsed.toISOString().slice(0, 10) === value
    );
  }, 'Use a real calendar date.');

export const briefSchema = z
  .object({
    name: text(EVENT_LIMITS.nameLength),
    type: z.enum(eventTypes),
    date: calendarDate.refine(
      (value) => value >= EVENT_LIMITS.minDate && value <= EVENT_LIMITS.maxDate,
      'Choose an event date from 1900 through 2199.',
    ),
    guests: z
      .number()
      .int()
      .min(EVENT_LIMITS.minGuests)
      .max(EVENT_LIMITS.maxGuests),
    budget: z
      .number()
      .int()
      .min(EVENT_LIMITS.minBudget)
      .max(EVENT_LIMITS.maxBudget),
    currency: z.enum(currencies),
    location: text(EVENT_LIMITS.locationLength),
    preferences: z.string().trim().max(EVENT_LIMITS.directionLength),
  })
  .strict();

export const budgetItemSchema = z
  .object({
    category: text(80),
    amount: z.number().int().nonnegative(),
    spent: z.number().int().min(0).max(EVENT_LIMITS.maxSpent),
  })
  .strict();

export const taskSchema = z
  .object({
    id: text(100),
    title: text(160),
    dueDate: calendarDate,
    category: text(80),
    completed: z.boolean(),
  })
  .strict();

export const vendorSchema = z
  .object({
    id: text(100),
    category: text(80),
    description: text(240),
    status: z.enum(vendorStatuses),
    notes: z.string().trim().max(500),
  })
  .strict();

export const ideaSchema = z
  .object({
    id: text(100),
    title: text(100),
    description: text(600),
    tag: text(60),
    saved: z.boolean(),
  })
  .strict();

const uniqueIds = (items: { id: string }[]) =>
  new Set(items.map((item) => item.id)).size === items.length;
const uniqueCategories = (items: { category: string }[]) =>
  new Set(items.map((item) => item.category)).size === items.length;

const BUDGET_MISMATCH = 'Allocations must match the event budget.';
const MILESTONE_MISMATCH = 'Milestones cannot fall after the event date.';
type PlanContext = { brief: EventBrief; plan: EventPlan };
const matchesBudget = ({ brief, plan }: PlanContext) =>
  plan.budget.reduce((total, item) => total + item.amount, 0) === brief.budget;
const matchesMilestones = ({ brief, plan }: PlanContext) =>
  plan.tasks.every((task) => task.dueDate <= brief.date);

export const planSchema = z
  .object({
    summary: text(1800),
    budget: z
      .array(budgetItemSchema)
      .min(1)
      .max(12)
      .refine(uniqueCategories, 'Duplicate budget category.'),
    tasks: z
      .array(taskSchema)
      .min(1)
      .max(40)
      .refine(uniqueIds, 'Duplicate task ID.'),
    vendors: z
      .array(vendorSchema)
      .min(1)
      .max(16)
      .refine(uniqueIds, 'Duplicate vendor ID.'),
    ideas: z
      .array(ideaSchema)
      .min(1)
      .max(12)
      .refine(uniqueIds, 'Duplicate idea ID.'),
  })
  .strict();

export const eventSchema = z
  .object({
    id: text(100),
    brief: briefSchema,
    plan: planSchema,
    source: z.enum(['demo', 'gemini']),
    createdAt: z.iso.datetime(),
  })
  .strict()
  .refine(matchesBudget, BUDGET_MISMATCH)
  .refine(matchesMilestones, MILESTONE_MISMATCH);

export const workspaceSchema = z
  .object({
    version: z.literal(1),
    events: z.array(eventSchema).min(1).max(MAX_EVENTS),
    activeEventId: text(100),
  })
  .strict()
  .refine(
    (workspace) =>
      uniqueIds(workspace.events) &&
      workspace.events.some((event) => event.id === workspace.activeEventId),
    'Workspace must contain unique events and its active event.',
  );

export const planRequestSchema = z
  .object({
    brief: briefSchema,
    prompt: z.string().trim().max(EVENT_LIMITS.directionLength).optional(),
  })
  .strict();
export const planResponseSchema = z
  .object({
    plan: planSchema,
    source: z.enum(['demo', 'gemini']),
    notice: text(300),
  })
  .strict();
export const apiErrorSchema = z
  .object({ error: z.object({ code: text(80), message: text(300) }).strict() })
  .strict();

export type EventType = (typeof eventTypes)[number];
export type Currency = (typeof currencies)[number];
export type EventBrief = z.infer<typeof briefSchema>;
export type BudgetItem = z.infer<typeof budgetItemSchema>;
export type PlanTask = z.infer<typeof taskSchema>;
export type VendorItem = z.infer<typeof vendorSchema>;
export type Idea = z.infer<typeof ideaSchema>;
export type EventPlan = z.infer<typeof planSchema>;
export type EventRecord = z.infer<typeof eventSchema>;
export type Workspace = z.infer<typeof workspaceSchema>;
export type PlanRequest = z.infer<typeof planRequestSchema>;
export type PlanResponse = z.infer<typeof planResponseSchema>;

/** Validate the response against its request without inventing a saved event identity. */
export function parsePlanResponseForBrief(
  input: unknown,
  brief: EventBrief,
): PlanResponse {
  const response = planResponseSchema.parse(input);
  const context = { brief: briefSchema.parse(brief), plan: response.plan };
  if (!matchesBudget(context)) throw new Error(BUDGET_MISMATCH);
  if (!matchesMilestones(context)) throw new Error(MILESTONE_MISMATCH);
  return response;
}
