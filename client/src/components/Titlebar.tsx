import { Sun, Moon } from 'lucide-react';
import { useI18n } from '../i18n';

const APP_VERSION = typeof import.meta.env.VITE_APP_VERSION === 'string' ? import.meta.env.VITE_APP_VERSION : '0.0.1';

interface TitlebarProps {
  name: string;
  wsConnected: boolean;
  theme: 'dark' | 'light';
  onThemeToggle: () => void;
}

export function Titlebar({ name, wsConnected, theme, onThemeToggle }: TitlebarProps) {
  const { t } = useI18n();

  return (
    <div className="titlebar">
      <div className="tb-dots">
        <div className="tb-dot dot-r" />
        <div className="tb-dot dot-y" />
        <div className="tb-dot dot-g" />
      </div>
      <div className="tb-center">{name} — KlpGit <span className="tb-ver">v{APP_VERSION}</span></div>
      <div className="tb-right">
        <button type="button" className="tb-theme" onClick={onThemeToggle} title={theme === 'dark' ? t.themeLight : t.themeDark} aria-label="Theme">
          {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
        </button>
        <div
          className={`tb-live ${wsConnected ? 'live' : 'offline'}`}
          title={wsConnected ? t.connected : t.disconnected}
        />
      </div>
    </div>
  );
}
