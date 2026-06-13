import httpClient from './httpClient';
import type { Envelope, MerchantDeal, DealStatus } from '../types';

const TRANSLATION_LANGS = ['uz', 'ru'] as const;

export type DealFilters = {
  partnerId?: number;
  status?: DealStatus | 'all';
  search?: string;
  planId?: number;
  validFrom?: string;
  validTo?: string;
};

type DealPayload = {
  partner_id: number;
  subscription_plan: number;
  title?: string;
  description?: string;
  terms?: string;
  start_at?: string;
  end_at?: string;
  price?: string;
  discount_percent?: number;
  offer_type?: string;
  image?: File | null;
  title_translations?: Record<string, string>;
  description_translations?: Record<string, string>;
  terms_translations?: Record<string, string>;
};

const buildFormData = (payload: DealPayload) => {
  const formData = new FormData();
  if (payload.title) formData.append('title', payload.title);
  if (payload.description) formData.append('description', payload.description);
  if (payload.terms) formData.append('terms', payload.terms);
  appendTranslations(formData, 'title', payload.title_translations);
  appendTranslations(formData, 'description', payload.description_translations);
  appendTranslations(formData, 'terms', payload.terms_translations);
  formData.append('subscription_plan', String(payload.subscription_plan));
  if (payload.start_at) formData.append('start_at', payload.start_at);
  if (payload.end_at) formData.append('end_at', payload.end_at);
  if (payload.price) formData.append('price', payload.price);
  if (typeof payload.discount_percent === 'number') {
    formData.append('discount_percent', String(payload.discount_percent));
  }
  if (payload.offer_type) formData.append('offer_type', payload.offer_type);
  if (payload.image) formData.append('image', payload.image);
  return formData;
};

const appendTranslations = (formData: FormData, field: string, translations?: Record<string, string>) => {
  if (!translations) return;
  TRANSLATION_LANGS.forEach((lang) => {
    const value = translations[lang];
    if (value) {
      formData.append(`${field}_${lang}`, value);
    }
  });
};

export const fetchMerchantDeals = async (filters?: DealFilters): Promise<MerchantDeal[]> => {
  const params: Record<string, string> = {};
  if (filters?.partnerId) {
    params.partner_id = String(filters.partnerId);
  }
  if (filters?.status && filters.status !== 'all') {
    params.status = filters.status;
  }
  if (filters?.search) {
    params.search = filters.search;
  }
  if (filters?.planId) {
    params.plan_id = String(filters.planId);
  }
  if (filters?.validFrom) {
    params.valid_from = filters.validFrom;
  }
  if (filters?.validTo) {
    params.valid_to = filters.validTo;
  }
  const response = await httpClient.get<Envelope<MerchantDeal[]>>('/merchant/special-offers', {
    params
  });
  return response.data.data;
};

export const createDeal = async (payload: DealPayload): Promise<MerchantDeal> => {
  const response = await httpClient.post<Envelope<MerchantDeal>>(
    `/merchant/partners/${payload.partner_id}/special-offers`,
    buildFormData(payload),
    {
      headers: { 'Content-Type': 'multipart/form-data' }
    }
  );
  return response.data.data;
};

export const updateDealStatus = async (dealId: number, status: DealStatus): Promise<MerchantDeal> => {
  const response = await httpClient.patch<Envelope<MerchantDeal>>(`/merchant/special-offers/${dealId}/status`, { status });
  return response.data.data;
};

export const updateDeal = async (partnerId: number, dealId: number, payload: DealPayload): Promise<MerchantDeal> => {
  const response = await httpClient.patch<Envelope<MerchantDeal>>(
    `/merchant/partners/${partnerId}/special-offers/${dealId}`,
    buildFormData(payload),
    {
      headers: { 'Content-Type': 'multipart/form-data' }
    }
  );
  return response.data.data;
};
