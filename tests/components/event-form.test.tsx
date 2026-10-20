import { fireEvent, render, screen } from '@testing-library/react';
import type { FormEvent } from 'react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { EventForm } from '@/components/event-form';
import { EVENT_LIMITS } from '@/domain/contracts';
import { createSampleWorkspace } from '@/domain/sample';

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

function renderForm() {
  const event = createSampleWorkspace(new Date('2026-10-20T00:00:00Z'))
    .events[0];
  if (!event) throw new Error('Expected a sample event');
  const onSubmit = vi.fn((submission: FormEvent<HTMLFormElement>) =>
    submission.preventDefault(),
  );
  render(
    <EventForm
      onSubmit={onSubmit}
      onClose={vi.fn()}
      loading={false}
      initial={{ ...event.brief, date: '2099-01-10' }}
    />,
  );
  return { onSubmit };
}

describe('event form calendar boundaries', () => {
  it.each([19, 21])(
    'uses local day %s when the UTC calendar date is different',
    (localDay) => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-10-20T12:00:00Z'));
      vi.spyOn(Date.prototype, 'getFullYear').mockReturnValue(2026);
      vi.spyOn(Date.prototype, 'getMonth').mockReturnValue(9);
      vi.spyOn(Date.prototype, 'getDate').mockReturnValue(localDay);
      renderForm();
      expect(screen.getByLabelText('Event date')).toHaveAttribute(
        'min',
        `2026-10-${localDay}`,
      );
    },
  );

  it('blocks dates outside the planning contract before submitting', async () => {
    const { onSubmit } = renderForm();
    const date = screen.getByLabelText('Event date');
    expect(date).toHaveAttribute('max', EVENT_LIMITS.maxDate);
    fireEvent.change(date, { target: { value: '2200-01-01' } });
    await userEvent.click(
      screen.getByRole('button', { name: 'Generate plan' }),
    );
    expect(date).toBeInvalid();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
