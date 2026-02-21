import { CheckCircle, AlertCircle, Info } from 'lucide-react';
import type { Toast } from '../types';

const ICONS = {
  ok: <CheckCircle size={15} />,
  error: <AlertCircle size={15} />,
  info: <Info size={15} />,
};

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: number) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast toast-${t.type}`}
          onClick={() => onRemove(t.id)}
        >
          {ICONS[t.type]}
          {t.message}
        </div>
      ))}
    </div>
  );
}
