import httpClient from './httpClient';
import type { Envelope, SubscriptionPlanSummary } from '../types';

export const fetchSubscriptionPlans = async (): Promise<SubscriptionPlanSummary[]> => {
  const response = await httpClient.get<Envelope<SubscriptionPlanSummary[]>>('/merchant/plans');
  return response.data.data;
};
