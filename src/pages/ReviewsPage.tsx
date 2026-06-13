import { Card, Col, Rate, Row, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { reviewsData, dashboardData } from '../api/mockData';

const ReviewsPage = () => {
  const columns: ColumnsType<(typeof reviewsData.reviews)[number]> = [
    { title: 'User', dataIndex: 'user', key: 'user' },
    { title: 'Branch', dataIndex: 'branch', key: 'branch' },
    { title: 'Comment', dataIndex: 'comment', key: 'comment' },
    { title: 'Rating', dataIndex: 'rating', key: 'rating', render: (rating: number) => <Rate disabled defaultValue={rating} /> }
  ];

  return (
    <div className="space-y-6">
      <Row gutter={16}>
        <Col span={8}>
          <Card title="Overall rating">
            <div className="text-5xl font-semibold text-center">{reviewsData.averageRating}</div>
            <Rate disabled allowHalf defaultValue={reviewsData.averageRating} className="mt-4 flex justify-center" />
            <p className="text-center text-gray-500 mt-2">Based on {reviewsData.totalReviews} reviews</p>
          </Card>
        </Col>
        <Col span={16}>
          <Card title="Branch sentiment">
            <Row gutter={16}>
              {dashboardData.branches.map((branch) => (
                <Col span={12} key={branch.id} className="mb-4">
                  <Card bordered={false} className="bg-gray-50">
                    <div className="font-semibold">{branch.name}</div>
                    <div className="flex items-center justify-between mt-2">
                      <Rate disabled allowHalf defaultValue={branch.rating} />
                      <Tag color={branch.rating > 4.5 ? 'green' : 'blue'}>{branch.rating}</Tag>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Low-performing when rating drops below 4.0</p>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
      </Row>
      <Card title="Recent reviews">
        <Table columns={columns} dataSource={reviewsData.reviews} rowKey="id" />
      </Card>
    </div>
  );
};

export default ReviewsPage;
