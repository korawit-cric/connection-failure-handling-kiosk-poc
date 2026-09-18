import type { Link } from '@repo/prisma';
import type {
  ApiEndpoint,
  ApiEndpointWithBody,
  CreateLinkDto,
  UpdateLinkDto,
} from './types.js';

/**
 * Links API definitions
 * Pure data contracts - no fetch, no React, no Next.js
 */
export const linksApi = {
  list: (): ApiEndpoint<Link[]> => ({
    url: '/links',
    method: 'GET',
  }),

  detail: (id: number): ApiEndpoint<Link> => ({
    url: `/links/${id}`,
    method: 'GET',
  }),

  create: (data: CreateLinkDto): ApiEndpointWithBody<CreateLinkDto, Link> => ({
    url: '/links',
    method: 'POST',
    body: data,
  }),

  update: (
    id: number,
    data: UpdateLinkDto,
  ): ApiEndpointWithBody<UpdateLinkDto, Link> => ({
    url: `/links/${id}`,
    method: 'PATCH',
    body: data,
  }),

  delete: (id: number): ApiEndpoint<void> => ({
    url: `/links/${id}`,
    method: 'DELETE',
  }),
};
