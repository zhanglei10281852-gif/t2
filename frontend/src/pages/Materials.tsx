import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Drawer,
  Form,
  Input,
  Select,
  InputNumber,
  DatePicker,
  Space,
  Row,
  Col,
  message,
  Upload,
  Popconfirm,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { materialApi, warehouseApi } from '../services/api';
import { Material, Warehouse } from '../types';
import dayjs from 'dayjs';

const { Option } = Select;

const CATEGORIES = ['防汛类', '抗震类', '消防类', '医疗类', '生活保障类', '通信类'];
const UNITS = ['件', '箱', '台', '套', '条', '双', '顶', '张', '具', '只'];

const Materials: React.FC = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [form] = Form.useForm();
  const [filters, setFilters] = useState({
    warehouse_id: undefined as number | undefined,
    category: undefined as string | undefined,
    search: '',
  });

  useEffect(() => {
    fetchWarehouses();
    fetchMaterials();
  }, [filters]);

  const fetchWarehouses = async () => {
    try {
      const response = await warehouseApi.getAll();
      setWarehouses(response.data);
    } catch (error) {
      message.error('获取仓库列表失败');
    }
  };

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const response = await materialApi.getAll(filters);
      setMaterials(response.data);
    } catch (error) {
      message.error('获取物资列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingMaterial(null);
    form.resetFields();
    setDrawerVisible(true);
  };

  const handleEdit = (record: Material) => {
    setEditingMaterial(record);
    form.setFieldsValue({
      ...record,
      expiry_date: record.expiry_date ? dayjs(record.expiry_date) : undefined,
    });
    setDrawerVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await materialApi.delete(id);
      message.success('删除成功');
      fetchMaterials();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      const data = {
        ...values,
        expiry_date: values.expiry_date ? values.expiry_date.format('YYYY-MM-DD') : undefined,
      };
      
      if (editingMaterial) {
        await materialApi.update(editingMaterial.id, data);
        message.success('更新成功');
      } else {
        await materialApi.create(data);
        message.success('添加成功');
      }
      setDrawerVisible(false);
      fetchMaterials();
    } catch (error) {
      message.error(editingMaterial ? '更新失败' : '添加失败');
    }
  };

  const uploadProps: UploadProps = {
    name: 'file',
    accept: '.csv',
    customRequest: async ({ file }) => {
      try {
        const response = await materialApi.import(file as File);
        message.success(`成功导入 ${response.data.imported} 条数据`);
        if (response.data.errors.length > 0) {
          message.warning(`有 ${response.data.errors.length} 条数据导入失败`);
          console.log('导入错误:', response.data.errors);
        }
        fetchMaterials();
      } catch (error) {
        message.error('导入失败');
      }
    },
    showUploadList: false,
  };

  const columns = [
    { title: '物资编码', dataIndex: 'code', key: 'code', width: 120 },
    { title: '名称', dataIndex: 'name', key: 'name', width: 150 },
    { title: '类别', dataIndex: 'category', key: 'category', width: 120 },
    { title: '规格型号', dataIndex: 'specification', key: 'specification', width: 150 },
    { title: '单位', dataIndex: 'unit', key: 'unit', width: 80 },
    { title: '采购单价', dataIndex: 'unit_price', key: 'unit_price', width: 100, render: (v: number) => `¥${v.toFixed(2)}` },
    { title: '库存数量', dataIndex: 'quantity', key: 'quantity', width: 100 },
    { title: '安全库存', dataIndex: 'safety_stock', key: 'safety_stock', width: 100 },
    { title: '保质期截止', dataIndex: 'expiry_date', key: 'expiry_date', width: 120 },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: any, record: Material) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm title="确定删除?" onConfirm={() => handleDelete(record.id)}>
            <Button icon={<DeleteOutlined />} size="small" danger>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Row justify="space-between" style={{ marginBottom: 16 }}>
        <Col>
          <h2>物资台账</h2>
        </Col>
        <Col>
          <Space>
            <Upload {...uploadProps}>
              <Button icon={<UploadOutlined />}>批量导入CSV</Button>
            </Upload>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              新增物资
            </Button>
          </Space>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Select
            placeholder="选择仓库"
            style={{ width: '100%' }}
            allowClear
            value={filters.warehouse_id}
            onChange={(v) => setFilters({ ...filters, warehouse_id: v })}
          >
            {warehouses.map((wh) => (
              <Option key={wh.id} value={wh.id}>
                {wh.name}
              </Option>
            ))}
          </Select>
        </Col>
        <Col span={6}>
          <Select
            placeholder="选择类别"
            style={{ width: '100%' }}
            allowClear
            value={filters.category}
            onChange={(v) => setFilters({ ...filters, category: v })}
          >
            {CATEGORIES.map((cat) => (
              <Option key={cat} value={cat}>
                {cat}
              </Option>
            ))}
          </Select>
        </Col>
        <Col span={6}>
          <Input.Search
            placeholder="搜索物资名称"
            allowClear
            onSearch={(v) => setFilters({ ...filters, search: v })}
          />
        </Col>
      </Row>

      <Table
        columns={columns}
        dataSource={materials}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 1200 }}
      />

      <Drawer
        title={editingMaterial ? '编辑物资' : '新增物资'}
        width={500}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="name" label="物资名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="category" label="类别" rules={[{ required: true }]}>
            <Select>
              {CATEGORIES.map((cat) => (
                <Option key={cat} value={cat}>
                  {cat}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="specification" label="规格型号">
            <Input />
          </Form.Item>
          <Form.Item name="unit" label="单位" rules={[{ required: true }]}>
            <Select>
              {UNITS.map((u) => (
                <Option key={u} value={u}>
                  {u}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="unit_price" label="采购单价" rules={[{ required: true }]}>
            <InputNumber min={0} precision={2} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="warehouse_id" label="存放仓库" rules={[{ required: true }]}>
            <Select>
              {warehouses.map((wh) => (
                <Option key={wh.id} value={wh.id}>
                  {wh.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="quantity" label="库存数量" rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="safety_stock" label="安全库存量" rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="expiry_date" label="保质期截止日期">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              提交
            </Button>
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
};

export default Materials;
