export interface TreeEntry {
  name: string;
  path: string;
  type: 'file' | 'dir';
  children?: TreeEntry[];
}

export interface FileStatus {
  path: string;
  status: 'staged' | 'modified' | 'untracked' | 'deleted';
}

export interface GitStatus {
  branch: string;
  remoteUrl: string;
  staged: number;
  modified: number;
  total: number;
  files: FileStatus[];
  ahead: number;
  behind: number;
}

export interface ProjectInfo {
  cwd: string;
  hasGit: boolean;
  name: string;
}

export interface Toast {
  id: number;
  message: string;
  type: 'ok' | 'error' | 'info';
}

export interface CommitLogEntry {
  hash: string;
  message: string;
  date: string;
  author: string;
  avatarUrl?: string;
}

export interface CommitDetail extends CommitLogEntry {
  fullMessage?: string;
  parentHash?: string;
  stats?: { filesChanged: number; insertions: number; deletions: number };
  files: { path: string; status: string }[];
}

export interface BranchesInfo {
  current: string;
  all: string[];
}

export interface StashEntry {
  hash: string;
  message: string;
  date: string;
}

export interface FileData {
  content: string;
  language: string;
  encoding?: 'base64';
}
