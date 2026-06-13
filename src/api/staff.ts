import httpClient from './httpClient';
import type { Envelope } from '../types';

export type StaffMember = {
  id: number;
  phone: string;
  full_name?: string;
  outlet_id: number;
  outlet_name: string;
  partner_name: string;
  staff_roles: string[];
  is_active: boolean;
};

type CreateStaffPayload = {
  phone: string;
  staff_roles: string[];
  full_name?: string;
};

type StaffFilters = {
  outletId?: number | 'all';
  search?: string;
};

export const fetchStaff = async (filters?: StaffFilters): Promise<StaffMember[]> => {
  const params: Record<string, string> = {};
  if (filters?.outletId && filters.outletId !== 'all') {
    params.outlet_id = String(filters.outletId);
  }
  if (filters?.search) {
    params.search = filters.search;
  }
  const response = await httpClient.get<Envelope<StaffMember[]>>('/merchant/staff', {
    params: Object.keys(params).length ? params : undefined
  });
  return response.data.data;
};

export const addStaffMember = async (outletId: number, payload: CreateStaffPayload): Promise<StaffMember> => {
  const response = await httpClient.post<Envelope<StaffMember>>(`/merchant/${outletId}/staff`, payload);
  return response.data.data;
};

export const updateStaffPassword = async (staffId: number, password: string) => {
  await httpClient.patch(`/merchant/staff/${staffId}/password`, { password });
};

export const updateStaffMember = async (
  staffId: number,
  payload: Partial<{ phone: string; full_name: string; staff_roles: string[]; outlet_id: number }>
): Promise<StaffMember> => {
  const response = await httpClient.patch<Envelope<StaffMember>>(`/merchant/staff/${staffId}`, payload);
  return response.data.data;
};

export const deleteStaffMember = async (staffId: number): Promise<void> => {
  await httpClient.delete(`/merchant/staff/${staffId}`);
};
