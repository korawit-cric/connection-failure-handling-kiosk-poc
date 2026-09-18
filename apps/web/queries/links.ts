'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  linksApi,
  type CreateLinkDto,
  type UpdateLinkDto,
  type Link,
} from '@repo/api-client';
import { clientFetch } from '../lib/fetch/client';

export const linkKeys = {
  all: ['links'] as const,
  detail: (id: number) => ['links', id] as const,
};

/**
 * Helper to add a delay to async operations
 */
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Hook to fetch all links (client-side with TanStack Query)
 */
export function useLinksQuery() {
  return useQuery<Link[]>({
    queryKey: linkKeys.all,
    queryFn: async () => {
      await delay(800);
      return clientFetch(linksApi.list());
    },
  });
}

/**
 * Hook to fetch a single link
 */
export function useLinkQuery(id: number) {
  return useQuery<Link>({
    queryKey: linkKeys.detail(id),
    queryFn: async () => {
      await delay(600);
      return clientFetch(linksApi.detail(id));
    },
    enabled: !!id,
  });
}

/**
 * Hook to create a new link
 */
export function useCreateLinkMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateLinkDto) => clientFetch(linksApi.create(data)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: linkKeys.all });
    },
  });
}

/**
 * Hook to update a link
 */
export function useUpdateLinkMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateLinkDto }) =>
      clientFetch(linksApi.update(id, data)),
    onSuccess: (_, { id }) => {
      void queryClient.invalidateQueries({ queryKey: linkKeys.all });
      void queryClient.invalidateQueries({ queryKey: linkKeys.detail(id) });
    },
  });
}

/**
 * Hook to delete a link
 */
export function useDeleteLinkMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => clientFetch(linksApi.delete(id)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: linkKeys.all });
    },
  });
}
