'use client';

import { Plus } from 'lucide-react';
import type { EventRecord } from '@/domain/contracts';
import { ViewHeading } from './ViewHeading';
import { EventCard } from './EventCard';

type EventsViewProps = {
  events: EventRecord[];
  activeId: string;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
};

export function EventsView({
  events,
  activeId,
  onSelect,
  onCreate,
  onDelete,
}: EventsViewProps) {
  return (
    <section className="workspace-view" aria-label="Your events">
      <ViewHeading
        eyebrow="Life gives us reasons to gather"
        title="All your happy occasions."
        description="A home for every celebration you are bringing to life."
      >
        <button
          className="view-primary-button"
          type="button"
          onClick={onCreate}
        >
          <Plus size={17} aria-hidden="true" />
          Create an event
        </button>
      </ViewHeading>
      <div className="events-grid">
        {events.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            active={activeId === event.id}
            canDelete={events.length > 1}
            onSelect={() => onSelect(event.id)}
            onDelete={() => onDelete(event.id)}
          />
        ))}
        <button type="button" className="event-create-card" onClick={onCreate}>
          <span>
            <Plus size={26} aria-hidden="true" />
          </span>
          <strong>Something to celebrate?</strong>
          <span>Let’s make a little magic.</span>
        </button>
      </div>
      <p className="events-storage-note">
        Your events are saved in this browser. Keep at least one event in your
        workspace.
      </p>
    </section>
  );
}
