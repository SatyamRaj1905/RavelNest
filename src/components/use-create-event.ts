import { useState, type FormEvent } from 'react';
import {
  briefSchema,
  type EventBrief,
  type EventRecord,
} from '@/domain/contracts';
import { createEvent } from '@/domain/workspace';
import { useGeneration } from './use-generation';

export function useCreateEvent(onSave: (event: EventRecord) => void) {
  const { state, generate, reset } = useGeneration();
  const [error, setError] = useState('');
  const [draft, setDraft] = useState<EventBrief | undefined>();
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    const result = briefSchema.safeParse({
      ...data,
      guests: Number(data.guests),
      budget: Number(data.budget),
    });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'Check your event details.');
      return;
    }
    setError('');
    setDraft(result.data);
    void generate(result.data);
  }
  function save() {
    if (state.status !== 'ready') return;
    try {
      onSave(createEvent(state.brief, state.result.plan, state.result.source));
    } catch {
      setError(
        'This event could not be saved. Remove an event if your workspace is full.',
      );
    }
  }
  return {
    state,
    error: error || (state.status === 'error' ? state.message : ''),
    draft,
    submit,
    save,
    back: reset,
  };
}
