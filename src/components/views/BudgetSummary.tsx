import { ArrowDownLeft, CircleDollarSign, PiggyBank } from 'lucide-react';
import type { Currency } from '@/domain/contracts';
import { formatMoney } from '@/domain/format';

type BudgetSummaryProps = {
  budget: number;
  spent: number;
  remaining: number;
  currency: Currency;
};

export function BudgetStats({
  budget,
  spent,
  remaining,
  currency,
}: BudgetSummaryProps) {
  const cards = [
    { label: 'Total budget', amount: budget, icon: CircleDollarSign },
    { label: 'Spent so far', amount: spent, icon: ArrowDownLeft },
    {
      label: remaining < 0 ? 'Over budget' : 'Still available',
      amount: Math.abs(remaining),
      icon: PiggyBank,
    },
  ];
  return (
    <div className="budget-stat-grid">
      {cards.map(({ label, amount, icon: Icon }) => (
        <article className="budget-stat" key={label}>
          <span className="budget-stat-icon">
            <Icon size={20} aria-hidden="true" />
          </span>
          <p>{label}</p>
          <strong>{formatMoney(amount, currency)}</strong>
        </article>
      ))}
    </div>
  );
}

export function BudgetProgress({
  budget,
  spent,
  remaining,
  currency,
}: BudgetSummaryProps) {
  const percent = Math.min(100, Math.round((spent / budget) * 100));
  return (
    <div className="view-panel budget-progress-panel">
      <div>
        <h3>Your budget at a glance</h3>
        <span>{percent}% of your budget used</span>
      </div>
      <div
        className="budget-progress"
        role="progressbar"
        aria-label="Budget spent"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <span style={{ width: `${percent}%` }} />
      </div>
      <p className={remaining < 0 ? 'budget-over' : ''}>
        {remaining < 0
          ? `Your spending is ${formatMoney(Math.abs(remaining), currency)} over the event budget. Review your allocations before booking more.`
          : 'Your allocations add up to your event budget. Record actual costs as you go.'}
      </p>
    </div>
  );
}
