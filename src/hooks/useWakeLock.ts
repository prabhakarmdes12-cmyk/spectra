import { useEffect, useRef, useState } from 'react';

export function useWakeLock(active: boolean) {
  const sentinelRef = useRef<WakeLockSentinel | null>(null);
  const [state, setState] = useState<'idle' | 'active' | 'unsupported' | 'released' | 'error'>('idle');

  useEffect(() => {
    let cancelled = false;
    async function requestLock() {
      if (!active) return;
      if (!navigator.wakeLock?.request) {
        setState('unsupported');
        return;
      }
      try {
        const sentinel = await navigator.wakeLock.request('screen');
        if (cancelled) {
          await sentinel.release();
          return;
        }
        sentinelRef.current = sentinel;
        setState('active');
        sentinel.onrelease = () => setState('released');
      } catch {
        setState('error');
      }
    }

    void requestLock();
    const onVisibility = () => {
      if (document.visibilityState === 'visible' && active && sentinelRef.current?.released) void requestLock();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisibility);
      const sentinel = sentinelRef.current;
      sentinelRef.current = null;
      if (sentinel && !sentinel.released) void sentinel.release().catch(() => undefined);
    };
  }, [active]);

  return state;
}
