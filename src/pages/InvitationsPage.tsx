import { CopyOutlined, PlusOutlined, StopOutlined } from '@ant-design/icons';
import { Button, Card, Col, message, Popconfirm, Row, Space, Table, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../auth/AuthContext';
import { useLocale } from '../i18n';
import { FamilyInvitation, getScopedData, userName } from '../services/petraqAdminData';

export default function InvitationsPage() {
  const { currentUser } = useAuth();
  const { translate } = useLocale();
  const data = getScopedData(currentUser?.role ?? 'family_admin', currentUser?.familyId);
  const [invitations, setInvitations] = useState(data.invitations);
  const active = useMemo(() => invitations.find((item) => item.status === 'pending'), [invitations]);
  const inviteUrl = active ? `${window.location.origin}/join/${active.token}` : '';
  const formatDate = (value: string) => new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));

  const createInvitation = () => {
    const family = data.families[0];
    if (!family || !currentUser) {
      message.warning(translate('请先创建或选择家庭', 'Create or select a family first'));
      return;
    }
    const now = dayjs();
    const next: FamilyInvitation = {
      id: `invite-${Date.now()}`,
      familyId: family.id,
      invitedByUserId: currentUser.id,
      token: `PQ-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      createdAt: now.toISOString(),
      expiresAt: now.add(7, 'day').toISOString(),
      status: 'pending',
    };
    setInvitations((items) => [next, ...items]);
  };

  const revoke = (id: string) => setInvitations((items) => items.map((item) => item.id === id ? { ...item, status: 'revoked' } : item));

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <div className="page-heading">
        <div>
          <Typography.Title level={2}>{translate('家庭邀请', 'Family invitations')}</Typography.Title>
          <Typography.Text type="secondary">{translate('邀请链接可撤销并会在七天后过期。', 'Invitation links can be revoked and expire after seven days.')}</Typography.Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={createInvitation}>{translate('创建邀请', 'Create invitation')}</Button>
      </div>

      <Row gutter={[20, 20]}>
        <Col xs={24} lg={8}>
          <Card className="invite-card">
            {active ? (
              <Space direction="vertical" align="center" size={16} style={{ width: '100%' }}>
                <QRCodeSVG value={inviteUrl} size={196} level="M" aria-label={translate('家庭邀请二维码', 'Family invitation QR code')} />
                <div style={{ textAlign: 'center' }}>
                  <Typography.Title level={4}>{data.families[0]?.name}</Typography.Title>
                  <Typography.Text type="secondary">{translate('扫码加入家庭；共享健康数据为可选项。', 'Scan to join. Health sharing remains optional.')}</Typography.Text>
                </div>
                <Button icon={<CopyOutlined />} onClick={async () => { await navigator.clipboard.writeText(inviteUrl); message.success(translate('邀请链接已复制', 'Invitation link copied')); }}>{translate('复制邀请链接', 'Copy invitation link')}</Button>
              </Space>
            ) : (
              <div className="empty-panel"><Typography.Title level={4}>{translate('暂无有效邀请', 'No active invitation')}</Typography.Title><Typography.Text type="secondary">{translate('创建二维码以邀请新的家庭成员。', 'Create a QR code to invite a family member.')}</Typography.Text></div>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={16}>
          <Card title={translate('邀请记录', 'Invitation history')}>
            <Table
              rowKey="id"
              dataSource={invitations}
              pagination={false}
              scroll={{ x: 700 }}
              columns={[
                { title: translate('邀请人', 'Invited by'), dataIndex: 'invitedByUserId', render: userName },
                { title: translate('邀请码', 'Code'), dataIndex: 'token' },
                { title: translate('状态', 'Status'), dataIndex: 'status', render: (value: string) => <Tag color={value === 'pending' ? 'green' : value === 'accepted' ? 'blue' : 'default'}>{value}</Tag> },
                { title: translate('创建时间', 'Created'), dataIndex: 'createdAt', render: formatDate },
                { title: translate('到期时间', 'Expires'), dataIndex: 'expiresAt', render: formatDate },
                { title: translate('操作', 'Action'), key: 'action', render: (_, record: FamilyInvitation) => record.status === 'pending' ? <Popconfirm title={translate('撤销这个邀请？', 'Revoke this invitation?')} description={translate('该二维码将立即失效。', 'The QR code will stop working immediately.')} okText={translate('撤销', 'Revoke')} cancelText={translate('取消', 'Cancel')} onConfirm={() => revoke(record.id)}><Button danger type="text" icon={<StopOutlined />}>{translate('撤销', 'Revoke')}</Button></Popconfirm> : null },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </Space>
  );
}
