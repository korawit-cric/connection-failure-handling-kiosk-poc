// Re-export Prisma types for convenience
export type { Link } from '@repo/prisma';

// API request/response types
export interface ApiEndpoint<TResponse = unknown> {
  url: string;
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  _response?: TResponse; // Phantom type for inference
}

export interface ApiEndpointWithBody<
  TBody = unknown,
  TResponse = unknown,
> extends ApiEndpoint<TResponse> {
  body?: TBody;
}

// Link DTOs
export interface CreateLinkDto {
  title: string;
  url: string;
  description?: string;
}

export interface UpdateLinkDto {
  title?: string;
  url?: string;
  description?: string;
}
