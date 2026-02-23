import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { watch } from 'chokidar';
import { join, dirname, resolve } from 'path';
import { readFileSync, statSync } from 'fs';
import { fileURLToPath } from 'url';
import { getFullStatus, getDiff, commitAndPush, addFiles, initRepo, removeRemote, hasGitRepo, getLog, getBranches, checkoutBranch, stashList, stashSave, stashPop } from '../services/git.js';
import { getFileTree } from '../services/fileTree.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function startServer(cwd: string, port: number) {
  const app = express();
  app.use(express.json());
  app.use((_req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    next();
  });

  const webDir = join(dirname(__dirname), '..', 'web');
  app.use(express.static(webDir));

  app.get('/api/status', async (_req, res) => {
    try {
      const status = await getFullStatus(cwd);
      res.json(status);
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  app.get('/api/tree', async (req, res) => {
    try {
      const maxDepth = Math.min(20, Math.max(1, parseInt(req.query.maxDepth as string, 10) || 10));
      const tree = getFileTree(cwd, maxDepth);
      res.json(tree);
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  app.get('/api/diff', async (req, res) => {
    try {
      const file = req.query.file as string;
      if (!file) { res.json({ diff: '' }); return; }
      const diff = await getDiff(cwd, file);
      res.json({ diff });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  app.post('/api/add', async (req, res) => {
    try {
      const { files } = req.body;
      await addFiles(cwd, files || ['.']);
      const status = await getFullStatus(cwd);
      res.json({ ok: true, status });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  app.post('/api/submit', async (req, res) => {
    try {
      const { message, files } = req.body;
      if (!message) { res.status(400).json({ error: 'Commit message required' }); return; }
      const result = await commitAndPush(cwd, message, files || ['.']);
      res.json({ ok: true, ...result });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  app.post('/api/init', async (req, res) => {
    try {
      const { remoteUrl } = req.body;
      await initRepo(cwd, remoteUrl);
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  app.post('/api/disconnect', async (_req, res) => {
    try {
      await removeRemote(cwd);
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  app.get('/api/file', (req, res) => {
    try {
      const filePath = req.query.path as string;
      if (!filePath) { res.status(400).json({ error: 'Path required' }); return; }
      const fullPath = join(cwd, filePath);
      if (!resolve(fullPath).startsWith(resolve(cwd))) {
        res.status(403).json({ error: 'Access denied' }); return;
      }
      const stats = statSync(fullPath);
      if (stats.size > 1024 * 1024) {
        res.json({ content: '', language: '' }); return;
      }
      const content = readFileSync(fullPath, 'utf-8');
      const ext = filePath.split('.').pop()?.toLowerCase() || '';
      res.json({ content, language: ext });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  app.get('/api/info', (_req, res) => {
    res.json({
      cwd,
      hasGit: hasGitRepo(cwd),
      name: cwd.split(/[\\/]/).pop() || cwd,
    });
  });

  app.get('/api/log', async (req, res) => {
    try {
      const n = Math.min(100, Math.max(1, parseInt(req.query.n as string, 10) || 30));
      const log = await getLog(cwd, n);
      res.json(log);
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  app.get('/api/branches', async (_req, res) => {
    try {
      const branches = await getBranches(cwd);
      res.json(branches);
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  app.post('/api/checkout', async (req, res) => {
    try {
      const { branch } = req.body;
      if (!branch || typeof branch !== 'string') { res.status(400).json({ error: 'Branch name required' }); return; }
      await checkoutBranch(cwd, branch);
      const status = await getFullStatus(cwd);
      res.json({ ok: true, status });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  app.get('/api/stash', async (_req, res) => {
    try {
      const list = await stashList(cwd);
      res.json(list);
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  app.post('/api/stash/save', async (req, res) => {
    try {
      const { message } = req.body;
      await stashSave(cwd, typeof message === 'string' ? message : undefined);
      const status = await getFullStatus(cwd);
      res.json({ ok: true, status });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  app.post('/api/stash/pop', async (_req, res) => {
    try {
      await stashPop(cwd);
      const status = await getFullStatus(cwd);
      res.json({ ok: true, status });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  const server = createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws' });

  const clients = new Set<WebSocket>();

  wss.on('connection', (ws) => {
    clients.add(ws);
    const ping = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) ws.ping();
    }, 30000);
    
    ws.on('pong', () => {});
    ws.on('close', () => {
      clients.delete(ws);
      clearInterval(ping);
    });
    ws.on('error', () => {
      clients.delete(ws);
      clearInterval(ping);
    });
  });

  function broadcast(event: string, data?: any) {
    const msg = JSON.stringify({ event, data });
    for (const ws of clients) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(msg);
      }
    }
  }

  const watcher = watch(cwd, {
    ignored: [
      /(^|[\/\\])\./,
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.klpgit/**',
    ],
    persistent: true,
    ignoreInitial: true,
    depth: 5,
  });

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  const notifyChange = () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      try {
        const status = await getFullStatus(cwd);
        broadcast('status', status);
      } catch {}
    }, 300);
  };

  watcher.on('add', notifyChange);
  watcher.on('change', notifyChange);
  watcher.on('unlink', notifyChange);

  let isShuttingDown = false;

  function shutdown() {
    process.off('SIGINT', shutdown);
    process.off('SIGTERM', shutdown);
    if (isShuttingDown) return;
    isShuttingDown = true;

    console.log('\n\x1b[90m→ Shutting down...\x1b[0m');
    
    watcher.close();
    
    for (const ws of clients) {
      ws.terminate();
    }
    clients.clear();

    server.close((err) => {
      if (err) {
        console.error('Server close error:', err);
      }
      console.log('\x1b[90m→ Server closed\x1b[0m');
      process.exit(0);
    });

    setTimeout(() => {
      console.error('\x1b[91mForce exit\x1b[0m');
      process.exit(1);
    }, 3000);
  }

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  process.on('uncaughtException', shutdown);

  server.listen(port, '127.0.0.1', () => {});

  return { server, watcher, port };
}
