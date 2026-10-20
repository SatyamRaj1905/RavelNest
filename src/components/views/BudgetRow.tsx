'use client';

import { Check } from 'lucide-react';
import { useId, useState, type FormEvent } from 'react';
import {
  budgetItemSchema,
  type EventPlan,
  type EventRecord,
} from '@/domain/contracts';
import { formatMoney } from '@/domain/format';

type BudgetRowProps = {
  item: EventPlan['budget'][number];
  currency: EventRecord['brief']['currency'];
  onSave: (amount: number) => void;
};

function validSpending(value: string, amount: number) {
  return (
    /^\d+$/.test(value) &&
    budgetItemSchema.shape.spent.safeParse(amount).success
  );
}

export function BudgetRow({ item, currency, onSave }: BudgetRowProps) {
  const [value, setValue] = useState(String(item.spent));
  const [error, setError] = useState('');
  const id = useId();
  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const amount = Number(value);
    if (!validSpending(value, amount)) {
      setError('Enter a whole amount from 0 to 1,000,000,000.');
      return;
    }
    setError('');
    onSave(amount);
  }
  const overBudget = item.spent > item.amount;
  return (
    <tr>
      <th scope="row">
        <span className="budget-category-dot" />
        {item.category}
      </th>
      <td>{formatMoney(item.amount, currency)}</td>
      <td>
        <form className="budget-spent-form" onSubmit={save}>
          <label className="sr-only" htmlFor={id}>
            Amount spent on {item.category}
          </label>
          <input
            id={id}
            inputMode="numeric"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${id}-error` : undefined}
          />
          <button
            type="submit"
            className="view-icon-button"
            aria-label={`Save spending for ${item.category}`}
          >
            <Check size={16} aria-hidden="true" />
          </button>
          {error && (
            <span className="view-input-error" id={`${id}-error`} role="alert">
              {error}
            </span>
          )}
        </form>
      </td>
      <td className={overBudget ? 'budget-over' : 'budget-remaining'}>
        {formatMoney(item.amount - item.spent, currency)}
        {overBudget && (
          <span className="budget-over-label">Over allocation</span>
        )}
      </td>
    </tr>
  );
}
