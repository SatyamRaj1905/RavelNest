import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
} from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { requestPlan } from '@/client/request-plan';
import { CreateEventDialog } from '@/components/create-event-dialog';
import { useCreateEvent } from '@/components/use-create-event';

vi.mock('@/client/request-plan', () => ({ requestPlan: vi.fn() }));
vi.mock('@/components/dialog', () => ({
  Dialog: ({ children }: { children: React.ReactNode }) => (
    <section role="dialog">{children}</section>
  ),
}));
beforeEach(() => vi.mocked(requestPlan).mockReset());

describe('event creation validation boundary', () => {
  it('ignores save attempts before a preview is ready', () => {
    const save = vi.fn();
    const { result } = renderHook(() => useCreateEvent(save));
    act(() => result.current.save());
    expect(save).not.toHaveBeenCalled();
    expect(result.current.state.status).toBe('idle');
    expect(result.current.error).toBe('');
  });
  it('rejects invalid form submission before calling the planning service', () => {
    render(<CreateEventDialog onClose={vi.fn()} onSave={vi.fn()} />);
    const form = screen
      .getByRole('button', { name: 'Generate plan' })
      .closest('form');
    if (!form) throw new Error('Expected creation form');
    fireEvent.submit(form);
    expect(screen.getByRole('alert')).not.toHaveTextContent('');
    expect(requestPlan).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Event name')).toBeInTheDocument();
  });
});
