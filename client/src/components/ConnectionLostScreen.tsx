import { WifiOff } from 'lucide-react';
import { useI18n } from '../i18n';

export function ConnectionLostScreen() {
  const { t } = useI18n();
  return (
    <div className="connection-lost-screen">
      <div className="connection-lost-content">
        <WifiOff size={48} strokeWidth={1.5} className="connection-lost-icon" />
        <h2 className="connection-lost-title">{t.connectionLost}</h2>
        <p className="connection-lost-hint">{t.connectionLostHint}</p>
      </div>
    </div>
  );
}
