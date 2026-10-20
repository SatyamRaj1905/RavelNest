import { currencies, EVENT_LIMITS, type EventBrief } from '@/domain/contracts';
import { localCalendarDate } from '@/domain/format';

type FieldProps = { initial?: EventBrief | undefined };

export function EventDetails({ initial }: FieldProps) {
  return (
    <>
      <label className="field">
        Event name
        <input
          name="name"
          placeholder="e.g. Our garden wedding"
          maxLength={EVENT_LIMITS.nameLength}
          required
          defaultValue={initial?.name}
        />
      </label>
      <div className="field-grid">
        <label className="field">
          Event type
          <select name="type" defaultValue={initial?.type ?? 'wedding'}>
            <option value="wedding">Wedding</option>
            <option value="birthday">Birthday</option>
            <option value="community">Community event</option>
          </select>
        </label>
        <label className="field">
          Event date
          <input
            name="date"
            type="date"
            min={localCalendarDate()}
            max={EVENT_LIMITS.maxDate}
            required
            defaultValue={initial?.date}
          />
        </label>
      </div>
      <div className="field-grid">
        <label className="field">
          Guests
          <input
            name="guests"
            type="number"
            min={EVENT_LIMITS.minGuests}
            max={EVENT_LIMITS.maxGuests}
            defaultValue={initial?.guests ?? 100}
            required
          />
        </label>
        <label className="field">
          Location
          <input
            name="location"
            maxLength={EVENT_LIMITS.locationLength}
            placeholder="e.g. Jaipur, India"
            required
            defaultValue={initial?.location}
          />
        </label>
      </div>
    </>
  );
}

export function EventPreferences({ initial }: FieldProps) {
  return (
    <>
      <div className="field-grid">
        <label className="field">
          Total budget
          <input
            name="budget"
            type="number"
            min={EVENT_LIMITS.minBudget}
            max={EVENT_LIMITS.maxBudget}
            defaultValue={initial?.budget ?? 250000}
            required
          />
        </label>
        <label className="field">
          Currency
          <select name="currency" defaultValue={initial?.currency ?? 'INR'}>
            {currencies.map((currency) => (
              <option key={currency}>{currency}</option>
            ))}
          </select>
        </label>
      </div>
      <label className="field">
        Your vision <span className="field-optional">(optional)</span>
        <textarea
          name="preferences"
          placeholder="An intimate garden celebration, earthy colors, vegetarian food… tell us what feels like you."
          maxLength={EVENT_LIMITS.directionLength}
          rows={3}
          defaultValue={initial?.preferences}
        />
      </label>
      <p className="form-hint">
        Share the feeling, skip the sensitive details. Review every suggestion
        before saving.
      </p>
    </>
  );
}
