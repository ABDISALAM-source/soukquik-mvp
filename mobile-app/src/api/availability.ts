import { api } from './client';

export interface AvailabilityRule {
  id: string;
  providerId: string;
  weekday: number;
  startTime: string;
  endTime: string;
}

export interface AvailabilityException {
  id: string;
  providerId: string;
  date: string;
  isClosed: boolean;
  startTime: string | null;
  endTime: string | null;
}

export interface ResolvedAvailability {
  date: string;
  closed: boolean;
  windows: { startTime: string; endTime: string }[];
  hasAnyRule: boolean;
}

export async function fetchMyAvailability() {
  const res = await api.get('/availability/mine');
  return res.data.data as { rules: AvailabilityRule[]; exceptions: AvailabilityException[] };
}

export async function createRule(input: { weekday: number; startTime: string; endTime: string }) {
  const res = await api.post('/availability/rules', input);
  return res.data.data as AvailabilityRule;
}

export async function deleteRule(id: string) {
  await api.delete(`/availability/rules/${id}`);
}

export async function createException(input: { date: string; isClosed: boolean; startTime?: string; endTime?: string }) {
  const res = await api.post('/availability/exceptions', input);
  return res.data.data as AvailabilityException;
}

export async function deleteException(id: string) {
  await api.delete(`/availability/exceptions/${id}`);
}

export async function fetchServiceAvailability(serviceId: string, date: string) {
  const res = await api.get(`/services/${serviceId}/availability`, { params: { date } });
  return res.data.data as ResolvedAvailability;
}
