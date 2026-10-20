import { useState, type ComponentType } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { createSampleWorkspace } from '@/domain/sample';
import type { EventRecord } from '@/domain/contracts';
import { BudgetView } from '@/components/views/BudgetView';
import { TimelineView } from '@/components/views/TimelineView';
import { VendorsView } from '@/components/views/VendorsView';
import { IdeasView } from '@/components/views/IdeasView';
import { EventsView } from '@/components/views/EventsView';
import type { PlanViewProps } from '@/components/views/types';

function sampleEvent(): EventRecord {
  const event = createSampleWorkspace(new Date('2026-10-20T00:00:00Z'))
    .events[0];
  if (!event) throw new Error('Expected a sample event');
  return event;
}

function EditableView({
  View,
  initial = sampleEvent(),
}: {
  View: ComponentType<PlanViewProps>;
  initial?: EventRecord;
}) {
  const [event, setEvent] = useState(initial);
  return (
    <View event={event} onUpdate={(plan) => setEvent({ ...event, plan })} />
  );
}

describe('budget view', () => {
  it('rejects invalid spending and records real overspending with an explicit warning', async () => {
    const user = userEvent.setup();
    render(<EditableView View={BudgetView} />);
    const input = screen.getByRole('textbox', {
      name: 'Amount spent on Venue & catering',
    });
    const save = screen.getByRole('button', {
      name: 'Save spending for Venue & catering',
    });
    await user.clear(input);
    await user.type(input, '-2.5');
    await user.click(save);
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a whole amount');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    await user.clear(input);
    await user.type(input, '800000');
    await user.click(save);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByText('Over allocation')).toBeInTheDocument();
    expect(
      screen.getByText(/Your spending is ₹50,000 over the event budget/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('progressbar', { name: 'Budget spent' }),
    ).toHaveAttribute('aria-valuenow', '100');
  });

  it.each(['', '1.5', '1000000001', '9007199254740992', 'no cost'])(
    'rejects invalid amount %j',
    (value) => {
      const onUpdate = vi.fn();
      render(<BudgetView event={sampleEvent()} onUpdate={onUpdate} />);
      fireEvent.change(
        screen.getByLabelText('Amount spent on Venue & catering'),
        { target: { value } },
      );
      fireEvent.click(
        screen.getByRole('button', {
          name: 'Save spending for Venue & catering',
        }),
      );
      expect(onUpdate).not.toHaveBeenCalled();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    },
  );
});

describe('timeline view', () => {
  it('propagates task completion and filters pending and completed tasks', async () => {
    const user = userEvent.setup();
    render(<EditableView View={TimelineView} />);
    expect(screen.getAllByRole('checkbox')).toHaveLength(8);
    const pendingTask = screen.getByRole('checkbox', {
      name: 'Complete task: Choose your décor and celebration palette',
    });
    await user.click(pendingTask);
    expect(screen.getByText(/4 of 8 tasks complete/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Completed/ }));
    expect(screen.getAllByRole('checkbox')).toHaveLength(4);
    expect(
      screen.getByRole('checkbox', {
        name: 'Mark incomplete: Choose your décor and celebration palette',
      }),
    ).toBeChecked();
    await user.click(screen.getByRole('button', { name: /To do/ }));
    expect(screen.getAllByRole('checkbox')).toHaveLength(4);
    expect(
      screen.queryByText('Choose your décor and celebration palette'),
    ).not.toBeInTheDocument();
  });

  it('shows a clear completed-checklist empty state', async () => {
    const user = userEvent.setup();
    const initial = sampleEvent();
    initial.plan.tasks = initial.plan.tasks.map((task) => ({
      ...task,
      completed: true,
    }));
    render(<EditableView View={TimelineView} initial={initial} />);
    await user.click(screen.getByRole('button', { name: /To do/ }));
    expect(screen.getByRole('status')).toHaveTextContent(
      'Every little detail is done.',
    );
  });

  it('labels overdue work while completed tasks have no overdue warning', () => {
    const initial = sampleEvent();
    initial.plan.tasks = initial.plan.tasks.slice(0, 2).map((task, index) => ({
      ...task,
      dueDate: '2020-01-01',
      completed: index === 0,
    }));
    render(<EditableView View={TimelineView} initial={initial} />);
    expect(screen.getAllByText('Overdue')).toHaveLength(1);
  });
});

describe('vendor checklist', () => {
  it('saves local contacts, changes status and searches the saved notes', async () => {
    const user = userEvent.setup();
    render(<EditableView View={VendorsView} />);
    const card = screen
      .getByRole('heading', { name: 'Catering' })
      .closest('article');
    if (!card) throw new Error('Expected a vendor card');
    await user.selectOptions(
      within(card).getByLabelText('Planning status'),
      'contacted',
    );
    const notes = within(card).getByLabelText('Your shortlist & notes');
    expect(notes).toHaveAttribute('maxlength', '500');
    await user.type(notes, 'Lotus kitchen: quote requested, call Friday.');
    await user.click(within(card).getByRole('button', { name: 'Save notes' }));
    expect(within(card).getByRole('status')).toHaveTextContent('Notes saved');
    await user.type(screen.getByLabelText('Search vendor checklist'), 'Lotus');
    expect(screen.getAllByRole('article')).toHaveLength(1);
    expect(
      screen.getByRole('heading', { name: 'Catering' }),
    ).toBeInTheDocument();
    await user.selectOptions(
      screen.getByLabelText('Filter vendor status'),
      'booked',
    );
    expect(screen.getByRole('status')).toHaveTextContent(
      'No matches just yet.',
    );
  });
});

describe('personalized inspiration', () => {
  it('saves and unsaves ideas in the collection', async () => {
    const user = userEvent.setup();
    render(<EditableView View={IdeasView} />);
    await user.click(screen.getByRole('button', { name: /Saved ideas/ }));
    expect(screen.getByRole('status')).toHaveTextContent(
      'Your collection starts with a spark.',
    );
    await user.click(screen.getByRole('button', { name: /All inspiration/ }));
    await user.click(
      screen.getAllByRole('button', { name: 'Save this idea' })[0] ??
        screen.getByText('Save this idea'),
    );
    await user.click(screen.getByRole('button', { name: /Saved ideas/ }));
    expect(screen.getAllByRole('article')).toHaveLength(1);
    const saved = screen.getByRole('button', {
      name: 'Saved to your collection',
    });
    expect(saved).toHaveAttribute('aria-pressed', 'true');
    await user.click(saved);
    expect(screen.getByRole('status')).toHaveTextContent(
      'Your collection starts with a spark.',
    );
  });
});

describe('event collection', () => {
  it('opens and creates events and requires confirmation before deletion', async () => {
    const user = userEvent.setup();
    const workspace = createSampleWorkspace(new Date('2026-10-20T00:00:00Z'));
    const onDelete = vi.fn();
    const onCreate = vi.fn();
    const onSelect = vi.fn();
    render(
      <EventsView
        events={workspace.events}
        activeId={workspace.activeEventId}
        onSelect={onSelect}
        onCreate={onCreate}
        onDelete={onDelete}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Back to overview' }));
    expect(onSelect).toHaveBeenCalledWith('sample-wedding');
    await user.click(screen.getByRole('button', { name: 'Create an event' }));
    expect(onCreate).toHaveBeenCalledOnce();
    await user.click(
      screen.getByRole('button', { name: 'Delete Aarav & Ananya’s wedding' }),
    );
    expect(onDelete).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Keep event' }));
    expect(
      screen.queryByRole('group', { name: /Confirm deleting/ }),
    ).not.toBeInTheDocument();
    await user.click(
      screen.getByRole('button', { name: 'Delete Aarav & Ananya’s wedding' }),
    );
    await user.click(screen.getByRole('button', { name: 'Delete event' }));
    expect(onDelete).toHaveBeenCalledWith('sample-wedding');
  });

  it('preserves the final event', () => {
    const event = sampleEvent();
    render(
      <EventsView
        events={[event]}
        activeId={event.id}
        onSelect={vi.fn()}
        onCreate={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(
      screen.getByRole('button', { name: 'Delete Aarav & Ananya’s wedding' }),
    ).toBeDisabled();
  });
});
