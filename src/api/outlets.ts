import httpClient from './httpClient';
import type { Envelope, Outlet, OutletType, Partner, OutletLocation } from '../types';

export interface OutletPayload {
  name: string;
  city: string;
  address: string;
  slug: string;
  phone?: string;
  partner_id: number;
  outlet_type_id?: number | null;
  is_approved?: boolean;
  location?: OutletLocation | null;
}

const buildFormData = (payload: Partial<OutletPayload>, image?: File | null, menu?: File | null) => {
  const formData = new FormData();
  if (payload.name !== undefined) {
    formData.append('name', payload.name);
  }
  if (payload.city !== undefined) {
    formData.append('city', payload.city);
  }
  if (payload.address !== undefined) {
    formData.append('address', payload.address);
  }
  if (payload.phone !== undefined) {
    formData.append('phone', payload.phone);
  }
  if (payload.slug !== undefined) {
    formData.append('slug', payload.slug);
  }
  if (payload.partner_id !== undefined) {
    formData.append('partner_id', String(payload.partner_id));
  }
  if (payload.outlet_type_id !== undefined && payload.outlet_type_id !== null) {
    formData.append('outlet_type_id', String(payload.outlet_type_id));
  }
  if (typeof payload.is_approved === 'boolean') {
    formData.append('is_approved', String(payload.is_approved));
  }
  if (payload.location && !Number.isNaN(payload.location.lat) && !Number.isNaN(payload.location.lng)) {
    const geojson = JSON.stringify({
      type: 'Point',
      coordinates: [payload.location.lng, payload.location.lat]
    });
    formData.append('location', geojson);
  }
  if (image) {
    formData.append('image', image);
  }
  if (menu) {
    formData.append('menu', menu);
  }
  return formData;
};

export const fetchPartners = async (): Promise<Partner[]> => {
  const response = await httpClient.get<Envelope<Partner[]>>('/merchant/partners');
  return response.data.data;
};

export const fetchOutletTypes = async (): Promise<OutletType[]> => {
  const response = await httpClient.get<Envelope<OutletType[]>>('/outlets/types/');
  return response.data.data;
};

type OutletFilters = {
  partnerId?: number;
  search?: string;
  outletTypeId?: number | 'all';
};

export const fetchOutlets = async (filters?: OutletFilters): Promise<Outlet[]> => {
  const params: Record<string, string> = {};
  if (filters?.partnerId) {
    params.partner_id = String(filters.partnerId);
  }
  if (filters?.search) {
    params.search = filters.search;
  }
  if (
    filters?.outletTypeId !== undefined &&
    filters.outletTypeId !== null &&
    filters.outletTypeId !== 'all'
  ) {
    params.outlet_type_id = String(filters.outletTypeId);
  }
  const response = await httpClient.get<Envelope<Outlet[]>>('/merchant/outlets/', {
    params: Object.keys(params).length ? params : undefined
  });
  return response.data.data;
};

export const createOutlet = async (payload: OutletPayload, image?: File | null, menu?: File | null): Promise<Outlet> => {
  const response = await httpClient.post<Envelope<Outlet>>('/merchant/outlets/', buildFormData(payload, image, menu), {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data.data;
};

export const updateOutlet = async (id: number, payload: Partial<OutletPayload>, image?: File | null, menu?: File | null): Promise<Outlet> => {
  const response = await httpClient.patch<Envelope<Outlet>>(`/merchant/outlets/${id}/`, buildFormData(payload, image, menu), {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data.data;
};

export const deleteOutlet = async (id: number) => {
  await httpClient.delete(`/merchant/outlets/${id}/`);
};
