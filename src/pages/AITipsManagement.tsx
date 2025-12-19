import { useState, useEffect } from 'react';
import { Table, Button, Input, Space, Modal, Form, Select, Tag, Popconfirm, message, Tabs, Switch } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { dataManager } from '../services/dataManager';
import { AITip, AITipType, AIPushRule } from '../types';
import { useLocale } from '../i18n';
import dayjs from 'dayjs';

const { Search, TextArea } = Input;

export default function AITipsManagement() {
  const { translate } = useLocale();
  const [tips, setTips] = useState<AITip[]>([]);
  const [rules, setRules] = useState<AIPushRule[]>([]);
  const [activeTab, setActiveTab] = useState('tips');
  const [isTipModalVisible, setIsTipModalVisible] = useState(false);
  const [isRuleModalVisible, setIsRuleModalVisible] = useState(false);
  const [editingTip, setEditingTip] = useState<AITip | null>(null);
  const [editingRule, setEditingRule] = useState<AIPushRule | null>(null);
  const [tipForm] = Form.useForm();
  const [ruleForm] = Form.useForm();

  useEffect(() => {
    updateData();
  }, []);

  const updateData = () => {
    setTips(dataManager.getAITips());
    setRules(dataManager.getAIPushRules());
  };

  const handleAddTip = () => {
    setEditingTip(null);
    tipForm.resetFields();
    tipForm.setFieldsValue({
      isActive: true,
    });
    setIsTipModalVisible(true);
  };

  const handleEditTip = (tip: AITip) => {
    setEditingTip(tip);
    tipForm.setFieldsValue({
      type: tip.type,
      content: tip.content,
      tags: tip.tags?.join(','),
      isActive: tip.isActive,
    });
    setIsTipModalVisible(true);
  };

  const handleDeleteTip = (id: string) => {
    dataManager.removeAITip(id);
    updateData();
    message.success(translate('删除成功', 'Deleted'));
  };

  const handleSubmitTip = async () => {
    try {
      const values = await tipForm.validateFields();
      if (editingTip) {
        const updated: AITip = {
          ...editingTip,
          ...values,
          tags: values.tags ? values.tags.split(',').map((t: string) => t.trim()) : [],
        };
        dataManager.updateAITip(updated);
        message.success(translate('更新成功', 'Updated'));
      } else {
        const newTip: AITip = {
          id: `tip-${Date.now()}`,
          type: values.type,
          content: values.content,
          tags: values.tags ? values.tags.split(',').map((t: string) => t.trim()) : [],
          isActive: values.isActive !== false,
          usageCount: 0,
          createdAt: new Date(),
        };
        dataManager.addAITip(newTip);
        message.success(translate('添加成功', 'Added'));
      }
      setIsTipModalVisible(false);
      updateData();
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handleAddRule = () => {
    setEditingRule(null);
    ruleForm.resetFields();
    ruleForm.setFieldsValue({
      isActive: true,
      priority: 1,
    });
    setIsRuleModalVisible(true);
  };

  const handleEditRule = (rule: AIPushRule) => {
    setEditingRule(rule);
    ruleForm.setFieldsValue({
      name: rule.name,
      tipType: rule.tipType,
      tipContent: rule.tipContent,
      isActive: rule.isActive,
      priority: rule.priority,
      healthScoreRange: rule.conditions.healthScoreRange,
      animalType: rule.conditions.animalType,
      alertSeverity: rule.conditions.alertSeverity,
    });
    setIsRuleModalVisible(true);
  };

  const handleDeleteRule = (id: string) => {
    dataManager.removeAIPushRule(id);
    updateData();
    message.success(translate('删除成功', 'Deleted'));
  };

  const handleSubmitRule = async () => {
    try {
      const values = await ruleForm.validateFields();
      if (editingRule) {
        const updated: AIPushRule = {
          ...editingRule,
          name: values.name,
          tipType: values.tipType,
          tipContent: values.tipContent,
          isActive: values.isActive !== false,
          priority: values.priority || 1,
          conditions: {
            healthScoreRange: values.healthScoreRange,
            animalType: values.animalType,
            alertSeverity: values.alertSeverity,
          },
        };
        dataManager.updateAIPushRule(updated);
        message.success(translate('更新成功', 'Updated'));
      } else {
        const newRule: AIPushRule = {
          id: `rule-${Date.now()}`,
          name: values.name,
          tipType: values.tipType,
          tipContent: values.tipContent,
          isActive: values.isActive !== false,
          priority: values.priority || 1,
          conditions: {
            healthScoreRange: values.healthScoreRange,
            animalType: values.animalType,
            alertSeverity: values.alertSeverity,
          },
          createdAt: new Date(),
        };
        dataManager.addAIPushRule(newRule);
        message.success(translate('添加成功', 'Added'));
      }
      setIsRuleModalVisible(false);
      updateData();
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const tipColumns = [
    {
      title: translate('类型', 'Type'),
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const colorMap: Record<string, string> = {
          健康提示: 'green',
          护理建议: 'blue',
          预警提示: 'red',
          通用提示: 'default',
        };
        return <Tag color={colorMap[type] || 'default'}>{type}</Tag>;
      },
    },
    {
      title: translate('内容', 'Content'),
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
    },
    {
      title: translate('标签', 'Tags'),
      dataIndex: 'tags',
      key: 'tags',
      render: (tags: string[] | undefined) => (
        <Space>
          {tags?.map((tag) => (
            <Tag key={tag}>{tag}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: translate('使用次数', 'Usage Count'),
      dataIndex: 'usageCount',
      key: 'usageCount',
    },
    {
      title: translate('状态', 'Status'),
      dataIndex: 'isActive',
      key: 'isActive',
      render: (active: boolean) => (
        <Tag color={active ? 'green' : 'default'}>
          {active ? translate('启用', 'Active') : translate('禁用', 'Inactive')}
        </Tag>
      ),
    },
    {
      title: translate('操作', 'Actions'),
      key: 'action',
      render: (_: any, record: AITip) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEditTip(record)}
          >
            {translate('编辑', 'Edit')}
          </Button>
          <Popconfirm
            title={translate('确定要删除这条文案吗？', 'Delete this tip?')}
            onConfirm={() => handleDeleteTip(record.id)}
            okText={translate('确定', 'Confirm')}
            cancelText={translate('取消', 'Cancel')}
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              {translate('删除', 'Delete')}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const ruleColumns = [
    {
      title: translate('规则名称', 'Rule Name'),
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: translate('提示类型', 'Tip Type'),
      dataIndex: 'tipType',
      key: 'tipType',
      render: (type: string) => {
        const colorMap: Record<string, string> = {
          健康提示: 'green',
          护理建议: 'blue',
          预警提示: 'red',
          通用提示: 'default',
        };
        return <Tag color={colorMap[type] || 'default'}>{type}</Tag>;
      },
    },
    {
      title: translate('优先级', 'Priority'),
      dataIndex: 'priority',
      key: 'priority',
    },
    {
      title: translate('状态', 'Status'),
      dataIndex: 'isActive',
      key: 'isActive',
      render: (active: boolean) => (
        <Tag color={active ? 'green' : 'default'}>
          {active ? translate('启用', 'Active') : translate('禁用', 'Inactive')}
        </Tag>
      ),
    },
    {
      title: translate('操作', 'Actions'),
      key: 'action',
      render: (_: any, record: AIPushRule) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEditRule(record)}
          >
            {translate('编辑', 'Edit')}
          </Button>
          <Popconfirm
            title={translate('确定要删除这条规则吗？', 'Delete this rule?')}
            onConfirm={() => handleDeleteRule(record.id)}
            okText={translate('确定', 'Confirm')}
            cancelText={translate('取消', 'Cancel')}
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              {translate('删除', 'Delete')}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>{translate('AI文案库管理', 'AI Tips Management')}</h2>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'tips',
            label: translate('文案库', 'Tips Library'),
            children: (
              <div>
                <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button type="primary" icon={<PlusOutlined />} onClick={handleAddTip}>
                    {translate('添加文案', 'Add Tip')}
                  </Button>
                </div>
                <Table
                  columns={tipColumns}
                  dataSource={tips}
                  rowKey="id"
                  pagination={{ pageSize: 10 }}
                />
              </div>
            ),
          },
          {
            key: 'rules',
            label: translate('推送规则', 'Push Rules'),
            children: (
              <div>
                <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button type="primary" icon={<PlusOutlined />} onClick={handleAddRule}>
                    {translate('添加规则', 'Add Rule')}
                  </Button>
                </div>
                <Table
                  columns={ruleColumns}
                  dataSource={rules}
                  rowKey="id"
                  pagination={{ pageSize: 10 }}
                  expandable={{
                    expandedRowRender: (record) => (
                      <div style={{ padding: '8px 0' }}>
                        <div><strong>{translate('提示内容', 'Tip Content')}:</strong> {record.tipContent}</div>
                        <div style={{ marginTop: 8 }}>
                          <strong>{translate('条件', 'Conditions')}:</strong>
                          {record.conditions.healthScoreRange && (
                            <Tag>健康评分: {record.conditions.healthScoreRange[0]}-{record.conditions.healthScoreRange[1]}</Tag>
                          )}
                          {record.conditions.animalType && record.conditions.animalType.length > 0 && (
                            <Tag>动物类型: {record.conditions.animalType.join(', ')}</Tag>
                          )}
                          {record.conditions.alertSeverity && record.conditions.alertSeverity.length > 0 && (
                            <Tag>预警级别: {record.conditions.alertSeverity.join(', ')}</Tag>
                          )}
                        </div>
                      </div>
                    ),
                  }}
                />
              </div>
            ),
          },
        ]}
      />

      <Modal
        title={editingTip ? translate('编辑文案', 'Edit Tip') : translate('添加文案', 'Add Tip')}
        open={isTipModalVisible}
        onOk={handleSubmitTip}
        onCancel={() => setIsTipModalVisible(false)}
        okText={translate('确定', 'Confirm')}
        cancelText={translate('取消', 'Cancel')}
        width={600}
      >
        <Form form={tipForm} layout="vertical">
          <Form.Item
            name="type"
            label={translate('类型', 'Type')}
            rules={[{ required: true, message: translate('请选择类型', 'Please select type') }]}
          >
            <Select placeholder={translate('请选择类型', 'Please select type')}>
              {Object.values(AITipType).map((type) => (
                <Select.Option key={type} value={type}>
                  {type}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="content"
            label={translate('内容', 'Content')}
            rules={[{ required: true, message: translate('请输入内容', 'Please enter content') }]}
          >
            <TextArea rows={4} placeholder={translate('请输入文案内容', 'Please enter tip content')} />
          </Form.Item>
          <Form.Item
            name="tags"
            label={translate('标签（逗号分隔）', 'Tags (comma separated)')}
          >
            <Input placeholder={translate('例如: 健康,良好', 'e.g.: health,good')} />
          </Form.Item>
          <Form.Item
            name="isActive"
            label={translate('启用', 'Active')}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={editingRule ? translate('编辑规则', 'Edit Rule') : translate('添加规则', 'Add Rule')}
        open={isRuleModalVisible}
        onOk={handleSubmitRule}
        onCancel={() => setIsRuleModalVisible(false)}
        okText={translate('确定', 'Confirm')}
        cancelText={translate('取消', 'Cancel')}
        width={700}
      >
        <Form form={ruleForm} layout="vertical">
          <Form.Item
            name="name"
            label={translate('规则名称', 'Rule Name')}
            rules={[{ required: true, message: translate('请输入规则名称', 'Please enter rule name') }]}
          >
            <Input placeholder={translate('请输入规则名称', 'Please enter rule name')} />
          </Form.Item>
          <Form.Item
            name="tipType"
            label={translate('提示类型', 'Tip Type')}
            rules={[{ required: true, message: translate('请选择提示类型', 'Please select tip type') }]}
          >
            <Select placeholder={translate('请选择提示类型', 'Please select tip type')}>
              {Object.values(AITipType).map((type) => (
                <Select.Option key={type} value={type}>
                  {type}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="tipContent"
            label={translate('提示内容', 'Tip Content')}
            rules={[{ required: true, message: translate('请输入提示内容', 'Please enter tip content') }]}
          >
            <TextArea rows={3} placeholder={translate('请输入提示内容', 'Please enter tip content')} />
          </Form.Item>
          <Form.Item
            name="priority"
            label={translate('优先级', 'Priority')}
          >
            <Input type="number" min={1} placeholder={translate('数字越小优先级越高', 'Lower number = higher priority')} />
          </Form.Item>
          <Form.Item
            name="isActive"
            label={translate('启用', 'Active')}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
          <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 16, marginTop: 16 }}>
            <h4>{translate('推送条件（可选）', 'Push Conditions (optional)')}</h4>
            <Form.Item
              name="healthScoreRange"
              label={translate('健康评分范围', 'Health Score Range')}
            >
              <Input placeholder={translate('例如: 0,60', 'e.g.: 0,60')} />
            </Form.Item>
            <Form.Item
              name="animalType"
              label={translate('动物类型（逗号分隔）', 'Animal Types (comma separated)')}
            >
              <Input placeholder={translate('例如: 牛,羊', 'e.g.: 牛,羊')} />
            </Form.Item>
            <Form.Item
              name="alertSeverity"
              label={translate('预警级别（逗号分隔）', 'Alert Severity (comma separated)')}
            >
              <Input placeholder={translate('例如: high,critical', 'e.g.: high,critical')} />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  );
}

