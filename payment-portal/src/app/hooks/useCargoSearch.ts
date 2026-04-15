import { useState, useCallback } from 'react';
import { cargoApi, billingApi } from '../services/apiClient';
import type { CargoInfo, BillingInfo } from '../types';

/**
 * Hook for searching cargo by AWB number via API.
 * LOCAL-ONLY — Figma Make does not generate this file.
 */
export function useCargoSearch() {
  const [cargo, setCargo] = useState<CargoInfo | null>(null);
  const [billing, setBilling] = useState<BillingInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (awbNumber: string) => {
    setLoading(true);
    setError(null);
    try {
      const [cargoResult, billingResult] = await Promise.all([
        cargoApi.search(awbNumber),
        billingApi.getByAwb(awbNumber),
      ]);
      setCargo(cargoResult);
      setBilling(billingResult);
      return { cargo: cargoResult, billing: billingResult };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setCargo(null);
    setBilling(null);
    setError(null);
  }, []);

  return { cargo, billing, loading, error, search, reset };
}
