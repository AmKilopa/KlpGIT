import { useEffect, useState } from 'react';
import { api } from '../api';
import type { CommitLogEntry } from '../types';
import { useI18n } from '../i18n';

interface LogModalProps {
  onClose: () => void;
}

export function LogModal({ onClose }: LogModalProps) {
  const { t } = useI18n();
  const [log, setLog] = useState<CommitLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.log(50).then(setLog).catch(() => setLog([])).finally(() => setLoading(false));
  }, []);

  return (
    <div className="overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal log-modal">
        <h2>{t.history}</h2>
        <p className="modal-desc">50 {t.history.toLowerCase()}</p>
        {loading ? (
          <div className="center-screen" style={{ minHeight: 120 }}><div className="spinner" /></div>
        ) : (
          <ul className="log-list">
            {log.length === 0 ? (
              <li className="log-item log-item-empty">{t.noFiles}</li>
            ) : (
              log.map((c) => (
                <li key={c.hash} className="log-item">
                  <span className="log-hash">{c.hash}</span>
                  <span className="log-msg">{c.message}</span>
                  <span className="log-date">{new Date(c.date).toLocaleString()}</span>
                </li>
              ))
            )}
          </ul>
        )}
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>{t.cancel}</button>
        </div>
      </div>
    </div>
  );
}
