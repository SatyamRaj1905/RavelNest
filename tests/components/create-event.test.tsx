import type { ReactNode } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { requestPlan } from '@/client/request-plan';
import { CreateEventDialog } from '@/components/create-event-dialog';
import { generatePlan } from '@/domain/planner';

vi.mock('@/client/request-plan', () => ({ requestPlan: vi.fn() }));
vi.mock('@/components/dialog', () => ({
  Dialog: ({ children, title }: { children: ReactNode; title: string }) => (
    <section role="dialog" aria-label={title}>
      {children}
    </section>
  ),
}));
const mockedRequest = vi.mocked(requestPlan);

beforeEach(() => {
  mockedRequest.mockReset();
  mockedRequest.mockImplementation(async (brief) => ({
    plan: generatePlan(brief),
    source: 'demo',
    notice: 'Demo preview, no AI provider used.',
  }));
});

async function fillBrief() {
  const user = userEvent.setup();
  await user.type(
    screen.getByLabelText('Event name'),
    'A festival for our neighborhood',
  );
  await user.selectOptions(screen.getByLabelText('Event type'), 'community');
  fireEvent.change(screen.getByLabelText('Event date'), {
    target: { value: '2099-11-21' },
  });
  await user.clear(screen.getByLabelText('Guests'));
  await user.type(screen.getByLabelText('Guests'), '83');
  await user.type(screen.getByLabelText('Location'), 'Pune, Maharashtra');
  await user.clear(screen.getByLabelText('Total budget'));
  await user.type(screen.getByLabelText('Total budget'), '87000');
  await user.selectOptions(screen.getByLabelText('Currency'), 'USD');
  await user.type(
    screen.getByLabelText(/Your vision/),
    'Accessible venue, local food, a plant exchange.',
  );
  return user;
}

describe('approved event creation', () => {
  it('retains every draft field after returning from a preview, and saves only on approval', async () => {
    const onSave = vi.fn();
    render(<CreateEventDialog onClose={vi.fn()} onSave={onSave} />);
    const user = await fillBrief();
    await user.click(screen.getByRole('button', { name: 'Generate plan' }));
    expect(
      await screen.findByText('Your celebration, taking shape.'),
    ).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Back to details' }));
    expect(screen.getByLabelText('Event name')).toHaveValue(
      'A festival for our neighborhood',
    );
    expect(screen.getByLabelText('Event type')).toHaveValue('community');
    expect(screen.getByLabelText('Event date')).toHaveValue('2099-11-21');
    expect(screen.getByLabelText('Guests')).toHaveValue(83);
    expect(screen.getByLabelText('Location')).toHaveValue('Pune, Maharashtra');
    expect(screen.getByLabelText('Total budget')).toHaveValue(87000);
    expect(screen.getByLabelText('Currency')).toHaveValue('USD');
    expect(screen.getByLabelText(/Your vision/)).toHaveValue(
      'Accessible venue, local food, a plant exchange.',
    );
    await user.click(screen.getByRole('button', { name: 'Generate plan' }));
    await user.click(await screen.findByRole('button', { name: 'Save event' }));
    expect(onSave).toHaveBeenCalledOnce();
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        brief: expect.objectContaining({
          name: 'A festival for our neighborhood',
          budget: 87000,
          guests: 83,
        }),
        source: 'demo',
      }),
    );
  });

  it('reports a save failure without dismissing the preview', async () => {
    const onSave = vi.fn(() => {
      throw new Error('Workspace full');
    });
    render(<CreateEventDialog onClose={vi.fn()} onSave={onSave} />);
    const user = await fillBrief();
    await user.click(screen.getByRole('button', { name: 'Generate plan' }));
    await user.click(await screen.findByRole('button', { name: 'Save event' }));
    expect(screen.getByRole('alert')).toHaveTextContent(
      'This event could not be saved.',
    );
    expect(
      screen.getByRole('button', { name: 'Back to details' }),
    ).toBeInTheDocument();
  });

  it('keeps the event draft and provides a retry after a generation error', async () => {
    const onSave = vi.fn();
    mockedRequest.mockRejectedValueOnce(new Error('Unexpected private detail'));
    render(<CreateEventDialog onClose={vi.fn()} onSave={onSave} />);
    const user = await fillBrief();
    await user.click(screen.getByRole('button', { name: 'Generate plan' }));
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(
      'Your plan could not be prepared. Please try again.',
    );
    expect(alert).not.toHaveTextContent('Unexpected private detail');
    expect(screen.getByLabelText('Event name')).toHaveValue(
      'A festival for our neighborhood',
    );
    expect(screen.getByLabelText(/Your vision/)).toHaveValue(
      'Accessible venue, local food, a plant exchange.',
    );
    expect(onSave).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Generate plan' }));
    expect(
      await screen.findByRole('button', { name: 'Save event' }),
    ).toBeEnabled();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
