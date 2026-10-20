import {
  ArrowUpRight,
  CalendarDays,
  CircleHelp,
  Flower2,
  Heart,
  LayoutDashboard,
  Lightbulb,
  ListChecks,
  Plus,
  Sparkles,
  Wallet,
  X,
} from 'lucide-react';

import { useMobile } from './use-mobile';

export const tabs = [
  'Overview',
  'My events',
  'Budget',
  'Timeline',
  'Vendors',
  'Inspiration',
] as const;
export type Tab = (typeof tabs)[number];
const icons = {
  Overview: LayoutDashboard,
  'My events': CalendarDays,
  Budget: Wallet,
  Timeline: ListChecks,
  Vendors: Heart,
  Inspiration: Lightbulb,
};

type Props = {
  tab: Tab;
  onTab: (tab: Tab) => void;
  onCreate: () => void;
  onHelp: () => void;
  mobileOpen: boolean;
  onClose: () => void;
};

function Brand() {
  return (
    <a href="/" className="brand">
      <span className="brand-mark">
        <Flower2 size={28} strokeWidth={1.5} />
      </span>
      ravelnest<span className="brand-dot">.</span>
    </a>
  );
}

function NavLinks({
  tab,
  onSelect,
}: {
  tab: Tab;
  onSelect: (tab: Tab) => void;
}) {
  return (
    <nav aria-label="Main navigation">
      {tabs.map((name) => {
        const Icon = icons[name];
        return (
          <button
            key={name}
            className={`nav-link ${tab === name ? 'active' : ''}`}
            aria-current={tab === name ? 'page' : undefined}
            onClick={() => onSelect(name)}
          >
            <Icon size={19} strokeWidth={1.65} />
            <span>{name}</span>
            {name === 'Inspiration' && (
              <span className="nav-new" aria-hidden="true">
                NEW
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}

function SidebarBottom({
  onSelect,
  onHelp,
}: {
  onSelect: (tab: Tab) => void;
  onHelp: () => void;
}) {
  return (
    <div className="sidebar-bottom">
      <div className="sidebar-note">
        <Sparkles size={22} />
        <h3>Big ideas. Little effort.</h3>
        <p>A little AI magic for your next big moment.</p>
        <button onClick={() => onSelect('Inspiration')}>
          Find your inspiration <ArrowUpRight size={16} />
        </button>
      </div>
      <button className="help-link" onClick={onHelp}>
        <CircleHelp size={18} /> A little help
      </button>
      <div className="local-profile">
        <span className="avatar">Y</span>
        <div>
          <strong>Your personal space</strong>
          <span>Saved on this device</span>
        </div>
        <span className="online-dot" />
      </div>
    </div>
  );
}

export function Navigation({
  tab,
  onTab,
  onCreate,
  onHelp,
  mobileOpen,
  onClose,
}: Props) {
  function selectTab(nextTab: Tab) {
    onTab(nextTab);
    onClose();
  }
  const isMobile = useMobile();
  return (
    <>
      <button
        className={`nav-scrim ${mobileOpen ? 'visible' : ''}`}
        aria-label="Close navigation overlay"
        onClick={onClose}
        tabIndex={mobileOpen ? 0 : -1}
      />
      <aside
        className={`sidebar ${mobileOpen ? 'open' : ''}`}
        inert={isMobile && !mobileOpen}
      >
        <Brand />
        <button
          className="mobile-close icon-button"
          aria-label="Close navigation"
          onClick={onClose}
        >
          <X size={20} />
        </button>
        <div className="workspace-label">YOUR PLANNING STUDIO</div>
        <NavLinks tab={tab} onSelect={selectTab} />
        <button className="button primary sidebar-create" onClick={onCreate}>
          <Plus size={17} /> Create event
        </button>
        <SidebarBottom onSelect={selectTab} onHelp={onHelp} />
      </aside>
    </>
  );
}
