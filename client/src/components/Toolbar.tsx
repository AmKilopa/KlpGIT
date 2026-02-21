import { GitBranch, RefreshCw, Send, Unlink } from 'lucide-react';
import type { GitStatus } from '../types';
import { useI18n } from '../i18n';

interface ToolbarProps {
  status: GitStatus;
  onRefresh: () => void;
  onSubmit: () => void;
  onDisconnect: () => void;
}

export function Toolbar({ status, onRefresh, onSubmit, onDisconnect }: ToolbarProps) {
  const { t } = useI18n();

  return (
    <div className="toolbar">
      <span className="tool-logo">KlpGit</span>
      <div className="tool-sep" />
      <span className="tool-branch">
        <GitBranch size={12} />
        {status.branch}
      </span>
      <div className="tool-badges">
        {status.staged > 0 && (
          <span className="badge badge-staged">{status.staged} {t.staged}</span>
        )}
        {status.modified > 0 && (
          <span className="badge badge-changed">{status.modified} {t.changed}</span>
        )}
        {status.total === 0 && (
          <span className="badge badge-clean">{t.clean}</span>
        )}
      </div>
      <div className="tool-actions">
        {status.remoteUrl && (
          <button className="btn btn-ghost btn-danger" onClick={onDisconnect}>
            <Unlink size={14} />
            {t.unlinkRepo}
          </button>
        )}
        <button className="btn btn-ghost" onClick={onRefresh}>
          <RefreshCw size={14} />
          {t.refresh}
        </button>
        <button className="btn btn-primary" onClick={onSubmit}>
          <Send size={14} />
          {t.submit}
        </button>
      </div>
    </div>
  );
}
