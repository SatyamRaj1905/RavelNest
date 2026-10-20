import { Search } from 'lucide-react';

type VendorToolbarProps = {
  query: string;
  status: string;
  visible: number;
  total: number;
  onQuery: (value: string) => void;
  onStatus: (value: string) => void;
};

export function VendorToolbar({
  query,
  status,
  visible,
  total,
  onQuery,
  onStatus,
}: VendorToolbarProps) {
  return (
    <div className="vendor-toolbar">
      <div className="view-search">
        <Search size={18} aria-hidden="true" />
        <label className="sr-only" htmlFor="vendor-search">
          Search vendor checklist
        </label>
        <input
          id="vendor-search"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="Search categories or your notes…"
        />
      </div>
      <label className="sr-only" htmlFor="vendor-status-filter">
        Filter vendor status
      </label>
      <select
        id="vendor-status-filter"
        value={status}
        onChange={(e) => onStatus(e.target.value)}
      >
        <option value="all">All statuses</option>
        <option value="to-contact">To contact</option>
        <option value="contacted">Contacted</option>
        <option value="booked">Booked</option>
      </select>
      <span className="vendor-count">
        {visible} of {total} categories
      </span>
    </div>
  );
}
