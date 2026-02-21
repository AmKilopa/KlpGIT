import { useState, useEffect, useRef } from 'react';
import { Package, ListChecks, Layers, Loader2 } from 'lucide-react';
import { useI18n } from '../i18n';

interface SubmitModalProps {
  modal: 'select' | 'message';
  subMode: 'all' | 'checked' | 'staged';
  checkedCount: number;
  loading: boolean;
  onClose: () => void;
  onModeChange: (mode: 'all' | 'checked' | 'staged') => void;
  onNext: () => void;
  onBack: () => void;
  onSubmit: (message: string) => void;
}

export function SubmitModal({
  modal, subMode, checkedCount, loading,
  onClose, onModeChange, onNext, onBack, onSubmit,
}: SubmitModalProps) {
  const { t } = useI18n();
  const [message, setMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (modal === 'message') {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [modal]);

  const handleSubmit = () => {
    const msg = message.trim();
    if (msg) onSubmit(msg);
  };

  const options = [
    { key: 'all' as const, icon: <Package size={18} />, label: t.addAll, desc: t.addAllDesc },
    { key: 'checked' as const, icon: <ListChecks size={18} />, label: `${t.addChecked} (${checkedCount})`, desc: t.addCheckedDesc },
    { key: 'staged' as const, icon: <Layers size={18} />, label: t.commitStaged, desc: t.commitStagedDesc },
  ];

  return (
    <div className="overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        {modal === 'select' ? (
          <>
            <h2>{t.submitChanges}</h2>
            <p className="modal-desc">{t.chooseCommit}</p>
            {options.map((opt) => (
              <div
                key={opt.key}
                className={`modal-option${subMode === opt.key ? ' active' : ''}`}
                onClick={() => onModeChange(opt.key)}
              >
                <div className="modal-option-icon">{opt.icon}</div>
                <div>
                  <div className="modal-option-label">{opt.label}</div>
                  <div className="modal-option-desc">{opt.desc}</div>
                </div>
              </div>
            ))}
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={onClose}>{t.cancel}</button>
              <button className="btn btn-primary" onClick={onNext}>{t.next} &rarr;</button>
            </div>
          </>
        ) : (
          <>
            <h2>{t.commitMessage}</h2>
            <p className="modal-desc">{t.commitMessageHint}</p>
            <input
              ref={inputRef}
              className="modal-input"
              placeholder={t.commitPlaceholder}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !loading) handleSubmit();
                if (e.key === 'Escape') onClose();
              }}
            />
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={onBack}>&larr; {t.back}</button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
                {loading && <Loader2 size={14} className="spin" />}
                {loading ? t.pushing : t.commitAndPush}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
