type TokenType = 'keyword' | 'string' | 'comment' | 'number' | 'bool' | 'fn' | 'type' | 'tag' | 'attr';

interface Token {
  type: TokenType | null;
  value: string;
}

const LANG_MAP: Record<string, string> = {
  js: 'js', jsx: 'js', mjs: 'js', cjs: 'js',
  ts: 'js', tsx: 'js', mts: 'js', cts: 'js',
  py: 'py', pyw: 'py',
  css: 'css', scss: 'css', less: 'css',
  json: 'json', jsonc: 'json',
  html: 'html', htm: 'html', xml: 'html', svg: 'html', vue: 'html', svelte: 'html',
  md: 'md', mdx: 'md',
  rb: 'rb', ruby: 'rb',
  go: 'go',
  rs: 'rs', rust: 'rs',
  java: 'java', kt: 'java', kts: 'java', scala: 'java',
  c: 'c', cpp: 'c', cc: 'c', h: 'c', hpp: 'c',
  sh: 'sh', bash: 'sh', zsh: 'sh', fish: 'sh',
  yaml: 'yaml', yml: 'yaml',
  toml: 'toml',
  sql: 'sql',
  php: 'php',
};

const JS_RE = /(?<comment>\/\/.*$|\/\*[\s\S]*?\*\/)|(?<string>"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|(?<number>\b\d+\.?\d*(?:e[+-]?\d+)?\b)|(?<keyword>\b(?:const|let|var|function|class|if|else|return|import|export|from|async|await|for|while|do|try|catch|throw|new|typeof|instanceof|interface|type|enum|extends|implements|default|switch|case|break|continue|finally|void|delete|yield|of|in|as|super|this|static|public|private|protected|readonly|abstract|declare|module|namespace|require|keyof|infer)\b)|(?<bool>\b(?:true|false|null|undefined|NaN|Infinity)\b)|(?<fn>\b[a-zA-Z_$][\w$]*(?=\s*\())|(?<type>\b[A-Z][\w]*\b)/gm;

const PY_RE = /(?<comment>#.*$)|(?<string>"""[\s\S]*?"""|'''[\s\S]*?'''|f?"(?:[^"\\]|\\.)*"|f?'(?:[^'\\]|\\.)*')|(?<number>\b\d+\.?\d*(?:e[+-]?\d+)?\b)|(?<keyword>\b(?:def|class|if|elif|else|for|while|return|import|from|as|try|except|finally|raise|with|yield|pass|break|continue|and|or|not|in|is|lambda|async|await|global|nonlocal|assert|del|print)\b)|(?<bool>\b(?:True|False|None)\b)|(?<fn>\b[a-zA-Z_][\w]*(?=\s*\())|(?<type>\b[A-Z][\w]*\b)/gm;

const CSS_RE = /(?<comment>\/\*[\s\S]*?\*\/)|(?<string>"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|(?<number>\b\d+\.?\d*(?:px|em|rem|%|vh|vw|vmin|vmax|s|ms|deg|fr|ch)?\b)|(?<keyword>\b(?:important|inherit|initial|unset|revert|none|auto|solid|dashed|flex|grid|block|inline|inline-block|relative|absolute|fixed|sticky|hidden|visible|scroll|wrap|nowrap|center|normal|bold|italic)\b)|(?<fn>[.#:]+[\w-]+)|(?<type>@[\w-]+)/gm;

const JSON_RE = /(?<string>"(?:[^"\\]|\\.)*"(?=\s*:))|(?<attr>"(?:[^"\\]|\\.)*")|(?<number>\b-?\d+\.?\d*(?:e[+-]?\d+)?\b)|(?<bool>\b(?:true|false|null)\b)/gm;

const HTML_RE = /(?<comment><!--[\s\S]*?-->)|(?<string>"[^"]*"|'[^']*')|(?<tag><\/?[\w-]+|\/?>)|(?<attr>\b[\w-]+(?==))/gm;

const RB_RE = /(?<comment>#.*$)|(?<string>"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|(?<number>\b\d+\.?\d*\b)|(?<keyword>\b(?:def|class|module|if|elsif|else|unless|while|until|for|do|end|begin|rescue|ensure|return|yield|require|include|extend|attr_accessor|attr_reader|attr_writer|puts|raise|then|and|or|not|in|self|super|nil|true|false)\b)|(?<bool>\b(?:true|false|nil)\b)|(?<fn>\b[a-zA-Z_][\w]*[!?]?(?=[\s(]))|(?<type>\b[A-Z][\w]*\b)/gm;

const GO_RE = /(?<comment>\/\/.*$|\/\*[\s\S]*?\*\/)|(?<string>"(?:[^"\\]|\\.)*"|`[^`]*`)|(?<number>\b\d+\.?\d*\b)|(?<keyword>\b(?:func|package|import|var|const|type|struct|interface|map|chan|go|defer|return|if|else|for|range|switch|case|default|break|continue|select|fallthrough)\b)|(?<bool>\b(?:true|false|nil|iota)\b)|(?<fn>\b[a-zA-Z_][\w]*(?=\s*\())|(?<type>\b[A-Z][\w]*\b)/gm;

const RS_RE = /(?<comment>\/\/.*$|\/\*[\s\S]*?\*\/)|(?<string>"(?:[^"\\]|\\.)*")|(?<number>\b\d+\.?\d*\b)|(?<keyword>\b(?:fn|let|mut|pub|use|mod|struct|enum|impl|trait|match|if|else|for|while|loop|return|break|continue|where|async|await|move|ref|self|super|crate|as|in|type|const|static|unsafe|extern)\b)|(?<bool>\b(?:true|false)\b)|(?<fn>\b[a-zA-Z_][\w]*(?=\s*[\(<]))|(?<type>\b[A-Z][\w]*\b)/gm;

const JAVA_RE = /(?<comment>\/\/.*$|\/\*[\s\S]*?\*\/)|(?<string>"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|(?<number>\b\d+\.?\d*[fFdDlL]?\b)|(?<keyword>\b(?:class|interface|extends|implements|import|package|public|private|protected|static|final|abstract|void|return|if|else|for|while|do|switch|case|break|continue|try|catch|finally|throw|throws|new|this|super|instanceof|default|synchronized|volatile|transient|native|enum|assert|var|val|fun|object|override|when|sealed|data|companion)\b)|(?<bool>\b(?:true|false|null)\b)|(?<fn>\b[a-zA-Z_][\w]*(?=\s*\())|(?<type>\b[A-Z][\w]*\b)/gm;

const C_RE = /(?<comment>\/\/.*$|\/\*[\s\S]*?\*\/)|(?<string>"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|(?<number>\b\d+\.?\d*[fFuUlL]*\b)|(?<keyword>\b(?:auto|break|case|char|const|continue|default|do|double|else|enum|extern|float|for|goto|if|inline|int|long|register|return|short|signed|sizeof|static|struct|switch|typedef|union|unsigned|void|volatile|while|class|namespace|template|typename|using|virtual|public|private|protected|override|nullptr|constexpr|noexcept|include|define|ifdef|ifndef|endif|pragma)\b)|(?<bool>\b(?:true|false|NULL|nullptr)\b)|(?<fn>\b[a-zA-Z_][\w]*(?=\s*\())|(?<type>\b[A-Z][\w]*\b)/gm;

const SH_RE = /(?<comment>#.*$)|(?<string>"(?:[^"\\]|\\.)*"|'[^']*')|(?<number>\b\d+\b)|(?<keyword>\b(?:if|then|else|elif|fi|for|while|do|done|case|esac|function|return|exit|echo|export|source|alias|local|readonly|shift|eval|exec|set|unset|trap|cd|pwd|ls|cat|grep|sed|awk|chmod|chown|mkdir|rm|cp|mv|ln|find|xargs|pipe|read|test)\b)|(?<fn>\$[\w{]+)/gm;

const YAML_RE = /(?<comment>#.*$)|(?<string>"(?:[^"\\]|\\.)*"|'[^']*')|(?<number>\b\d+\.?\d*\b)|(?<keyword>[\w.-]+(?=\s*:))|(?<bool>\b(?:true|false|yes|no|null|on|off)\b)/gm;

const TOML_RE = /(?<comment>#.*$)|(?<string>"""[\s\S]*?"""|'''[\s\S]*?'''|"(?:[^"\\]|\\.)*"|'[^']*')|(?<number>\b\d+\.?\d*\b)|(?<keyword>[\w.-]+(?=\s*=))|(?<bool>\b(?:true|false)\b)|(?<tag>\[[\w.-]+\])/gm;

const SQL_RE = /(?<comment>--.*$|\/\*[\s\S]*?\*\/)|(?<string>'(?:[^'\\]|\\.)*')|(?<number>\b\d+\.?\d*\b)|(?<keyword>\b(?:SELECT|FROM|WHERE|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|DROP|ALTER|TABLE|INDEX|JOIN|LEFT|RIGHT|INNER|OUTER|ON|AND|OR|NOT|IN|IS|NULL|AS|ORDER|BY|GROUP|HAVING|LIMIT|OFFSET|UNION|ALL|DISTINCT|BETWEEN|LIKE|EXISTS|CASE|WHEN|THEN|ELSE|END|COUNT|SUM|AVG|MIN|MAX|PRIMARY|KEY|FOREIGN|REFERENCES|UNIQUE|CHECK|DEFAULT|CONSTRAINT|CASCADE|select|from|where|insert|into|values|update|set|delete|create|drop|alter|table|index|join|left|right|inner|outer|on|and|or|not|in|is|null|as|order|by|group|having|limit|offset|union|all|distinct|between|like|exists|case|when|then|else|end|count|sum|avg|min|max|primary|key|foreign|references|unique|check|default|constraint|cascade)\b)|(?<bool>\b(?:TRUE|FALSE|true|false)\b)/gm;

const PHP_RE = /(?<comment>\/\/.*$|#.*$|\/\*[\s\S]*?\*\/)|(?<string>"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|(?<number>\b\d+\.?\d*\b)|(?<keyword>\b(?:function|class|if|else|elseif|for|foreach|while|do|switch|case|break|continue|return|echo|print|public|private|protected|static|abstract|final|interface|extends|implements|new|try|catch|finally|throw|use|namespace|require|include|require_once|include_once|array|isset|empty|unset|var|const|global)\b)|(?<bool>\b(?:true|false|null|TRUE|FALSE|NULL)\b)|(?<fn>\$[\w]+|\b[a-zA-Z_][\w]*(?=\s*\())|(?<type>\b[A-Z][\w]*\b)/gm;

const MD_RE = /(?<tag>^#{1,6}\s.*$)|(?<string>`[^`]+`)|(?<keyword>\*\*[^*]+\*\*|__[^_]+__)|(?<comment>\[([^\]]+)\]\([^)]+\))|(?<attr>^\s*[-*+]\s|^\s*\d+\.\s)/gm;

const PATTERNS: Record<string, RegExp> = {
  js: JS_RE,
  py: PY_RE,
  css: CSS_RE,
  json: JSON_RE,
  html: HTML_RE,
  rb: RB_RE,
  go: GO_RE,
  rs: RS_RE,
  java: JAVA_RE,
  c: C_RE,
  sh: SH_RE,
  yaml: YAML_RE,
  toml: TOML_RE,
  sql: SQL_RE,
  php: PHP_RE,
  md: MD_RE,
};

function getType(groups: Record<string, string | undefined>): TokenType | null {
  if (groups.comment) return 'comment';
  if (groups.string) return 'string';
  if (groups.number) return 'number';
  if (groups.keyword) return 'keyword';
  if (groups.bool) return 'bool';
  if (groups.fn) return 'fn';
  if (groups.type) return 'type';
  if (groups.tag) return 'tag';
  if (groups.attr) return 'attr';
  return null;
}

export function highlightLine(text: string, ext: string): Token[] {
  const lang = LANG_MAP[ext] || '';
  const pattern = PATTERNS[lang];
  if (!pattern) return [{ type: null, value: text }];

  const tokens: Token[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(new RegExp(pattern.source, pattern.flags))) {
    const idx = match.index ?? 0;
    if (idx > lastIndex) {
      tokens.push({ type: null, value: text.slice(lastIndex, idx) });
    }
    const type = match.groups ? getType(match.groups) : null;
    tokens.push({ type, value: match[0] });
    lastIndex = idx + match[0].length;
  }

  if (lastIndex < text.length) {
    tokens.push({ type: null, value: text.slice(lastIndex) });
  }

  return tokens;
}

export function getExtension(filePath: string): string {
  return filePath.split('.').pop()?.toLowerCase() || '';
}
