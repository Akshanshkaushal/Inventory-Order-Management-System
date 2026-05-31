import { AlertTriangle } from 'lucide-react';

import Button from './Button.jsx';
import Modal from './Modal.jsx';

export default function ConfirmDialog({ open, title, message, confirmLabel = 'Delete', onConfirm, onClose }) {
  return (
    <Modal open={open} title={title} onClose={onClose}>
      <div className="flex gap-3 rounded-md border border-amber-200 bg-amber-50 p-4">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-white text-amber-700 shadow-sm">
          <AlertTriangle className="h-4 w-4" />
        </span>
        <div>
          <p className="text-sm font-medium text-ink">Please confirm this change</p>
          <p className="mt-1 text-sm leading-6 text-slate-600">{message}</p>
        </div>
      </div>
      <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onClose}>
          Keep record
        </Button>
        <Button variant="danger" onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
