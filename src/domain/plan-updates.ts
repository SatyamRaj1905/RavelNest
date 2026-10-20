import { planSchema, type EventPlan, type VendorItem } from './contracts';

export function setBudgetSpent(
  plan: EventPlan,
  category: string,
  spent: number,
): EventPlan {
  const budget = plan.budget.map((item) =>
    item.category === category
      ? {
          ...item,
          spent: Number.isFinite(spent)
            ? Math.max(0, Math.min(1000000000, Math.round(spent)))
            : item.spent,
        }
      : item,
  );
  return planSchema.parse({ ...plan, budget });
}

export function toggleTask(plan: EventPlan, id: string): EventPlan {
  return planSchema.parse({
    ...plan,
    tasks: plan.tasks.map((task) =>
      task.id === id ? { ...task, completed: !task.completed } : task,
    ),
  });
}

export function updateVendor(
  plan: EventPlan,
  id: string,
  patch: { status?: VendorItem['status']; notes?: string },
): EventPlan {
  return planSchema.parse({
    ...plan,
    vendors: plan.vendors.map((vendor) =>
      vendor.id === id ? { ...vendor, ...patch } : vendor,
    ),
  });
}

export function toggleIdea(plan: EventPlan, id: string): EventPlan {
  return planSchema.parse({
    ...plan,
    ideas: plan.ideas.map((idea) =>
      idea.id === id ? { ...idea, saved: !idea.saved } : idea,
    ),
  });
}

export function applySuggestions(
  plan: EventPlan,
  suggestions: EventPlan,
): EventPlan {
  const savedIds = new Set(
    plan.ideas.filter((idea) => idea.saved).map((idea) => idea.id),
  );
  return planSchema.parse({
    ...plan,
    summary: suggestions.summary,
    ideas: suggestions.ideas.map((idea) => ({
      ...idea,
      saved: savedIds.has(idea.id),
    })),
  });
}
