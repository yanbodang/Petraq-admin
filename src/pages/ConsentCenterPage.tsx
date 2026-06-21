import { Alert, Card, Space, Table, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import { useAuth } from '../auth/AuthContext';
import { useLocale } from '../i18n';
import { familyName, getScopedData, userName } from '../services/petraqAdminData';

const consentColor = {
  granted: 'green',
  limited: 'gold',
  not_granted: 'red',
  pending: 'blue',
};

export default function ConsentCenterPage() {
  const { currentUser } = useAuth();
  const { translate } = useLocale();
  const data = getScopedData(currentUser?.role ?? 'family_admin', currentUser?.familyId);

  const consentLabel = (state: keyof typeof consentColor) => {
    const labels: Record<keyof typeof consentColor, string> = {
      granted: translate('已授权', 'Granted'),
      limited: translate('有限授权', 'Limited'),
      not_granted: translate('未授权', 'Not granted'),
      pending: translate('待处理', 'Pending'),
    };
    return labels[state];
  };

  const scopeLabel = (scope: string) => {
    const labels: Record<string, string> = {
      'human.heart_rate': translate('人的心率', 'Human heart rate'),
      'human.steps': translate('人的步数', 'Human steps'),
      'human.sleep': translate('人的睡眠', 'Human sleep'),
      'pet.latest': translate('宠物最新数据', 'Pet latest data'),
      'pet.history': translate('宠物历史数据', 'Pet history data'),
    };
    return labels[scope] ?? scope;
  };

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <div>
        <Typography.Title level={2}>{translate('授权与隐私', 'Consent & Privacy')}</Typography.Title>
        <Typography.Text type="secondary">
          {translate(
            '加入家庭并不代表自动共享人的健康数据。每一项授权都必须明确、可追踪、可撤销。',
            'Family membership does not automatically share human health data. Every consent is explicit, versioned, and revocable.'
          )}
        </Typography.Text>
      </div>

      <Alert
        showIcon
        type="warning"
        message={translate('隐私规则', 'Privacy rule')}
        description={translate(
          '宠物数据共享和人的健康数据共享必须分开。后端 API 必须同时校验家庭、角色和授权范围。',
          'Pet data sharing and human health data sharing must stay separate. Backend APIs must enforce family, role, and scope checks.'
        )}
      />

      <Card title={translate('授权记录', 'Consent records')}>
        <Table
          rowKey="id"
          dataSource={data.consents}
          columns={[
            {
              title: translate('家庭', 'Family'),
              dataIndex: 'familyId',
              render: (value: string) => familyName(value),
            },
            {
              title: translate('数据主体', 'Subject'),
              dataIndex: 'subjectUserId',
              render: (value: string) => userName(value),
            },
            {
              title: translate('授权给', 'Granted to'),
              dataIndex: 'grantedToUserId',
              render: (value: string) => userName(value),
            },
            { title: translate('范围', 'Scope'), dataIndex: 'scope', render: (value: string) => scopeLabel(value) },
            {
              title: translate('状态', 'State'),
              dataIndex: 'state',
              render: (value: keyof typeof consentColor) => <Tag color={consentColor[value]}>{consentLabel(value)}</Tag>,
            },
            { title: translate('语言', 'Language'), dataIndex: 'language' },
            { title: translate('版本', 'Version'), dataIndex: 'version' },
            {
              title: translate('更新时间', 'Updated'),
              dataIndex: 'updatedAt',
              render: (value: string) => dayjs(value).format('YYYY-MM-DD HH:mm'),
            },
          ]}
        />
      </Card>
    </Space>
  );
}
