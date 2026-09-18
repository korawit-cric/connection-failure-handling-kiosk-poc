import type { ApiEndpoint, ApiEndpointWithBody } from './types.js';
export interface MenuItem {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  available: boolean;
  icon: string;
}
export interface Snapshot {
  version: number;
  checksum: string;
  items: MenuItem[];
  createdAt: string;
}
export interface CartLine {
  id: string;
  quantity: number;
}
export interface Quote {
  id: string;
  menuVersion: number;
  items: (CartLine & { name: string; price: number })[];
  total: number;
  expiresAt: string;
}
export interface PaymentResult {
  id: string;
  quoteId: string;
  status: 'PAID' | 'FAILED' | 'UNKNOWN';
  amount: number;
}
export interface QuoteRequest {
  items: CartLine[];
  localVersion: number;
}
export interface PublishRequest {
  baseVersion: number;
  items: MenuItem[];
}
export interface PayRequest {
  quoteId: string;
  mode: 'success' | 'decline' | 'timeout';
}
export interface OutboxEvent {
  id: string;
  type: 'CART_UPDATED';
  createdAt: string;
  items: CartLine[];
}
const get = <T>(url: string): ApiEndpoint<T> => ({ url, method: 'GET' });
const post = <B, T>(url: string, body: B): ApiEndpointWithBody<B, T> => ({
  url,
  method: 'POST',
  body,
});
export const kioskApi = {
  revision: () => get<{ version: number }>('/kiosk/menu/version'),
  menu: () => get<Snapshot>('/kiosk/menu'),
  versions: () => get<Snapshot[]>('/kiosk/versions'),
  publish: (body: PublishRequest) =>
    post<PublishRequest, Snapshot>('/kiosk/menu', body),
  quote: (body: QuoteRequest) =>
    post<QuoteRequest, Quote>('/kiosk/quote', body),
  pay: (body: PayRequest) =>
    post<PayRequest, PaymentResult>('/kiosk/pay', body),
  reconcile: (id: string) =>
    post<Record<string, never>, PaymentResult>(
      `/kiosk/pay/${id}/reconcile`,
      {},
    ),
  events: (body: OutboxEvent[]) =>
    post<OutboxEvent[], { accepted: string[] }>('/kiosk/events', body),
  payments: () => get<PaymentResult[]>('/kiosk/payments'),
};
