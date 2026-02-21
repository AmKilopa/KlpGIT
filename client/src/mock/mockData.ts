import type { ProjectInfo, GitStatus, TreeEntry } from '../types';

export const mockProjectInfo: ProjectInfo = {
  cwd: '/mock/мой-проект',
  hasGit: true,
  name: 'мой-проект',
};

export const mockStatus: GitStatus = {
  branch: 'main',
  remoteUrl: 'https://github.com/user/repo.git',
  staged: 2,
  modified: 3,
  total: 5,
  files: [
    { path: 'src/App.tsx', status: 'staged' },
    { path: 'src/api/index.ts', status: 'staged' },
    { path: 'README.md', status: 'modified' },
    { path: 'client/src/components/Sidebar.tsx', status: 'modified' },
    { path: 'package.json', status: 'untracked' },
  ],
  ahead: 0,
  behind: 0,
};

export const mockTree: TreeEntry[] = [
  {
    name: 'client',
    path: 'client',
    type: 'dir',
    children: [
      {
        name: 'src',
        path: 'client/src',
        type: 'dir',
        children: [
          { name: 'App.tsx', path: 'client/src/App.tsx', type: 'file' },
          { name: 'main.tsx', path: 'client/src/main.tsx', type: 'file' },
          {
            name: 'components',
            path: 'client/src/components',
            type: 'dir',
            children: [
              { name: 'Sidebar.tsx', path: 'client/src/components/Sidebar.tsx', type: 'file' },
              { name: 'Toolbar.tsx', path: 'client/src/components/Toolbar.tsx', type: 'file' },
            ],
          },
        ],
      },
      { name: 'index.html', path: 'client/index.html', type: 'file' },
    ],
  },
  {
    name: 'server',
    path: 'server',
    type: 'dir',
    children: [
      { name: 'cli.ts', path: 'server/cli.ts', type: 'file' },
      { name: 'package.json', path: 'server/package.json', type: 'file' },
    ],
  },
  { name: 'README.md', path: 'README.md', type: 'file' },
  { name: 'package.json', path: 'package.json', type: 'file' },
];

export const mockDiffByFile: Record<string, string> = {
  'README.md': `--- a/README.md
+++ b/README.md
@@ -1,5 +1,6 @@
 # KlpGit
+Новая строка в начале.
 
 Графический Git из терминала.
`,
  'client/src/App.tsx': `--- a/client/src/App.tsx
+++ b/client/src/App.tsx
@@ -10,6 +10,7 @@ function AppInner() {
   const [loading, setLoading] = useState(false);
+  const [mounted, setMounted] = useState(false);
   const [wsConnected, setWsConnected] = useState(false);
`,
};

export const mockFileByPath: Record<string, { content: string; language: string }> = {
  'README.md': {
    content: '# KlpGit\n\nГрафический Git из терминала.\n',
    language: 'md',
  },
  'client/src/App.tsx': {
    content: 'import { useState } from \'react\';\n\nexport default function App() {\n  const [count, setCount] = useState(0);\n  return <div>{count}</div>;\n}\n',
    language: 'tsx',
  },
  'package.json': {
    content: '{\n  "name": "klpgit",\n  "version": "0.0.1"\n}\n',
    language: 'json',
  },
};

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

export async function mockRequest<T>(data: T, ms = 80): Promise<T> {
  await delay(ms);
  return data;
}
