import httpClient from './httpClient';
import type { Envelope, Partner } from '../types';

export const fetchPartnerProfile = async (partnerId?: number): Promise<Partner> => {
  const params = partnerId ? { partner_id: String(partnerId) } : undefined;
  const response = await httpClient.get<Envelope<Partner>>('/merchant/partner-profile', { params });
  return response.data.data;
};

export type PartnerProfilePayload = Partial<
  Pick<
    Partner,
    |
      'description'
      | 'description_uz'
      | 'description_ru'
      | 'contact_email'
      | 'contact_phone'
      | 'address'
      | 'website'
      | 'instagram_url'
      | 'telegram_url'
      | 'youtube_url'
      | 'facebook_url'
  >
>;

export const updatePartnerProfile = async (
  payload: PartnerProfilePayload,
  options?: { logo?: File | null; menu?: File | null; partnerId?: number }
): Promise<Partner> => {
  const formData = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, value);
    }
  });
  if (options?.partnerId) {
    formData.append('partner_id', String(options.partnerId));
  }
  if (options?.logo) {
    formData.append('logo', options.logo);
  }
  if (options?.menu) {
    formData.append('menu', options.menu);
  }
  const response = await httpClient.patch<Envelope<Partner>>('/merchant/partner-profile', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data.data;
};
