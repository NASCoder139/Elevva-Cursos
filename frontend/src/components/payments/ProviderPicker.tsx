import { useEffect, useState } from 'react';
import { X, Globe } from 'lucide-react';
import { Button } from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { usersApi } from '../../api/users.api';
import { COUNTRIES, isChile } from '../../lib/countries';
import { useTaxConfig } from '../../hooks/useExchangeRate';
import { MercadoPagoLogo, PayPalLogo } from './ProviderLogos';
import type { PaymentProvider } from '../../api/payments.api';

interface Props {
  open: boolean;
  title?: string;
  /** Precio NETO en USD del producto (sin IVA). */
  priceUSD?: number;
  /** Compatibilidad: si quien invoca ya manda CLP precalculado, se respeta. */
  priceCLP?: number;
  onClose: () => void;
  onPick: (provider: PaymentProvider) => Promise<void> | void;
}

const fmtCLP = (n: number) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(n);
const fmtUSD = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n);

export function ProviderPicker({ open, title = 'Confirmar tu método de pago', priceUSD, priceCLP, onClose, onPick }: Props) {
  const { user, updateUser } = useAuth();
  const { usdToClp, taxRatePercent } = useTaxConfig();
  const [loading, setLoading] = useState<PaymentProvider | null>(null);
  const [savingCountry, setSavingCountry] = useState(false);
  const [draftCountry, setDraftCountry] = useState<string>('');
  const [redirected, setRedirected] = useState(false);

  useEffect(() => {
    if (open && user?.country) setDraftCountry(user.country);
    if (!open) setRedirected(false);
  }, [open, user?.country]);

  const country = user?.country ?? null;
  const provider: PaymentProvider | null = country ? (isChile(country) ? 'MERCADOPAGO' : 'PAYPAL') : null;

  // Auto-redirect: si el usuario ya tiene país configurado, no le hacemos
  // mostrar un modal con un solo botón. Iniciamos el checkout directo.
  useEffect(() => {
    if (!open || !provider || redirected) return;
    setRedirected(true);
    (async () => {
      setLoading(provider);
      try {
        await onPick(provider);
      } finally {
        setLoading(null);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, provider, redirected]);

  if (!open) return null;

  const saveCountry = async () => {
    if (!draftCountry) return;
    setSavingCountry(true);
    try {
      const { data } = await usersApi.updateProfile({ country: draftCountry });
      updateUser(data.data);
      // Lanzamos el redirect directo: el useEffect podría tardar un tick
      const newProvider: PaymentProvider = isChile(draftCountry) ? 'MERCADOPAGO' : 'PAYPAL';
      setRedirected(true);
      setLoading(newProvider);
      try {
        await onPick(newProvider);
      } finally {
        setLoading(null);
      }
    } finally {
      setSavingCountry(false);
    }
  };

  // Calcular bruto y CLP a partir del NETO recibido
  const taxFactor = 1 + (taxRatePercent || 0) / 100;
  const grossUSD = priceUSD != null ? priceUSD * taxFactor : null;
  const totalCLP = priceCLP != null ? priceCLP : (grossUSD != null ? Math.round(grossUSD * usdToClp) : null);
  const netCLP = totalCLP != null ? Math.round(totalCLP / taxFactor) : null;
  const ivaCLP = totalCLP != null && netCLP != null ? totalCLP - netCLP : null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-xl p-6">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800"
        >
          <X className="h-5 w-5 text-surface-500" />
        </button>

        <h2 className="text-xl font-semibold text-surface-900 dark:text-white mb-1">{title}</h2>

        {!country ? (
          <>
            <p className="text-sm text-surface-500 mb-5">
              Selecciona tu país para continuar con el pago.
            </p>
            <div className="space-y-3">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-surface-600 dark:text-surface-400">País</span>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
                  <select
                    value={draftCountry}
                    onChange={(e) => setDraftCountry(e.target.value)}
                    className="w-full rounded-lg border border-surface-300 bg-white pl-9 pr-3 py-2.5 text-sm dark:border-surface-700 dark:bg-surface-800"
                  >
                    <option value="">Elige tu país...</option>
                    {COUNTRIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </label>
              <Button fullWidth onClick={saveCountry} isLoading={savingCountry} disabled={!draftCountry}>
                Continuar
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-surface-500 mb-4">
              {provider === 'MERCADOPAGO' ? 'Pagando desde' : 'Cliente internacional desde'}{' '}
              <span className="font-medium text-surface-700 dark:text-surface-200">{country}</span>.
            </p>

            {provider === 'MERCADOPAGO' && totalCLP != null && netCLP != null && ivaCLP != null && (
              <div className="mb-4 rounded-xl border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-800/50 p-3 text-xs space-y-1.5">
                <div className="flex justify-between text-surface-600 dark:text-surface-400">
                  <span>Subtotal (neto)</span>
                  <span>{fmtCLP(netCLP)}</span>
                </div>
                <div className="flex justify-between text-surface-600 dark:text-surface-400">
                  <span>IVA ({taxRatePercent}%)</span>
                  <span>{fmtCLP(ivaCLP)}</span>
                </div>
                <div className="flex justify-between pt-1.5 border-t border-surface-200 dark:border-surface-700 font-semibold text-surface-900 dark:text-white">
                  <span>Total a pagar</span>
                  <span>{fmtCLP(totalCLP)}</span>
                </div>
                {priceUSD != null && (
                  <div className="pt-1 text-[10px] text-surface-500">
                    Equivalente a {fmtUSD(grossUSD!)} · TC referencial 1 USD = {usdToClp.toLocaleString('es-CL')} CLP
                  </div>
                )}
              </div>
            )}

            {provider === 'PAYPAL' && grossUSD != null && priceUSD != null && (
              <div className="mb-4 rounded-xl border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-800/50 p-3 text-xs space-y-1.5">
                <div className="flex justify-between text-surface-600 dark:text-surface-400">
                  <span>Subtotal (neto)</span>
                  <span>{fmtUSD(priceUSD)}</span>
                </div>
                <div className="flex justify-between text-surface-600 dark:text-surface-400">
                  <span>IVA ({taxRatePercent}%)</span>
                  <span>{fmtUSD(grossUSD - priceUSD)}</span>
                </div>
                <div className="flex justify-between pt-1.5 border-t border-surface-200 dark:border-surface-700 font-semibold text-surface-900 dark:text-white">
                  <span>Total a pagar</span>
                  <span>{fmtUSD(grossUSD)}</span>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={async () => {
                if (!provider) return;
                setLoading(provider);
                try { await onPick(provider); } finally { setLoading(null); }
              }}
              disabled={loading !== null}
              className="w-full rounded-xl border border-surface-200 dark:border-surface-800 p-4 flex items-center gap-3 hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-950/20 transition-colors text-left disabled:opacity-50"
            >
              {provider === 'MERCADOPAGO' ? <MercadoPagoLogo className="h-10 w-auto" /> : <PayPalLogo className="h-8 w-auto" />}
              <div className="flex-1">
                <p className="text-xs text-surface-500">
                  {provider === 'MERCADOPAGO' ? 'Tarjetas, transferencia, saldo MP' : 'Cuenta PayPal o tarjeta internacional'}
                </p>
              </div>
              {loading ? (
                <span className="text-xs text-primary-600">Redirigiendo…</span>
              ) : (
                <span className="text-xs font-semibold text-primary-600">Continuar →</span>
              )}
            </button>

            <p className="mt-4 text-xs text-surface-500 text-center">
              ¿Tu país está mal? Cámbialo desde tu <a href="/profile" className="underline hover:text-primary-600">perfil</a>.
            </p>
          </>
        )}

        <Button variant="ghost" fullWidth onClick={onClose} className="mt-5">
          Cancelar
        </Button>
      </div>
    </div>
  );
}
