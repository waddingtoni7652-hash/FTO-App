/**
 * Stand-in for 'virtual:pwa-register' in the portable single-file build
 * (vite.portable.config.ts aliases the virtual module here). No service worker
 * is registered — the portable build runs directly from a file, so there is
 * nothing to cache.
 */
export function registerSW(_options?: unknown): () => void {
  return () => {}
}
