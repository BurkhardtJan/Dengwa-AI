import { useTranslation } from 'react-i18next';

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  return (
    <select
      value={i18n.language}
      onChange={e => i18n.changeLanguage(e.target.value)}
      className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
    >
      <option value="de">Deutsch</option>
      <option value="en">English</option>
    </select>
  );
}