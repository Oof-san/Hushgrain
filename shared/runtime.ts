import { z } from 'zod';

const configuration = z.object({ mode: z.enum(['demo', 'live']), ownerConfigured: z.boolean() });
export type CafeConfig = z.infer<typeof configuration>;

export async function resolveConfig(
  buildMode: CafeConfig['mode'],
  loadLiveConfig: () => Promise<unknown>,
): Promise<CafeConfig> {
  // The sandbox is fully browser-local; its availability must not depend on an API.
  if (buildMode === 'demo') return { mode: 'demo', ownerConfigured: false };
  const config = configuration.parse(await loadLiveConfig());
  // A live café must never silently turn into a sandbox during an outage or misconfiguration.
  if (config.mode !== 'live') throw new Error('The café’s deployment mode does not match its API.');
  return config;
}
