import httpClient from './httpClient';
import type { AuthTokens, CurrentUser, Envelope } from '../types';

// TODO(backend): remove mock when CORS is resolved on api.dcard.uz
const MOCK_MODE = true;

interface LoginPayload {
  phone: string;
  password: string;
}

export const loginWithPassword = async (payload: LoginPayload): Promise<AuthTokens> => {
  if (MOCK_MODE) {
    return {
      access_token: 'mock_access_token',
      refresh_token: 'mock_refresh_token',
      user_id: 1,
      role: 'partner_owner',
    };
  }
  const response = await httpClient.post<Envelope<AuthTokens>>('/auth/login/password', payload);
  return response.data.data;
};

export const fetchCurrentUser = async (): Promise<CurrentUser> => {
  if (MOCK_MODE) {
    return {
      id: 1,
      phone: '+998931255773',
      role: 'partner_owner',
      first_name: 'Demo',
      last_name: 'User',
    };
  }
  const response = await httpClient.get<Envelope<CurrentUser>>('/auth/me');
  return response.data.data;
};
