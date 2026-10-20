'use client';

import { Info } from 'lucide-react';
import { useState } from 'react';
import { updateVendor } from '@/domain/plan-updates';
import type { EventPlan } from '@/domain/contracts';
import type { PlanViewProps } from './types';
import { ViewHeading } from './ViewHeading';
import { VendorCard } from './VendorCard';
import { EmptyView } from './EmptyView';
import { VendorToolbar } from './VendorToolbar';

type VendorStatus = EventPlan['vendors'][number]['status'];

export function VendorsView({ event, onUpdate }: PlanViewProps) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const { vendors } = event.plan;
  const search = query.trim().toLowerCase();
  const visible = vendors.filter(
    (vendor) =>
      (status === 'all' || vendor.status === status) &&
      `${vendor.category} ${vendor.description} ${vendor.notes}`
        .toLowerCase()
        .includes(search),
  );
  function setStatusFor(id: string, nextStatus: VendorStatus) {
    onUpdate(updateVendor(event.plan, id, { status: nextStatus }));
  }
  function setNotes(id: string, notes: string) {
    onUpdate(updateVendor(event.plan, id, { notes }));
  }
  return (
    <section className="workspace-view" aria-label="Vendor checklist">
      <ViewHeading
        eyebrow="The people behind the magic"
        title="Find your celebration team."
        description="Keep the right conversations, quotes, and decisions in one happy place."
      />
      <p className="view-info-note">
        <Info size={16} aria-hidden="true" />
        This is your vendor checklist. Add your own real contacts and compare
        quotes before booking.
      </p>
      <VendorToolbar
        query={query}
        status={status}
        visible={visible.length}
        total={vendors.length}
        onQuery={setQuery}
        onStatus={setStatus}
      />
      {visible.length ? (
        <div className="vendor-grid">
          {visible.map((vendor) => (
            <VendorCard
              key={`${event.id}-${vendor.id}`}
              vendor={vendor}
              onStatus={(value) => setStatusFor(vendor.id, value)}
              onNotes={(value) => setNotes(vendor.id, value)}
            />
          ))}
        </div>
      ) : (
        <EmptyView
          title="No matches just yet."
          description="Try another search or choose a different planning status."
        />
      )}
    </section>
  );
}
