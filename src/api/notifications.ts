import httpClient from './httpClient';
import type { Envelope, Notification, Paginated } from '../types';

export const fetchNotifications = async (): Promise<Paginated<Notification>> => {
  const response = await httpClient.get<Envelope<Paginated<Notification>>>('/notifications/my/');
  return response.data.data;
};

export const markAllNotificationsRead = async (): Promise<{ updated: number }> => {
  const response = await httpClient.post<Envelope<{ updated: number }>>('/notifications/my/read-all');
  return response.data.data;
};
