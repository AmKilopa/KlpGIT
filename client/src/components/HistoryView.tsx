import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { ArrowLeft, GitCommit, Calendar, FileDiff, FilePlus, FileMinus, Copy, Folder, FolderOpen } from 'lucide-react';
import { api } from '../api';
import type { CommitLogEntry, CommitDetail } from '../types';
import { useI18n, type Translations } from '../i18n';
import { LOG_PAGE_SIZE } from '../constants';

interface HistoryViewProps {
  onBack: () => void;
}

function fileStatusIcon(status: string) {
  if (status === 'A' || status.startsWith('A')) return <FilePlus size={14} />;
  if (status === 'D' || status.startsWith('D')) return <FileMinus size={14} />;
  return <FileDiff size={14} />;
}

function fileStatusLabel(status: string, t: Translations) {
  if (status === 'A' || status.startsWith('A')) return t.fileStatusAdded;
  if (status === 'D' || status.startsWith('D')) return t.fileStatusDeleted;
  return t.fileStatusModified;
}

function authorInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase() || '?';
}

function relativeTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const sec = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (sec < 60) return '1 min';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} h`;
  const day = Math.floor(h / 24);
  if (day < 30) return `${day} d`;
  return d.toLocaleDateString();
}

interface TreeNode {
  name: string;
  path?: string;
  status?: string;
  children: Map<string, TreeNode>;
}

function buildFileTree(files: { path: string; status: string }[]): TreeNode {
  const root: TreeNode = { name: '', children: new Map() };
  for (const { path, status } of files) {
    const parts = path.split('/');
    let node = root;
    for (let i = 0; i < parts.length; i++) {
      const key = parts[i];
      const isFile = i === parts.length - 1;
      if (!node.children.has(key)) {
        node.children.set(key, {
          name: key,
          ...(isFile ? { path, status } : {}),
          children: new Map(),
        });
      }
      node = node.children.get(key)!;
    }
  }
  return root;
}

function CommitDiffViewer({ diff }: { diff: string }) {
  const lines = diff.split('\n');
  let addCount = 0;
  let delCount = 0;
  let lineNum = 0;
  const rows = lines.map((line, i) => {
    let cls = '';
    let sign = '\u00A0';
    if (line.startsWith('+') && !line.startsWith('+++')) {
      cls = 'dl-add'; sign = '+'; addCount++; lineNum++;
    } else if (line.startsWith('-') && !line.startsWith('---')) {
      cls = 'dl-del'; sign = '\u2212'; delCount++;
    } else if (line.startsWith('@@')) {
      cls = 'dl-hunk'; sign = '\u00A0';
      const m = line.match(/@@ -\d+,?\d* \+(\d+)/);
      if (m) lineNum = parseInt(m[1], 10) - 1;
    } else if (line.startsWith('diff ') || line.startsWith('index ') || line.startsWith('---') || line.startsWith('+++')) {
      cls = 'dl-meta'; sign = '\u00A0';
    } else {
      lineNum++;
    }
    const num = cls === 'dl-hunk' || cls === 'dl-meta' ? '' : lineNum;
    const codeText = (cls === 'dl-add' || cls === 'dl-del') ? (line.slice(1) || '\u00A0') : (line || '\u00A0');
    return (
      <div key={i} className={`dl ${cls}`}>
        <div className="dl-num">{num}</div>
        <div className="dl-sign">{sign}</div>
        <div className="dl-code">{codeText}</div>
      </div>
    );
  });
  return (
    <>
      <div className="content-stats">
        <span className="stat-add">+{addCount}</span>
        <span className="stat-del">&minus;{delCount}</span>
      </div>
      <div className="diff-body">{rows}</div>
    </>
  );
}

function FileTree({
  root,
  filter,
  expanded,
  onToggle,
  onSelectFile,
  selectedPath,
  t,
}: {
  root: TreeNode;
  filter: string;
  expanded: Set<string>;
  onToggle: (path: string) => void;
  onSelectFile: (path: string) => void;
  selectedPath: string | null;
  t: Translations;
}) {
  const q = filter.trim().toLowerCase();
  function hasMatchingFile(n: TreeNode): boolean {
    if (n.path && n.path.toLowerCase().includes(q)) return true;
    for (const ch of n.children.values()) if (hasMatchingFile(ch)) return true;
    return false;
  }
  function renderNode(node: TreeNode, path: string, depth: number): React.ReactNode[] {
    const out: React.ReactNode[] = [];
    const entries = Array.from(node.children.entries()).sort((a, b) => {
      const aIsDir = a[1].children.size > 0;
      const bIsDir = b[1].children.size > 0;
      if (aIsDir !== bIsDir) return aIsDir ? -1 : 1;
      return a[0].localeCompare(b[0]);
    });
    for (const [key, child] of entries) {
      const childPath = path ? path + '/' + key : key;
      const isDir = child.children.size > 0;
      if (isDir) {
        if (q && !hasMatchingFile(child)) continue;
        const isExp = expanded.has(childPath);
        out.push(
          <div key={childPath}>
            <button
              type="button"
              className="history-tree-folder"
              style={{ paddingLeft: 12 + depth * 12 }}
              onClick={() => onToggle(childPath)}
            >
              {isExp ? <FolderOpen size={14} /> : <Folder size={14} />}
              <span>{key}</span>
            </button>
            {isExp && renderNode(child, childPath, depth + 1)}
          </div>
        );
      } else if (child.path) {
        if (q && !child.path.toLowerCase().includes(q)) continue;
        out.push(
          <button
            key={child.path}
            type="button"
            className={`history-tree-file${selectedPath === child.path ? ' selected' : ''}`}
            style={{ paddingLeft: 12 + depth * 12 }}
            onClick={() => onSelectFile(child.path!)}
          >
            {fileStatusIcon(child.status!)}
            <span className="history-tree-file-name">{key}</span>
          </button>
        );
      }
    }
    return out;
  }

  return <div className="history-tree">{renderNode(root, '', 0)}</div>;
}

export function HistoryView({ onBack }: HistoryViewProps) {
  const { t } = useI18n();
  const [log, setLog] = useState<CommitLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedHash, setSelectedHash] = useState<string | null>(null);
  const [detail, setDetail] = useState<CommitDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [fileFilter, setFileFilter] = useState('');
  const [treeExpanded, setTreeExpanded] = useState<Set<string>>(new Set());
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileDiff, setFileDiff] = useState('');
  const [fileDiffLoading, setFileDiffLoading] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);

  useEffect(() => {
    api.log(LOG_PAGE_SIZE).then(setLog).catch(() => setLog([])).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedHash) {
      setDetail(null);
      setSelectedFile(null);
      setFileDiff('');
      return;
    }
    setDetailLoading(true);
    setSelectedFile(null);
    setFileDiff('');
    api.commit(selectedHash).then((d) => {
      setDetail(d);
      if (d.files.length > 0) {
        const next = new Set<string>();
        d.files.forEach((f) => {
          const parts = f.path.split('/');
          for (let i = 1; i < parts.length; i++) next.add(parts.slice(0, i).join('/'));
        });
        setTreeExpanded(next);
      }
    }).catch(() => setDetail(null)).finally(() => setDetailLoading(false));
  }, [selectedHash]);

  const loadFileDiff = useCallback((hash: string, path: string) => {
    setSelectedFile(path);
    setFileDiffLoading(true);
    setFileDiff('');
    api.commitDiff(hash, path).then((r) => setFileDiff(r.diff)).catch(() => setFileDiff('')).finally(() => setFileDiffLoading(false));
  }, []);

  useEffect(() => {
    if (detail && selectedFile && selectedHash) loadFileDiff(selectedHash, selectedFile);
  }, [detail, selectedFile, selectedHash, loadFileDiff]);

  const copyHash = useCallback(() => {
    if (!detail) return;
    navigator.clipboard.writeText(detail.hash).then(() => {
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 1500);
    });
  }, [detail]);

  const toggleFolder = useCallback((path: string) => {
    setTreeExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path); else next.add(path);
      return next;
    });
  }, []);

  const fileTree = useMemo(() => detail ? buildFileTree(detail.files) : null, [detail]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedHash) setSelectedHash(null);
        else onBack();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [selectedHash, onBack]);

  return (
    <div className="history-view">
      <div className="history-header">
        <button type="button" className="btn btn-ghost history-back" onClick={onBack}>
          <ArrowLeft size={16} />
          {t.historyBack}
        </button>
        <h1 className="history-title">{t.history}</h1>
      </div>
      <div className="history-body">
        <div className="history-list-wrap">
          {loading ? (
            <div className="history-loading"><div className="spinner" /></div>
          ) : log.length === 0 ? (
            <p className="history-empty">{t.noFiles}</p>
          ) : (
            <ul className="history-list">
              {log.map((c) => (
                <li
                  key={c.hash}
                  className={`history-item${selectedHash === c.hash ? ' selected' : ''}`}
                  onClick={() => setSelectedHash(c.hash)}
                >
                  <span className="history-item-icon"><GitCommit size={16} /></span>
                  <span className="history-item-hash">{c.hash}</span>
                  <span className="history-item-msg">{c.message}</span>
                  <span className="history-item-meta">
                    {c.author && (
                      <>
                        {c.avatarUrl ? (
                          <img src={c.avatarUrl} alt="" className="history-item-avatar" title={c.author} />
                        ) : null}
                        <span className="history-item-author">{c.author}</span>
                      </>
                    )}
                    <span className="history-item-date">{new Date(c.date).toLocaleString()}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="history-detail-wrap">
          {!selectedHash && (
            <p className="history-detail-placeholder">{t.selectFileHint}</p>
          )}
          {selectedHash && detailLoading && (
            <div className="history-detail-loading"><div className="spinner" /></div>
          )}
          {selectedHash && detail && !detailLoading && (
            <div className="history-commit-page">
              <div className="history-commit-header">
                <div className="history-commit-title-row">
                  <h2 className="history-commit-title">{t.commitDetail} {detail.hash}</h2>
                  <button type="button" className="btn btn-ghost history-copy-hash" onClick={copyHash} title={t.copy}>
                    <Copy size={14} />
                    {copiedHash ? t.copied : detail.hash}
                  </button>
                </div>
                <div className="history-commit-meta-row">
                  {detail.author && (
                    <span className="history-detail-author">
                      {detail.avatarUrl ? (
                        <img src={detail.avatarUrl} alt="" className="history-detail-avatar-img" title={detail.author} />
                      ) : (
                        <span className="history-detail-avatar" title={detail.author}>{authorInitials(detail.author)}</span>
                      )}
                      {detail.author}
                    </span>
                  )}
                  <span className="history-commit-ago">
                    {t.committedAgo} {relativeTime(detail.date)}
                  </span>
                  {detail.parentHash && (
                    <span className="history-commit-parent">
                      {t.parentCommit} {detail.parentHash}
                    </span>
                  )}
                </div>
                <pre className="history-commit-message">{(detail.fullMessage ?? detail.message).trim()}</pre>
                {detail.stats && (
                  <div className="history-commit-stats">
                    <span className="history-commit-stats-files">{detail.stats.filesChanged} {t.filesChanged}</span>
                    <span className="stat-add">+{detail.stats.insertions}</span>
                    <span className="stat-del">−{detail.stats.deletions}</span>
                  </div>
                )}
              </div>
              <div className="history-commit-panes">
                <div className="history-commit-files-pane">
                  <input
                    type="text"
                    className="history-tree-filter"
                    placeholder={t.filterFiles}
                    value={fileFilter}
                    onChange={(e) => setFileFilter(e.target.value)}
                  />
                  {fileTree && (
                    <FileTree
                      root={fileTree}
                      filter={fileFilter}
                      expanded={treeExpanded}
                      onToggle={toggleFolder}
                      onSelectFile={(path) => setSelectedFile(path)}
                      selectedPath={selectedFile}
                      t={t}
                    />
                  )}
                </div>
                <div className="history-commit-diff-pane">
                  {!selectedFile && (
                    <p className="history-detail-placeholder">{t.selectFileHint}</p>
                  )}
                  {selectedFile && fileDiffLoading && (
                    <div className="history-detail-loading"><div className="spinner" /></div>
                  )}
                  {selectedFile && !fileDiffLoading && (
                    <>
                      <div className="history-diff-file-header">{selectedFile}</div>
                      <CommitDiffViewer diff={fileDiff} />
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
