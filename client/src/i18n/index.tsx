import { createContext, useContext, type ReactNode } from 'react';

export type Lang = 'en' | 'ru';

const en = {
  connected: 'Connected',
  disconnected: 'Disconnected',
  refresh: 'Refresh',
  submit: 'Submit',
  staged: 'STAGED',
  changed: 'CHANGED',
  clean: 'CLEAN',
  explorer: 'Explorer',
  checked: 'checked',
  searchFiles: 'Search files...',
  noFiles: 'No files found',
  changes: 'Changes',
  source: 'Source',
  checks: 'Checks',
  selectFile: 'Select a file to view',
  selectFileHint: 'Click on a file in the sidebar',
  noChanges: 'No changes',
  noChangesHint: 'This file has no uncommitted changes',
  unableToLoad: 'Unable to load file',
  issues: 'issues',
  noIssues: 'No issues found',
  lines: 'lines',
  longLines: 'long lines (>120 chars)',
  trailingWs: 'lines with trailing whitespace',
  missingNewline: 'Missing newline at end of file',
  todoComments: 'TODO/FIXME comments',
  consoleStmts: 'console statements',
  mixedIndent: 'Mixed indentation (tabs + spaces)',
  fileTooLarge: 'File too large (>100 KB)',
  submitChanges: 'Submit Changes',
  chooseCommit: 'Choose what to include in this commit',
  addAll: 'Add all & commit',
  addAllDesc: 'Stage everything, then commit and push',
  addChecked: 'Add checked',
  addCheckedDesc: 'Only stage files you checked in the tree',
  commitStaged: 'Commit staged only',
  commitStagedDesc: 'Commit files already in the staging area',
  cancel: 'Cancel',
  next: 'Next',
  back: 'Back',
  commitMessage: 'Commit Message',
  commitMessageHint: 'First line — short summary. Empty line, then details (optional).',
  commitPlaceholder: 'What did you change?',
  commitSubmitHint: 'Ctrl+Enter to commit and push',
  commitAndPush: 'Commit & Push',
  pushing: 'Pushing...',
  refreshed: 'Refreshed',
  pushedTo: 'Pushed to',
  noFilesChecked: 'No files checked!',
  repoInitialized: 'Repository initialized!',
  noRepo: 'No Git repository found. Enter a remote URL to initialize:',
  initRepo: 'Initialize Repository',
  unlinkRepo: 'Disconnect',
  repoUnlinked: 'Remote disconnected!',
};

const ru: typeof en = {
  connected: 'Подключено',
  disconnected: 'Отключено',
  refresh: 'Обновить',
  submit: 'Отправить',
  staged: 'В ИНДЕКСЕ',
  changed: 'ИЗМЕНЕНО',
  clean: 'ЧИСТО',
  explorer: 'Проводник',
  checked: 'выбрано',
  searchFiles: 'Поиск файлов...',
  noFiles: 'Файлы не найдены',
  changes: 'Изменения',
  source: 'Код',
  checks: 'Проверка',
  selectFile: 'Выберите файл',
  selectFileHint: 'Нажмите на файл в боковой панели',
  noChanges: 'Нет изменений',
  noChangesHint: 'Нет незакоммиченных изменений',
  unableToLoad: 'Не удалось загрузить',
  issues: 'проблем',
  noIssues: 'Проблем не найдено',
  lines: 'строк',
  longLines: 'длинных строк (>120)',
  trailingWs: 'строк с пробелами в конце',
  missingNewline: 'Нет новой строки в конце файла',
  todoComments: 'TODO/FIXME комментарии',
  consoleStmts: 'console вызовы',
  mixedIndent: 'Смешанные отступы (табы + пробелы)',
  fileTooLarge: 'Файл слишком большой (>100 КБ)',
  submitChanges: 'Отправить изменения',
  chooseCommit: 'Выберите что включить в коммит',
  addAll: 'Добавить всё',
  addAllDesc: 'Всё в индекс, коммит и пуш',
  addChecked: 'Добавить отмеченные',
  addCheckedDesc: 'Только отмеченные файлы',
  commitStaged: 'Из индекса',
  commitStagedDesc: 'Файлы уже в индексе',
  cancel: 'Отмена',
  next: 'Далее',
  back: 'Назад',
  commitMessage: 'Сообщение коммита',
  commitMessageHint: 'Первая строка — кратко. Пустая строка, затем детали (по желанию).',
  commitPlaceholder: 'Что вы изменили?',
  commitSubmitHint: 'Ctrl+Enter — коммит и пуш',
  commitAndPush: 'Коммит и Пуш',
  pushing: 'Отправка...',
  refreshed: 'Обновлено',
  pushedTo: 'Запушено в',
  noFilesChecked: 'Нет выбранных файлов!',
  repoInitialized: 'Репозиторий создан!',
  noRepo: 'Git-репозиторий не найден. Введите URL:',
  initRepo: 'Инициализировать',
  unlinkRepo: 'Отвязать',
  repoUnlinked: 'Удалённый репозиторий отвязан!',
};

export type Translations = typeof en;

const translations: Record<Lang, Translations> = { en, ru };

interface I18nContextValue {
  lang: Lang;
  t: Translations;
  setLang: (l: Lang) => void;
}

const I18nContext = createContext<I18nContextValue>(null!);

export function useI18n() {
  return useContext(I18nContext);
}

export function I18nProvider({
  lang,
  setLang,
  children,
}: {
  lang: Lang;
  setLang: (l: Lang) => void;
  children: ReactNode;
}) {
  return (
    <I18nContext.Provider value={{ lang, t: translations[lang], setLang }}>
      {children}
    </I18nContext.Provider>
  );
}
