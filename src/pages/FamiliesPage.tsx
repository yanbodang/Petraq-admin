import { CloudSyncOutlined, CrownOutlined, HeartOutlined, UserOutlined } from '@ant-design/icons';
import { Avatar, Button, Card, Col, message, Row, Space, Table, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useLocale } from '../i18n';
import { Family, FamilyMember, getScopedData, userName } from '../services/petraqAdminData';
import { groupSyncService } from '../services/groupSyncService';

export default function FamiliesPage() {
  const { currentUser, session } = useAuth();
  const { translate } = useLocale();
  const role = currentUser?.role ?? 'family_admin';
  const data = getScopedData(role, currentUser?.familyId);

  if (role === 'super_admin') {
    return (
      <Space direction="vertical" size={20} style={{ width: '100%' }}>
        <div>
          <Typography.Title level={2}>{translate('家庭管理', 'Family management')}</Typography.Title>
          <Typography.Text type="secondary">{translate('查看每个家庭的所有者、成员与宠物归属。', 'Review ownership, membership and pet relationships for every family.')}</Typography.Text>
        </div>
        <Card>
          <Table
            rowKey="id"
            dataSource={data.families}
            scroll={{ x: 760 }}
            columns={[
              { title: translate('家庭', 'Family'), dataIndex: 'name' },
              { title: translate('所有者', 'Owner'), dataIndex: 'ownerUserId', render: userName },
              { title: translate('成员', 'Members'), dataIndex: 'memberCount' },
              { title: translate('宠物', 'Pets'), dataIndex: 'petCount' },
              { title: translate('地区', 'Region'), dataIndex: 'region' },
              { title: translate('创建时间', 'Created'), dataIndex: 'createdAt', render: (value: string) => dayjs(value).format('YYYY-MM-DD') },
              ...(groupSyncService.isEnabled ? [{ title: translate('临时操作', 'Temporary action'), key: 'sync', render: (_: unknown, record: Family) => <SyncTestDataButton groupId={record.id} token={session?.token} /> }] : []),
            ]}
          />
        </Card>
      </Space>
    );
  }

  const family = data.families[0];
  const orderedMembers = [...data.members].sort((a, b) => roleRank(a.role) - roleRank(b.role));

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <div className="page-heading">
        <div>
          <Typography.Title level={2}>{family?.name ?? translate('我的家庭', 'My family')}</Typography.Title>
          <Typography.Text type="secondary">{translate('查看每位家庭成员、家庭关系及其名下宠物。', 'See every family member, their relationship and the pets they care for.')}</Typography.Text>
        </div>
        <Space size={8} wrap>
          <Tag color="green">{data.members.length} {translate('位成员', 'members')}</Tag>
          <Tag>{data.pets.length} {translate('只宠物', 'pets')}</Tag>
          {family && groupSyncService.isEnabled && <SyncTestDataButton groupId={family.id} token={session?.token} />}
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        {orderedMembers.map((member) => (
          <Col xs={24} md={12} xl={8} key={member.id}>
            <MemberCard member={member} />
          </Col>
        ))}
      </Row>
    </Space>
  );
}

function SyncTestDataButton({ groupId, token }: { groupId: string; token?: string }) {
  const { translate } = useLocale();
  const [syncing, setSyncing] = useState(false);

  const sync = async () => {
    if (!token) {
      message.error(translate('登录会话已失效，请重新登录。', 'Your session expired. Please sign in again.'));
      return;
    }
    setSyncing(true);
    try {
      const result = await groupSyncService.syncTestData(groupId, token);
      message.success(translate(
        `同步完成：写入 ${result.recordsWritten} 条，${result.recordsUnmapped} 条未映射。`,
        `Sync complete: ${result.recordsWritten} written, ${result.recordsUnmapped} unmapped.`,
      ));
    } catch (error) {
      message.error(error instanceof Error ? error.message : translate('同步测试数据失败', 'Test data sync failed'));
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Button icon={<CloudSyncOutlined />} loading={syncing} onClick={sync}>
      {translate('同步测试数据', 'Sync test data')}
    </Button>
  );
}

function MemberCard({ member }: { member: FamilyMember }) {
  const { currentUser } = useAuth();
  const { translate } = useLocale();
  const data = getScopedData(currentUser?.role ?? 'family_admin', currentUser?.familyId);
  const name = userName(member.userId);
  const pets = data.pets.filter((pet) => pet.ownerMemberId === member.id);
  const health = data.humanHealth.find((item) => item.memberId === member.id);

  return (
    <Card className="member-card">
      <div className="member-card__header">
        <Avatar size={44} icon={<UserOutlined />} className="member-avatar" />
        <div>
          <Space size={8} wrap>
            <Typography.Title level={4}>{name}</Typography.Title>
            {member.role === 'owner' && <CrownOutlined className="owner-icon" aria-label={translate('家庭所有者', 'Family owner')} />}
          </Space>
          <Typography.Text type="secondary">{member.relationship} · {member.role}</Typography.Text>
        </div>
      </div>

      <div className="member-health-row">
        <HeartOutlined />
        <span>{translate('人的健康数据', 'Human health')}</span>
        <Tag color={health?.sharedWithFamily ? 'green' : 'default'}>{health?.sharedWithFamily ? translate('已共享', 'Shared') : translate('未共享', 'Not shared')}</Tag>
      </div>

      <div className="pet-list">
        <Typography.Text strong>{translate('名下宠物', 'Pets')}</Typography.Text>
        {pets.length ? pets.map((pet) => (
          <div className="pet-list__item" key={pet.id}>
            <div><strong>{pet.name}</strong><Typography.Text type="secondary"> · {pet.breed}</Typography.Text></div>
            <Tag color={pet.sharedWithFamily ? 'green' : 'default'}>{pet.sharedWithFamily ? translate('已共享', 'Shared') : translate('未共享', 'Not shared')}</Tag>
          </div>
        )) : <Typography.Text type="secondary">{translate('暂无宠物', 'No pets')}</Typography.Text>}
      </div>
    </Card>
  );
}

function roleRank(role: FamilyMember['role']) {
  return { owner: 0, admin: 1, member: 2, viewer: 3 }[role];
}
