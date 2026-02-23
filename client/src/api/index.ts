import type { GitStatus, TreeEntry, ProjectInfo, CommitLogEntry, CommitDetail, BranchesInfo, StashEntry, FileData } from '../types';
import { MOCK_REQUEST_DELAY_MS } from '../constants';
import {
  mockProjectInfo,
  mockStatus,
  mockTree,
  mockDiffByFile,
  mockFileByPath,
  mockRequest as mockDelay,
} from '../mock/mockData';

const useMock = import.meta.env.VITE_USE_MOCK === 'true';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch('/api/' + path, options);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

function createRealApi() {
  return {
    info: () => request<ProjectInfo>('info'),
    status: () => request<GitStatus>('status'),
    tree: () => request<TreeEntry[]>('tree'),
    diff: (file: string) =>
      request<{ diff: string }>('diff?file=' + encodeURIComponent(file)),
    file: (path: string) =>
      request<FileData>('file?path=' + encodeURIComponent(path)),
    submit: (message: string, files: string[]) =>
      request<{ ok: boolean; hash: string; branch: string }>('submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, files }),
      }),
    init: (remoteUrl?: string) =>
      request<{ ok: boolean }>('init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ remoteUrl }),
      }),
    disconnect: () =>
      request<{ ok: boolean }>('disconnect', { method: 'POST' }),
    log: (n?: number) =>
      request<CommitLogEntry[]>('log' + (n != null ? '?n=' + n : '')),
    commit: (hash: string) =>
      request<CommitDetail>('commit?hash=' + encodeURIComponent(hash)),
    commitDiff: (hash: string, filePath: string) =>
      request<{ diff: string }>('commit/diff?hash=' + encodeURIComponent(hash) + '&file=' + encodeURIComponent(filePath)),
    branches: () => request<BranchesInfo>('branches'),
    checkout: (branch: string) =>
      request<{ ok: boolean; status: GitStatus }>('checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branch }),
      }),
    stash: () => request<StashEntry[]>('stash'),
    stashSave: (message?: string) =>
      request<{ ok: boolean; status: GitStatus }>('stash/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      }),
    stashPop: () =>
      request<{ ok: boolean; status: GitStatus }>('stash/pop', { method: 'POST' }),
  };
}

function createMockApi() {
  const mockRequest = <T>(data: T) => mockDelay(data, MOCK_REQUEST_DELAY_MS);
  return {
    info: () => mockRequest(mockProjectInfo),
    status: () => mockRequest(mockStatus),
    tree: () => mockRequest(mockTree),
    diff: (file: string) =>
      mockRequest({ diff: mockDiffByFile[file] ?? '' }),
    file: (path: string) =>
      mockRequest(mockFileByPath[path] ?? { content: '', language: '' }),
    submit: (_message: string, _files: string[]) =>
      mockRequest({ ok: true, hash: 'mock-hash', branch: 'main' }),
    init: (_remoteUrl?: string) => mockRequest({ ok: true }),
    disconnect: () => mockRequest({ ok: true }),
    log: (n?: number) => mockRequest([{ hash: 'a1b2c3d', message: 'Initial commit', date: new Date().toISOString(), author: 'Dev' }]),
    commit: (_hash: string) => mockRequest({
      hash: 'a1b2c3d', message: 'Initial commit', fullMessage: 'Initial commit\n\nSetup project.',
      date: new Date().toISOString(), author: 'Dev', parentHash: '0000000',
      stats: { filesChanged: 2, insertions: 10, deletions: 0 },
      files: [{ path: 'src/App.tsx', status: 'M' }, { path: 'README.md', status: 'A' }],
    }),
    commitDiff: (_hash: string, filePath: string) => mockRequest({
      diff: `--- a/${filePath}\n+++ b/${filePath}\n@@ -1,3 +1,4 @@\n line1\n line2\n+new line\n line3`,
    }),
    branches: () => mockRequest({ current: 'main', all: ['main'] }),
    checkout: (branch: string) => mockRequest({ ok: true, status: mockStatus }),
    stash: () => mockRequest([]),
    stashSave: (message?: string) => mockRequest({ ok: true, status: mockStatus }),
    stashPop: () => mockRequest({ ok: true, status: mockStatus }),
  };
}

export const api = useMock ? createMockApi() : createRealApi();
