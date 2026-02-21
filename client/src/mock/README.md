# Mock-режим: проверка стилей без сервера

В mock-режиме запросы к API не уходят на сервер — клиент подставляет данные из **mockData.ts**. Так можно верстать и проверять интерфейс без запуска бэкенда и без Git-репозитория.

---

## Как включить

- **Разработка:** из корня репо `npm run dev:mock`, либо из папки client: `npm run dev:mock`.
- **Сборка:** из корня `npm run build:mock`, либо из client: `npm run build:mock`. В **web/** попадёт сборка с заглушками; можно раздавать статически.

Режим включается переменной **VITE_USE_MOCK=true** (файл **.env.mock** в client, подхватывается при `--mode mock`).

---

## Файл mockData.ts

В нём заданы ответы в том же формате, что и [реальное API сервера](../../../server/README.md#примеры-ответов):

| Переменная | Подменяет | Формат (как в API) |
|------------|-----------|---------------------|
| `mockProjectInfo` | GET /api/info | `{ cwd, hasGit, name }` |
| `mockStatus` | GET /api/status | Ветка, remoteUrl, files[], счётчики |
| `mockTree` | GET /api/tree | Массив TreeEntry (дерево папок/файлов) |
| `mockDiffByFile` | GET /api/diff?file=... | Объект «путь → строка диффа» |
| `mockFileByPath` | GET /api/file?path=... | Объект «путь → { content, language }» |
| `mockRequest(data, ms)` | — | Утилита: возвращает `data` с задержкой `ms` мс |

Методы `submit`, `init`, `disconnect` в mock всегда возвращают успешный ответ без реальных действий.

---

## Примеры форматов данных (как в API)

Эти же структуры используй в **mockData.ts** (типы импортируются из **../types**).

**info** (GET /api/info):

```json
{
  "cwd": "/путь/к/проекту",
  "hasGit": true,
  "name": "имя-папки"
}
```

**status** (GET /api/status):

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
    { "path": "new.js", "status": "untracked" }
  ],
  "ahead": 0,
  "behind": 0
}
```

Статусы файла: `staged`, `modified`, `untracked`, `deleted`.

**tree** (GET /api/tree):

```json
[
  {
    "name": "src",
    "path": "src",
    "type": "dir",
    "children": [
      { "name": "App.tsx", "path": "src/App.tsx", "type": "file" }
    ]
  },
  { "name": "package.json", "path": "package.json", "type": "file" }
]
```

**diff** (GET /api/diff?file=...): ответ `{ "diff": "строка с диффом" }`. В mock — объект `mockDiffByFile`: ключ = путь к файлу, значение = строка диффа.

**file** (GET /api/file?path=...): ответ `{ "content": "текст файла", "language": "md" }`. В mock — объект `mockFileByPath`: ключ = путь, значение = `{ content, language }`.

---

## Как править заглушки

1. Открой **client/src/mock/mockData.ts**.
2. Меняй константы под нужный сценарий:
   - **mockProjectInfo** — `name` (имя проекта), `hasGit: true/false` (показать экран «нет репо» или основной интерфейс).
   - **mockStatus** — ветка, количество staged/modified, массив **files** с путями и статусами.
   - **mockTree** — массив узлов: папки с **children**, файлы без **children**; у каждого **name**, **path**, **type** (`"file"` или `"dir"`).
   - **mockDiffByFile** — добавь ключ с путём файла и строку диффа (как выводит `git diff`).
   - **mockFileByPath** — добавь ключ с путём и объект `{ content: "текст", language: "ts" }` (language — расширение для подсветки: ts, js, json, md и т.д.).
3. Сохрани; при `npm run dev:mock` страница подхватит изменения после перезагрузки.

Типы (ProjectInfo, GitStatus, TreeEntry) импортируются из **../types** — структура должна совпадать с API, иначе TypeScript выдаст ошибки.
