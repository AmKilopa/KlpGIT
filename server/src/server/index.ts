import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { watch } from 'chokidar';
import { join, dirname, resolve } from 'path';
import { readFileSync, statSync } from 'fs';
import { fileURLToPath } from 'url';
import { getFullStatus, getDiff, commitAndPush, addFiles, initRepo, removeRemote, hasGitRepo } from '../services/git.js';
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

  app.get('/api/tree', async (_req, res) => {
    try {
      const tree = getFileTree(cwd);
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

  const server = createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws' });

  const clients = new Set<WebSocket>();

  wss.on('connection', (ws) => {
    clients.add(ws);
    const ping = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) ws.ping();
    }, 30000);
    ws.on('close', () => {
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

  const shutdown = () => {
    console.log('\n\x1b[90m→ Shutting down...\x1b[0m');
    watcher.close();
    server.close(() => process.exit(0));
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  server.listen(port, () => {});

  return { server, watcher, port };
}
