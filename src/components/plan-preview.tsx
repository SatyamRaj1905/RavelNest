import { Check, ClipboardList, Sparkles, Wallet } from 'lucide-react';
import type { EventBrief, PlanResponse } from '@/domain/contracts';
import { formatMoney } from '@/domain/format';

export function PlanPreview({
  brief,
  result,
  onSave,
  onBack,
}: {
  brief: EventBrief;
  result: PlanResponse;
  onSave: () => void;
  onBack: () => void;
}) {
  return (
    <div className="plan-preview">
      <div className="preview-banner">
        <span className="preview-icon">
          <Sparkles size={24} />
        </span>
        <div>
          <h3>Your celebration, taking shape.</h3>
          <p>
            {brief.name} · {brief.guests} guests
          </p>
        </div>
      </div>
      <span className={`source-badge ${result.source}`}>
        {result.source === 'gemini'
          ? 'Personalized with Gemini'
          : 'Demo planning engine'}
      </span>
      <p className="preview-summary">{result.plan.summary}</p>
      <div className="preview-stats">
        <span>
          <Wallet size={18} /> {formatMoney(brief.budget, brief.currency)}{' '}
          allocated
        </span>
        <span>
          <ClipboardList size={18} /> {result.plan.tasks.length} thoughtful next
          steps
        </span>
      </div>
      <div className="preview-ideas">
        {result.plan.ideas.slice(0, 2).map((idea) => (
          <article key={idea.id}>
            <h4>{idea.title}</h4>
            <p>{idea.description}</p>
          </article>
        ))}
      </div>
      <p className="form-hint" role="status">
        {result.notice} Allocations are estimates, not quotes.
      </p>
      <PreviewActions onSave={onSave} onBack={onBack} />
    </div>
  );
}

function PreviewActions({
  onSave,
  onBack,
}: {
  onSave: () => void;
  onBack: () => void;
}) {
  return (
    <div className="dialog-actions">
      <button className="button secondary" onClick={onBack}>
        Back to details
      </button>
      <button className="button primary" onClick={onSave}>
        <Check size={17} /> Save event
      </button>
    </div>
  );
}
