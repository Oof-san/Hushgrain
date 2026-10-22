import { describe, expect, it, vi } from 'vitest';
import { resolveConfig } from '../shared/runtime';

describe('deployment mode boundary', () => {
  it('boots the sandbox without contacting any API, even when that API would fail', async () => {
    const unavailable = vi.fn().mockRejectedValue(new Error('FUNCTION_INVOCATION_FAILED'));
    expect(await resolveConfig('demo', unavailable)).toEqual({
      mode: 'demo',
      ownerConfigured: false,
    });
    expect(unavailable).not.toHaveBeenCalled();
  });
  it('loads live configuration and preserves live API failures', async () => {
    expect(
      await resolveConfig('live', async () => ({ mode: 'live', ownerConfigured: true })),
    ).toEqual({ mode: 'live', ownerConfigured: true });
    await expect(
      resolveConfig('live', async () => {
        throw new Error('Service unavailable');
      }),
    ).rejects.toThrow('Service unavailable');
  });
  it('rejects mismatched or malformed live responses rather than switching to demo', async () => {
    await expect(
      resolveConfig('live', async () => ({ mode: 'demo', ownerConfigured: false })),
    ).rejects.toThrow('does not match');
    await expect(resolveConfig('live', async () => ({}))).rejects.toThrow();
  });
});
