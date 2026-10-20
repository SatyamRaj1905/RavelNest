'use client';

import { Check } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import type { VendorItem } from '@/domain/contracts';

export function VendorNotes({
  vendor,
  onSave,
}: {
  vendor: VendorItem;
  onSave: (notes: string) => void;
}) {
  const [notes, setNotes] = useState(vendor.notes);
  const [saved, setSaved] = useState(false);
  function saveNotes(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSave(notes.trim());
    setSaved(true);
  }
  return (
    <form onSubmit={saveNotes} className="vendor-notes-form">
      <label htmlFor={`notes-${vendor.id}`}>Your shortlist & notes</label>
      <textarea
        id={`notes-${vendor.id}`}
        rows={3}
        maxLength={500}
        value={notes}
        placeholder="Add a name, contact details, or a quote…"
        onChange={(event) => {
          setNotes(event.target.value);
          setSaved(false);
        }}
      />
      <div>
        <span className="vendor-save-status" role="status">
          {saved && (
            <>
              <Check size={13} aria-hidden="true" /> Notes saved
            </>
          )}
        </span>
        <button type="submit" className="view-text-button">
          Save notes
        </button>
      </div>
    </form>
  );
}
