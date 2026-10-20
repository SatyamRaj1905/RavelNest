import type { PlanViewProps } from './types';
import { setBudgetSpent } from '@/domain/plan-updates';
import { BudgetRow } from './BudgetRow';

export function BudgetTable({ event, onUpdate }: PlanViewProps) {
  return (
    <div className="view-panel budget-table-panel">
      <div className="view-panel-heading">
        <h3>The little details, accounted for</h3>
        <span>{event.brief.currency} · whole currency units</span>
      </div>
      <div className="budget-table-scroll">
        <table className="budget-table">
          <thead>
            <tr>
              <th scope="col">Category</th>
              <th scope="col">Planned</th>
              <th scope="col">Actual spending</th>
              <th scope="col">Remaining</th>
            </tr>
          </thead>
          <tbody>
            {event.plan.budget.map((item) => (
              <BudgetRow
                key={`${event.id}-${item.category}`}
                item={item}
                currency={event.brief.currency}
                onSave={(amount) =>
                  onUpdate(setBudgetSpent(event.plan, item.category, amount))
                }
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
