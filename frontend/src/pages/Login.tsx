import React, { useState } from 'react';
import { Form, Input, Button, message, Card } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = (values: any) => {
    setLoading(true);
    
    setTimeout(() => {
      if (values.username === 'admin' && values.password === 'admin123') {
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('username', values.username);
        message.success('登录成功');
        navigate('/');
      } else {
        message.error('用户名或密码错误');
      }
      setLoading(false);
    }, 500);
  };

  return (
    <div className="login-container">
      <Card className="login-card">
        <h2 className="login-title">应急物资调配管理平台</h2>
        <Form
          name="login"
          onFinish={onFinish}
          autoComplete="off"
          size="large"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名!' }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="用户名"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码!' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              登录
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center', color: '#999', fontSize: 12 }}>
            默认账号: admin / admin123
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default Login;
