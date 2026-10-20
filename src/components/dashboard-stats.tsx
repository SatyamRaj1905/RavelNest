import {
  ArrowUpRight,
  CalendarDays,
  CheckCheck,
  HeartHandshake,
  Wallet,
} from 'lucide-react';
import type { EventRecord } from '@/domain/contracts';
import { getBudgetTotals, getTaskProgress } from '@/domain/workspace';
import { formatMoney } from '@/domain/format';
import type { Tab } from './navigation';

function buildStats(event: EventRecord, total: number) {
  const budget = getBudgetTotals(event.plan.budget);
  const tasks = getTaskProgress(event.plan.tasks);
  const booked = event.plan.vendors.filter(
    (vendor) => vendor.status === 'booked',
  ).length;
  return [
    {
      label: 'Events in the making',
      value: String(total).padStart(2, '0'),
      detail: 'A reason to bring people together',
      icon: CalendarDays,
      tab: 'My events' as const,
      color: 'sage',
    },
    {
      label: 'Budget remaining',
      value: formatMoney(budget.remaining, event.brief.currency),
      detail: `of ${formatMoney(budget.allocated, event.brief.currency)} total budget`,
      icon: Wallet,
      tab: 'Budget' as const,
      color: 'peach',
    },
    {
      label: 'Little things, checked off',
      value: `${tasks.completed}/${tasks.total}`,
      detail: `${tasks.percent}% closer to the big day`,
      icon: CheckCheck,
      tab: 'Timeline' as const,
      color: 'lavender',
    },
    {
      label: 'Vendors on board',
      value: `${booked}/${event.plan.vendors.length}`,
      detail: 'Your dream team, coming together',
      icon: HeartHandshake,
      tab: 'Vendors' as const,
      color: 'yellow',
    },
  ];
}

export function DashboardStats({
  event,
  total,
  onTab,
}: {
  event: EventRecord;
  total: number;
  onTab: (tab: Tab) => void;
}) {
  const stats = buildStats(event, total);
  return (
    <div className="stats-grid">
      {stats.map((stat) => (
        <button
          className="stat-card"
          key={stat.label}
          onClick={() => onTab(stat.tab)}
        >
          <div className="stat-top">
            <span className={`stat-icon ${stat.color}`}>
              <stat.icon size={19} strokeWidth={1.7} />
            </span>
            <ArrowUpRight size={16} />
          </div>
          <span className="stat-label">{stat.label}</span>
          <strong className="stat-number">{stat.value}</strong>
          <span className="stat-detail">{stat.detail}</span>
        </button>
      ))}
    </div>
  );
}
