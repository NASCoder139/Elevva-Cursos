import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  CheckCircle2, XCircle, Clock, AlertTriangle,
  Sparkles, BookOpen, Crown, ArrowRight,
  type LucideIcon,
} from 'lucide-react';
import { paymentsApi, type PaymentDetail } from '../../api/payments.api';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { useAuth } from '../../contexts/AuthContext';

type StatusKey = 'APPROVED' | 'PENDING' | 'IN_PROCESS' | 'REJECTED' | 'REFUNDED';

const statusConfig: Record<StatusKey, { icon: LucideIcon; color: string; title: string; message: string }> = {
  APPROVED: { icon: CheckCircle2, color: 'text-green-500', title: '¡Pago aprobado!', message: 'Ya tenés acceso al contenido.' },
  PENDING: { icon: Clock, color: 'text-yellow-500', title: 'Pago pendiente', message: 'Te avisaremos cuando se acredite.' },
  IN_PROCESS: { icon: Clock, color: 'text-yellow-500', title: 'En proceso', message: 'Tu pago está siendo procesado.' },
  REJECTED: { icon: XCircle, color: 'text-red-500', title: 'Pago rechazado', message: 'Probá nuevamente o usá otro medio de pago.' },
  REFUNDED: { icon: AlertTriangle, color: 'text-surface-500', title: 'Pago reembolsado', message: 'Este pago fue reembolsado.' },
};

export default function PaymentResultPage() {
  const [params] = useSearchParams();
  const { isAuthenticated } = useAuth();

  const provider = params.get('provider');
  const paymentId =
    params.get('paymentId') ||
    params.get('external_reference') ||
    params.get('payment_id');
  const subscriptionId = params.get('subscriptionId');
  const isMock = params.get('mock') === '1';
  const status = params.get('status');

  const [payment, setPayment] = useState<PaymentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [simulated, setSimulated] = useState(false);
  const [subActivated, setSubActivated] = useState(false);

  useEffect(() => {
    // PayPal subscription return — sync and activate
    if (!paymentId && subscriptionId && provider === 'paypal') {
      paymentsApi.syncPaypalSubscription(subscriptionId)
        .then(() => setSubActivated(true))
        .catch(() => setSubActivated(true))
        .finally(() => setLoading(false));
      return;
    }

    if (!paymentId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    const run = async () => {
      try {
        if (isMock && !simulated) {
          await paymentsApi.simulateApprove(paymentId);
          if (!cancelled) setSimulated(true);
        }

        if (provider === 'paypal') {
          try {
            await paymentsApi.capturePaypal(paymentId);
          } catch {
            // may already be captured
          }
        }

        const res = await paymentsApi.getPayment(paymentId);
        if (!cancelled) setPayment(res.data.data);
      } catch {
        if (!cancelled) setPayment(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [paymentId, subscriptionId, provider, isMock, simulated]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-surface-50 via-primary-50/30 to-violet-50/30 dark:from-surface-950 dark:via-primary-950/20 dark:to-violet-950/20">
        <Spinner size="lg" />
      </div>
    );
  }

  // ── Suscripción PayPal activada ─────────────────────────────────────────
  if (subActivated) {
    return (
      <SuccessLayout
        type="subscription"
        isAuthenticated={isAuthenticated}
      />
    );
  }

  // ── Sin paymentId ni subscriptionId ─────────────────────────────────────
  if (!paymentId) {
    return (
      <ResultLayout>
        <AlertTriangle className="mx-auto mb-4 h-16 w-16 text-yellow-500" />
        <h1 className="mb-2 text-3xl font-bold text-surface-900 dark:text-white">Sin referencia de pago</h1>
        <p className="mb-6 text-surface-600 dark:text-surface-400">
          Si completaste una suscripción, revísala desde el panel de Planes.
        </p>
        <div className="flex justify-center gap-3">
          <Button href={isAuthenticated ? '/pricing' : '/login'}>
            {isAuthenticated ? 'Ver planes' : 'Iniciar sesión'}
          </Button>
        </div>
      </ResultLayout>
    );
  }

  // ── Pago único (curso o categoría) ──────────────────────────────────────
  const effectiveStatus: StatusKey =
    (payment?.status as StatusKey | undefined) || (status === 'approved' ? 'APPROVED' : 'PENDING');

  if (effectiveStatus === 'APPROVED') {
    return <SuccessLayout type="purchase" isAuthenticated={isAuthenticated} payment={payment} />;
  }

  // Estados no-aprobados — uso el config básico
  const config = statusConfig[effectiveStatus] || statusConfig.PENDING;
  const Icon = config.icon;

  return (
    <ResultLayout>
      <Icon className={`mx-auto mb-4 h-16 w-16 ${config.color}`} />
      <h1 className="mb-2 text-3xl font-bold text-surface-900 dark:text-white">{config.title}</h1>
      <p className="mb-6 text-surface-600 dark:text-surface-400">{config.message}</p>
      {payment && (
        <div className="mb-6 rounded-xl border border-surface-200 bg-surface-50 p-4 text-left text-sm dark:border-surface-800 dark:bg-surface-900">
          <div className="flex justify-between"><span className="text-surface-500">ID</span><span className="font-mono text-xs">{payment.id}</span></div>
          <div className="flex justify-between"><span className="text-surface-500">Monto</span><span>${Number(payment.amount).toLocaleString('es-AR')} {payment.currency}</span></div>
          <div className="flex justify-between"><span className="text-surface-500">Estado</span><span className="font-semibold">{payment.status}</span></div>
        </div>
      )}
      <div className="flex justify-center gap-3">
        <Button href={isAuthenticated ? '/dashboard' : '/login'}>
          {isAuthenticated ? 'Ir al dashboard' : 'Iniciar sesión'}
        </Button>
        <Link to="/store" className="text-sm text-primary-600 hover:underline self-center">Ver cursos</Link>
      </div>
    </ResultLayout>
  );
}

/* ═══════════════════════════════════════════════════════
   Pantalla de éxito (suscripción o compra individual)
   ═══════════════════════════════════════════════════════ */
function SuccessLayout({
  type,
  isAuthenticated,
  payment,
}: {
  type: 'subscription' | 'purchase';
  isAuthenticated: boolean;
  payment?: PaymentDetail | null;
}) {
  const isSubscription = type === 'subscription';

  return (
    <ResultLayout>
      {/* Header con icono animado */}
      <div className="relative mb-6 flex justify-center">
        <div className="relative">
          <div className="absolute inset-0 -m-4 rounded-full bg-green-500/20 blur-2xl animate-pulse" />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-emerald-500 shadow-lg shadow-green-500/30">
            <CheckCircle2 className="h-10 w-10 text-white" strokeWidth={2.5} />
          </div>
        </div>
      </div>

      {/* Título */}
      <h1 className="mb-3 text-3xl sm:text-4xl font-bold text-surface-900 dark:text-white">
        ¡Gracias por tu compra!
      </h1>

      {/* Mensaje principal */}
      <p className="mb-2 text-lg text-surface-700 dark:text-surface-200 font-medium">
        {isSubscription
          ? 'Tu suscripción ya está activa 🎉'
          : 'Tu compra fue confirmada 🎉'}
      </p>

      <p className="mb-8 text-surface-600 dark:text-surface-400 max-w-md mx-auto">
        {isSubscription
          ? 'A partir de ahora tienes acceso a todo el catálogo de cursos. Comenzá cuando quieras.'
          : 'Ya podés acceder a tu curso desde "Mis cursos". ¡Disfrutá del aprendizaje!'}
      </p>

      {/* Tarjetita resumen del pago si aplica */}
      {payment && (
        <div className="mb-8 mx-auto max-w-sm rounded-xl border border-surface-200 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-900/50 p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-surface-500">Monto</span>
            <span className="font-semibold text-surface-900 dark:text-white">
              ${Number(payment.amount).toLocaleString('es-AR')} {payment.currency}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="text-surface-500">Estado</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 dark:bg-green-900/30 px-2.5 py-0.5 text-xs font-semibold text-green-700 dark:text-green-400">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              Aprobado
            </span>
          </div>
        </div>
      )}

      {/* CTAs */}
      {isAuthenticated ? (
        <div className="flex flex-col sm:flex-row justify-center gap-3 max-w-md mx-auto">
          <Button href={isSubscription ? '/my-courses' : '/my-courses'} fullWidth size="lg" className="gap-2">
            {isSubscription ? <Crown className="h-5 w-5" /> : <BookOpen className="h-5 w-5" />}
            {isSubscription ? 'Explorar el catálogo' : 'Ir a mis cursos'}
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-surface-200 dark:border-surface-700 text-sm font-medium text-surface-700 dark:text-surface-300 hover:border-primary-500 hover:text-primary-600 transition"
          >
            Ir al dashboard
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border border-amber-200 dark:border-amber-800/40 bg-amber-50 dark:bg-amber-950/20 p-4 max-w-md mx-auto">
          <p className="text-sm text-amber-900 dark:text-amber-200">
            <Sparkles className="inline h-4 w-4 mr-1" />
            Tu sesión expiró durante el pago. <strong>Iniciá sesión</strong> de nuevo y vas a tener todo el contenido disponible.
          </p>
          <Button href="/login" fullWidth size="lg" className="mt-4 gap-2">
            Iniciar sesión
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Footer info */}
      <p className="mt-8 text-xs text-surface-500">
        ¿Algún problema con tu compra? Escribínos a{' '}
        <a href="mailto:contacto@multimindoficial.com" className="text-primary-600 hover:underline">
          contacto@multimindoficial.com
        </a>
      </p>
    </ResultLayout>
  );
}

function ResultLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-surface-50 via-primary-50/30 to-violet-50/30 dark:from-surface-950 dark:via-primary-950/20 dark:to-violet-950/20 px-4 py-12">
      <div className="w-full max-w-2xl text-center">
        <div className="rounded-3xl bg-white/80 dark:bg-surface-900/80 backdrop-blur-xl border border-surface-200 dark:border-surface-800 shadow-xl shadow-black/5 dark:shadow-black/40 p-8 sm:p-12">
          {children}
        </div>
        <Link to="/" className="mt-6 inline-block text-sm text-surface-500 hover:text-primary-600 transition">
          ← Volver a la página principal
        </Link>
      </div>
    </div>
  );
}
