import dayjs from 'dayjs';

export const dashboardData = {
  metrics: {
    totalRedemptions: 18234,
    todaysRedemptions: 256,
    activeDeals: 12,
    merchantRating: 4.7
  },
  branches: [
    { id: 1, name: 'Downtown Hub', city: 'Tashkent', today: 92, trend: 12, rating: 4.8 },
    { id: 2, name: 'Mega Mall', city: 'Samarkand', today: 54, trend: -5, rating: 4.5 },
    { id: 3, name: 'Airport Express', city: 'Tashkent', today: 38, trend: 3, rating: 4.2 },
    { id: 4, name: 'City Center', city: 'Bukhara', today: 72, trend: 8, rating: 4.6 }
  ],
  dealMix: [
    { type: 'one_plus_one', label: '1+1 Deals', value: 45, color: '#1677ff' },
    { type: 'percent', label: '% Discounts', value: 35, color: '#52c41a' },
    { type: 'exclusive', label: 'Exclusive Offers', value: 20, color: '#faad14' }
  ],
  alerts: [
    { id: 'expiring', title: '3 deals expiring soon', description: 'Extend special offers ending in 2 days', type: 'warning' },
    { id: 'rating', title: 'Branch rating dropped', description: 'Downtown Hub rating is below 4 this week', type: 'critical' }
  ]
};

export const dealLibrary = {
  items: [
    {
      id: 'deal-1',
      name: '2-for-1 Lunch',
      type: 'one_plus_one',
      plan: 'Gold',
      status: 'pending',
      start: dayjs().subtract(1, 'day').toISOString(),
      end: dayjs().add(6, 'day').toISOString(),
      redemptions: 320
    },
    {
      id: 'deal-2',
      name: '20% off Desserts',
      type: 'percent',
      plan: 'Premium',
      status: 'active',
      start: dayjs().subtract(10, 'day').toISOString(),
      end: dayjs().add(20, 'day').toISOString(),
      redemptions: 560
    },
    {
      id: 'deal-3',
      name: 'VIP Chef Table',
      type: 'exclusive',
      plan: 'Elite',
      status: 'paused',
      start: dayjs().subtract(30, 'day').toISOString(),
      end: dayjs().add(2, 'day').toISOString(),
      redemptions: 120
    }
  ]
};

export const staffDirectory = [
  { id: 'staff-1', name: 'Sardor', phone: '+998 90 123 45 67', role: 'Manager', branches: ['Downtown Hub', 'Mega Mall'], permissions: ['full'] },
  { id: 'staff-2', name: 'Aziza', phone: '+998 93 765 43 21', role: 'Cashier', branches: ['City Center'], permissions: ['scan'] },
  { id: 'staff-3', name: 'Timur', phone: '+998 97 111 22 33', role: 'Scanner', branches: ['Airport Express'], permissions: ['scan'] }
];

export const reviewsData = {
  averageRating: 4.5,
  totalReviews: 238,
  reviews: [
    { id: 1, user: 'Nilufar', branch: 'Downtown Hub', rating: 5, comment: 'Great ambiance and quick scanning experience.' },
    { id: 2, user: 'Alex', branch: 'Mega Mall', rating: 3, comment: 'Deal was unavailable during lunch rush.' }
  ]
};

export const analyticsData = {
  redemptionSeries: [
    { date: dayjs().subtract(6, 'day').format('DD MMM'), value: 180 },
    { date: dayjs().subtract(5, 'day').format('DD MMM'), value: 230 },
    { date: dayjs().subtract(4, 'day').format('DD MMM'), value: 200 },
    { date: dayjs().subtract(3, 'day').format('DD MMM'), value: 260 },
    { date: dayjs().subtract(2, 'day').format('DD MMM'), value: 310 },
    { date: dayjs().subtract(1, 'day').format('DD MMM'), value: 290 },
    { date: dayjs().format('DD MMM'), value: 340 }
  ],
  branchLeaders: [
    { name: 'Downtown Hub', value: 38 },
    { name: 'Mega Mall', value: 24 },
    { name: 'Airport Express', value: 18 }
  ],
  demographic: [
    { segment: 'Gen Z', value: 35 },
    { segment: 'Millennial', value: 45 },
    { segment: 'Gen X', value: 20 }
  ],
  engagement: {
    followers: 5200,
    profileViews: 1800,
    wishlistAdds: 640,
    conversions: 420
  }
};

export const notifications = [
  { id: 'notif-1', title: 'Deal approved', body: '“VIP Chef Table” was approved by admin', type: 'success', time: '2 hours ago' },
  { id: 'notif-2', title: 'Deal performance alert', body: '“20% off Desserts” is underperforming', type: 'warning', time: '5 hours ago' },
  { id: 'notif-3', title: 'Deal expired', body: '“Lunch Rush Combo” expired today', type: 'danger', time: '1 day ago' }
];
