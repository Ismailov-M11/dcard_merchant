import { Alert, Card, List, Switch } from 'antd';
import { notifications } from '../api/mockData';

const NotificationsPage = () => {
  return (
    <div className="space-y-6">
      <Card title="Preferences">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="flex items-center justify-between p-4 border rounded">
            <span>Deal approvals</span>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between p-4 border rounded">
            <span>Performance alerts</span>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between p-4 border rounded">
            <span>Announcements</span>
            <Switch />
          </div>
        </div>
      </Card>
      <Card title="Inbox">
        <List
          itemLayout="vertical"
          dataSource={notifications}
          renderItem={(item) => (
            <List.Item>
              <Alert
                message={item.title}
                description={item.body}
                type={item.type === 'success' ? 'success' : item.type === 'warning' ? 'warning' : 'error'}
                showIcon
              />
              <span className="text-xs text-gray-500">{item.time}</span>
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
};

export default NotificationsPage;
