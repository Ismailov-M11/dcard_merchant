export interface Partner {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  description_uz?: string | null;
  description_ru?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  address?: string | null;
  website?: string | null;
  instagram_url?: string | null;
  telegram_url?: string | null;
  youtube_url?: string | null;
  facebook_url?: string | null;
  logo?: string | null;
  menu?: string | null;
  is_active?: boolean;
}

export interface OutletType {
  id: number;
  name: string;
}

export interface Outlet {
  id: number;
  name: string;
  city: string;
  address: string;
  slug: string;
  phone?: string | null;
  partner: Partner;
  is_approved: boolean;
  outlet_type?: OutletType | null;
  location?: OutletLocation | null;
  menu?: string | null;
}

export interface OutletBanner {
  id: number;
  outlet_id: number;
  outlet_name: string;
  image?: string | null;
  background_color?: string | null;
  text_color?: string | null;
  suggested_background_colors?: string[];
  applies_to_all_outlets: boolean;
  shared_outlet_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Envelope<T> {
  success: boolean;
  data: T;
  error: unknown;
  meta: Record<string, unknown>;
}

export interface CurrentUser {
  id: number;
  phone: string;
  role: string;
  first_name?: string;
  last_name?: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  user_id: number;
  role: string;
}

export interface OutletLocation {
  lat: number;
  lng: number;
}

export type DealStatus = 'pending' | 'active' | 'paused' | 'rejected';

export interface MerchantDeal {
  id: number;
  title: string;
  description?: string | null;
  terms?: string | null;
  status: DealStatus;
  partner: number;
  partner_detail?: Partner | null;
  subscription_plan: number;
  subscription_plan_detail?: {
    id: number;
    code: string;
    name?: string | null;
  } | null;
  start_at?: string | null;
  end_at?: string | null;
  price: string;
  discount_percent: number;
  offer_type: string;
  image?: string | null;
  is_active: boolean;
  show_in_home_page: boolean;
  title_translations?: Record<string, string>;
  description_translations?: Record<string, string>;
  terms_translations?: Record<string, string>;
}

export interface SubscriptionPlanSummary {
  id: number;
  code: string;
  name: string;
  plan_type: string;
  price_month?: string | null;
}

export type PartnerDiscountStatus = 'pending' | 'approved' | 'rejected';

export interface PartnerSubscriptionDiscount {
  id: number;
  partner: number;
  partner_name: string;
  subscription_plan: number;
  subscription_plan_detail?: {
    id: number;
    code: string;
    name?: string | null;
  } | null;
  discount_percent: number;
  is_active: boolean;
  status: PartnerDiscountStatus;
  requested_by_phone?: string | null;
  approved_by_phone?: string | null;
  approved_at?: string | null;
  created_at: string;
}
