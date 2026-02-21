import { readdirSync, statSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

const DEFAULT_IGNORE = new Set([
  'node_modules', '.git', '.klpgit', 'dist', 'build',
  '.next', '.nuxt', 'coverage', '.cache', '__pycache__',
  '.venv', 'venv', '.env', '.idea', '.vscode',
]);

export interface TreeEntry {
  name: string;
  path: string;
  type: 'file' | 'dir';
  children?: TreeEntry[];
}

function shouldIgnore(name: string, gitignorePatterns: string[]): boolean {
  if (DEFAULT_IGNORE.has(name)) return true;
  if (name.startsWith('.') && name !== '.gitignore') return true;
  for (const p of gitignorePatterns) {
    if (name === p || name.match(new RegExp('^' + p.replace(/\*/g, '.*') + '$'))) return true;
  }
  return false;
}

function readDir(basePath: string, relPath: string, gitignorePatterns: string[]): TreeEntry[] {
  const fullPath = join(basePath, relPath);
  let entries: string[];
  try {
    entries = readdirSync(fullPath);
  } catch {
    return [];
  }

  const result: TreeEntry[] = [];

  const sorted = entries
    .filter(e => !shouldIgnore(e, gitignorePatterns))
    .sort((a, b) => {
      const aIsDir = statSync(join(fullPath, a)).isDirectory();
      const bIsDir = statSync(join(fullPath, b)).isDirectory();
      if (aIsDir && !bIsDir) return -1;
      if (!aIsDir && bIsDir) return 1;
      return a.localeCompare(b);
    });

  for (const entry of sorted) {
    const rel = relPath ? `${relPath}/${entry}` : entry;
    const full = join(basePath, rel);
    let isDir: boolean;
    try {
      isDir = statSync(full).isDirectory();
    } catch {
      continue;
    }

    const node: TreeEntry = {
      name: entry,
      path: rel,
      type: isDir ? 'dir' : 'file',
    };

    if (isDir) {
      node.children = readDir(basePath, rel, gitignorePatterns);
    }

    result.push(node);
  }

  return result;
}

export function getFileTree(cwd: string): TreeEntry[] {
  let gitignorePatterns: string[] = [];
  const gitignorePath = join(cwd, '.gitignore');
  if (existsSync(gitignorePath)) {
    try {
      gitignorePatterns = readFileSync(gitignorePath, 'utf-8')
        .split('\n')
        .map(l => l.trim())
        .filter(l => l && !l.startsWith('#'));
    } catch {}
  }

  return readDir(cwd, '', gitignorePatterns);
}
