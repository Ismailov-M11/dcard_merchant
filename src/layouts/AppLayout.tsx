import { useMemo, useState } from 'react';
import { Button, Layout, Menu, Space, Typography, theme } from 'antd';
import {
  DashboardOutlined,
  GiftOutlined,
  ShopOutlined,
  TeamOutlined,
  StarOutlined,
  AreaChartOutlined,
  BellOutlined,
  SettingOutlined,
  PercentageOutlined,
  PictureOutlined
} from '@ant-design/icons';
import { Link, Route, Routes, useLocation } from 'react-router-dom';
import DashboardPage from '../pages/DashboardPage';
import DealsPage from '../pages/DealsPage';
import DiscountsPage from '../pages/DiscountsPage';
import BannersPage from '../pages/BannersPage';
import BranchesPage from '../pages/BranchesPage';
import StaffPage from '../pages/StaffPage';
import ReviewsPage from '../pages/ReviewsPage';
import AnalyticsPage from '../pages/AnalyticsPage';
import NotificationsPage from '../pages/NotificationsPage';
import SettingsPage from '../pages/SettingsPage';
import { useAuth } from '../features/auth/AuthContext';

const { Header, Sider, Content } = Layout;

const navItems = [
  { key: 'dashboard', icon: <DashboardOutlined />, label: 'Dashboard', path: '/' },
  { key: 'deals', icon: <GiftOutlined />, label: 'Deals', path: '/deals' },
  { key: 'discounts', icon: <PercentageOutlined />, label: 'Discounts', path: '/discounts' },
  { key: 'branches', icon: <ShopOutlined />, label: 'Branches', path: '/branches' },
  { key: 'banners', icon: <PictureOutlined />, label: 'Banners', path: '/banners' },
  { key: 'staff', icon: <TeamOutlined />, label: 'Staff', path: '/staff' },
  { key: 'reviews', icon: <StarOutlined />, label: 'Reviews', path: '/reviews' },
  { key: 'analytics', icon: <AreaChartOutlined />, label: 'Analytics', path: '/analytics' },
  { key: 'notifications', icon: <BellOutlined />, label: 'Notifications', path: '/notifications' },
  { key: 'settings', icon: <SettingOutlined />, label: 'Settings', path: '/settings' }
];

export const AppLayout = () => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const {
    token: { colorBgContainer }
  } = theme.useToken();

  const selectedKey = useMemo(() => {
    const found = navItems.find((item) => item.path === location.pathname);
    return found?.key ?? 'dashboard';
  }, [location.pathname]);

  return (
    <Layout>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed} width={240} style={{ background: '#001529' }}>
        <div className="py-6 text-center text-white text-xl font-semibold tracking-wide">Partner Panel</div>
        <Menu theme="dark" mode="inline" selectedKeys={[selectedKey]}
          items={navItems.map((item) => ({
            key: item.key,
            icon: item.icon,
            label: <Link to={item.path}>{item.label}</Link>
          }))}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: '0 24px',
            background: colorBgContainer,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <Typography.Title level={4} style={{ margin: 0 }}>
            {navItems.find((item) => item.key === selectedKey)?.label ?? 'Dashboard'}
          </Typography.Title>
          <Space size="large">
            <div className="text-sm text-gray-600">{user?.phone}</div>
            <Button type="link" onClick={logout}>
              Logout
            </Button>
          </Space>
        </Header>
        <Content style={{ margin: '24px', minHeight: 280 }}>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/deals" element={<DealsPage />} />
            <Route path="/discounts" element={<DiscountsPage />} />
            <Route path="/branches" element={<BranchesPage />} />
            <Route path="/banners" element={<BannersPage />} />
            <Route path="/staff" element={<StaffPage />} />
            <Route path="/reviews" element={<ReviewsPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
};
