import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Select,
  Input,
  Space,
  Row,
  Col,
  message,
  Tag,
  Popconfirm,
  List,
  InputNumber,
  Card,
} from 'antd';
import { PlusOutlined, CheckOutlined, DeleteOutlined } from '@ant-design/icons';
import { transferApi, warehouseApi, materialApi } from '../services/api';
import { TransferOrder, Warehouse, Material } from '../types';

const { Option } = Select;

interface MaterialItem {
  material_code: string;
  material_name: string;
  quantity: number;
  unit: string;
}

const Transfers: React.FC = () => {
  const [transfers, setTransfers] = useState<TransferOrder[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [materialForm] = Form.useForm();
  const [selectedFromWarehouse, setSelectedFromWarehouse] = useState<number | null>(null);
  const [selectedMaterials, setSelectedMaterials] = useState<MaterialItem[]>([]);

  const STATUS_MAP: Record<string, { color: string; text: string }> = {
    pending: { color: 'gold', text: '待审批' },
    approved: { color: 'blue', text: '已审批' },
    out_confirmed: { color: 'purple', text: '已出库' },
    completed: { color: 'green', text: '已完成' },
  };

  useEffect(() => {
    fetchWarehouses();
    fetchTransfers();
  }, []);

  useEffect(() => {
    if (selectedFromWarehouse) {
      fetchWarehouseMaterials(selectedFromWarehouse);
    }
  }, [selectedFromWarehouse]);

  const fetchWarehouses = async () => {
    try {
      const response = await warehouseApi.getAll();
      setWarehouses(response.data);
    } catch (error) {
      message.error('获取仓库列表失败');
    }
  };

  const fetchWarehouseMaterials = async (warehouseId: number) => {
    try {
      const response = await materialApi.getAll({ warehouse_id: warehouseId });
      setMaterials(response.data);
    } catch (error) {
      message.error('获取物资列表失败');
    }
  };

  const fetchTransfers = async () => {
    try {
      setLoading(true);
      const response = await transferApi.getAll();
      setTransfers(response.data);
    } catch (error) {
      message.error('获取调拨单列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    form.resetFields();
    materialForm.resetFields();
    setSelectedFromWarehouse(null);
    setSelectedMaterials([]);
    setModalVisible(true);
  };

  const handleAddMaterial = () => {
    materialForm.validateFields().then((values) => {
      const material = materials.find((m) => m.code === values.material_code);
      if (material) {
        if (material.quantity < values.quantity) {
          message.error(`库存不足，当前库存: ${material.quantity}`);
          return;
        }
        setSelectedMaterials([
          ...selectedMaterials,
          {
            material_code: material.code,
            material_name: material.name,
            quantity: values.quantity,
            unit: material.unit,
          },
        ]);
        materialForm.resetFields();
      }
    });
  };

  const handleRemoveMaterial = (index: number) => {
    setSelectedMaterials(selectedMaterials.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (selectedMaterials.length === 0) {
        message.warning('请至少添加一种物资');
        return;
      }
      if (values.from_warehouse_id === values.to_warehouse_id) {
        message.error('调入和调出仓库不能相同');
        return;
      }

      const data = {
        from_warehouse_id: values.from_warehouse_id,
        to_warehouse_id: values.to_warehouse_id,
        initiator: values.initiator,
        materials: selectedMaterials.map((m) => ({
          material_code: m.material_code,
          material_name: m.material_name,
          quantity: m.quantity,
        })),
      };

      await transferApi.create(data);
      message.success('创建成功');
      setModalVisible(false);
      fetchTransfers();
    } catch (error: any) {
      message.error(error.response?.data?.detail || '创建失败');
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await transferApi.approve(id, { approver: '系统管理员' });
      message.success('审批成功');
      fetchTransfers();
    } catch (error: any) {
      message.error(error.response?.data?.detail || '审批失败');
    }
  };

  const handleConfirmOut = async (id: number) => {
    try {
      await transferApi.confirmOut(id);
      message.success('确认出库成功');
      fetchTransfers();
    } catch (error: any) {
      message.error(error.response?.data?.detail || '确认出库失败');
    }
  };

  const handleConfirmIn = async (id: number) => {
    try {
      await transferApi.confirmIn(id);
      message.success('确认入库成功');
      fetchTransfers();
    } catch (error: any) {
      message.error(error.response?.data?.detail || '确认入库失败');
    }
  };

  const getWarehouseName = (id: number) => {
    return warehouses.find((w) => w.id === id)?.name || '-';
  };

  const columns = [
    { title: '调拨单号', dataIndex: 'transfer_no', key: 'transfer_no', width: 150 },
    {
      title: '调出仓库',
      dataIndex: 'from_warehouse_id',
      key: 'from_warehouse_id',
      width: 120,
      render: (v: number) => getWarehouseName(v),
    },
    {
      title: '调入仓库',
      dataIndex: 'to_warehouse_id',
      key: 'to_warehouse_id',
      width: 120,
      render: (v: number) => getWarehouseName(v),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (v: string) => {
        const status = STATUS_MAP[v] || { color: 'default', text: v };
        return <Tag color={status.color}>{status.text}</Tag>;
      },
    },
    { title: '发起人', dataIndex: 'initiator', key: 'initiator', width: 100 },
    { title: '审批人', dataIndex: 'approver', key: 'approver', width: 100 },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', width: 180 },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, record: TransferOrder) => (
        <Space size="small">
          {record.status === 'pending' && (
            <Popconfirm title="确定审批通过?" onConfirm={() => handleApprove(record.id)}>
              <Button type="primary" size="small" icon={<CheckOutlined />}>
                审批
              </Button>
            </Popconfirm>
          )}
          {record.status === 'approved' && (
            <Popconfirm title="确定出库?" onConfirm={() => handleConfirmOut(record.id)}>
              <Button type="primary" size="small">
                确认出库
              </Button>
            </Popconfirm>
          )}
          {record.status === 'out_confirmed' && (
            <Popconfirm title="确定入库?" onConfirm={() => handleConfirmIn(record.id)}>
              <Button type="primary" size="small">
                确认入库
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Row justify="space-between" style={{ marginBottom: 16 }}>
        <Col>
          <h2>调拨管理</h2>
        </Col>
        <Col>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            发起调拨
          </Button>
        </Col>
      </Row>

      <Table
        columns={columns}
        dataSource={transfers}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
        expandable={{
          expandedRowRender: (record) => (
            <List
              size="small"
              header={<div>物资明细</div>}
              dataSource={record.materials}
              renderItem={(item) => (
                <List.Item>
                  {item.material_name} ({item.material_code}) - {item.quantity}
                </List.Item>
              )}
            />
          ),
        }}
      />

      <Modal
        title="发起调拨"
        open={modalVisible}
        width={700}
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmit}
        okText="提交"
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="from_warehouse_id" label="调出仓库" rules={[{ required: true }]}>
                <Select
                  placeholder="请选择调出仓库"
                  onChange={(v) => setSelectedFromWarehouse(v)}
                >
                  {warehouses.map((wh) => (
                    <Option key={wh.id} value={wh.id}>
                      {wh.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="to_warehouse_id" label="调入仓库" rules={[{ required: true }]}>
                <Select placeholder="请选择调入仓库">
                  {warehouses.map((wh) => (
                    <Option key={wh.id} value={wh.id}>
                      {wh.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="initiator" label="发起人" rules={[{ required: true }]}>
            <Input placeholder="请输入发起人姓名" />
          </Form.Item>

          {selectedFromWarehouse && (
            <Card title="添加物资" size="small" style={{ marginBottom: 16 }}>
              <Form form={materialForm} layout="inline">
                <Form.Item name="material_code" rules={[{ required: true }]} style={{ flex: 1 }}>
                  <Select placeholder="选择物资" showSearch optionFilterProp="children">
                    {materials.map((m) => (
                      <Option key={m.code} value={m.code}>
                        {m.code} - {m.name} (库存: {m.quantity})
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item name="quantity" rules={[{ required: true }]}>
                  <InputNumber min={1} placeholder="数量" />
                </Form.Item>
                <Form.Item>
                  <Button type="primary" onClick={handleAddMaterial}>
                    添加
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          )}

          <List
            size="small"
            bordered
            header={<div>已选物资</div>}
            dataSource={selectedMaterials}
            locale={{ emptyText: '暂无物资' }}
            renderItem={(item, index) => (
              <List.Item
                actions={[
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleRemoveMaterial(index)}
                  />,
                ]}
              >
                {item.material_name} ({item.material_code}) - {item.quantity} {item.unit}
              </List.Item>
            )}
          />
        </Form>
      </Modal>
    </div>
  );
};

export default Transfers;
