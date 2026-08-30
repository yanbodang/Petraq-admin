import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider } from 'antd';
import App from './App';
import { LocaleProvider, useLocale } from './i18n';
import { AuthProvider } from './auth/AuthContext';
import './index.css';

function AppWithProviders() {
  const { antdLocale } = useLocale();

  return (
    <ConfigProvider
      locale={antdLocale}
      theme={{
        token: {
          colorPrimary: '#147a68',
          colorInfo: '#1b7898',
          colorSuccess: '#147a68',
          colorWarning: '#b77a2a',
          colorError: '#b45a50',
          colorText: '#1d2523',
          colorTextSecondary: '#66706d',
          colorBorderSecondary: '#e2e9e5',
          colorBgLayout: '#f3f7f5',
          borderRadius: 12,
          borderRadiusLG: 16,
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        },
        components: {
          Layout: { headerBg: '#ffffff', siderBg: '#ffffff' },
          Menu: { itemSelectedBg: '#d8e8e2', itemSelectedColor: '#147a68' },
          Table: { headerBg: '#f7f9f7', headerColor: '#46504d' },
        },
      }}
    >
      <AuthProvider>
        <App />
      </AuthProvider>
    </ConfigProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LocaleProvider>
      <AppWithProviders />
    </LocaleProvider>
  </React.StrictMode>
);
