import { useState, useRef, useEffect } from 'react';
import { GitBranch, RefreshCw, Send, Unlink, History, Archive, ArchiveRestore, ChevronDown } from 'lucide-react';
import type { GitStatus } from '../types';
import { useI18n } from '../i18n';

interface ToolbarProps {
  status: GitStatus;
  branches: string[];
  onRefresh: () => void;
  onSubmit: () => void;
  onDisconnect: () => void;
  onCheckout: (branch: string) => void;
  onStashSave: () => void;
  onStashPop: () => void;
  onHistory: () => void;
  stashCount: number;
}

export function Toolbar({ status, branches, onRefresh, onSubmit, onDisconnect, onCheckout, onStashSave, onStashPop, onHistory, stashCount }: ToolbarProps) {
  const { t } = useI18n();
  const [branchOpen, setBranchOpen] = useState(false);
  const branchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onOutside = (e: MouseEvent) => {
      if (branchRef.current && !branchRef.current.contains(e.target as Node)) setBranchOpen(false);
    };
    document.addEventListener('click', onOutside);
    return () => document.removeEventListener('click', onOutside);
  }, []);

  return (
    <div className="toolbar">
      <span className="tool-logo">KlpGit</span>
      <div className="tool-sep" />
      <div className="tool-branch-wrap" ref={branchRef}>
        <button type="button" className="tool-branch-btn" onClick={() => setBranchOpen(!branchOpen)}>
          <GitBranch size={12} />
          {status.branch}
          <ChevronDown size={12} className={branchOpen ? 'open' : ''} />
        </button>
        {branchOpen && (
          <div className="tool-branch-drop">
            {branches.filter(b => b !== status.branch).map((b) => (
              <button type="button" key={b} className="tool-branch-opt" onClick={() => { onCheckout(b); setBranchOpen(false); }}>{b}</button>
            ))}
            {branches.length <= 1 && <span className="tool-branch-empty">{t.noFiles}</span>}
          </div>
        )}
      </div>
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
        <button type="button" className="btn btn-ghost" onClick={onHistory} title={t.history}>
          <History size={14} />
        </button>
        {status.total > 0 && (
          <button type="button" className="btn btn-ghost" onClick={onStashSave} title={t.stashSave}>
            <Archive size={14} />
          </button>
        )}
        {stashCount > 0 && (
          <button type="button" className="btn btn-ghost" onClick={onStashPop} title={t.stashPop}>
            <ArchiveRestore size={14} />
          </button>
        )}
        {status.remoteUrl && (
          <button type="button" className="btn btn-ghost btn-danger" onClick={onDisconnect}>
            <Unlink size={14} />
            {t.unlinkRepo}
          </button>
        )}
        <button type="button" className="btn btn-ghost" onClick={onRefresh}>
          <RefreshCw size={14} />
          {t.refresh}
        </button>
        <button type="button" className="btn btn-primary" onClick={onSubmit}>
          <Send size={14} />
          {t.submit}
        </button>
      </div>
    </div>
  );
}
