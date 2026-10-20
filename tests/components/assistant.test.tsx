import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { requestPlan } from '@/client/request-plan';
import { Assistant } from '@/components/assistant';
import { createSampleWorkspace } from '@/domain/sample';

vi.mock('@/client/request-plan', () => ({ requestPlan: vi.fn() }));
const mockedRequest = vi.mocked(requestPlan);

function renderAssistant() {
  const event = createSampleWorkspace(new Date('2026-10-20T00:00:00Z'))
    .events[0];
  if (!event) throw new Error('Expected a sample event');
  const onUpdate = vi.fn();
  mockedRequest.mockImplementation(async () => ({
    plan: event.plan,
    source: 'gemini',
    notice: 'Review these suggestions before applying them.',
  }));
  render(<Assistant event={event} onUpdate={onUpdate} />);
  return { onUpdate, user: userEvent.setup() };
}

beforeEach(() => mockedRequest.mockReset());

describe('assistant suggestion approval', () => {
  it('keeps the current result approved while the next prompt is being edited', async () => {
    const { user, onUpdate } = renderAssistant();
    await user.click(screen.getByRole('button', { name: 'Make it personal' }));
    const apply = await screen.findByRole('button', {
      name: 'Apply suggestions',
    });
    expect(onUpdate).not.toHaveBeenCalled();
    await user.click(apply);
    const approved = screen.getByRole('button', {
      name: 'Suggestions saved',
    });
    expect(approved).toBeDisabled();
    const prompt = screen.getByRole('textbox', {
      name: 'Ask your planning assistant',
    });
    await user.clear(prompt);
    await user.type(prompt, 'Another idea for my guests');
    expect(approved).toBeDisabled();
    expect(onUpdate).toHaveBeenCalledOnce();
    await user.click(screen.getByRole('button', { name: 'Send message' }));
    const next = await screen.findByRole('button', {
      name: 'Apply suggestions',
    });
    expect(next).toBeEnabled();
    await user.click(next);
    expect(onUpdate).toHaveBeenCalledTimes(2);
  });

  it('shows a safe error, keeps the prompt, and lets the user retry', async () => {
    const { user, onUpdate } = renderAssistant();
    mockedRequest.mockRejectedValueOnce(
      new Error('Sensitive provider internals must never be shown'),
    );
    await user.click(screen.getByRole('button', { name: 'Plan sustainably' }));
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(
      'Your plan could not be prepared. Please try again.',
    );
    expect(alert).not.toHaveTextContent('Sensitive provider internals');
    expect(
      screen.getByRole('textbox', { name: 'Ask your planning assistant' }),
    ).toHaveValue('Plan sustainably');
    expect(onUpdate).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Send message' }));
    expect(
      await screen.findByRole('button', { name: 'Apply suggestions' }),
    ).toBeEnabled();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
