# Server (бэкенд)

Node.js-сервер: раздаёт статику из папки **web/** (собранный клиент), отдаёт REST API по Git и дереву файлов, держит WebSocket для обновления статуса при изменении файлов. Запускается из **dist/cli.js** (после `npm run build:server` из корня).

---

## Структура

```
server/
  src/
    cli.ts             — точка входа: выбор порта, startServer(), открытие браузера
    port.ts            — проверка занятости порта, выбор свободного (4219 или случайный)
    server/
      index.ts         — Express: статика, маршруты /api/*, WebSocket /ws
    services/
      git.ts           — Git (simple-git): статус, дифф, add, commit, push, init, remote
      fileTree.ts      — дерево файлов с учётом .gitignore
  tsconfig.json
```

Сборка: из корня `npm run build:server` → в корне появляется **dist/** (cli.js, server/, services/).

---

## Порт

- По умолчанию **4219**. Если занят — автоматически выбирается свободный (логика в **src/port.ts**).
- Задать вручную: переменная окружения **KLPGIT_PORT** (например `KLPGIT_PORT=3000`).

---

## API

Базовый URL: `http://localhost:ПОРТ`. Все ответы — **JSON**. При ошибке: `{ "error": "строка" }`, код ответа 4xx/5xx.

### GET-маршруты

| Путь | Описание |
|------|-----------|
| `/api/info` | Информация о текущей рабочей папке (cwd, есть ли Git, имя). |
| `/api/status` | Полный статус Git: ветка, remote, список файлов, счётчики. |
| `/api/tree` | Дерево файлов (папки и файлы, с учётом .gitignore). |
| `/api/diff?file=<путь>` | Дифф по одному файлу. |
| `/api/file?path=<путь>` | Содержимое файла и расширение для подсветки. |

### POST-маршруты

| Путь | Body (JSON) | Описание |
|------|-------------|----------|
| `/api/add` | `{ "files": ["."] }` или массив путей | Добавить файлы в индекс. |
| `/api/submit` | `{ "message": "текст коммита", "files": ["."] }` | Коммит и пуш. `files` — массив путей или `["."]` для всех. |
| `/api/init` | `{ "remoteUrl": "https://..." }` (опционально) | Инициализация репо, при необходимости добавление remote. |
| `/api/disconnect` | — | Удалить remote origin. |

---

## Примеры запросов

**GET /api/info** (без тела):

```http
GET /api/info
```

**GET /api/diff** (query-параметр):

```http
GET /api/diff?file=src/App.tsx
```

**GET /api/file** (query-параметр):

```http
GET /api/file?path=README.md
```

**POST /api/submit** (тело JSON):

```http
POST /api/submit
Content-Type: application/json

{
  "message": "Исправлена вёрстка",
  "files": ["."]
}
```

**POST /api/add**:

```http
POST /api/add
Content-Type: application/json

{
  "files": ["src/App.tsx", "README.md"]
}
```

**POST /api/init** (с remote):

```http
POST /api/init
Content-Type: application/json

{
  "remoteUrl": "https://github.com/user/repo.git"
}
```

---

## Примеры ответов

**GET /api/info**

```json
{
  "cwd": "D:\\Project\\MyRepo",
  "hasGit": true,
  "name": "MyRepo"
}
```

**GET /api/status**

```json
{
  "branch": "main",
  "remoteUrl": "https://github.com/user/repo.git",
  "staged": 2,
  "modified": 3,
  "total": 5,
  "files": [
    { "path": "src/App.tsx", "status": "staged" },
    { "path": "README.md", "status": "modified" },
    { "path": "package.json", "status": "untracked" }
  ],
  "ahead": 0,
  "behind": 0
}
```

Статусы файлов: `staged`, `modified`, `untracked`, `deleted`.

**GET /api/tree**

```json
[
  {
    "name": "src",
    "path": "src",
    "type": "dir",
    "children": [
      { "name": "App.tsx", "path": "src/App.tsx", "type": "file" },
      { "name": "index.ts", "path": "src/index.ts", "type": "file" }
    ]
  },
  { "name": "package.json", "path": "package.json", "type": "file" }
]
```

**GET /api/diff?file=README.md**

```json
{
  "diff": "--- a/README.md\n+++ b/README.md\n@@ -1,3 +1,4 @@\n # Title\n+New line\n"
}
```

**GET /api/file?path=README.md**

```json
{
  "content": "# Title\n\nText here.\n",
  "language": "md"
}
```

**POST /api/submit** (успех)

```json
{
  "ok": true,
  "hash": "a1b2c3d",
  "branch": "main"
}
```

**POST /api/add** (успех)

```json
{
  "ok": true,
  "status": { ... }
}
```

Поле `status` — тот же объект, что возвращает GET /api/status.

**POST /api/init** и **POST /api/disconnect** (успех)

```json
{
  "ok": true
}
```

**Ошибка (например 400)**

```json
{
  "error": "Commit message required"
}
```

---

## WebSocket

- URL: `ws://localhost:ПОРТ/ws`
- После подключения сервер при изменении файлов в рабочей директории шлёт сообщения в формате:

```json
{
  "event": "status",
  "data": { ... }
}
```

`data` — объект того же формата, что и ответ GET /api/status.
