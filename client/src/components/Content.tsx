import { useMemo } from 'react';
import { Code, FileCode, ShieldCheck, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { useI18n, type Translations } from '../i18n';
import { validateFile, type ValidationIssue } from '../lib/validate';
import { highlightLine, getExtension } from '../lib/highlight';

interface ContentProps {
  selectedFile: string | null;
  diff: string;
  fileContent: string | null;
  viewMode: 'diff' | 'source' | 'checks';
  onChangeViewMode: (mode: 'diff' | 'source' | 'checks') => void;
}

function DiffViewer({ diff }: { diff: string }) {
  const lines = diff.split('\n');
  let addCount = 0;
  let delCount = 0;
  let lineNum = 0;

  const rows = lines.map((line, i) => {
    let cls = '';
    let sign = '\u00A0';

    if (line.startsWith('+') && !line.startsWith('+++')) {
      cls = 'dl-add'; sign = '+'; addCount++; lineNum++;
    } else if (line.startsWith('-') && !line.startsWith('---')) {
      cls = 'dl-del'; sign = '\u2212'; delCount++;
    } else if (line.startsWith('@@')) {
      cls = 'dl-hunk'; sign = '\u00A0';
      const m = line.match(/@@ -\d+,?\d* \+(\d+)/);
      if (m) lineNum = parseInt(m[1]) - 1;
    } else if (
      line.startsWith('diff ') || line.startsWith('index ') ||
      line.startsWith('---') || line.startsWith('+++')
    ) {
      cls = 'dl-meta'; sign = '\u00A0';
    } else {
      lineNum++;
    }

    const num = cls === 'dl-hunk' || cls === 'dl-meta' ? '' : lineNum;

    return (
      <div key={i} className={`dl ${cls}`}>
        <div className="dl-num">{num}</div>
        <div className="dl-sign">{sign}</div>
        <div className="dl-code">{line || '\u00A0'}</div>
      </div>
    );
  });

  return (
    <>
      <div className="content-stats">
        <span className="stat-add">+{addCount}</span>
        <span className="stat-del">&minus;{delCount}</span>
      </div>
      <div className="diff-body">{rows}</div>
    </>
  );
}

function CodeViewer({ content, ext }: { content: string; ext: string }) {
  const highlighted = useMemo(() => {
    return content.split('\n').map(line => highlightLine(line, ext));
  }, [content, ext]);

  return (
    <div className="code-body">
      {highlighted.map((tokens, i) => (
        <div key={i} className="cl">
          <div className="cl-num">{i + 1}</div>
          <div className="cl-code">
            {tokens.length === 0 ? '\u00A0' : tokens.map((token, j) =>
              token.type
                ? <span key={j} className={`hl-${token.type}`}>{token.value}</span>
                : token.value
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function ValidationView({ content, t }: { content: string; t: Translations }) {
  const issues = validateFile(content);
  const lineCount = content.split('\n').length;

  return (
    <div className="val-body">
      <div className="val-header">
        <span className="val-stat">{lineCount} {t.lines}</span>
        <span className={`val-badge ${issues.length === 0 ? 'val-ok' : 'val-warn'}`}>
          {issues.length === 0 ? t.noIssues : `${issues.length} ${t.issues}`}
        </span>
      </div>
      {issues.length === 0 ? (
        <div className="content-empty small">
          <CheckCircle size={32} strokeWidth={1.5} />
          <p>{t.noIssues}</p>
        </div>
      ) : (
        <div className="val-list">
          {issues.map((issue, i) => (
            <ValidationItem key={i} issue={issue} t={t} />
          ))}
        </div>
      )}
    </div>
  );
}

function ValidationItem({ issue, t }: { issue: ValidationIssue; t: Translations }) {
  const msg = t[issue.key as keyof Translations] ?? issue.key;

  return (
    <div className={`val-item val-${issue.type}`}>
      <div className="val-item-icon">
        {issue.type === 'warning' ? <AlertTriangle size={14} /> : <Info size={14} />}
      </div>
      <span className="val-count">{issue.count}</span>
      <span className="val-msg">{msg}</span>
      {issue.lines && issue.lines.length <= 6 && (
        <span className="val-lines">
          {issue.lines.map(l => `L${l}`).join(', ')}
        </span>
      )}
    </div>
  );
}

export function Content({
  selectedFile, diff, fileContent, viewMode, onChangeViewMode,
}: ContentProps) {
  const { t } = useI18n();
  const ext = selectedFile ? getExtension(selectedFile) : '';

  if (!selectedFile) {
    return (
      <div className="content">
        <div className="content-empty">
          <Code size={48} strokeWidth={1} />
          <p>{t.selectFile}</p>
          <span>{t.selectFileHint}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="content">
      <div className="content-header">
        <div className="content-tabs">
          <button
            className={`content-tab${viewMode === 'diff' ? ' active' : ''}`}
            onClick={() => onChangeViewMode('diff')}
          >
            <Code size={13} />
            {t.changes}
          </button>
          <button
            className={`content-tab${viewMode === 'source' ? ' active' : ''}`}
            onClick={() => onChangeViewMode('source')}
          >
            <FileCode size={13} />
            {t.source}
          </button>
          <button
            className={`content-tab${viewMode === 'checks' ? ' active' : ''}`}
            onClick={() => onChangeViewMode('checks')}
          >
            <ShieldCheck size={13} />
            {t.checks}
          </button>
        </div>
        <span className="content-filename">{selectedFile}</span>
      </div>

      <div className="content-body">
        {viewMode === 'diff' ? (
          diff ? (
            <DiffViewer diff={diff} />
          ) : (
            <div className="content-empty small">
              <p>{t.noChanges}</p>
              <span>{t.noChangesHint}</span>
            </div>
          )
        ) : viewMode === 'source' ? (
          fileContent !== null ? (
            <CodeViewer content={fileContent} ext={ext} />
          ) : (
            <div className="content-empty small">
              <p>{t.unableToLoad}</p>
            </div>
          )
        ) : fileContent !== null ? (
          <ValidationView content={fileContent} t={t} />
        ) : (
          <div className="content-empty small">
            <p>{t.unableToLoad}</p>
          </div>
        )}
      </div>
    </div>
  );
}
