import { createServer } from 'net';

export function getAvailablePort(preferred: number): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        const fallback = createServer();
        fallback.once('error', reject);
        fallback.listen(0, '127.0.0.1', () => {
          const port = (fallback.address() as { port: number }).port;
          fallback.close(() => resolve(port));
        });
      } else {
        reject(err);
      }
    });
    server.listen(preferred, '127.0.0.1', () => {
      const port = (server.address() as { port: number }).port;
      server.close(() => resolve(port));
    });
  });
}
