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
