import React, { useState, useEffect } from "react";
import {
  Tabs,
  Table,
  Button,
  Modal,
  Steps,
  Form,
  Select,
  Input,
  InputNumber,
  DatePicker,
  Space,
  Row,
  Col,
  message,
  Card,
  List,
} from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import { inventoryApi, warehouseApi, materialApi } from "../services/api";
import { InventoryRecord, Warehouse, Material } from "../types";
import dayjs from "dayjs";

const { Option } = Select;
const { Step } = Steps;

interface MaterialItem {
  material_code: string;
  material_name: string;
  quantity: number;
  unit: string;
}

const Inventory: React.FC = () => {
  const [activeTab, setActiveTab] = useState("in");
  const [records, setRecords] = useState<InventoryRecord[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedWarehouse, setSelectedWarehouse] = useState<number | null>(
    null,
  );
  const [selectedMaterials, setSelectedMaterials] = useState<MaterialItem[]>(
    [],
  );
  const [form] = Form.useForm();
  const [materialForm] = Form.useForm();

  useEffect(() => {
    fetchWarehouses();
    fetchRecords();
  }, [activeTab]);

  useEffect(() => {
    if (selectedWarehouse) {
      fetchWarehouseMaterials(selectedWarehouse);
    }
  }, [selectedWarehouse]);

  const fetchWarehouses = async () => {
    try {
      const response = await warehouseApi.getAll();
      setWarehouses(response.data);
    } catch (error) {
      message.error("获取仓库列表失败");
    }
  };

  const fetchWarehouseMaterials = async (warehouseId: number) => {
    try {
      const response = await materialApi.getAll({ warehouse_id: warehouseId });
      setMaterials(response.data);
    } catch (error) {
      message.error("获取物资列表失败");
    }
  };

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const response = await inventoryApi.getRecords({
        record_type: activeTab,
      });
      setRecords(response.data);
    } catch (error) {
      message.error("获取记录失败");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setCurrentStep(0);
    setSelectedWarehouse(null);
    setSelectedMaterials([]);
    form.resetFields();
    materialForm.resetFields();
    setModalVisible(true);
  };

  const handleNextStep = async () => {
    if (currentStep === 0) {
      const values = await form.validateFields();
      setSelectedWarehouse(values.warehouse_id);
      form.setFieldsValue({ warehouse_id: values.warehouse_id });
      setCurrentStep(1);
    } else if (currentStep === 1) {
      if (selectedMaterials.length === 0) {
        message.warning("请至少添加一种物资");
        return;
      }
      setCurrentStep(2);
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleAddMaterial = () => {
    materialForm.validateFields().then((values) => {
      const material = materials.find((m) => m.code === values.material_code);
      if (material) {
        if (activeTab === "out" && material.quantity < values.quantity) {
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
      const data = {
        order_no: values.order_no,
        warehouse_id: values.warehouse_id,
        materials: selectedMaterials.map((m) => ({
          material_code: m.material_code,
          quantity: m.quantity,
        })),
        record_date: values.record_date.format("YYYY-MM-DD"),
        handler: values.handler,
        ...(activeTab === "out" && {
          department: values.department,
          purpose: values.purpose,
        }),
      };

      if (activeTab === "in") {
        await inventoryApi.stockIn(data);
      } else {
        await inventoryApi.stockOut(data);
      }

      message.success("操作成功");
      setModalVisible(false);
      fetchRecords();
    } catch (error: any) {
      message.error(error.response?.data?.detail || "操作失败");
    }
  };

  const inColumns = [
    {
      title: "单号",
      dataIndex: "order_no",
      key: "order_no",
      width: 140,
      fixed: "left" as const,
    },
    {
      title: "物资编码",
      dataIndex: "material_code",
      key: "material_code",
      width: 120,
    },
    {
      title: "物资名称",
      dataIndex: "material_name",
      key: "material_name",
      width: 160,
    },
    { title: "数量", dataIndex: "quantity", key: "quantity", width: 90 },
    {
      title: "入库日期",
      dataIndex: "record_date",
      key: "record_date",
      width: 110,
    },
    { title: "经办人", dataIndex: "handler", key: "handler", width: 100 },
    {
      title: "创建时间",
      dataIndex: "created_at",
      key: "created_at",
      width: 180,
    },
  ];

  const outColumns = [
    {
      title: "单号",
      dataIndex: "order_no",
      key: "order_no",
      width: 140,
      fixed: "left" as const,
    },
    {
      title: "物资编码",
      dataIndex: "material_code",
      key: "material_code",
      width: 120,
    },
    {
      title: "物资名称",
      dataIndex: "material_name",
      key: "material_name",
      width: 160,
    },
    { title: "数量", dataIndex: "quantity", key: "quantity", width: 90 },
    {
      title: "出库日期",
      dataIndex: "record_date",
      key: "record_date",
      width: 110,
    },
    { title: "经办人", dataIndex: "handler", key: "handler", width: 100 },
    {
      title: "领用部门",
      dataIndex: "department",
      key: "department",
      width: 130,
    },
    {
      title: "用途",
      dataIndex: "purpose",
      key: "purpose",
      width: 200,
      ellipsis: true,
    },
    {
      title: "创建时间",
      dataIndex: "created_at",
      key: "created_at",
      width: 180,
    },
  ];

  const stepItems = [
    { title: "选择仓库", description: "选择操作的仓库" },
    { title: "选择物资", description: "选择物资及数量" },
    { title: "确认提交", description: "确认信息并提交" },
  ];

  return (
    <div>
      <Row justify="space-between" style={{ marginBottom: 16 }}>
        <Col>
          <h2>出入库管理</h2>
        </Col>
        <Col>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新建{activeTab === "in" ? "入库" : "出库"}单
          </Button>
        </Col>
      </Row>

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <Tabs.TabPane tab="入库单列表" key="in">
          <Table
            columns={inColumns}
            dataSource={records}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
          />
        </Tabs.TabPane>
        <Tabs.TabPane tab="出库单列表" key="out">
          <Table
            columns={outColumns}
            dataSource={records}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
          />
        </Tabs.TabPane>
      </Tabs>

      <Modal
        title={`新建${activeTab === "in" ? "入库" : "出库"}单`}
        open={modalVisible}
        width={700}
        onCancel={() => setModalVisible(false)}
        footer={
          <Space>
            {currentStep > 0 && (
              <Button onClick={handlePrevStep}>上一步</Button>
            )}
            {currentStep < 2 ? (
              <Button type="primary" onClick={handleNextStep}>
                下一步
              </Button>
            ) : (
              <Button type="primary" onClick={handleSubmit}>
                提交
              </Button>
            )}
          </Space>
        }
      >
        <Steps
          current={currentStep}
          items={stepItems}
          style={{ marginBottom: 24 }}
        />

        {currentStep === 0 && (
          <Form form={form} layout="vertical">
            <Form.Item
              name="warehouse_id"
              label="选择仓库"
              rules={[{ required: true }]}
            >
              <Select placeholder="请选择仓库">
                {warehouses.map((wh) => (
                  <Option key={wh.id} value={wh.id}>
                    {wh.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Form>
        )}

        {currentStep === 1 && (
          <div>
            <Card title="添加物资" size="small" style={{ marginBottom: 16 }}>
              <Form form={materialForm} layout="inline">
                <Form.Item
                  name="material_code"
                  rules={[{ required: true }]}
                  style={{ flex: 1 }}
                >
                  <Select
                    placeholder="选择物资"
                    showSearch
                    optionFilterProp="children"
                  >
                    {materials.map((m) => (
                      <Option key={m.code} value={m.code}>
                        {m.code} - {m.name} (库存: {m.quantity}
                        {m.unit})
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
            <List
              size="small"
              bordered
              dataSource={selectedMaterials}
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
                  {item.material_name} ({item.material_code}) - {item.quantity}{" "}
                  {item.unit}
                </List.Item>
              )}
            />
          </div>
        )}

        {currentStep === 2 && (
          <Form form={form} layout="vertical">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="order_no"
                  label="单号"
                  rules={[{ required: true }]}
                >
                  <Input placeholder="请输入单号" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="record_date"
                  label="日期"
                  rules={[{ required: true }]}
                  initialValue={dayjs()}
                >
                  <DatePicker style={{ width: "100%" }} />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item
              name="handler"
              label="经办人"
              rules={[{ required: true }]}
            >
              <Input placeholder="请输入经办人姓名" />
            </Form.Item>
            {activeTab === "out" && (
              <>
                <Form.Item
                  name="department"
                  label="领用部门"
                  rules={[{ required: true }]}
                >
                  <Input placeholder="请输入领用部门" />
                </Form.Item>
                <Form.Item
                  name="purpose"
                  label="用途描述"
                  rules={[{ required: true }]}
                >
                  <Input.TextArea rows={3} placeholder="请描述用途" />
                </Form.Item>
              </>
            )}
            <Card title="物资明细" size="small">
              <List
                size="small"
                dataSource={selectedMaterials}
                renderItem={(item) => (
                  <List.Item>
                    {item.material_name} ({item.material_code}) -{" "}
                    {item.quantity} {item.unit}
                  </List.Item>
                )}
              />
            </Card>
          </Form>
        )}
      </Modal>
    </div>
  );
};

export default Inventory;
