import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  // Use startsWith so 'en-US', 'en-GB' etc. all count as English
  const isEnglish = i18n.language.startsWith('en');

  const toggleLanguage = () => {
    const newLang = isEnglish ? 'ta' : 'en';
    i18n.changeLanguage(newLang);
    // Explicitly persist choice so the LanguageDetector doesn't override it
    localStorage.setItem('i18nextLng', newLang);
  };

  return (
    <div
      onClick={toggleLanguage}
      className="relative flex items-center w-[100px] sm:w-[120px] h-11 bg-slate-200 dark:bg-slate-800 rounded-xl cursor-pointer border border-slate-300 dark:border-slate-700 p-1 select-none transition-all hover:border-slate-400 dark:hover:border-slate-600"
      role="button"
      aria-label="Toggle Language"
    >
      {/* Sliding Active Background */}
      <div
        className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-[8px] shadow-sm transition-all duration-300 ease-out flex items-center justify-center ${
          isEnglish
            ? 'left-1 bg-blue-600'
            : 'left-[calc(50%+2px)] bg-green-600'
        }`}
      />

      {/* Text Labels */}
      <div className="relative z-10 flex w-full h-full text-xs font-bold leading-none">
        <div className={`flex-1 flex items-center justify-center transition-colors duration-300 ${
          isEnglish ? 'text-white' : 'text-slate-600 dark:text-slate-400'
        }`}>
          EN
        </div>
        <div className={`flex-1 flex items-center justify-center transition-colors duration-300 ${
          !isEnglish ? 'text-white' : 'text-slate-600 dark:text-slate-400'
        }`}>
          தமிழ்
        </div>
      </div>
    </div>
  );
};

export default LanguageSwitcher;
