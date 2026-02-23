import { useMemo, useState, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';
import { Code, FileCode, ShieldCheck, AlertTriangle, Info, CheckCircle, Eye, FileText, Copy } from 'lucide-react';
import { useI18n, type Translations } from '../i18n';
import type { FileData } from '../types';
import { validateFile, type ValidationIssue } from '../lib/validate';
import { highlightLine, getExtension } from '../lib/highlight';
import { api } from '../api';

const MD_LANG_TO_EXT: Record<string, string> = {
  javascript: 'js', js: 'js', typescript: 'ts', ts: 'ts', tsx: 'tsx',
  json: 'json', bash: 'sh', shell: 'sh', sh: 'sh', html: 'html', css: 'css',
  python: 'py', py: 'py', yaml: 'yml', yml: 'yml',
};

function MdCodeBlock({ code, lang }: { code: string; lang: string }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  const ext = MD_LANG_TO_EXT[lang.toLowerCase()] ?? lang.toLowerCase();
  const lines = useMemo(() => code.split('\n').map(line => highlightLine(line, ext)), [code, ext]);
  const label = lang || 'plain';
  const copyCode = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <div className="md-code-block">
      <div className="md-code-block-head">
        <span className="md-code-block-lang">{label}</span>
        <button type="button" className="md-code-block-copy" onClick={copyCode} title={t.copy}>
          <Copy size={12} />
          {copied ? t.copied : t.copy}
        </button>
      </div>
      <pre className="md-preview-pre">
        <code>
          {lines.map((tokens, i) => (
            <div key={i} className="md-preview-code-line">
              {tokens.length === 0 ? '\u00A0' : tokens.map((token, j) =>
                token.type
                  ? <span key={j} className={`hl-${token.type}`}>{token.value}</span>
                  : token.value
              )}
            </div>
          ))}
        </code>
      </pre>
    </div>
  );
}

interface ContentProps {
  selectedFile: string | null;
  diff: string;
  fileData: FileData | null;
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
    const codeText = (cls === 'dl-add' || cls === 'dl-del') ? (line.slice(1) || '\u00A0') : (line || '\u00A0');
    return (
      <div key={i} className={`dl ${cls}`}>
        <div className="dl-num">{num}</div>
        <div className="dl-sign">{sign}</div>
        <div className="dl-code">{codeText}</div>
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

function MdImage({ src, resolve, alt }: { src: string; resolve: (path: string) => Promise<string>; alt?: string }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    resolve(src).then((url) => { if (!cancelled) setDataUrl(url); });
    return () => { cancelled = true; };
  }, [src, resolve]);
  if (!dataUrl) return <span className="md-preview-img-placeholder">{alt || src}</span>;
  return <img src={dataUrl} alt={alt || ''} className="md-preview-inline-img" />;
}

function MarkdownPreview({
  content,
  resolveImage,
}: {
  content: string;
  resolveImage?: (path: string) => Promise<string>;
}) {
  const components: Components = {
    code: ({ node, className, children, ...props }) => {
      const raw = Array.isArray(className) ? className[0] : className;
      const langMatch = raw ? String(raw).match(/language-(\w+)/) : null;
      const isBlock = raw && String(raw).includes('language-');
      const code = String(children).replace(/\n$/, '');
      if (langMatch) return <MdCodeBlock code={code} lang={langMatch[1]} />;
      if (isBlock) return <MdCodeBlock code={code} lang="plain" />;
      return <code {...props}>{children}</code>;
    },
    img: ({ src, alt }) => {
      if (!src) return null;
      if (src.startsWith('data:') || src.startsWith('http://') || src.startsWith('https://')) {
        return <img src={src} alt={alt || ''} className="md-preview-inline-img" />;
      }
      if (resolveImage) return <MdImage src={src} resolve={resolveImage} alt={alt} />;
      return <img src={src} alt={alt || ''} className="md-preview-inline-img" />;
    },
  };
  return (
    <div className="md-preview-wrap">
      <div className="md-preview">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>{content}</ReactMarkdown>
      </div>
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

const MD_EXT = ['md', 'mdx'];
const IMAGE_EXT = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'];

function getImageDataUrl(content: string, ext: string, encoding?: string): string {
  if (ext === 'svg') {
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(content);
  }
  if (encoding === 'base64') {
    const mime = ext === 'jpg' || ext === 'jpeg' ? 'jpeg' : ext;
    return `data:image/${mime};base64,${content}`;
  }
  return '';
}

function ImageView({ content, ext, encoding }: { content: string; ext: string; encoding?: string }) {
  const src = getImageDataUrl(content, ext, encoding);
  if (!src) return null;
  return (
    <div className="content-media-wrap content-media-center">
      <img src={src} alt="" className="content-media-img" />
    </div>
  );
}

export function Content({
  selectedFile, diff, fileData, viewMode, onChangeViewMode,
}: ContentProps) {
  const { t } = useI18n();
  const ext = selectedFile ? getExtension(selectedFile) : '';
  const isMd = MD_EXT.includes(ext);
  const isImageOrSvg = IMAGE_EXT.includes(ext);
  const [mdViewMode, setMdViewMode] = useState<'preview' | 'raw'>('preview');
  const [mediaViewMode, setMediaViewMode] = useState<'preview' | 'code'>('preview');
  const fileContent = fileData?.content ?? null;

  useEffect(() => {
    if (selectedFile && isMd) setMdViewMode('preview');
  }, [selectedFile, isMd]);

  useEffect(() => {
    if (selectedFile && isImageOrSvg) setMediaViewMode('preview');
  }, [selectedFile, isImageOrSvg]);

  const basePath = selectedFile ? selectedFile.replace(/\/[^/]*$/, '') : '';
  const resolveImage = useCallback(async (rel: string) => {
    const path = rel.startsWith('/') ? rel.slice(1) : (basePath ? basePath + '/' + rel : rel);
    try {
      const data = await api.file(path);
      return getImageDataUrl(data.content, getExtension(path), data.encoding) || '';
    } catch {
      return '';
    }
  }, [basePath]);

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
            <>
              {isImageOrSvg ? (
                <>
                  <div className="md-toolbar">
                    <div className="md-toggle">
                      <button
                        type="button"
                        className={`md-toggle-btn${mediaViewMode === 'preview' ? ' active' : ''}`}
                        onClick={() => setMediaViewMode('preview')}
                      >
                        <Eye size={14} />
                        {t.mdPreview}
                      </button>
                      <button
                        type="button"
                        className={`md-toggle-btn${mediaViewMode === 'code' ? ' active' : ''}`}
                        onClick={() => setMediaViewMode('code')}
                      >
                        <FileText size={14} />
                        {t.mdCode}
                      </button>
                    </div>
                  </div>
                  {mediaViewMode === 'preview' ? (
                    <ImageView content={fileContent} ext={ext} encoding={fileData?.encoding} />
                  ) : (
                    <CodeViewer content={fileContent} ext={ext === 'svg' ? 'svg' : 'txt'} />
                  )}
                </>
              ) : (
                <>
                  {isMd && (
                    <div className="md-toolbar">
                      <div className="md-toggle">
                        <button
                          type="button"
                          className={`md-toggle-btn${mdViewMode === 'preview' ? ' active' : ''}`}
                          onClick={() => setMdViewMode('preview')}
                        >
                          <Eye size={14} />
                          {t.mdPreview}
                        </button>
                        <button
                          type="button"
                          className={`md-toggle-btn${mdViewMode === 'raw' ? ' active' : ''}`}
                          onClick={() => setMdViewMode('raw')}
                        >
                          <FileText size={14} />
                          {t.mdCode}
                        </button>
                      </div>
                    </div>
                  )}
                  {isMd && mdViewMode === 'preview' ? (
                    <MarkdownPreview content={fileContent} resolveImage={resolveImage} />
                  ) : (
                    <CodeViewer content={fileContent} ext={ext} />
                  )}
                </>
              )}
            </>
          ) : (
            <div className="content-empty small">
              <p>{t.unableToLoad}</p>
            </div>
          )
        ) : fileContent !== null && !isImageOrSvg ? (
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
