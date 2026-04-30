import { useEffect, useState } from 'react';
import api from '../api/axios';

interface RateResponse {
  usdToClp: number;
  taxRatePercent: number;
}

const FALLBACK: RateResponse = { usdToClp: 950, taxRatePercent: 19 };
let cached: RateResponse | null = null;
let inFlight: Promise<RateResponse> | null = null;

async function fetchRate(): Promise<RateResponse> {
  if (cached != null) return cached;
  if (inFlight) return inFlight;
  inFlight = (async () => {
    try {
      const res = await api.get<RateResponse>('/payments/exchange-rate');
      const usdToClp = Number(res.data?.usdToClp);
      const taxRatePercent = Number(res.data?.taxRatePercent);
      const final: RateResponse = {
        usdToClp: isFinite(usdToClp) && usdToClp > 0 ? usdToClp : FALLBACK.usdToClp,
        taxRatePercent: isFinite(taxRatePercent) && taxRatePercent >= 0 ? taxRatePercent : FALLBACK.taxRatePercent,
      };
      cached = final;
      return final;
    } catch {
      cached = FALLBACK;
      return FALLBACK;
    } finally {
      inFlight = null;
    }
  })();
  return inFlight;
}

/** Hook que retorna el tipo de cambio USD→CLP (tasa fija configurable). */
export function useExchangeRate(): number {
  const [rate, setRate] = useState<number>(cached?.usdToClp ?? FALLBACK.usdToClp);
  useEffect(() => {
    let mounted = true;
    fetchRate().then((v) => {
      if (mounted) setRate(v.usdToClp);
    });
    return () => { mounted = false; };
  }, []);
  return rate;
}

/** Hook que retorna el tipo de cambio + la tasa de IVA. */
export function useTaxConfig(): { usdToClp: number; taxRatePercent: number } {
  const [data, setData] = useState<RateResponse>(cached ?? FALLBACK);
  useEffect(() => {
    let mounted = true;
    fetchRate().then((v) => {
      if (mounted) setData(v);
    });
    return () => { mounted = false; };
  }, []);
  return data;
}
