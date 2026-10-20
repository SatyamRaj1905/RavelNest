import type { EventRecord } from '@/domain/contracts';
import { formatMoney } from '@/domain/format';

export function planMarkdown(event: EventRecord): string {
  const { brief, plan } = event;
  return [
    `# ${brief.name}`,
    '',
    `${brief.type} · ${brief.date} · ${brief.location} · ${brief.guests} guests`,
    `Budget: ${formatMoney(brief.budget, brief.currency)} · Plan source: ${event.source}`,
    '',
    plan.summary,
    '',
    '## Budget estimates',
    ...plan.budget.map(
      (item) =>
        `- ${item.category}: ${formatMoney(item.amount, brief.currency)} allocated; ${formatMoney(item.spent, brief.currency)} spent`,
    ),
    '',
    '## Timeline',
    ...plan.tasks.map(
      (task) =>
        `- [${task.completed ? 'x' : ' '}] ${task.dueDate}: ${task.title}`,
    ),
    '',
    '## Vendor checklist',
    ...plan.vendors.map(
      (vendor) =>
        `- ${vendor.category} (${vendor.status}): ${vendor.description} ${vendor.notes}`,
    ),
    '',
    '## Personalized ideas',
    ...plan.ideas.map((idea) => `- ${idea.title}: ${idea.description}`),
    '',
    'Estimates are planning guides, not vendor quotations. Created with RavelNest.',
    '',
  ].join('\n');
}

export function downloadPlan(event: EventRecord) {
  const url = URL.createObjectURL(
    new Blob([planMarkdown(event)], { type: 'text/markdown;charset=utf-8' }),
  );
  const link = document.createElement('a');
  link.href = url;
  link.download = `${event.brief.name.replace(/[^a-z0-9]/gi, '-').slice(0, 60)}-plan.md`;
  link.hidden = true;
  document.body.append(link);
  try {
    link.click();
  } finally {
    link.remove();
    URL.revokeObjectURL(url);
  }
}
