import { useState, useEffect, useCallback } from 'react';
import { cargoApi } from '../services/apiClient';
import type { CargoInfo } from '../types';

/**
 * Hook for looking up a single cargo by AWB number.
 * LOCAL-ONLY — Figma Make does not generate this file.
 */
export function useCargoLookup(awbNumber: string | undefined) {
  const [cargo, setCargo] = useState<CargoInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!awbNumber) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    cargoApi.search(awbNumber)
      .then((result) => {
        if (!cancelled) setCargo(result);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Unknown error');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [awbNumber]);

  return { cargo, loading, error };
}

/**
 * Hook for looking up multiple cargos by AWB numbers.
 * Used by Cart and Watchlist components.
 */
export function useBulkCargoLookup(awbNumbers: string[]) {
  const [cargoMap, setCargoMap] = useState<Record<string, CargoInfo>>({});
  const [loading, setLoading] = useState(false);

  const fetchAll = useCallback(async (awbs: string[]) => {
    if (awbs.length === 0) return;
    setLoading(true);
    try {
      const results = await Promise.allSettled(
        awbs.map((awb) => cargoApi.search(awb))
      );
      const map: Record<string, CargoInfo> = {};
      results.forEach((result, i) => {
        if (result.status === 'fulfilled') {
          map[awbs[i]] = result.value;
        }
      });
      setCargoMap((prev) => ({ ...prev, ...map }));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const missing = awbNumbers.filter((awb) => !cargoMap[awb]);
    if (missing.length > 0) {
      fetchAll(missing);
    }
  }, [awbNumbers.join(',')]);

  return { cargoMap, loading, refetch: fetchAll };
}
