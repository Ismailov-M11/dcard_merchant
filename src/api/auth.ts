import httpClient from './httpClient';
import type { AuthTokens, CurrentUser, Envelope } from '../types';

interface LoginPayload {
  phone: string;
  password: string;
}

export const loginWithPassword = async (payload: LoginPayload): Promise<AuthTokens> => {
  const response = await httpClient.post<Envelope<AuthTokens>>('/auth/login/password', payload);
  return response.data.data;
};

export const fetchCurrentUser = async (): Promise<CurrentUser> => {
  const response = await httpClient.get<Envelope<CurrentUser>>('/auth/me');
  return response.data.data;
};
