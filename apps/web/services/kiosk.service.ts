import type { ApiEndpointWithBody, Snapshot, MenuItem } from '@repo/api-client';
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
export async function request<T>(
  endpoint: ApiEndpointWithBody<unknown, T>,
): Promise<T> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API || 'http://localhost:3001'}${endpoint.url}`,
    {
      method: endpoint.method,
      headers: { 'Content-Type': 'application/json' },
      body: endpoint.body ? JSON.stringify(endpoint.body) : undefined,
      signal: AbortSignal.timeout(5000),
      cache: 'no-store',
    },
  );
  const data: unknown = await response.json();
  if (!response.ok)
    throw new ApiError(
      data && typeof data === 'object' && 'message' in data
        ? String(data.message)
        : 'Request failed',
      response.status,
    );
  return data as T;
}
export async function verifySnapshot(snapshot: Snapshot) {
  if (
    !Number.isInteger(snapshot.version) ||
    !Array.isArray(snapshot.items) ||
    !snapshot.items.length ||
    snapshot.items.some(
      (i) =>
        typeof i.id !== 'string' ||
        typeof i.name !== 'string' ||
        !Number.isSafeInteger(i.price) ||
        i.price < 0 ||
        typeof i.available !== 'boolean',
    )
  )
    throw new Error('Invalid snapshot schema; keeping last-known-good menu.');
  const canonical = snapshot.items.map(
    ({
      id,
      name,
      category,
      description,
      price,
      available,
      icon,
    }: MenuItem) => ({
      id,
      name,
      category,
      description,
      price,
      available,
      icon,
    }),
  );
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(JSON.stringify(canonical)),
  );
  const checksum = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  if (checksum !== snapshot.checksum)
    throw new Error('Checksum mismatch; keeping last-known-good menu.');
  return snapshot;
}
