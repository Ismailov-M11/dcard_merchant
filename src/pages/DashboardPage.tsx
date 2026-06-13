import { Card, Col, Progress, Row, Statistic, Table, Tag } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { useMemo } from 'react';
import { dashboardData } from '../api/mockData';

const DashboardPage = () => {
  const branchColumns = useMemo(
    () => [
      { title: 'Branch', dataIndex: 'name', key: 'name' },
      { title: 'City', dataIndex: 'city', key: 'city' },
      { title: 'Today Redemptions', dataIndex: 'today', key: 'today' },
      { title: 'Week Trend', dataIndex: 'trend', key: 'trend', render: (trend: number) => <Tag color={trend >= 0 ? 'green' : 'red'}>{trend}%</Tag> },
      { title: 'Rating', dataIndex: 'rating', key: 'rating' }
    ],
    []
  );

  return (
    <div className="space-y-6">
      <Row gutter={16}>
        <Col span={6}>
          <Card>
            <Statistic title="Total redemptions" value={dashboardData.metrics.totalRedemptions} suffix={<Tag color="blue">All time</Tag>} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Today's redemptions"
              value={dashboardData.metrics.todaysRedemptions}
              valueStyle={{ color: '#52c41a' }}
              prefix={<ArrowUpOutlined />}
              suffix="vs yesterday"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="Active deals" value={dashboardData.metrics.activeDeals} suffix="live" />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Merchant rating"
              value={dashboardData.metrics.merchantRating}
              precision={1}
              valueStyle={{ color: '#faad14' }}
              suffix="/ 5"
            />
          </Card>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col xs={24} lg={14}>
          <Card title="Branch performance overview" extra={<span>Last 7 days</span>}>
            <Table
              size="small"
              pagination={{ pageSize: 4 }}
              columns={branchColumns}
              dataSource={dashboardData.branches}
              rowKey="id"
            />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="Deal mix">
            {dashboardData.dealMix.map((deal) => (
              <div key={deal.type} className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span>{deal.label}</span>
                  <span>{deal.value}%</span>
                </div>
                <Progress percent={deal.value} showInfo={false} strokeColor={deal.color} />
              </div>
            ))}
          </Card>
          <Card title="Alerts" className="mt-4">
            {dashboardData.alerts.map((alert) => (
              <div key={alert.id} className="flex items-center justify-between py-2 border-b last:border-none">
                <div>
                  <p className="font-medium">{alert.title}</p>
                  <span className="text-xs text-gray-500">{alert.description}</span>
                </div>
                <Tag color={alert.type === 'warning' ? 'gold' : 'red'}>{alert.type}</Tag>
              </div>
            ))}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DashboardPage;
