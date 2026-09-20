import { Alert, Card, Space, Spin, Table, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import { useLocale } from '../i18n';
import { useRemoteGroupData } from '../hooks/useRemoteGroupData';

const consentColor = {
  granted: 'green',
  limited: 'gold',
  not_granted: 'red',
  pending: 'blue',
};

export default function ConsentCenterPage() {
  const { translate } = useLocale();
  const remote = useRemoteGroupData();
  const family = remote.families[0];
  const consentRows = (remote.snapshot?.members ?? []).flatMap((member) => ([
    {
      id: `${member.id}-human`, familyName: family?.name ?? remote.snapshot?.group?.name ?? '-', subject: member.name,
      scope: 'human_health', state: member.share_human_health ? 'granted' : 'not_granted', updatedAt: member.joined_at,
    },
    {
      id: `${member.id}-pet`, familyName: family?.name ?? remote.snapshot?.group?.name ?? '-', subject: member.name,
      scope: 'pet_health', state: member.share_pet_health ? 'granted' : 'not_granted', updatedAt: member.joined_at,
    },
  ]));

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
      human_health: translate('人的健康数据', 'Human health data'),
      pet_health: translate('宠物健康数据', 'Pet health data'),
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
          '宠物健康和人的健康共享必须分别授权。家庭所有者不能替成员开启共享。',
          'Pet health and human health require separate consent. Family owners cannot enable sharing for another member.'
        )}
      />

      {remote.error && <Alert type="error" showIcon message={translate('授权数据读取失败', 'Failed to load consent data')} description={remote.error} />}
      {remote.loading && <Spin tip={translate('正在同步授权数据…', 'Syncing consent data…')} />}

      <Card title={translate('授权记录', 'Consent records')}>
        <Table
          rowKey="id"
          loading={remote.loading}
          dataSource={consentRows}
          columns={[
            {
              title: translate('家庭', 'Family'),
              dataIndex: 'familyName',
            },
            {
              title: translate('数据主体', 'Subject'),
              dataIndex: 'subject',
            },
            { title: translate('范围', 'Scope'), dataIndex: 'scope', render: (value: string) => scopeLabel(value) },
            {
              title: translate('状态', 'State'),
              dataIndex: 'state',
              render: (value: keyof typeof consentColor) => <Tag color={consentColor[value]}>{consentLabel(value)}</Tag>,
            },
            {
              title: translate('成员加入时间', 'Member joined'),
              dataIndex: 'updatedAt',
              render: (value: string) => dayjs(value).format('YYYY-MM-DD HH:mm'),
            },
          ]}
        />
      </Card>
    </Space>
  );
}
