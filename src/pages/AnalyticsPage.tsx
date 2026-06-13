import { Card, Col, Progress, Row, Statistic } from 'antd';
import { analyticsData } from '../api/mockData';

const AnalyticsPage = () => {
  return (
    <div className="space-y-6">
      <Row gutter={16}>
        <Col xs={24} lg={16}>
          <Card title="Deal performance (last 7 days)">
            <div className="grid grid-cols-7 gap-4">
              {analyticsData.redemptionSeries.map((point) => (
                <div key={point.date} className="text-center">
                  <div className="h-40 bg-primary/10 flex items-end justify-center rounded">
                    <div className="w-6 bg-primary rounded-t" style={{ height: `${point.value / 4}%` }} />
                  </div>
                  <p className="text-xs mt-2">{point.date}</p>
                </div>
              ))}
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Engagement snapshot">
            <Row gutter={[8, 8]}>
              {Object.entries(analyticsData.engagement).map(([key, value]) => (
                <Col span={12} key={key}>
                  <Statistic title={key} value={value as number} />
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col xs={24} lg={12}>
          <Card title="Top-performing branches">
            {analyticsData.branchLeaders.map((branch) => (
              <div key={branch.name} className="mb-4">
                <div className="flex justify-between text-sm">
                  <span>{branch.name}</span>
                  <span>{branch.value}% of redemptions</span>
                </div>
                <Progress percent={branch.value} showInfo={false} />
              </div>
            ))}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Customer demographics">
            {analyticsData.demographic.map((segment) => (
              <div key={segment.segment} className="mb-4">
                <div className="flex justify-between text-sm">
                  <span>{segment.segment}</span>
                  <span>{segment.value}%</span>
                </div>
                <Progress percent={segment.value} strokeColor="#faad14" showInfo={false} />
              </div>
            ))}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AnalyticsPage;
