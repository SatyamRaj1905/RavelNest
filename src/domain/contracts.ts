import { z } from 'zod';

export const eventTypes = ['wedding', 'birthday', 'community'] as const;
export const currencies = ['INR', 'USD', 'EUR', 'GBP'] as const;
export const vendorStatuses = ['to-contact', 'contacted', 'booked'] as const;
export const MAX_EVENTS = 12;

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
    name: text(100),
    type: z.enum(eventTypes),
    date: calendarDate.refine(
      (value) => value >= '1900-01-01' && value <= '2199-12-31',
      'Choose an event date from 1900 through 2199.',
    ),
    guests: z.number().int().min(1).max(10000),
    budget: z.number().int().min(100).max(100000000),
    currency: z.enum(currencies),
    location: text(120),
    preferences: z.string().trim().max(1200),
  })
  .strict();

export const budgetItemSchema = z
  .object({
    category: text(80),
    amount: z.number().int().nonnegative(),
    spent: z.number().int().min(0).max(1000000000),
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
  .refine(
    (event) =>
      event.plan.budget.reduce((total, item) => total + item.amount, 0) ===
      event.brief.budget,
    'Allocations must match the event budget.',
  )
  .refine(
    (event) =>
      event.plan.tasks.every((task) => task.dueDate <= event.brief.date),
    'Milestones cannot fall after the event date.',
  );

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
    prompt: z.string().trim().max(1200).optional(),
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
