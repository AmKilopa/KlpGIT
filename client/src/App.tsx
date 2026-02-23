import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from './api';
import type { GitStatus, TreeEntry, ProjectInfo, Toast } from './types';
import { I18nProvider, useI18n } from './i18n';
import { Titlebar } from './components/Titlebar';
import { Toolbar } from './components/Toolbar';
import { Sidebar } from './components/Sidebar';
import { Content } from './components/Content';
import { SubmitModal } from './components/Modal';
import { LogModal } from './components/LogModal';
import { ToastContainer } from './components/Toast';
import { InitScreen } from './components/InitScreen';

function AppInner() {
  const { t } = useI18n();
  const [info, setInfo] = useState<ProjectInfo | null>(null);
  const [status, setStatus] = useState<GitStatus | null>(null);
  const [tree, setTree] = useState<TreeEntry[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [diff, setDiff] = useState('');
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'diff' | 'source' | 'checks'>('diff');
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<'select' | 'message' | null>(null);
  const [subMode, setSubMode] = useState<'all' | 'checked' | 'staged'>('all');
  const [loading, setLoading] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => (localStorage.getItem('klpgit-theme') as 'dark' | 'light') || 'dark');
  const [branches, setBranches] = useState<string[]>([]);
  const [stashList, setStashList] = useState<unknown[]>([]);
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  const selectedFileRef = useRef(selectedFile);
  useEffect(() => { selectedFileRef.current = selectedFile; }, [selectedFile]);

  const addToast = useCallback((message: string, type: Toast['type'] = 'ok') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('klpgit-theme', theme);
  }, [theme]);

  useEffect(() => {
    (async () => {
      try {
        const infoData = await api.info();
        setInfo(infoData);
        if (infoData.hasGit) {
          const [s, tr] = await Promise.all([api.status(), api.tree()]);
          setStatus(s);
          setTree(tr);
        }
      } catch (err: unknown) {
        addToast(err instanceof Error ? err.message : 'Failed to connect', 'error');
      }
    })();
  }, [addToast]);

  useEffect(() => {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      setWsConnected(true);
      return;
    }
    let ws: WebSocket;
    let timer: number;
    const connect = () => {
      ws = new WebSocket(`ws://${location.host}/ws`);
      ws.onopen = () => setWsConnected(true);
      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg.event === 'status') setStatus(msg.data);
        } catch {}
      };
      ws.onclose = () => {
        setWsConnected(false);
        timer = window.setTimeout(connect, 2000);
      };
    };
    connect();
    return () => { ws?.close(); clearTimeout(timer); };
  }, []);

  const selectFile = useCallback(async (path: string) => {
    setSelectedFile(path);
    try {
      const [diffData, fileData] = await Promise.all([api.diff(path), api.file(path)]);
      setDiff(diffData.diff);
      setFileContent(fileData.content);
      setViewMode(diffData.diff ? 'diff' : 'source');
    } catch {
      try {
        const fileData = await api.file(path);
        setFileContent(fileData.content);
        setDiff('');
        setViewMode('source');
      } catch {
        setDiff('');
        setFileContent(null);
      }
    }
  }, []);

  const toggleDir = useCallback((path: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path); else next.add(path);
      return next;
    });
  }, []);

  const toggleCheck = useCallback((path: string) => {
    setChecked(prev => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path); else next.add(path);
      return next;
    });
  }, []);

  const refresh = useCallback(async () => {
    try {
      const [s, tr] = await Promise.all([api.status(), api.tree()]);
      setStatus(s);
      setTree(tr);
      if (selectedFileRef.current) selectFile(selectedFileRef.current);
      try {
        const br = await api.branches();
        setBranches(br.all || []);
      } catch {}
      try {
        const st = await api.stash();
        setStashList(Array.isArray(st) ? st : []);
      } catch {}
      addToast(t.refreshed, 'info');
    } catch (err: unknown) {
      addToast(err instanceof Error ? err.message : 'Failed', 'error');
    }
  }, [selectFile, addToast, t]);

  useEffect(() => {
    if (!status?.branch) return;
    api.branches().then((br) => setBranches(br.all || [])).catch(() => {});
    api.stash().then((st) => setStashList(Array.isArray(st) ? st : [])).catch(() => {});
  }, [status?.branch]);

  const submit = useCallback(async (message: string) => {
    setLoading(true);
    try {
      let files: string[] = ['.'];
      if (subMode === 'checked') files = Array.from(checked);
      else if (subMode === 'staged') files = [];
      const result = await api.submit(message, files);
      addToast(`${t.pushedTo} ${result.branch}`, 'ok');
      setModal(null);
      setChecked(new Set());
      const [s, tr] = await Promise.all([api.status(), api.tree()]);
      setStatus(s);
      setTree(tr);
      if (selectedFileRef.current) selectFile(selectedFileRef.current);
    } catch (err: unknown) {
      addToast(err instanceof Error ? err.message : 'Failed', 'error');
    } finally {
      setLoading(false);
    }
  }, [subMode, checked, selectFile, addToast]);

  const checkout = useCallback(async (branch: string) => {
    try {
      const result = await api.checkout(branch);
      setStatus(result.status);
      const tr = await api.tree();
      setTree(tr);
      addToast(`${t.switchBranch}: ${branch}`, 'ok');
    } catch (err: unknown) {
      addToast(err instanceof Error ? err.message : 'Failed', 'error');
    }
  }, [addToast, t]);

  const handleStashSave = useCallback(async () => {
    try {
      const result = await api.stashSave();
      setStatus(result.status);
      const st = await api.stash();
      setStashList(Array.isArray(st) ? st : []);
      addToast(t.stashSave, 'ok');
    } catch (err: unknown) {
      addToast(err instanceof Error ? err.message : 'Failed', 'error');
    }
  }, [addToast, t]);

  const handleStashPop = useCallback(async () => {
    try {
      const result = await api.stashPop();
      setStatus(result.status);
      const [tr, st] = await Promise.all([api.tree(), api.stash()]);
      setTree(tr);
      setStashList(Array.isArray(st) ? st : []);
      addToast(t.stashPop, 'ok');
      if (selectedFileRef.current) selectFile(selectedFileRef.current);
    } catch (err: unknown) {
      addToast(err instanceof Error ? err.message : 'Failed', 'error');
    }
  }, [addToast, t, selectFile]);

  const disconnect = useCallback(async () => {
    try {
      await api.disconnect();
      addToast(t.repoUnlinked, 'ok');
      const [s, tr] = await Promise.all([api.status(), api.tree()]);
      setStatus(s);
      setTree(tr);
    } catch (err: unknown) {
      addToast(err instanceof Error ? err.message : 'Failed', 'error');
    }
  }, [addToast, t]);

  const initRepo = useCallback(async (remoteUrl?: string) => {
    try {
      await api.init(remoteUrl);
      addToast(t.repoInitialized, 'ok');
      const infoData = await api.info();
      setInfo(infoData);
      if (infoData.hasGit) {
        const [s, tr] = await Promise.all([api.status(), api.tree()]);
        setStatus(s);
        setTree(tr);
      }
    } catch (err: unknown) {
      addToast(err instanceof Error ? err.message : 'Failed', 'error');
    }
  }, [addToast, t]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setModal(null);
        setLogModalOpen(false);
        setShortcutsOpen(false);
        return;
      }
      if (e.key === '?' && !(e.target as HTMLElement)?.closest('input, textarea')) {
        setShortcutsOpen((v) => !v);
        e.preventDefault();
        return;
      }
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.shiftKey && e.key === 'R') { refresh(); e.preventDefault(); }
      if (e.shiftKey && e.key === 'S') { setModal('select'); setSubMode('all'); e.preventDefault(); }
      if (e.key === '/' || (e.key === 'k' && (e.metaKey || e.ctrlKey))) {
        e.preventDefault();
        document.getElementById('search-input')?.focus();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [refresh]);

  if (!info) {
    return (
      <div className="app">
        <div className="center-screen"><div className="spinner" /></div>
      </div>
    );
  }

  if (!info.hasGit) {
    return (
      <div className="app">
        <Titlebar name={info.name} wsConnected={wsConnected} theme={theme} onThemeToggle={() => setTheme((t) => t === 'dark' ? 'light' : 'dark')} />
        <InitScreen onInit={initRepo} />
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </div>
    );
  }

  const s = status ?? {
    branch: '...', remoteUrl: '', staged: 0, modified: 0,
    total: 0, files: [], ahead: 0, behind: 0,
  };

  return (
    <div className="app">
      <Titlebar name={info.name} wsConnected={wsConnected} theme={theme} onThemeToggle={() => setTheme((t) => t === 'dark' ? 'light' : 'dark')} />
      <Toolbar
        status={s}
        branches={branches}
        onRefresh={refresh}
        onSubmit={() => { setModal('select'); setSubMode('all'); }}
        onDisconnect={disconnect}
        onCheckout={checkout}
        onStashSave={handleStashSave}
        onStashPop={handleStashPop}
        onHistory={() => setLogModalOpen(true)}
        stashCount={stashList.length}
      />
      <div className="main">
        <Sidebar
          tree={tree} status={s} selectedFile={selectedFile}
          checked={checked} expanded={expanded} search={search}
          onSearch={setSearch} onSelectFile={selectFile}
          onToggleDir={toggleDir} onToggleCheck={toggleCheck}
        />
        <Content
          selectedFile={selectedFile} diff={diff}
          fileContent={fileContent} viewMode={viewMode}
          onChangeViewMode={setViewMode}
        />
      </div>
      {modal && (
        <SubmitModal
          modal={modal} subMode={subMode} checkedCount={checked.size}
          loading={loading} onClose={() => setModal(null)}
          onModeChange={setSubMode}
          onNext={() => {
            if (subMode === 'checked' && checked.size === 0) {
              addToast(t.noFilesChecked, 'error');
              return;
            }
            setModal('message');
          }}
          onBack={() => setModal('select')}
          onSubmit={submit}
        />
      )}
      {logModalOpen && <LogModal onClose={() => setLogModalOpen(false)} />}
      {shortcutsOpen && (
        <div className="overlay" onClick={() => setShortcutsOpen(false)}>
          <div className="modal shortcuts-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{t.shortcuts}</h2>
            <p className="modal-desc">{t.shortcutsHint}</p>
            <button type="button" className="btn btn-ghost" onClick={() => setShortcutsOpen(false)}>{t.cancel}</button>
          </div>
        </div>
      )}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

export default function App() {
  return (
    <I18nProvider lang="ru" setLang={() => {}}>
      <AppInner />
    </I18nProvider>
  );
}
