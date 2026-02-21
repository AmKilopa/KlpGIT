import simpleGit, { type SimpleGit } from 'simple-git';
import { existsSync } from 'fs';
import { join } from 'path';

export function getGit(cwd: string): SimpleGit {
  return simpleGit({ baseDir: cwd });
}

export function hasGitRepo(cwd: string): boolean {
  return existsSync(join(cwd, '.git'));
}

export async function getFullStatus(cwd: string) {
  const git = getGit(cwd);
  const status = await git.status();
  const branch = status.current || 'main';

  let remoteUrl = '';
  try {
    const remotes = await git.getRemotes(true);
    const origin = remotes.find((r: { name: string }) => r.name === 'origin') as any;
    remoteUrl = origin?.refs?.fetch || origin?.refs?.push || '';
  } catch {}

  const files: { path: string; status: string }[] = [];
  const seen = new Set<string>();

  for (const f of status.staged) {
    if (!seen.has(f)) { files.push({ path: f, status: 'staged' }); seen.add(f); }
  }
  for (const f of status.modified) {
    if (!seen.has(f)) { files.push({ path: f, status: 'modified' }); seen.add(f); }
  }
  for (const f of status.not_added) {
    if (!seen.has(f)) { files.push({ path: f, status: 'untracked' }); seen.add(f); }
  }
  for (const f of status.created) {
    if (!seen.has(f)) { files.push({ path: f, status: 'untracked' }); seen.add(f); }
  }
  for (const f of status.deleted) {
    if (!seen.has(f)) { files.push({ path: f, status: 'deleted' }); seen.add(f); }
  }

  return {
    branch,
    remoteUrl,
    staged: status.staged.length,
    modified: files.filter(f => f.status !== 'staged').length,
    total: files.length,
    files,
    ahead: status.ahead,
    behind: status.behind,
  };
}

export async function getDiff(cwd: string, file: string) {
  const git = getGit(cwd);
  let unstaged = '';
  let staged = '';
  try { unstaged = await git.diff(['--', file]); } catch {}
  try { staged = await git.diff(['--staged', '--', file]); } catch {}
  return staged || unstaged || '';
}

export async function addFiles(cwd: string, files: string[]) {
  const git = getGit(cwd);
  if (files.includes('.')) {
    await git.add('.');
  } else {
    await git.add(files);
  }
}

export async function commitAndPush(cwd: string, message: string, filesToAdd: string[]) {
  const git = getGit(cwd);

  if (filesToAdd.length > 0) {
    if (filesToAdd.includes('.')) {
      await git.add('.');
    } else {
      await git.add(filesToAdd);
    }
  }

  const result = await git.commit(message);
  const hash = result.commit || '';

  const status = await git.status();
  const branch = status.current || 'main';
  try {
    await git.push('origin', branch);
  } catch {
    await git.push(['-u', 'origin', branch]);
  }

  return { hash, branch };
}

export async function initRepo(cwd: string, remoteUrl?: string) {
  const git = getGit(cwd);
  if (!hasGitRepo(cwd)) {
    await git.init();
  }
  if (remoteUrl) {
    try {
      await git.addRemote('origin', remoteUrl);
    } catch {}
  }
}

export async function removeRemote(cwd: string) {
  const git = getGit(cwd);
  await git.removeRemote('origin');
}
