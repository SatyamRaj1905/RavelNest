import type { FormEvent } from 'react';
import { LoaderCircle, Sparkles } from 'lucide-react';
import { EventDetails, EventPreferences } from './event-fields';
import type { EventBrief } from '@/domain/contracts';

export function EventForm({
  onSubmit,
  onClose,
  loading,
  initial,
}: {
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
  loading: boolean;
  initial?: EventBrief | undefined;
}) {
  return (
    <form className="event-form" onSubmit={onSubmit}>
      <EventDetails initial={initial} />
      <EventPreferences initial={initial} />
      <div className="dialog-actions">
        <button type="button" className="button secondary" onClick={onClose}>
          Maybe later
        </button>
        <button className="button primary" disabled={loading}>
          {loading ? (
            <LoaderCircle size={17} className="spin" />
          ) : (
            <Sparkles size={17} />
          )}
          {loading ? 'Putting your plan together…' : 'Generate plan'}
        </button>
      </div>
      <span className="sr-only" role="status">
        {loading ? 'Generating your event plan. Please wait.' : ''}
      </span>
    </form>
  );
}
