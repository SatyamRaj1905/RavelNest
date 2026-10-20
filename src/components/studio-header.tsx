import { ChevronDown, Menu, Sparkles } from 'lucide-react';
import type { EventRecord } from '@/domain/contracts';
import type { Tab } from './navigation';

export function StudioHeader({
  tab,
  events,
  activeId,
  onSelect,
  onMenu,
}: {
  tab: Tab;
  events: EventRecord[];
  activeId: string;
  onSelect: (id: string) => void;
  onMenu: () => void;
}) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          className="menu-button icon-button"
          aria-label="Open navigation"
          onClick={onMenu}
        >
          <Menu size={21} />
        </button>
        <span className="breadcrumb">
          Your workspace <span>/</span> <strong>{tab}</strong>
        </span>
      </div>
      <div className="topbar-right">
        <span className="private-badge">
          <span className="online-dot" /> Local-first workspace
        </span>
        <div className="event-select">
          <select
            aria-label="Active event"
            value={activeId}
            onChange={(e) => onSelect(e.target.value)}
          >
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.brief.name}
              </option>
            ))}
          </select>
          <ChevronDown size={15} />
        </div>
        <span className="topbar-sparkle" aria-hidden="true">
          <Sparkles size={20} />
        </span>
      </div>
    </header>
  );
}
