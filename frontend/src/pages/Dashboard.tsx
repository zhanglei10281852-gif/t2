import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Progress, Badge } from 'antd';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { statisticsApi, alertApi } from '../services/api';
import { WarehouseStats, CategoryData } from '../types';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const Dashboard: React.FC = () => {
  const [warehouseStats, setWarehouseStats] = useState<WarehouseStats[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [totalValue, setTotalValue] = useState(0);
  const [alertCount, setAlertCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [whRes, catRes, valRes, alertRes] = await Promise.all([
        statisticsApi.getWarehouseValues(),
        statisticsApi.getCategoryDistribution(),
        statisticsApi.getTotalValue(),
        alertApi.getCount(),
      ]);
      setWarehouseStats(whRes.data);
      setCategoryData(catRes.data);
      setTotalValue(valRes.data.total_value);
      setAlertCount(alertRes.data.count);
    } catch (error) {
      console.error('获取仪表盘数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>物资总览仪表盘</h2>
      
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="库存总值"
              value={totalValue}
              precision={2}
              prefix="¥"
              suffix="元"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title={
                <span>
                  待处理预警
                  <Badge count={alertCount} style={{ marginLeft: 8 }} />
                </span>
              }
              value={alertCount}
              valueStyle={{ color: alertCount > 0 ? '#cf1322' : '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="仓库数量"
              value={warehouseStats.length}
              suffix="个"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="物资类别数"
              value={categoryData.length}
              suffix="类"
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col span={14}>
          <Card title="各仓库库存占用率" loading={loading}>
            <Row gutter={[16, 16]}>
              {warehouseStats.map((wh) => (
                <Col span={12} key={wh.warehouse_id}>
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ marginBottom: 8 }}>
                      <strong>{wh.warehouse_name}</strong>
                    </div>
                    <Progress
                      percent={Math.min(wh.usage_rate, 100)}
                      status={wh.usage_rate > 80 ? 'exception' : 'active'}
                    />
                    <div style={{ fontSize: 12, color: '#666' }}>
                      已用容量: {wh.used_capacity.toFixed(1)} m² / 总容量: {wh.total_capacity} m²
                    </div>
                  </div>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
        <Col span={10}>
          <Card title="物资类别分布" loading={loading}>
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="quantity"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {categoryData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
