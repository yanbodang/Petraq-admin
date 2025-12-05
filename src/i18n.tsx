import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import zhCN from 'antd/locale/zh_CN';
import enUS from 'antd/locale/en_US';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import 'dayjs/locale/en';

export type AppLanguage = 'zh-CN' | 'en-US';

type LocaleContextValue = {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  antdLocale: typeof zhCN | typeof enUS;
  t: (key: string) => string;
  translate: (zh: string, enText: string) => string;
  languageOptions: Array<{ value: AppLanguage; label: string }>;
};

const STORAGE_KEY = 'petraq-language';

const languageConfig: Record<AppLanguage, { antd: typeof zhCN | typeof enUS; dayjs: string; label: string }> = {
  'zh-CN': { antd: zhCN, dayjs: 'zh-cn', label: '中文' },
  'en-US': { antd: enUS, dayjs: 'en', label: 'English' },
};

const messages: Record<AppLanguage, Record<string, string>> = {
  'zh-CN': {
    'app.title': 'PetraQ SaaS 管理平台',
    'app.logo.full': 'PetraQ 管理',
    'app.logo.short': 'PQ',
    'menu.dashboard': '系统概览',
    'menu.users': '用户管理',
    'menu.userAnimals': '用户动物',
    'menu.sync': '数据同步',
    'menu.organizations': '组织管理',
    'menu.settings': '系统设置',
    'header.language': '语言',
  },
  'en-US': {
    'app.title': 'PetraQ SaaS Admin',
    'app.logo.full': 'PetraQ Admin',
    'app.logo.short': 'PQ',
    'menu.dashboard': 'Dashboard',
    'menu.users': 'Users',
    'menu.userAnimals': 'User Animals',
    'menu.sync': 'Data Sync',
    'menu.organizations': 'Organizations',
    'menu.settings': 'Settings',
    'header.language': 'Language',
  },
};

const LocaleContext = createContext<LocaleContextValue>({
  language: 'zh-CN',
  setLanguage: () => {},
  antdLocale: zhCN,
  t: (key: string) => key,
  translate: (zh: string, enText: string) => (enText ? zh : zh),
  languageOptions: [
    { value: 'zh-CN', label: languageConfig['zh-CN'].label },
    { value: 'en-US', label: languageConfig['en-US'].label },
  ],
});

const detectLanguage = (): AppLanguage => {
  const stored = typeof window !== 'undefined' ? (localStorage.getItem(STORAGE_KEY) as AppLanguage | null) : null;
  if (stored && ['zh-CN', 'en-US'].includes(stored)) {
    return stored;
  }
  const browserLang = navigator.language.toLowerCase();
  return browserLang.startsWith('zh') ? 'zh-CN' : 'en-US';
};

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<AppLanguage>(() => detectLanguage());

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, language);
    dayjs.locale(languageConfig[language].dayjs);
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: string) => messages[language][key] ?? key;

  const value = useMemo<LocaleContextValue>(
    () => ({
      language,
      setLanguage,
      antdLocale: languageConfig[language].antd,
      t,
      translate: (zh: string, enText: string) => (language === 'en-US' ? enText : zh),
      languageOptions: [
        { value: 'zh-CN', label: languageConfig['zh-CN'].label },
        { value: 'en-US', label: languageConfig['en-US'].label },
      ],
    }),
    [language]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export const useLocale = () => useContext(LocaleContext);
