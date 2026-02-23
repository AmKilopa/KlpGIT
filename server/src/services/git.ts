import simpleGit, { type SimpleGit } from 'simple-git';
import { existsSync } from 'fs';
import { join } from 'path';
import { createHash } from 'crypto';

function gravatarUrl(email: string): string {
  const hash = createHash('md5').update((email || '').trim().toLowerCase()).digest('hex');
  return `https://www.gravatar.com/avatar/${hash}?s=80&d=identicon`;
}

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
    const origin = remotes.find((r: { name: string; refs?: { fetch?: string; push?: string } }) => r.name === 'origin');
    remoteUrl = origin?.refs?.fetch ?? origin?.refs?.push ?? '';
  } catch (_) {}

  const seen = new Map<string, string>();
  for (const f of status.staged) {
    if (!seen.has(f)) seen.set(f, 'staged');
  }
  for (const f of status.modified) {
    if (!seen.has(f)) seen.set(f, 'modified');
  }
  for (const f of status.not_added) {
    if (!seen.has(f)) seen.set(f, 'untracked');
  }
  for (const f of status.created) {
    if (!seen.has(f)) seen.set(f, 'untracked');
  }
  for (const f of status.deleted) {
    if (!seen.has(f)) seen.set(f, 'deleted');
  }
  const files = Array.from(seen.entries()).slice(0, 100).map(([path, status]) => ({ path, status }));

  const total = seen.size;
  const modifiedCount = Array.from(seen.values()).filter(s => s !== 'staged').length;
  return {
    branch,
    remoteUrl,
    staged: status.staged.length,
    modified: modifiedCount,
    total,
    files,
    ahead: status.ahead,
    behind: status.behind,
  };
}

export async function getDiff(cwd: string, file: string) {
  const git = getGit(cwd);
  let unstaged = '';
  let staged = '';
  try { unstaged = await git.diff(['--', file]); } catch (_) {}
  try { staged = await git.diff(['--staged', '--', file]); } catch (_) {}
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
  const hash = result.commit ?? '';

  const status = await git.status();
  const branch = status.current ?? 'main';
  try {
    await git.pull();
  } catch (_) {}
  try {
    await git.push('origin', branch);
  } catch (_) {
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
    } catch (_) {}
  }
}

export async function removeRemote(cwd: string) {
  const git = getGit(cwd);
  await git.removeRemote('origin');
}

export async function getLog(cwd: string, n: number = 30) {
  const git = getGit(cwd);
  const log = await git.log({ maxCount: n });
  return log.all.map((c: { hash: string; message: string; date: string; author_name?: string; author_email?: string }) => {
    const email = (c as { author_email?: string }).author_email ?? '';
    return {
      hash: c.hash.slice(0, 7),
      message: c.message.trim().split('\n')[0],
      date: c.date,
      author: c.author_name ?? '',
      avatarUrl: email ? gravatarUrl(email) : '',
    };
  });
}

export async function getCommitDetail(cwd: string, hashShort: string) {
  const git = getGit(cwd);
  const log = await git.log({ maxCount: 200 });
  const entry = log.all.find((c: { hash: string; message: string; date: string; author_name?: string }) =>
    c.hash.startsWith(hashShort)
  );
  if (!entry) {
    throw new Error('Commit not found');
  }
  const fullHash = entry.hash;
  const hash = fullHash.slice(0, 7);
  const fullMessage = (entry.message ?? '').trim();
  const message = fullMessage.split('\n')[0];
  const dateStr = entry.date ?? '';
  const author = (entry as { author_name?: string }).author_name ?? '';
  let authorEmail = (entry as { author_email?: string }).author_email ?? '';
  if (!authorEmail) {
    try {
      authorEmail = await git.raw(['show', fullHash, '-s', '--format=%ae']);
      authorEmail = authorEmail.trim();
    } catch (_) {}
  }
  let parentHash = '';
  try {
    parentHash = await git.raw(['rev-parse', fullHash + '^']);
    parentHash = parentHash.trim().slice(0, 7);
  } catch (_) {}
  let files: { path: string; status: string }[] = [];
  let filesChanged = 0;
  let insertions = 0;
  let deletions = 0;
  try {
    const out = await git.raw(['diff-tree', '--no-commit-id', '--name-status', '-r', fullHash]);
    const lines = out.replace(/\r\n/g, '\n').trim().split('\n').filter(Boolean);
    for (const line of lines) {
      const tab = line.indexOf('\t');
      if (tab === -1) continue;
      const status = line.slice(0, tab).trim();
      const rest = line.slice(tab + 1).trim();
      const path = rest.includes('\t') ? rest.split('\t').pop() ?? rest : rest;
      if (path) files.push({ path, status });
    }
    filesChanged = files.length;
  } catch (_) {}
  try {
    const statOut = await git.raw(['show', fullHash, '--shortstat', '--format=']);
    const m = statOut.match(/(\d+) files? changed(?:, (\d+) insertions?\(\+\))?(?:, (\d+) deletions?\(-\))?/);
    if (m) {
      filesChanged = parseInt(m[1], 10) || filesChanged;
      insertions = parseInt(m[2], 10) || 0;
      deletions = parseInt(m[3], 10) || 0;
    }
  } catch (_) {}
  return {
    hash,
    message,
    fullMessage,
    date: dateStr,
    author,
    avatarUrl: authorEmail ? gravatarUrl(authorEmail) : '',
    parentHash,
    stats: { filesChanged, insertions, deletions },
    files,
  };
}

export async function getCommitFileDiff(cwd: string, hashShort: string, filePath: string) {
  const git = getGit(cwd);
  const log = await git.log({ maxCount: 200 });
  const entry = log.all.find((c: { hash: string }) => c.hash.startsWith(hashShort));
  const fullHash = entry?.hash ?? hashShort;
  try {
    const diff = await git.raw(['diff', fullHash + '^', fullHash, '--', filePath]);
    return typeof diff === 'string' ? diff : '';
  } catch (_) {
    const out = await git.raw(['show', fullHash, '--', filePath]);
    const raw = typeof out === 'string' ? out : '';
    const idx = raw.indexOf('diff --git');
    return idx >= 0 ? raw.slice(idx) : raw;
  }
}

export async function getBranches(cwd: string) {
  const git = getGit(cwd);
  const branches = await git.branch();
  return { current: branches.current, all: branches.all };
}

export async function checkoutBranch(cwd: string, name: string) {
  const git = getGit(cwd);
  await git.checkout(name);
}

export async function stashList(cwd: string) {
  const git = getGit(cwd);
  const list = await git.stashList();
  return list.all.map((s: { hash: string; message: string; date: string }) => ({
    hash: s.hash,
    message: s.message.trim(),
    date: s.date,
  }));
}

export async function stashSave(cwd: string, message?: string) {
  const git = getGit(cwd);
  await git.stash(['push', ...(message ? ['-m', message] : [])]);
}

export async function stashPop(cwd: string) {
  const git = getGit(cwd);
  await git.stash(['pop']);
}
