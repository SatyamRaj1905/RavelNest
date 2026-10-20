import type { EventRecord } from '@/domain/contracts';
import { Dialog } from './dialog';
import { EventForm } from './event-form';
import { PlanPreview } from './plan-preview';
import { useCreateEvent } from './use-create-event';

type Props = { onClose: () => void; onSave: (event: EventRecord) => void };

export function CreateEventDialog({ onClose, onSave }: Props) {
  const { state, error, draft, submit, save, back } = useCreateEvent(onSave);
  return (
    <Dialog
      title={
        state.status === 'ready'
          ? 'Meet your next memorable moment.'
          : 'Every great event starts with an idea.'
      }
      onClose={onClose}
    >
      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}
      {state.status === 'ready' ? (
        <PlanPreview
          brief={state.brief}
          result={state.result}
          onSave={save}
          onBack={back}
        />
      ) : (
        <EventForm
          onSubmit={submit}
          onClose={onClose}
          loading={state.status === 'loading'}
          initial={draft}
        />
      )}
    </Dialog>
  );
}
