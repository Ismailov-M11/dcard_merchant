import httpClient from './httpClient';
import type { Envelope, VerificationLog } from '../types';

interface VerificationLogEntry {
  verification_id: string;
  user: string;
  plan: string | null;
  special_offer: string | null;
  special_offer_id: number | null;
  discount_percent: number;
  status: VerificationLog['status'];
  timestamp: string;
  merchant_staff: string | null;
}

interface VerificationLogResponse {
  results: VerificationLogEntry[];
}

export const fetchVerificationLogs = async (outletId: number): Promise<VerificationLog[]> => {
  const response = await httpClient.get<Envelope<VerificationLogResponse>>(
    `/merchant/${outletId}/verification-logs`,
  );
  const entries = response.data.data.results;
  return entries.map((entry) => ({ ...entry, outlet_id: outletId, outlet_name: '' }));
};

// Fetch logs for multiple outlets in parallel and combine
export const fetchAllVerificationLogs = async (
  outlets: { id: number; name: string }[],
): Promise<VerificationLog[]> => {
  if (outlets.length === 0) return [];
  const results = await Promise.allSettled(
    outlets.map((o) => fetchVerificationLogs(o.id)),
  );
  return results.flatMap((r, i) => {
    if (r.status === 'fulfilled') {
      return r.value.map((log) => ({ ...log, outlet_name: outlets[i].name }));
    }
    return [];
  });
};
