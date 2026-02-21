import type { GitStatus, TreeEntry, ProjectInfo } from '../types';
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
      request<{ content: string; language: string }>(
        'file?path=' + encodeURIComponent(path),
      ),
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
  };
}

function createMockApi() {
  const mockRequest = <T>(data: T) => mockDelay(data, 60);
  return {
    info: () => mockRequest(mockProjectInfo),
    status: () => mockRequest(mockStatus),
    tree: () => mockRequest(mockTree),
    diff: (file: string) =>
      mockRequest({ diff: mockDiffByFile[file] ?? '' }),
    file: (path: string) =>
      mockRequest(mockFileByPath[path] ?? { content: '', language: '' }),
    submit: () =>
      mockRequest({ ok: true, hash: 'mock-hash', branch: 'main' }),
    init: () => mockRequest({ ok: true }),
    disconnect: () => mockRequest({ ok: true }),
  };
}

export const api = useMock ? createMockApi() : createRealApi();
