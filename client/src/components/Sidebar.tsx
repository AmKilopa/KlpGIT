import { Folder, FolderOpen, Check } from 'lucide-react';
import type { TreeEntry, GitStatus } from '../types';
import { useI18n } from '../i18n';
import { FileIcon } from './FileIcon';

interface SidebarProps {
  tree: TreeEntry[];
  status: GitStatus;
  selectedFile: string | null;
  checked: Set<string>;
  expanded: Set<string>;
  search: string;
  onSearch: (q: string) => void;
  onSelectFile: (path: string) => void;
  onToggleDir: (path: string) => void;
  onToggleCheck: (path: string) => void;
}

const STATUS_LABELS: Record<string, string> = {
  modified: 'M', untracked: 'U', deleted: 'D', staged: 'S',
};

function filterTree(nodes: TreeEntry[], query: string): TreeEntry[] {
  if (!query) return nodes;
  const q = query.toLowerCase();
  return nodes.reduce<TreeEntry[]>((acc, node) => {
    if (node.type === 'dir') {
      const filtered = filterTree(node.children || [], query);
      if (filtered.length) acc.push({ ...node, children: filtered });
    } else if (
      node.name.toLowerCase().includes(q) ||
      node.path.toLowerCase().includes(q)
    ) {
      acc.push(node);
    }
    return acc;
  }, []);
}

interface FileTreeProps {
  entries: TreeEntry[];
  depth: number;
  fileStatusMap: Record<string, string>;
  selectedFile: string | null;
  checked: Set<string>;
  expanded: Set<string>;
  onSelectFile: (path: string) => void;
  onToggleDir: (path: string) => void;
  onToggleCheck: (path: string) => void;
}

function FileTree({
  entries, depth, fileStatusMap, selectedFile, checked, expanded,
  onSelectFile, onToggleDir, onToggleCheck,
}: FileTreeProps) {
  return (
    <>
      {entries.map((entry) => {
        const isDir = entry.type === 'dir';
        const isExpanded = expanded.has(entry.path);
        const isSelected = selectedFile === entry.path;
        const isChecked = checked.has(entry.path);
        const st = fileStatusMap[entry.path];
        const label = st ? STATUS_LABELS[st] ?? '' : '';

        return (
          <div key={entry.path}>
            <div
              className={`fi${isSelected ? ' sel' : ''}${isDir ? ' fi-dir' : ''}`}
              style={{ paddingLeft: 12 + depth * 16 }}
              onClick={() => (isDir ? onToggleDir(entry.path) : onSelectFile(entry.path))}
            >
              {isDir ? (
                <>
                  <div className="fi-icon">
                    {isExpanded ? <FolderOpen size={14} /> : <Folder size={14} />}
                  </div>
                  <span className="fi-name">{entry.name}</span>
                </>
              ) : (
                <>
                  <div
                    className={`fi-check${isChecked ? ' on' : ''}`}
                    onClick={(e) => { e.stopPropagation(); onToggleCheck(entry.path); }}
                  >
                    {isChecked && <Check size={9} />}
                  </div>
                  <div className="fi-icon">
                    <FileIcon name={entry.name} />
                  </div>
                  <span className="fi-name">{entry.name}</span>
                  {label && <span className={`fi-badge fi-badge-${label}`}>{label}</span>}
                </>
              )}
            </div>
            {isDir && isExpanded && entry.children && (
              <FileTree
                entries={entry.children} depth={depth + 1}
                fileStatusMap={fileStatusMap} selectedFile={selectedFile}
                checked={checked} expanded={expanded}
                onSelectFile={onSelectFile} onToggleDir={onToggleDir}
                onToggleCheck={onToggleCheck}
              />
            )}
          </div>
        );
      })}
    </>
  );
}

export function Sidebar({
  tree, status, selectedFile, checked, expanded, search,
  onSearch, onSelectFile, onToggleDir, onToggleCheck,
}: SidebarProps) {
  const { t } = useI18n();
  const fileStatusMap: Record<string, string> = {};
  for (const f of status.files) fileStatusMap[f.path] = f.status;

  const filtered = filterTree(tree, search);
  const checkedCount = checked.size;

  return (
    <div className="sidebar">
      <div className="sb-head">
        <span>
          {t.explorer}
          {checkedCount > 0 && <span className="sb-count">{checkedCount} {t.checked}</span>}
        </span>
        <span className="sb-count">{status.total || 0}</span>
      </div>
      <div className="sb-search">
        <input
          id="search-input"
          placeholder={t.searchFiles}
          value={search}
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>
      <div className="file-list">
        {filtered.length > 0 ? (
          <FileTree
            entries={filtered} depth={0} fileStatusMap={fileStatusMap}
            selectedFile={selectedFile} checked={checked} expanded={expanded}
            onSelectFile={onSelectFile} onToggleDir={onToggleDir}
            onToggleCheck={onToggleCheck}
          />
        ) : (
          <div className="file-list-empty">{t.noFiles}</div>
        )}
      </div>
    </div>
  );
}
