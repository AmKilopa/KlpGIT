import { useState } from 'react';
import { GitBranch } from 'lucide-react';
import { useI18n } from '../i18n';

interface InitScreenProps {
  onInit: (remoteUrl?: string) => void;
}

export function InitScreen({ onInit }: InitScreenProps) {
  const { t } = useI18n();
  const [url, setUrl] = useState('');

  return (
    <div className="init-screen">
      <div className="init-logo">
        <GitBranch size={48} strokeWidth={1.5} />
        <h1>KlpGit</h1>
      </div>
      <p>{t.noRepo}</p>
      <input
        className="modal-input"
        placeholder="https://github.com/user/repo.git"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') onInit(url || undefined); }}
      />
      <button className="btn btn-primary" onClick={() => onInit(url || undefined)}>
        {t.initRepo}
      </button>
    </div>
  );
}
