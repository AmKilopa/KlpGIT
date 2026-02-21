import { useI18n } from '../i18n';

interface TitlebarProps {
  name: string;
  wsConnected: boolean;
}

export function Titlebar({ name, wsConnected }: TitlebarProps) {
  const { t } = useI18n();

  return (
    <div className="titlebar">
      <div className="tb-dots">
        <div className="tb-dot dot-r" />
        <div className="tb-dot dot-y" />
        <div className="tb-dot dot-g" />
      </div>
      <div className="tb-center">{name} — KlpGit</div>
      <div className="tb-right">
        <div
          className={`tb-live ${wsConnected ? 'live' : 'offline'}`}
          title={wsConnected ? t.connected : t.disconnected}
        />
      </div>
    </div>
  );
}
