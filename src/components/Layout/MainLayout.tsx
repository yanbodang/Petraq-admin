import { useMemo, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Select, theme } from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  TeamOutlined,
  SyncOutlined,
  BankOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { AppLanguage, useLocale } from '../../i18n';

const { Header, Sider, Content } = Layout;

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { t, language, setLanguage, languageOptions } = useLocale();
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const menuItems = useMemo(
    () => [
      {
        key: '/dashboard',
        icon: <DashboardOutlined />,
        label: t('menu.dashboard'),
      },
      {
        key: '/users',
        icon: <UserOutlined />,
        label: t('menu.users'),
      },
      {
        key: '/user-animals',
        icon: <TeamOutlined />,
        label: t('menu.userAnimals'),
      },
      {
        key: '/sync',
        icon: <SyncOutlined />,
        label: t('menu.sync'),
      },
      {
        key: '/organizations',
        icon: <BankOutlined />,
        label: t('menu.organizations'),
      },
      {
        key: '/settings',
        icon: <SettingOutlined />,
        label: t('menu.settings'),
      },
    ],
    [t]
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="light"
        width={200}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            fontWeight: 'bold',
            color: '#1890ff',
          }}
        >
          {collapsed ? t('app.logo.short') : t('app.logo.full')}
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: '0 24px',
            background: colorBgContainer,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h1 style={{ margin: 0, fontSize: 20 }}>{t('app.title')}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Select
              size="small"
              value={language}
              onChange={(value) => setLanguage(value as AppLanguage)}
              options={languageOptions}
              style={{ width: 140 }}
              aria-label={t('header.language')}
            />
          </div>
        </Header>
        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            minHeight: 280,
            background: colorBgContainer,
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
