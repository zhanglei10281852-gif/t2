import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Badge, theme } from 'antd';
import {
  DashboardOutlined,
  AppstoreOutlined,
  InboxOutlined,
  SwapOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import Dashboard from './pages/Dashboard';
import Materials from './pages/Materials';
import Inventory from './pages/Inventory';
import Transfers from './pages/Transfers';
import Alerts from './pages/Alerts';
import { alertApi } from './services/api';

const { Header, Sider, Content } = Layout;

const App: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [alertCount, setAlertCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  useEffect(() => {
    fetchAlertCount();
  }, []);

  const fetchAlertCount = async () => {
    try {
      const response = await alertApi.getCount();
      setAlertCount(response.data.count);
    } catch (error) {
      console.error('获取预警数量失败:', error);
    }
  };

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: '物资总览',
    },
    {
      key: '/materials',
      icon: <AppstoreOutlined />,
      label: '物资台账',
    },
    {
      key: '/inventory',
      icon: <InboxOutlined />,
      label: '出入库管理',
    },
    {
      key: '/transfers',
      icon: <SwapOutlined />,
      label: '调拨管理',
    },
    {
      key: '/alerts',
      icon: <Badge count={alertCount} size="small"><WarningOutlined /></Badge>,
      label: '预警中心',
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed}>
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: collapsed ? 16 : 18, fontWeight: 'bold' }}>
          {collapsed ? '应急' : '应急物资平台'}
        </div>
        <Menu
          theme="dark"
          selectedKeys={[location.pathname]}
          mode="inline"
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: 0, background: colorBgContainer }}>
          <h2 style={{ marginLeft: 24, marginBottom: 0 }}>应急物资调配管理平台</h2>
        </Header>
        <Content style={{ margin: '24px 16px', padding: 24, minHeight: 280, background: colorBgContainer, borderRadius: borderRadiusLG }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/materials" element={<Materials />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/transfers" element={<Transfers />} />
            <Route path="/alerts" element={<Alerts />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
};

export default App;
