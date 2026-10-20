import type { KeyboardEvent } from 'react';

export function containDialogFocus(event: KeyboardEvent<HTMLDialogElement>) {
  if (event.key !== 'Tab') return;
  const elements = Array.from(
    event.currentTarget.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]',
    ),
  ).filter((element) => element.getClientRects().length > 0);
  const first = elements[0];
  const last = elements.at(-1);
  if (!first || !last) {
    event.preventDefault();
    event.currentTarget.focus();
    return;
  }
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  }
  if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}
