import { blueprints } from './catalog';
import {
  briefSchema,
  planSchema,
  type EventBrief,
  type EventPlan,
} from './contracts';
import { offsetDate } from './format';

/** Linear in the fixed category/task catalog; integer remainder keeps allocations exact. */
export function generatePlan(input: EventBrief, prompt = ''): EventPlan {
  const brief = briefSchema.parse(input);
  const blueprint = blueprints[brief.type];
  let allocated = 0;
  const budget = blueprint.categories.map(([category, percent], index) => {
    const amount =
      index === blueprint.categories.length - 1
        ? brief.budget - allocated
        : Math.floor((brief.budget * percent) / 100);
    allocated += amount;
    return { category, amount, spent: 0 };
  });
  const preference = [brief.preferences, prompt.slice(0, 1200)]
    .filter(Boolean)
    .join(' ');
  return planSchema.parse({
    summary: `${brief.name} brings ${brief.guests} guests together in ${brief.location} for ${blueprint.label}. Your budget is allocated with a dedicated contingency, and every milestone works backward from your event date.${preference ? ` Your direction: ${preference.slice(0, 650)}` : ''}`,
    budget,
    tasks: blueprint.tasks.map(([title, days, category], index) => ({
      id: `task-${index + 1}`,
      title,
      dueDate: offsetDate(brief.date, days),
      category,
      completed: false,
    })),
    vendors: blueprint.vendors.map(([category, description], index) => ({
      id: `vendor-${index + 1}`,
      category,
      description,
      status: 'to-contact',
      notes: '',
    })),
    ideas: blueprint.ideas.map(([title, description, tag], index) => ({
      id: `idea-${index + 1}`,
      title,
      description:
        index === 0 && brief.preferences
          ? `${description} Shape the details around: ${brief.preferences.slice(0, 240)}`
          : description,
      tag,
      saved: false,
    })),
  });
}
