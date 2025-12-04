import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider } from 'antd';
import App from './App';
import { LocaleProvider, useLocale } from './i18n';
import './index.css';

function AppWithProviders() {
  const { antdLocale } = useLocale();

  return (
    <ConfigProvider locale={antdLocale}>
      <App />
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

