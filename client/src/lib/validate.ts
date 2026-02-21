export type ValidationKey =
  | 'longLines'
  | 'trailingWs'
  | 'missingNewline'
  | 'todoComments'
  | 'consoleStmts'
  | 'mixedIndent'
  | 'fileTooLarge';

export interface ValidationIssue {
  type: 'warning' | 'info';
  key: ValidationKey;
  count: number;
  lines?: number[];
}

export function validateFile(content: string): ValidationIssue[] {
  const lines = content.split('\n');
  const issues: ValidationIssue[] = [];

  if (content.length > 100 * 1024) {
    issues.push({ type: 'warning', key: 'fileTooLarge', count: 1 });
  }

  const longLineNums = lines.reduce<number[]>((acc, l, i) => {
    if (l.length > 120) acc.push(i + 1);
    return acc;
  }, []);
  if (longLineNums.length > 0) {
    issues.push({ type: 'warning', key: 'longLines', count: longLineNums.length, lines: longLineNums });
  }

  const trailingNums = lines.reduce<number[]>((acc, l, i) => {
    if (l.length > 0 && l !== l.trimEnd()) acc.push(i + 1);
    return acc;
  }, []);
  if (trailingNums.length > 0) {
    issues.push({ type: 'warning', key: 'trailingWs', count: trailingNums.length, lines: trailingNums });
  }

  if (content.length > 0 && !content.endsWith('\n')) {
    issues.push({ type: 'info', key: 'missingNewline', count: 1 });
  }

  const todoNums = lines.reduce<number[]>((acc, l, i) => {
    if (/\b(TODO|FIXME|HACK|XXX)\b/i.test(l)) acc.push(i + 1);
    return acc;
  }, []);
  if (todoNums.length > 0) {
    issues.push({ type: 'info', key: 'todoComments', count: todoNums.length, lines: todoNums });
  }

  const consoleNums = lines.reduce<number[]>((acc, l, i) => {
    if (/console\.(log|warn|error|debug|info|trace)\s*\(/.test(l)) acc.push(i + 1);
    return acc;
  }, []);
  if (consoleNums.length > 0) {
    issues.push({ type: 'warning', key: 'consoleStmts', count: consoleNums.length, lines: consoleNums });
  }

  const hasSpaces = lines.some(l => /^ {2,}/.test(l));
  const hasTabs = lines.some(l => /^\t/.test(l));
  if (hasSpaces && hasTabs) {
    issues.push({ type: 'warning', key: 'mixedIndent', count: 1 });
  }

  return issues;
}
