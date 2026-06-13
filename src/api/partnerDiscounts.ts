import httpClient from './httpClient';
import type { Envelope, PartnerSubscriptionDiscount } from '../types';

export const fetchPartnerDiscounts = async (partnerId: number): Promise<PartnerSubscriptionDiscount[]> => {
  const response = await httpClient.get<Envelope<PartnerSubscriptionDiscount[]>>(
    `/merchant/partners/${partnerId}/discounts`
  );
  return response.data.data;
};

export const requestPartnerDiscount = async (
  partnerId: number,
  payload: { subscription_plan: number; discount_percent: number; is_active?: boolean }
): Promise<PartnerSubscriptionDiscount> => {
  const response = await httpClient.post<Envelope<PartnerSubscriptionDiscount>>(
    `/merchant/partners/${partnerId}/discounts`,
    payload
  );
  return response.data.data;
};

export const updatePartnerDiscount = async (
  partnerId: number,
  discountId: number,
  payload: { discount_percent: number; is_active?: boolean }
): Promise<PartnerSubscriptionDiscount> => {
  const response = await httpClient.patch<Envelope<PartnerSubscriptionDiscount>>(
    `/merchant/partners/${partnerId}/discounts/${discountId}`,
    payload
  );
  return response.data.data;
};
