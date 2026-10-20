import { ArrowRight } from 'lucide-react';
import type { EventRecord } from '@/domain/contracts';
import { formatMoney } from '@/domain/format';
import { getBudgetTotals } from '@/domain/workspace';

const colors = [
  '#49674f',
  '#9caa84',
  '#e0b68b',
  '#d8c8a2',
  '#a9afb7',
  '#e4ddcc',
  '#b7a0b0',
];

export function BudgetSnapshot({
  event,
  onOpen,
}: {
  event: EventRecord;
  onOpen: () => void;
}) {
  const totals = getBudgetTotals(event.plan.budget);
  const stops = budgetStops(event.plan.budget, totals.allocated);
  return (
    <section className="panel budget-snapshot">
      <div className="section-heading">
        <h2>A little budget clarity</h2>
        <button className="text-button" onClick={onOpen}>
          Details <ArrowRight size={14} />
        </button>
      </div>
      <div className="budget-snapshot-body">
        <div
          className="budget-donut"
          style={{ background: `conic-gradient(${stops.join(',')})` }}
          role="img"
          aria-label={`Allocated budget ${formatMoney(totals.allocated, event.brief.currency)} across ${event.plan.budget.length} categories`}
        >
          <div>
            <span>Total budget</span>
            <strong>
              {formatMoney(totals.allocated, event.brief.currency)}
            </strong>
            <small>Thoughtfully allocated</small>
          </div>
        </div>
        <div className="budget-legend">
          {event.plan.budget.slice(0, 4).map((item, i) => (
            <div key={item.category}>
              <span className="legend-dot" style={{ background: colors[i] }} />
              <span>{item.category}</span>
              <strong>
                {Math.round((item.amount / totals.allocated) * 100)}%
              </strong>
            </div>
          ))}
          <button className="text-button" onClick={onOpen}>
            Explore all categories <ArrowRight size={13} />
          </button>
        </div>
      </div>
      <p className="budget-footnote">
        A starting point for your vision. Every allocation is an estimate.
      </p>
    </section>
  );
}

function budgetStops(budget: EventRecord['plan']['budget'], allocated: number) {
  return budget.reduce<{ total: number; stops: string[] }>(
    (result, item, index) => {
      const total = result.total + (item.amount / allocated) * 100;
      return {
        total,
        stops: [
          ...result.stops,
          `${colors[index % colors.length]} ${result.total}% ${total}%`,
        ],
      };
    },
    { total: 0, stops: [] },
  ).stops;
}
