const ICONS: Record<string, { bg: string; fg: string; label: string }> = {
  js:    { bg: '#f7df1e', fg: '#000', label: 'JS' },
  mjs:   { bg: '#f7df1e', fg: '#000', label: 'JS' },
  cjs:   { bg: '#f7df1e', fg: '#000', label: 'JS' },
  jsx:   { bg: '#61dafb', fg: '#000', label: 'JSX' },
  ts:    { bg: '#3178c6', fg: '#fff', label: 'TS' },
  tsx:   { bg: '#3178c6', fg: '#fff', label: 'TSX' },
  mts:   { bg: '#3178c6', fg: '#fff', label: 'TS' },
  py:    { bg: '#3776ab', fg: '#ffd43b', label: 'Py' },
  pyw:   { bg: '#3776ab', fg: '#ffd43b', label: 'Py' },
  json:  { bg: '#5b5ea6', fg: '#fff', label: '{ }' },
  jsonc: { bg: '#5b5ea6', fg: '#fff', label: '{ }' },
  md:    { bg: '#354a5f', fg: '#fff', label: 'MD' },
  mdx:   { bg: '#354a5f', fg: '#fff', label: 'MDX' },
  css:   { bg: '#264de4', fg: '#fff', label: 'CSS' },
  scss:  { bg: '#cd6799', fg: '#fff', label: 'SC' },
  less:  { bg: '#1d365d', fg: '#fff', label: 'LS' },
  html:  { bg: '#e44d26', fg: '#fff', label: '</>' },
  htm:   { bg: '#e44d26', fg: '#fff', label: '</>' },
  vue:   { bg: '#42b883', fg: '#fff', label: 'Vue' },
  svelte:{ bg: '#ff3e00', fg: '#fff', label: 'Sv' },
  go:    { bg: '#00add8', fg: '#fff', label: 'Go' },
  rs:    { bg: '#dea584', fg: '#000', label: 'Rs' },
  java:  { bg: '#ed8b00', fg: '#fff', label: 'Jv' },
  rb:    { bg: '#cc342d', fg: '#fff', label: 'Rb' },
  php:   { bg: '#777bb4', fg: '#fff', label: 'PHP' },
  yml:   { bg: '#cb171e', fg: '#fff', label: 'YML' },
  yaml:  { bg: '#cb171e', fg: '#fff', label: 'YML' },
  toml:  { bg: '#9c4221', fg: '#fff', label: 'TML' },
  sh:    { bg: '#4eaa25', fg: '#fff', label: 'SH' },
  bash:  { bg: '#4eaa25', fg: '#fff', label: 'SH' },
  sql:   { bg: '#f29111', fg: '#fff', label: 'SQL' },
  graphql:{ bg: '#e535ab', fg: '#fff', label: 'GQL' },
  gitignore: { bg: '#f05032', fg: '#fff', label: 'Git' },
  env:   { bg: '#ecd53f', fg: '#000', label: 'ENV' },
  lock:  { bg: '#6b7280', fg: '#fff', label: 'LCK' },
  xml:   { bg: '#f16529', fg: '#fff', label: 'XML' },
  svg:   { bg: '#ffb13b', fg: '#000', label: 'SVG' },
  png:   { bg: '#a855f7', fg: '#fff', label: 'IMG' },
  jpg:   { bg: '#a855f7', fg: '#fff', label: 'IMG' },
  jpeg:  { bg: '#a855f7', fg: '#fff', label: 'IMG' },
  gif:   { bg: '#a855f7', fg: '#fff', label: 'IMG' },
  webp:  { bg: '#a855f7', fg: '#fff', label: 'IMG' },
  txt:   { bg: '#6b7280', fg: '#fff', label: 'TXT' },
};

export function FileIcon({ name }: { name: string }) {
  const ext = name.includes('.') ? name.split('.').pop()!.toLowerCase() : '';
  const icon = ICONS[ext];

  if (icon) {
    return (
      <svg viewBox="0 0 24 24" width={14} height={14}>
        <rect x="2" y="2" width="20" height="20" rx="3" fill={icon.bg} />
        <text
          x="12"
          y="16"
          textAnchor="middle"
          fontSize={icon.label.length > 3 ? 6 : icon.label.length > 2 ? 7 : 9}
          fontWeight="800"
          fill={icon.fg}
        >
          {icon.label}
        </text>
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="var(--text3)" strokeWidth="1.5">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
      <polyline points="14,2 14,8 20,8" />
    </svg>
  );
}
