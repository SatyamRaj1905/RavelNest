import Image from 'next/image';
import { ArrowRight, CalendarDays, MapPin, Users } from 'lucide-react';
import type { EventRecord } from '@/domain/contracts';
import { getCountdown, formatDate } from '@/domain/format';
import { getTaskProgress } from '@/domain/workspace';

function EventPhoto({ event }: { event: EventRecord }) {
  const countdown = getCountdown(event.brief.date);
  return (
    <div className="feature-photo">
      <Image
        src={`/images/${event.brief.type}.jpg`}
        alt={
          event.brief.type === 'wedding'
            ? 'Sunlit wedding flowers in soft ivory and rose tones'
            : 'A warm and colorful celebration setting'
        }
        fill
        sizes="(max-width: 760px) 100vw, 55vw"
        priority
      />
      <div className="photo-shade" />
      <span className="event-type-badge">
        {event.brief.type === 'community'
          ? 'Community event'
          : event.brief.type}
      </span>
      <div className="photo-caption">
        <h3>{event.brief.name}</h3>
        <span>
          <MapPin size={14} />
          {event.brief.location}
        </span>
      </div>
      <div className="countdown">
        <strong>{countdown.value}</strong>
        <span>{countdown.label}</span>
      </div>
    </div>
  );
}

function EventDetails({ event }: { event: EventRecord }) {
  return (
    <div className="feature-details">
      <span>
        <CalendarDays size={15} /> {formatDate(event.brief.date)}
      </span>
      <span>
        <Users size={15} /> {event.brief.guests} guests
      </span>
      <span className="source-label">
        {event.source === 'gemini'
          ? 'Gemini personalized'
          : 'Sample / demo plan'}
      </span>
    </div>
  );
}

function EventProgress({ percent }: { percent: number }) {
  return (
    <div className="feature-progress">
      <div>
        <span>Bringing it all together</span>
        <strong>{percent}% ready</strong>
      </div>
      <div className="progress-track">
        <span style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

export function FeaturedEvent({
  event,
  onOpen,
}: {
  event: EventRecord;
  onOpen: () => void;
}) {
  const progress = getTaskProgress(event.plan.tasks);
  return (
    <section className="panel featured-event">
      <div className="section-heading">
        <h2>Your next big moment</h2>
        <span className="tiny-label">A LITTLE CLOSER, EVERY DAY</span>
      </div>
      <EventPhoto event={event} />
      <EventDetails event={event} />
      <EventProgress percent={progress.percent} />
      <div className="feature-bottom">
        <span className="avatar-stack">
          <i>A</i>
          <i>J</i>
          <i>♡</i>
        </span>
        <p>Your vision. Your pace. Your moment.</p>
        <button className="text-button" onClick={onOpen}>
          View plan <ArrowRight size={15} />
        </button>
      </div>
    </section>
  );
}
