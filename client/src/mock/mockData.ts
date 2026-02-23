import type { ProjectInfo, GitStatus, TreeEntry, FileData } from '../types';

export const mockProjectInfo: ProjectInfo = {
  cwd: '/mock/проект',
  hasGit: true,
  name: 'проект',
};

export const mockStatus: GitStatus = {
  branch: 'main',
  remoteUrl: 'https://github.com/user/repo.git',
  staged: 2,
  modified: 3,
  total: 6,
  files: [
    { path: 'docs/README.md', status: 'staged' },
    { path: 'src/app.ts', status: 'staged' },
    { path: 'src/App.tsx', status: 'modified' },
    { path: 'src/style.css', status: 'modified' },
    { path: 'config.json', status: 'untracked' },
    { path: 'assets/logo.svg', status: 'modified' },
  ],
  ahead: 0,
  behind: 0,
};

export const mockTree: TreeEntry[] = [
  {
    name: 'docs',
    path: 'docs',
    type: 'dir',
    children: [
      { name: 'README.md', path: 'docs/README.md', type: 'file' },
    ],
  },
  {
    name: 'src',
    path: 'src',
    type: 'dir',
    children: [
      { name: 'App.tsx', path: 'src/App.tsx', type: 'file' },
      { name: 'app.ts', path: 'src/app.ts', type: 'file' },
      { name: 'style.css', path: 'src/style.css', type: 'file' },
      { name: 'demo-validation.ts', path: 'src/demo-validation.ts', type: 'file' },
    ],
  },
  {
    name: 'assets',
    path: 'assets',
    type: 'dir',
    children: [
      { name: 'logo.svg', path: 'assets/logo.svg', type: 'file' },
      { name: 'icon.svg', path: 'assets/icon.svg', type: 'file' },
      { name: 'test.svg', path: 'assets/test.svg', type: 'file' },
    ],
  },
  { name: 'index.html', path: 'index.html', type: 'file' },
  { name: 'config.json', path: 'config.json', type: 'file' },
  { name: 'config.yml', path: 'config.yml', type: 'file' },
  { name: 'script.sh', path: 'script.sh', type: 'file' },
  { name: 'main.py', path: 'main.py', type: 'file' },
];

export const mockDiffByFile: Record<string, string> = {
  'docs/README.md': `--- a/docs/README.md
+++ b/docs/README.md
@@ -1,3 +1,4 @@
 # Пример
+Новая строка для диффа.
 
 Текст.
`,
  'src/App.tsx': `--- a/src/App.tsx
+++ b/src/App.tsx
@@ -2,4 +2,5 @@
   const [x, setX] = useState(0);
+  const [y, setY] = useState(0);
   return <div>{x}</div>;
 `,
  'src/app.ts': `--- a/src/app.ts
+++ b/src/app.ts
@@ -1,4 +1,5 @@
 const a = 1;
+const b = 2;
 export { a };
 `,
  'src/style.css': `--- a/src/style.css
+++ b/src/style.css
@@ -1,3 +1,4 @@
 .root { margin: 0; }
+.box { padding: 8px; }
 body { font-size: 14px; }
 `,
  'config.json': `--- a/config.json
+++ b/config.json
@@ -2,5 +2,6 @@
   "name": "app",
   "version": "1.0.0",
+  "private": true,
   "scripts": {}
 }
 `,
};

const mdFull = `# Заголовок уровня 1 (H1)

Обычный абзац текста. В нём есть **жирное выделение** и *курсив*, а также \`код в строке\`. Ещё можно __жирное так__ и _курсив так_. И ~~зачёркнутый текст~~.

---

## Заголовок уровня 2 (H2)

Второй абзац с [ссылкой](https://example.com) и с <https://example.org> в угловых скобках.

### Заголовок уровня 3 (H3)

- Маркированный список: первый пункт
- Второй пункт
- Третий пункт

Или с плюсом:

+ Пункт A
+ Пункт B

Или со звёздочкой:

* Пункт I
* Пункт II

#### Заголовок уровня 4 (H4)

Нумерованный список:

1. Первый шаг
2. Второй шаг
3. Третий шаг

##### Заголовок уровня 5 (H5)

Список задач (GFM):

- [ ] Невыполненная задача
- [x] Выполненная задача
- [ ] Ещё одна открытая

###### Заголовок уровня 6 (H6)

Горизонтальная черта выше уже была (---). Ещё можно *** или ___.

> Цитата (blockquote). В ней может быть несколько абзацев.
>
> Второй абзац цитаты с **выделением** и \`кодом\`.

Таблица:

| Заголовок A | Заголовок B | Заголовок C |
|-------------|-------------|-------------|
| ячейка 1    | ячейка 2    | ячейка 3    |
| ячейка 4    | ячейка 5    | ячейка 6    |
| выравнивание по умолчанию слева | можно и длинный текст | ок |

Блок кода без языка:

\`\`\`
const x = 1;
const y = 2;
console.log(x + y);
\`\`\`

Блок кода с языком (синтаксис):

\`\`\`javascript
function hello(name) {
  return \`Hello, \${name}!\`;
}
hello("World");
\`\`\`

\`\`\`typescript
interface User {
  id: number;
  name: string;
}
const u: User = { id: 1, name: "Test" };
\`\`\`

\`\`\`bash
echo "Проверка подсветки"
npm install
npm run build
\`\`\`

\`\`\`json
{
  "key": "value",
  "count": 42,
  "nested": { "a": true }
}
\`\`\`

Вложенный список:

1. Пункт один
   - подпункт A
   - подпункт B
2. Пункт два
   - подпункт C

Параграф с переносами строк (два пробела в конце строки):  
вот так.  
И ещё раз.

Экранирование: \\*звёздочки\\*, \\# решётка.

Конец документа.
`;

const tsContent = `const count = 0;
let name: string = 'test';

function add(a: number, b: number): number {
  return a + b;
}

const obj = { x: 1, y: 2 };
type Id = string | number;
`;

const tsxContent = `import { useState } from 'react';

export function Block() {
  const [open, setOpen] = useState(false);
  return <div onClick={() => setOpen(!open)}>{open ? 'да' : 'нет'}</div>;
}
`;

const htmlContent = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Test</title>
</head>
<body>
  <main id="app"></main>
  <script src="app.js"></script>
</body>
</html>
`;

const cssContent = `:root {
  --color-bg: #fff;
  --color-text: #111;
}

.container {
  margin: 0 auto;
  max-width: 1200px;
  padding: 1rem;
}

.box {
  border: 1px solid var(--color-text);
  border-radius: 8px;
}
`;

const jsonContent = `{
  "name": "demo",
  "version": "1.0.0",
  "config": {
    "port": 3000,
    "env": "development"
  }
}
`;

const ymlContent = `name: app
version: "1.0.0"

server:
  port: 3000
  host: localhost

features:
  - auth
  - api
`;

const shContent = `#!/bin/bash
set -e
echo "Starting..."
npm run build
npm start
`;

const pyContent = `def hello(name: str) -> str:
    return f"Hello, {name}!"

def main():
    x = 42
    print(hello("World"))

if __name__ == "__main__":
    main()
`;

const demoValidationContent = `const a = 1;
\tconst b = 2;   
  const c = 3;
console.log(a, b, c);

const long = 'This line is longer than one hundred twenty characters so that the long line validation is triggered in the checks view when you open this file.';
`;

const svgTest = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 48" width="120" height="48">
  <rect width="120" height="48" fill="#1a1a2e" rx="8"/>
  <text x="60" y="30" font-family="sans-serif" font-size="18" font-weight="600" fill="#e6edf3" text-anchor="middle">тест</text>
</svg>`;

const svgLogo = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 40" width="80" height="40">
  <rect width="80" height="40" fill="#242b35" rx="6"/>
  <text x="40" y="26" font-family="sans-serif" font-size="14" fill="#a855f7" text-anchor="middle">Logo</text>
</svg>`;

const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <circle cx="32" cy="32" r="28" fill="#161b22" stroke="#30363d" stroke-width="2"/>
  <text x="32" y="40" font-family="sans-serif" font-size="20" font-weight="700" fill="#58a6ff" text-anchor="middle">G</text>
</svg>`;

export const mockFileByPath: Record<string, FileData> = {
  'docs/README.md': { content: mdFull, language: 'md' },
  'src/App.tsx': { content: tsxContent, language: 'tsx' },
  'src/app.ts': { content: tsContent, language: 'ts' },
  'src/style.css': { content: cssContent, language: 'css' },
  'src/demo-validation.ts': { content: demoValidationContent, language: 'ts' },
  'assets/logo.svg': { content: svgLogo, language: 'svg' },
  'assets/icon.svg': { content: svgIcon, language: 'svg' },
  'assets/test.svg': { content: svgTest, language: 'svg' },
  'index.html': { content: htmlContent, language: 'html' },
  'config.json': { content: jsonContent, language: 'json' },
  'config.yml': { content: ymlContent, language: 'yml' },
  'script.sh': { content: shContent, language: 'sh' },
  'main.py': { content: pyContent, language: 'py' },
};

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

export async function mockRequest<T>(data: T, ms = 80): Promise<T> {
  await delay(ms);
  return data;
}
