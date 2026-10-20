'use client';

import {
  ArrowUpRight,
  CalendarDays,
  Heart,
  MapPin,
  PartyPopper,
  Trash2,
  Users,
} from 'lucide-react';
import { useState } from 'react';
import type { EventRecord } from '@/domain/contracts';
import { formatDate } from '@/domain/format';

const eventIcons = {
  wedding: Heart,
  birthday: PartyPopper,
  community: Users,
} as const;
type EventCardProps = {
  event: EventRecord;
  active: boolean;
  canDelete: boolean;
  onSelect: () => void;
  onDelete: () => void;
};

function EventDetails({ event }: { event: EventRecord }) {
  return (
    <>
      <span className="event-type-label">{event.brief.type} celebration</span>
      <h3>{event.brief.name}</h3>
      <p>
        <CalendarDays size={14} aria-hidden="true" />
        {formatDate(event.brief.date)}
      </p>
      <p>
        <MapPin size={14} aria-hidden="true" />
        {event.brief.location}
      </p>
      <p>
        <Users size={14} aria-hidden="true" />
        {event.brief.guests} guests
      </p>
    </>
  );
}

function DeleteConfirmation({
  name,
  onDelete,
  onCancel,
}: {
  name: string;
  onDelete: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="event-delete-confirm"
      role="group"
      aria-label={`Confirm deleting ${name}`}
    >
      <p>
        Delete this event and all its planning details? This cannot be undone.
      </p>
      <div>
        <button
          type="button"
          className="event-confirm-button"
          onClick={onDelete}
        >
          Delete event
        </button>
        <button type="button" className="view-text-button" onClick={onCancel}>
          Keep event
        </button>
      </div>
    </div>
  );
}

export function EventCard({
  event,
  active,
  canDelete,
  onSelect,
  onDelete,
}: EventCardProps) {
  const [confirming, setConfirming] = useState(false);
  const Icon = eventIcons[event.brief.type];
  return (
    <article className={active ? 'event-card is-active' : 'event-card'}>
      <header>
        <span className={`event-type-icon event-type-${event.brief.type}`}>
          <Icon size={25} aria-hidden="true" />
        </span>
        {active && <span className="event-current">Current workspace</span>}
      </header>
      <EventDetails event={event} />
      <footer>
        <button type="button" className="event-open-button" onClick={onSelect}>
          {active ? 'Back to overview' : 'Open event'}
          <ArrowUpRight size={16} aria-hidden="true" />
        </button>
        <button
          type="button"
          className="view-icon-button event-delete-button"
          disabled={!canDelete}
          onClick={() => setConfirming(true)}
          aria-label={`Delete ${event.brief.name}`}
          title={
            canDelete
              ? 'Delete event'
              : 'Keep at least one event in your workspace'
          }
        >
          <Trash2 size={16} aria-hidden="true" />
        </button>
      </footer>
      {confirming && (
        <DeleteConfirmation
          name={event.brief.name}
          onDelete={onDelete}
          onCancel={() => setConfirming(false)}
        />
      )}
    </article>
  );
}
