import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Check, Sparkles, Tag } from 'lucide-react';
import { paymentsApi, plansApi, couponsApi, type PaymentProvider, type PublicPlan, type ValidatedCoupon } from '../../api/payments.api';
import { useSubscription } from '../../hooks/useSubscription';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { ProviderPicker } from '../../components/payments/ProviderPicker';
import { PriceTag } from '../../components/ui/PriceTag';
import { hasDiscount } from '../../lib/formatters';

const planMeta: Record<string, { tagline: string; highlight: boolean }> = {
  SUBSCRIPTION_MONTHLY: { tagline: 'por mes', highlight: false },
  SUBSCRIPTION_ANNUAL: { tagline: 'por año', highlight: true },
};

function formatUSD(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n);
}

function planKeyFromType(t: PublicPlan['key']): 'MONTHLY' | 'ANNUAL' {
  return t === 'SUBSCRIPTION_MONTHLY' ? 'MONTHLY' : 'ANNUAL';
}

export default function PricingPage() {
  const { subscription, loading, refresh } = useSubscription();
  const [plans, setPlans] = useState<PublicPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [pickerPlan, setPickerPlan] = useState<PublicPlan | null>(null);

  const [couponCode, setCouponCode] = useState('');
  const [couponByPlan, setCouponByPlan] = useState<Record<string, ValidatedCoupon | null>>({});
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  useEffect(() => {
    plansApi
      .list()
      .then((res) => setPlans(res.data.data))
      .catch(() => toast.error('No se pudieron cargar los planes'))
      .finally(() => setPlansLoading(false));
  }, []);

  const applyCoupon = async () => {
    const code = couponCode.trim();
    if (!code) {
      toast.error('Ingresá un código');
      return;
    }
    setValidatingCoupon(true);
    try {
      const next: Record<string, ValidatedCoupon | null> = {};
      for (const p of plans) {
        try {
          const res = await couponsApi.validate(code, 'PLAN', Number(p.price));
          next[p.id] = res.data.data;
        } catch {
          next[p.id] = null;
        }
      }
      const someValid = Object.values(next).some((v) => v !== null);
      if (!someValid) {
        toast.error('El cupón no es válido para ningún plan');
      } else {
        toast.success(`Cupón ${code.toUpperCase()} aplicado`);
      }
      setCouponByPlan(next);
    } finally {
      setValidatingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setCouponCode('');
    setCouponByPlan({});
  };

  const handleSubscribe = async (plan: PublicPlan, provider: PaymentProvider) => {
    if (processing) return;
    const key = planKeyFromType(plan.key);
    setProcessing(plan.id);
    try {
      const code = couponByPlan[plan.id] ? couponCode.trim() : undefined;
      const res = await paymentsApi.subscribe(key, provider, code);
      const { initPoint, subscriptionId } = res.data.data;
      if (initPoint?.includes('mock=1') && subscriptionId) {
        await paymentsApi.simulateSubscription(subscriptionId);
        toast.success('Suscripción activada (modo simulado)');
        await refresh();
      } else if (initPoint) {
        window.location.href = initPoint;
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'No se pudo iniciar el checkout');
    } finally {
      setProcessing(null);
    }
  };

  const handleCancel = async () => {
    if (!confirm('¿Querés cancelar tu suscripción?')) return;
    try {
      await (await import('../../api/subscriptions.api')).subscriptionsApi.cancel();
      toast.success('Suscripción cancelada');
      refresh();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'No se pudo cancelar');
    }
  };

  if (loading || plansLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="px-4 py-10">
      <div className="mx-auto max-w-4xl text-center">
        <h1 className="mb-3 text-3xl font-bold text-surface-900 dark:text-surface-50">Planes y precios</h1>
        <p className="mb-10 text-surface-600 dark:text-surface-400">
          Desbloqueá todo el contenido premium con una suscripción o comprá cursos de forma individual.
        </p>
      </div>

      {subscription?.isActive && !subscription?.isCancelled && (
        <div className="mx-auto mb-8 max-w-3xl rounded-xl border border-green-300 bg-green-50 p-5 text-sm dark:border-green-800 dark:bg-green-900/20">
          <p className="font-semibold text-green-800 dark:text-green-300">
            Tenés una suscripción {subscription.plan === 'SUBSCRIPTION_ANNUAL' ? 'anual' : 'mensual'} activa
          </p>
          {subscription.currentPeriodEnd && (
            <p className="mt-1 text-green-700 dark:text-green-400">
              Renueva el {new Date(subscription.currentPeriodEnd).toLocaleDateString('es-CL')}
            </p>
          )}
          <button onClick={handleCancel} className="mt-2 text-xs font-semibold text-red-600 hover:underline dark:text-red-400">
            Cancelar suscripción
          </button>
        </div>
      )}

      {subscription?.isCancelled && subscription?.accessUntil && (
        <div className="mx-auto mb-8 max-w-3xl rounded-xl border border-yellow-300 bg-yellow-50 p-5 text-sm dark:border-yellow-800 dark:bg-yellow-900/20">
          <p className="font-semibold text-yellow-800 dark:text-yellow-300">
            Suscripción cancelada
          </p>
          <p className="mt-1 text-yellow-700 dark:text-yellow-400">
            Tenés acceso hasta el {new Date(subscription.accessUntil).toLocaleDateString('es-CL')}
          </p>
        </div>
      )}

      {/* Caja de cupón */}
      <div className="mx-auto mb-8 max-w-3xl rounded-xl border border-surface-200 bg-white p-4 dark:border-surface-800 dark:bg-surface-900">
        <div className="flex items-center gap-2 mb-2">
          <Tag className="h-4 w-4 text-primary-600" />
          <span className="text-sm font-medium">¿Tenés un código de descuento?</span>
        </div>
        <div className="flex gap-2">
          <input
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            placeholder="VERANO2026"
            className="flex-1 rounded-lg border border-surface-300 px-3 py-2 text-sm uppercase font-mono dark:border-surface-700 dark:bg-surface-800"
          />
          {Object.values(couponByPlan).some((v) => v !== null) ? (
            <Button variant="outline" onClick={removeCoupon}>
              Quitar
            </Button>
          ) : (
            <Button onClick={applyCoupon} isLoading={validatingCoupon}>
              Aplicar
            </Button>
          )}
        </div>
      </div>

      <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
        {plans.map((p) => {
          const meta = planMeta[p.key] || { tagline: '', highlight: false };
          const basePrice = Number(p.price);
          const applied = couponByPlan[p.id];
          const finalPrice = applied ? applied.finalAmount : basePrice;
          return (
            <div
              key={p.id}
              className={`rounded-2xl border p-6 shadow-sm ${
                meta.highlight
                  ? 'border-primary-500 bg-white ring-2 ring-primary-500 dark:bg-surface-900'
                  : 'border-surface-200 bg-white dark:border-surface-800 dark:bg-surface-900'
              }`}
            >
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-xl font-bold text-surface-900 dark:text-surface-50">{p.label}</h3>
                {p.badge && (
                  <span className="rounded-full bg-primary-100 px-3 py-0.5 text-xs font-semibold text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                    {p.badge}
                  </span>
                )}
              </div>
              <div className="mb-1">
                {applied ? (
                  <>
                    <div className="text-4xl font-bold text-primary-600 dark:text-primary-400">
                      {formatUSD(finalPrice)}
                    </div>
                    <div className="text-xs text-green-600 dark:text-green-400 line-through">
                      {formatUSD(basePrice)} · ahorrás {formatUSD(applied.discountAmount)}
                    </div>
                  </>
                ) : (
                  <PriceTag
                    price={basePrice}
                    comparePrice={hasDiscount(basePrice, p.comparePrice) ? p.comparePrice : null}
                    size="xl"
                  />
                )}
              </div>
              <div className="mb-6 text-sm text-surface-500">{meta.tagline}</div>
              <ul className="mb-6 space-y-2 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-surface-700 dark:text-surface-300">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" /> {f}
                  </li>
                ))}
              </ul>
              <Button
                fullWidth
                variant={meta.highlight ? 'primary' : 'outline'}
                onClick={() => setPickerPlan(p)}
                isLoading={processing === p.id}
                disabled={subscription?.isActive && !subscription?.isCancelled}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                {subscription?.isActive && !subscription?.isCancelled
                  ? 'Ya estás suscripto'
                  : `Suscribirme ${p.label.toLowerCase()}`}
              </Button>
            </div>
          );
        })}
      </div>

      <ProviderPicker
        open={pickerPlan !== null}
        title={pickerPlan ? `Suscripción ${pickerPlan.label.toLowerCase()}` : undefined}
        priceUSD={
          pickerPlan
            ? couponByPlan[pickerPlan.id]?.finalAmount ?? Number(pickerPlan.price)
            : undefined
        }
        onClose={() => setPickerPlan(null)}
        onPick={async (provider) => {
          if (!pickerPlan) return;
          await handleSubscribe(pickerPlan, provider);
          setPickerPlan(null);
        }}
      />
    </div>
  );
}
