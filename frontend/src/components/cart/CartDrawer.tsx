import { useState } from 'react';
import { X, Trash2, ShoppingCart, Sparkles, Tag } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { paymentsApi, type PaymentProvider } from '../../api/payments.api';
import { Button } from '../ui/Button';
import { ProviderPicker } from '../payments/ProviderPicker';
import { PriceTag } from '../ui/PriceTag';
import toast from 'react-hot-toast';

const formatPrice = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n);

export function CartDrawer() {
  const { items, total, remove, clear, drawerOpen, closeDrawer } = useCart();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [pickerFor, setPickerFor] = useState<{ id: string; title: string; price: number } | null>(null);
  const [couponCode, setCouponCode] = useState('');

  const checkout = async (courseId: string, provider: PaymentProvider) => {
    setLoadingId(courseId);
    try {
      const code = couponCode.trim() || undefined;
      const res = await paymentsApi.checkoutCourse(courseId, provider, code);
      const initPoint = (res.data as any)?.data?.initPoint || (res.data as any)?.initPoint;
      if (initPoint) window.location.href = initPoint;
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al iniciar el pago');
    } finally {
      setLoadingId(null);
    }
  };

  if (!drawerOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black/50" onClick={closeDrawer} />
      <aside className="fixed inset-y-0 right-0 w-full max-w-md bg-white dark:bg-surface-900 border-l border-surface-200 dark:border-surface-800 flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-surface-200 dark:border-surface-800">
          <h2 className="text-lg font-semibold text-surface-900 dark:text-white flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Carrito ({items.length})
          </h2>
          <button
            onClick={closeDrawer}
            className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800"
          >
            <X className="h-5 w-5 text-surface-600 dark:text-surface-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center text-surface-500">
              <ShoppingCart className="h-12 w-12 mb-3 text-surface-400" />
              <p className="font-medium">Tu carrito está vacío</p>
              <p className="text-sm mt-1">Agregá cursos desde la tienda</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="flex gap-3 rounded-xl border border-surface-200 dark:border-surface-800 p-3"
                >
                  <div className="h-16 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-surface-100 dark:bg-surface-800">
                    {item.thumbnailUrl ? (
                      <img src={item.thumbnailUrl} alt={item.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-surface-400">
                        <Sparkles className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-surface-900 dark:text-white line-clamp-2">
                      {item.title}
                    </p>
                    <div className="mt-1">
                      <PriceTag price={item.price} comparePrice={item.comparePrice} size="sm" />
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => setPickerFor({ id: item.id, title: item.title, price: item.price })}
                        isLoading={loadingId === item.id}
                      >
                        Pagar
                      </Button>
                      <button
                        onClick={() => remove(item.id)}
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-surface-200 dark:border-surface-800 p-4 space-y-3">
            <div>
              <label className="flex items-center gap-1 text-xs font-medium text-surface-500 mb-1">
                <Tag className="h-3 w-3" /> Código de descuento (opcional)
              </label>
              <input
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="VERANO2026"
                className="w-full rounded-lg border border-surface-300 px-3 py-1.5 text-sm uppercase font-mono dark:border-surface-700 dark:bg-surface-800"
              />
              {couponCode && (
                <p className="text-xs text-surface-500 mt-1">
                  Se aplicará al pagar. Si no es válido para el curso, el pago no se inicia.
                </p>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-surface-600 dark:text-surface-400">Total</span>
              <span className="text-xl font-bold text-surface-900 dark:text-white">
                {formatPrice(total)}
              </span>
            </div>
            <p className="text-xs text-surface-500">
              El pago se realiza por cada curso individualmente.
            </p>
            <Button variant="ghost" fullWidth onClick={clear}>
              Vaciar carrito
            </Button>
          </div>
        )}
      </aside>

      <ProviderPicker
        open={pickerFor !== null}
        title={pickerFor ? `Pagar: ${pickerFor.title}` : undefined}
        priceUSD={pickerFor?.price}
        onClose={() => setPickerFor(null)}
        onPick={async (provider) => {
          if (!pickerFor) return;
          await checkout(pickerFor.id, provider);
          setPickerFor(null);
        }}
      />
    </div>
  );
}
