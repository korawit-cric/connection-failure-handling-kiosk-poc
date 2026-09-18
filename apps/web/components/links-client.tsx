'use client';

import { Button } from '@repo/ui/button';
import { useLinksQuery } from '../queries/links';

/**
 * Client-side links component using TanStack Query
 * Demonstrates clientFetch pattern with automatic caching & refetching
 */
export function LinksClient() {
  const {
    data: links,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useLinksQuery();

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Client-Side Fetch (TanStack Query)</h3>
          <Button onClick={() => void refetch()}>Refetch</Button>
        </div>
        <div className="border-surface rounded-xl border p-5">
          <div className="flex items-center gap-3">
            <div className="border-primary-500 h-5 w-5 animate-spin rounded-full border-2 border-t-transparent"></div>
            <p className="text-foreground/70">Loading links...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border-error-400/50 rounded-xl border p-5">
        <p className="text-error-400">Error loading links</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Client-Side Fetch (TanStack Query)</h3>
        <Button onClick={() => void refetch()} disabled={isFetching}>
          {isFetching ? 'Refetching...' : 'Refetch'}
        </Button>
      </div>

      {isFetching && !isLoading && (
        <div className="rounded-xl p-3">
          <div className="flex items-center gap-3">
            <div className="border-primary-500 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"></div>
            <p className="text-foreground/70 text-sm">Refetching links...</p>
          </div>
        </div>
      )}

      {links && links.length > 0 ? (
        <ul className="space-y-2">
          {links.map((link) => (
            <li
              key={link.id}
              className="border-primary-500/30 rounded-lg border border-dashed p-3 text-sm"
            >
              <span className="font-medium">{link.title}</span>
              <span className="text-foreground/50 ml-2">#{link.id}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-foreground/70">No links found</p>
      )}

      <p className="text-success-800/70 text-xs">
        ✓ Fetched client-side with useLinksQuery()
      </p>
    </div>
  );
}
