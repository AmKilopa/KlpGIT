# Client (фронтенд)

React-приложение: интерфейс KlpGit (дерево файлов, диффы, коммит, пуш). Собирается Vite в папку **web/** в корне репозитория.

---

## Структура

```
client/
  src/
    main.tsx           — точка входа, подключение стилей
    App.tsx            — главный экран, состояние, вызовы API, WebSocket
    api/               — слой запросов к серверу (или к mock)
    components/        — UI: Titlebar, Toolbar, Sidebar, Content, Modal, Toast и др.
    i18n/              — тексты интерфейса (словари)
    lib/               — подсветка кода (highlight), проверки файлов (validate)
    mock/              — заглушки для mock-режима
    styles/            — глобальные стили (index.css)
    types/             — типы (ProjectInfo, GitStatus, TreeEntry, Toast)
  index.html
  vite.config.ts
  .env.mock            — VITE_USE_MOCK=true для режима mock
```

---

## Скрипты (из папки client)

| Скрипт | Действие |
|--------|----------|
| `npm run dev` | Vite в режиме разработки. Запросы проксируются на сервер (порт из `KLPGIT_PORT` или 4219). Сервер должен быть запущен отдельно. |
| `npm run dev:mock` | То же, но без сервера: данные из [mock](src/mock/README.md). |
| `npm run build` | Сборка в **../web/** (режим «боевой», запросы к реальному API). |
| `npm run build:mock` | Сборка в **../web/** с заглушками (можно раздавать статически). |

Из корня репозитория те же сценарии: `npm run dev`, `npm run dev:mock`, `npm run build:mock` (корневой package.json вызывает скрипты в client).

---

## Стили и вёрстка

- Один файл стилей: **src/styles/index.css**.
- В нём: CSS-переменные (тема, цвета), сетка (`.app`, `.main`, `.sidebar`, `.content`), кнопки (`.btn`, `.btn-primary`, `.btn-ghost`), модалки, тосты, дифф и код.
- Компоненты в **src/components/** используют только эти классы, без внешней UI-библиотеки.

Чтобы поменять внешний вид — правь **src/styles/index.css** и при необходимости компоненты в **src/components/**.

---

## Слой API (src/api/)

- **src/api/index.ts** — объект `api`: методы `info()`, `status()`, `tree()`, `diff(file)`, `file(path)`, `submit(message, files)`, `init(remoteUrl?)`, `disconnect()`.
- Если в окружении выставлен **VITE_USE_MOCK=true** (режим mock), запросы не уходят на сервер — возвращаются данные из **src/mock/mockData.ts** (те же форматы, что у реального API).
- Форматы ответов совпадают с [серверным API](../server/README.md#примеры-ответов).

---

## Mock-режим

Когда нужна только проверка стилей без сервера и без Git:

- Запуск из корня: `npm run dev:mock`, либо из client: `npm run dev:mock`.
- Данные берутся из **src/mock/mockData.ts**. Форматы и примеры описаны в **[src/mock/README.md](src/mock/README.md)**.
