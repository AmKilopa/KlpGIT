import type { Lang } from '../i18n';

interface LanguagePickerProps {
  onSelect: (lang: Lang) => void;
}

export function LanguagePicker({ onSelect }: LanguagePickerProps) {
  return (
    <div className="lang-picker">
      <div className="lang-content">
        <h1 className="lang-logo">KlpGit</h1>
        <p className="lang-subtitle">Choose language / Выберите язык</p>
        <div className="lang-options">
          <button className="lang-option" onClick={() => onSelect('en')}>
            <span className="lang-flag">EN</span>
            <span>English</span>
          </button>
          <button className="lang-option" onClick={() => onSelect('ru')}>
            <span className="lang-flag">RU</span>
            <span>Русский</span>
          </button>
        </div>
      </div>
    </div>
  );
}
