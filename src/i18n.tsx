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
    'app.title': 'PetraQ 管理平台',
    'app.title.super': 'PetraQ 超级管理员',
    'app.title.family': '家庭管理后台',
    'app.logo.full': 'PetraQ Admin',
    'app.logo.short': 'PQ',
    'menu.dashboard': '系统概览',
    'menu.families': '家庭管理',
    'menu.family': '我的家庭',
    'menu.users': '用户管理',
    'menu.members': '家庭成员',
    'menu.petsDevices': '宠物与设备',
    'menu.pets': '宠物管理',
    'menu.health': '健康数据',
    'menu.invitations': '家庭邀请',
    'menu.medical': '宠物医疗',
    'menu.consent': '授权与隐私',
    'menu.operations': '运维审计',
    'menu.audit': '操作记录',
    'menu.settings': '系统设置',
    'header.language': '语言',
  },
  'en-US': {
    'app.title': 'PetraQ Admin',
    'app.title.super': 'PetraQ Super Admin',
    'app.title.family': 'Family Admin Portal',
    'app.logo.full': 'PetraQ Admin',
    'app.logo.short': 'PQ',
    'menu.dashboard': 'Dashboard',
    'menu.families': 'Families',
    'menu.family': 'My Family',
    'menu.users': 'Users',
    'menu.members': 'Members',
    'menu.petsDevices': 'Pets & Devices',
    'menu.pets': 'Pets',
    'menu.health': 'Health data',
    'menu.invitations': 'Invitations',
    'menu.medical': 'Pet Medical',
    'menu.consent': 'Consent & Privacy',
    'menu.operations': 'Operations Audit',
    'menu.audit': 'Audit Log',
    'menu.settings': 'Settings',
    'header.language': 'Language',
  },
};

const LocaleContext = createContext<LocaleContextValue>({
  language: 'zh-CN',
  setLanguage: () => {},
  antdLocale: zhCN,
  t: (key: string) => key,
  translate: (zh: string) => zh,
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
  return 'zh-CN';
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
