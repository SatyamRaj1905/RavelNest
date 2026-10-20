import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { containDialogFocus } from './dialog-focus';

export function Dialog({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    const trigger = document.activeElement;
    dialog?.showModal();
    return () => {
      dialog?.close();
      queueMicrotask(() => {
        if (trigger instanceof HTMLElement && trigger.isConnected)
          trigger.focus();
      });
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="dialog"
      aria-labelledby="dialog-title"
      onCancel={onClose}
      onKeyDown={containDialogFocus}
    >
      <div className="dialog-top">
        <div>
          <p className="eyebrow">LET’S MAKE IT HAPPEN</p>
          <h2 id="dialog-title">{title}</h2>
        </div>
        <button
          className="icon-button"
          aria-label="Close dialog"
          onClick={onClose}
        >
          <X size={21} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
