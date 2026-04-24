import { useState } from 'react';
import { X, CreditCard, Wallet } from 'lucide-react';
import { Button } from '../ui/Button';
import type { PaymentProvider } from '../../api/payments.api';

interface Props {
  open: boolean;
  title?: string;
  priceCLP?: number;
  priceUSD?: number;
  onClose: () => void;
  onPick: (provider: PaymentProvider) => Promise<void> | void;
}

const fmtCLP = (n?: number) =>
  n == null ? '' : new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(n);
const fmtUSD = (n?: number) =>
  n == null ? '' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n);

export function ProviderPicker({ open, title = 'Elegí tu método de pago', priceCLP, priceUSD, onClose, onPick }: Props) {
  const [loading, setLoading] = useState<PaymentProvider | null>(null);

  if (!open) return null;

  const pick = async (p: PaymentProvider) => {
    setLoading(p);
    try {
      await onPick(p);
    } finally {
      setLoading(null);
    }
  };

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
        <p className="text-sm text-surface-500 mb-5">
          Seleccioná el proveedor con el que preferís pagar.
        </p>

        <div className="space-y-3">
          <button
            onClick={() => pick('MERCADOPAGO')}
            disabled={loading !== null}
            className="w-full flex items-center gap-3 p-4 rounded-xl border border-surface-200 dark:border-surface-800 hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-950/20 transition-colors text-left disabled:opacity-50"
          >
            <div className="h-10 w-10 rounded-lg bg-[#00B1EA] text-white flex items-center justify-center">
              <Wallet className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-surface-900 dark:text-white">MercadoPago</p>
              <p className="text-xs text-surface-500">Tarjetas, transferencia, saldo MP</p>
            </div>
            {priceCLP != null && (
              <span className="text-sm font-semibold text-surface-900 dark:text-white">{fmtCLP(priceCLP)}</span>
            )}
            {loading === 'MERCADOPAGO' && <span className="text-xs text-primary-600">Redirigiendo…</span>}
          </button>

          <button
            onClick={() => pick('PAYPAL')}
            disabled={loading !== null}
            className="w-full flex items-center gap-3 p-4 rounded-xl border border-surface-200 dark:border-surface-800 hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-950/20 transition-colors text-left disabled:opacity-50"
          >
            <div className="h-10 w-10 rounded-lg bg-[#003087] text-white flex items-center justify-center">
              <CreditCard className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-surface-900 dark:text-white">PayPal</p>
              <p className="text-xs text-surface-500">Cuenta PayPal o tarjeta internacional</p>
            </div>
            {priceUSD != null && (
              <span className="text-sm font-semibold text-surface-900 dark:text-white">{fmtUSD(priceUSD)}</span>
            )}
            {loading === 'PAYPAL' && <span className="text-xs text-primary-600">Redirigiendo…</span>}
          </button>
        </div>

        <Button variant="ghost" fullWidth onClick={onClose} className="mt-5">
          Cancelar
        </Button>
      </div>
    </div>
  );
}
