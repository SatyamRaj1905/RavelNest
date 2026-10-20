import {
  workspaceSchema,
  type EventBrief,
  type EventRecord,
  type Workspace,
} from './contracts';
import { offsetDate } from './format';
import { generatePlan } from './planner';

function sampleEvent(
  id: string,
  brief: EventBrief,
  createdAt: string,
): EventRecord {
  const plan = generatePlan(brief);
  return {
    id,
    brief,
    source: 'demo',
    createdAt,
    plan: {
      ...plan,
      tasks: plan.tasks.map((task, index) => ({
        ...task,
        completed: index < 3,
      })),
      vendors: plan.vendors.map((vendor, index) => ({
        ...vendor,
        status: index === 0 ? 'booked' : 'to-contact',
      })),
      budget: plan.budget.map((item, index) => ({
        ...item,
        spent: index === 0 ? Math.floor(item.amount / 3) : 0,
      })),
    },
  };
}

export function createSampleWorkspace(now: Date = new Date()): Workspace {
  const date = now.toISOString().slice(0, 10);
  const createdAt = now.toISOString();
  const events = [
    sampleEvent(
      'sample-wedding',
      {
        name: 'Aarav & Ananya’s wedding',
        type: 'wedding',
        date: offsetDate(date, 126),
        guests: 150,
        budget: 750000,
        currency: 'INR',
        location: 'Jaipur, Rajasthan',
        preferences:
          'An intimate garden celebration, warm terracotta tones, seasonal flowers and thoughtful little details.',
      },
      createdAt,
    ),
    sampleEvent(
      'sample-birthday',
      {
        name: 'Maya’s birthday',
        type: 'birthday',
        date: offsetDate(date, 38),
        guests: 30,
        budget: 45000,
        currency: 'INR',
        location: 'Bengaluru, Karnataka',
        preferences:
          'A cozy rooftop evening with board games, fairy lights and a chocolate cake.',
      },
      createdAt,
    ),
    sampleEvent(
      'sample-community',
      {
        name: 'The neighborhood gathering',
        type: 'community',
        date: offsetDate(date, 62),
        guests: 100,
        budget: 80000,
        currency: 'INR',
        location: 'Pune, Maharashtra',
        preferences:
          'A welcoming, accessible afternoon with local food, a plant exchange and activities for all ages.',
      },
      createdAt,
    ),
  ];
  return workspaceSchema.parse({
    version: 1,
    events,
    activeEventId: 'sample-wedding',
  });
}
