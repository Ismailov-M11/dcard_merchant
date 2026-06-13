import httpClient from './httpClient';
import type { Envelope, OutletBanner } from '../types';

export type OutletBannerPayload = {
  background_color?: string | null;
  apply_to_all_outlets?: boolean;
  is_active?: boolean;
  image?: File | null;
};

const buildFormData = (payload: OutletBannerPayload) => {
  const formData = new FormData();
  if (payload.background_color !== undefined) {
    formData.append('background_color', payload.background_color ?? '');
  }
  if (typeof payload.apply_to_all_outlets === 'boolean') {
    formData.append('apply_to_all_outlets', String(payload.apply_to_all_outlets));
  }
  if (typeof payload.is_active === 'boolean') {
    formData.append('is_active', String(payload.is_active));
  }
  if (payload.image) {
    formData.append('image', payload.image);
  }
  return formData;
};

export const fetchOutletBanners = async (outletId: number): Promise<OutletBanner[]> => {
  const response = await httpClient.get<Envelope<OutletBanner[]>>(`/merchant/outlets/${outletId}/banners`);
  return response.data.data ?? [];
};

export const createOutletBanner = async (outletId: number, payload: OutletBannerPayload): Promise<OutletBanner> => {
  const response = await httpClient.post<Envelope<OutletBanner>>(
    `/merchant/outlets/${outletId}/banners`,
    buildFormData(payload),
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    },
  );
  return response.data.data;
};

export const updateOutletBanner = async (
  outletId: number,
  bannerId: number,
  payload: OutletBannerPayload,
): Promise<OutletBanner> => {
  const response = await httpClient.patch<Envelope<OutletBanner>>(
    `/merchant/outlets/${outletId}/banners/${bannerId}`,
    buildFormData(payload),
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    },
  );
  return response.data.data;
};

export const deleteOutletBanner = async (
  outletId: number,
  bannerId: number,
  options?: { apply_to_all_outlets?: boolean },
) => {
  await httpClient.delete(`/merchant/outlets/${outletId}/banners/${bannerId}`, {
    params: options?.apply_to_all_outlets ? { apply_to_all_outlets: true } : undefined,
  });
};
