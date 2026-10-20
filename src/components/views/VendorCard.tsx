'use client';

import { Store } from 'lucide-react';
import type { EventPlan } from '@/domain/contracts';
import { VendorNotes } from './VendorNotes';

type Vendor = EventPlan['vendors'][number];
type VendorCardProps = {
  vendor: Vendor;
  onStatus: (status: Vendor['status']) => void;
  onNotes: (notes: string) => void;
};

export function VendorCard({ vendor, onStatus, onNotes }: VendorCardProps) {
  function changeStatus(value: string) {
    if (value === 'to-contact' || value === 'contacted' || value === 'booked')
      onStatus(value);
  }
  return (
    <article className="vendor-card">
      <header>
        <span className="vendor-icon">
          <Store size={21} aria-hidden="true" />
        </span>
        <span className={`vendor-status status-${vendor.status}`}>
          {vendor.status === 'to-contact' ? 'To contact' : vendor.status}
        </span>
      </header>
      <h3>{vendor.category}</h3>
      <p className="vendor-description">{vendor.description}</p>
      <label className="vendor-status-label" htmlFor={`status-${vendor.id}`}>
        Planning status
      </label>
      <select
        id={`status-${vendor.id}`}
        value={vendor.status}
        onChange={(event) => changeStatus(event.target.value)}
      >
        <option value="to-contact">To contact</option>
        <option value="contacted">Contacted</option>
        <option value="booked">Booked</option>
      </select>
      <VendorNotes vendor={vendor} onSave={onNotes} />
    </article>
  );
}
