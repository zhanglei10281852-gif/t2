import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Space,
  Row,
  Col,
  message,
  Tag,
  Select,
} from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';
import { alertApi } from '../services/api';
import { Alert } from '../types';

const { Option } = Select;

const Alerts: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [form] = Form.useForm();
  const [filterStatus, setFilterStatus] = useState<string | undefined>(undefined);

  useEffect(() => {
    fetchAlerts();
  }, [filterStatus]);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filterStatus !== undefined) {
        params.is_handled = filterStatus === 'handled';
      }
      const response = await alertApi.getAll(params);
      setAlerts(response.data);
    } catch (error) {
      message.error('获取预警列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAlertClick = (record: Alert) => {
    if (!record.is_handled) {
      setSelectedAlert(record);
      form.resetFields();
      setModalVisible(true);
    }
  };

  const handleSubmit = async () => {
    if (!selectedAlert) return;
    try {
      const values = await form.validateFields();
      await alertApi.handle(selectedAlert.id, values);
      message.success('处理成功');
      setModalVisible(false);
      fetchAlerts();
    } catch (error) {
      message.error('处理失败');
    }
  };

  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case 'danger':
        return { color: 'red', text: '严重' };
      case 'warning':
        return { color: 'orange', text: '警告' };
      case 'caution':
        return { color: 'gold', text: '注意' };
      default:
        return { color: 'default', text: severity };
    }
  };

  const getAlertTypeText = (type: string) => {
    switch (type) {
      case 'expired':
        return '物资过期';
      case 'stock_low':
        return '库存不足';
      case 'expiring_soon':
        return '临期预警';
      default:
        return type;
    }
  };

  const columns = [
    {
      title: '严重程度',
      dataIndex: 'severity',
      key: 'severity',
      width: 100,
      render: (v: string) => {
        const config = getSeverityConfig(v);
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    { title: '预警类型', dataIndex: 'alert_type', key: 'alert_type', width: 120, render: getAlertTypeText },
    { title: '物资编码', dataIndex: 'material_code', key: 'material_code', width: 120 },
    { title: '物资名称', dataIndex: 'material_name', key: 'material_name', width: 150 },
    { title: '所属仓库', dataIndex: 'warehouse_name', key: 'warehouse_name', width: 130 },
    { title: '预警信息', dataIndex: 'message', key: 'message', ellipsis: true },
    {
      title: '状态',
      dataIndex: 'is_handled',
      key: 'is_handled',
      width: 100,
      render: (v: boolean) => (v ? <Tag color="green">已处理</Tag> : <Tag color="red">待处理</Tag>),
    },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', width: 180 },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: any, record: Alert) =>
        !record.is_handled && (
          <Button type="primary" size="small" icon={<CheckCircleOutlined />} onClick={() => handleAlertClick(record)}>
            处理
          </Button>
        ),
    },
  ];

  return (
    <div>
      <Row justify="space-between" style={{ marginBottom: 16 }}>
        <Col>
          <h2>预警中心</h2>
        </Col>
        <Col>
          <Select
            placeholder="筛选状态"
            style={{ width: 150 }}
            allowClear
            value={filterStatus}
            onChange={setFilterStatus}
          >
            <Option value="unhandled">待处理</Option>
            <Option value="handled">已处理</Option>
          </Select>
        </Col>
      </Row>

      <Table
        columns={columns}
        dataSource={alerts}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
        rowClassName={(record) => {
          if (record.is_handled) return '';
          if (record.severity === 'danger') return 'table-row-danger';
          if (record.severity === 'warning') return 'table-row-warning';
          if (record.severity === 'caution') return 'table-row-caution';
          return '';
        }}
      />

      <Modal
        title="处理预警"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmit}
        okText="确认处理"
      >
        {selectedAlert && (
          <div style={{ marginBottom: 16 }}>
            <p>
              <strong>预警类型:</strong> {getAlertTypeText(selectedAlert.alert_type)}
            </p>
            <p>
              <strong>物资名称:</strong> {selectedAlert.material_name} ({selectedAlert.material_code})
            </p>
            <p>
              <strong>预警信息:</strong> {selectedAlert.message}
            </p>
          </div>
        )}
        <Form form={form} layout="vertical">
          <Form.Item name="handle_result" label="处理结果" rules={[{ required: true }]}>
            <Input.TextArea rows={4} placeholder="请输入处理结果" />
          </Form.Item>
        </Form>
      </Modal>

      <style>
        {`
          .table-row-danger td {
            background-color: #fff1f0 !important;
          }
          .table-row-warning td {
            background-color: #fff7e6 !important;
          }
          .table-row-caution td {
            background-color: #fffbe6 !important;
          }
        `}
      </style>
    </div>
  );
};

export default Alerts;
