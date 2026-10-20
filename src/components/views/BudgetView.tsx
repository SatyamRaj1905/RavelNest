'use client';

import { getBudgetTotals } from '@/domain/workspace';
import type { PlanViewProps } from './types';
import { ViewHeading } from './ViewHeading';
import { BudgetStats, BudgetProgress } from './BudgetSummary';
import { BudgetTable } from './BudgetTable';

export function BudgetView({ event, onUpdate }: PlanViewProps) {
  const { spent, remaining } = getBudgetTotals(event.plan.budget);
  const summary = {
    budget: event.brief.budget,
    spent,
    remaining,
    currency: event.brief.currency,
  };
  return (
    <section className="workspace-view" aria-label="Budget planner">
      <ViewHeading
        eyebrow="A little clarity goes a long way"
        title="Make every moment count."
        description="A thoughtful budget for a celebration that feels like you."
      />
      <BudgetStats {...summary} />
      <BudgetProgress {...summary} />
      <BudgetTable event={event} onUpdate={onUpdate} />
    </section>
  );
}
