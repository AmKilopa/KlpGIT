import { useState } from 'react';
import { useI18n } from '../i18n';

const CONFIRM_PREFIX = 'отвязать ';

interface DisconnectConfirmModalProps {
  repoName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DisconnectConfirmModal({ repoName, onConfirm, onCancel }: DisconnectConfirmModalProps) {
  const { t } = useI18n();
  const [value, setValue] = useState('');
  const expected = CONFIRM_PREFIX + repoName;
  const canConfirm = value === expected;

  return (
    <div className="overlay" onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{t.disconnectConfirm}</h2>
        <p className="modal-desc">{t.disconnectTypePrompt}</p>
        <p className="modal-hint">
          {CONFIRM_PREFIX}<strong>{repoName}</strong>
        </p>
        <input
          type="text"
          className="modal-input"
          placeholder={t.disconnectTypePlaceholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onPaste={(e) => e.preventDefault()}
          autoFocus
          autoComplete="off"
        />
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onCancel}>{t.cancel}</button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={onConfirm}
            disabled={!canConfirm}
          >
            {t.unlinkRepo}
          </button>
        </div>
      </div>
    </div>
  );
}
