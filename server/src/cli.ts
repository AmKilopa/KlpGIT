#!/usr/bin/env node
import { startServer } from './server/index.js';
import { getAvailablePort } from './port.js';
import { exec } from 'child_process';
import open from 'open';

const cwd = process.cwd();
const preferredPort = parseInt(process.env.KLPGIT_PORT || '4219', 10);

process.stdout.write('\x1Bc');

(async () => {
  const port = await getAvailablePort(preferredPort);
  const url = `http://localhost:${port}`;

  console.log('');
  console.log('  \x1b[35m\x1b[1mKlpGit\x1b[0m \x1b[90mv0.0.1\x1b[0m');
  console.log('');
  console.log(`  \x1b[36m→\x1b[0m ${url}`);
  if (port !== preferredPort) {
    console.log(`  \x1b[90m(порт ${preferredPort} занят, выбран ${port})\x1b[0m`);
  }
  console.log('  \x1b[90mCtrl+C для выхода\x1b[0m');
  console.log('');

  const { server } = startServer(cwd, port);

  function openAppWindow() {
    const w = 1280, h = 840;
    const flags = `--app=${url} --window-size=${w},${h} --disable-extensions --new-window`;
    const isWin = process.platform === 'win32';
    const isMac = process.platform === 'darwin';

    if (isWin) {
      exec(`start msedge ${flags}`, (err) => {
        if (err) exec(`start chrome ${flags}`, (err2) => {
          if (err2) open(url);
        });
      });
    } else if (isMac) {
      exec(`open -na "Google Chrome" --args ${flags}`, (err) => {
        if (err) exec(`open -na "Microsoft Edge" --args ${flags}`, (err2) => {
          if (err2) open(url);
        });
      });
    } else {
      exec(`google-chrome ${flags} 2>/dev/null || chromium-browser ${flags} 2>/dev/null || microsoft-edge ${flags} 2>/dev/null`, (err) => {
        if (err) open(url);
      });
    }
  }

  server.on('listening', openAppWindow);
})();
