import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, XCircle, Clock, AlertTriangle, type LucideIcon } from 'lucide-react';
import { paymentsApi, type PaymentDetail } from '../../api/payments.api';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';

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

  // MP sends: external_reference, payment_id, status
  // PayPal sends: provider=paypal, paymentId=xxx or subscriptionId=xxx
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
        // Mock flow (dev)
        if (isMock && !simulated) {
          await paymentsApi.simulateApprove(paymentId);
          if (!cancelled) setSimulated(true);
        }

        // PayPal order: capture it first
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
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  // PayPal subscription activated
  if (subActivated) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-green-500" />
        <h1 className="mb-2 text-2xl font-bold text-surface-900 dark:text-surface-50">¡Suscripción activada!</h1>
        <p className="mb-6 text-surface-600 dark:text-surface-400">
          Tu suscripción fue procesada. Ya tenés acceso a todos los cursos.
        </p>
        <div className="flex justify-center gap-3">
          <Button href="/dashboard">Ir al dashboard</Button>
          <Link to="/catalog" className="text-sm text-primary-600 hover:underline self-center">Ver cursos</Link>
        </div>
      </div>
    );
  }

  if (!paymentId) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-yellow-500" />
        <h1 className="mb-2 text-2xl font-bold">Sin referencia de pago</h1>
        <p className="mb-6 text-surface-600 dark:text-surface-400">
          Si completaste una suscripción, revisala desde el panel de Planes.
        </p>
        <Button href="/pricing">Ver planes</Button>
      </div>
    );
  }

  const effectiveStatus: StatusKey =
    (payment?.status as StatusKey | undefined) || (status === 'approved' ? 'APPROVED' : 'PENDING');
  const config = statusConfig[effectiveStatus] || statusConfig.PENDING;
  const Icon = config.icon;

  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center">
      <Icon className={`mx-auto mb-4 h-16 w-16 ${config.color}`} />
      <h1 className="mb-2 text-2xl font-bold text-surface-900 dark:text-surface-50">{config.title}</h1>
      <p className="mb-6 text-surface-600 dark:text-surface-400">{config.message}</p>
      {payment && (
        <div className="mb-6 rounded-lg border border-surface-200 bg-surface-50 p-4 text-left text-sm dark:border-surface-800 dark:bg-surface-900">
          <div className="flex justify-between"><span className="text-surface-500">ID</span><span className="font-mono text-xs">{payment.id}</span></div>
          <div className="flex justify-between"><span className="text-surface-500">Monto</span><span>${Number(payment.amount).toLocaleString('es-AR')} {payment.currency}</span></div>
          <div className="flex justify-between"><span className="text-surface-500">Estado</span><span className="font-semibold">{payment.status}</span></div>
        </div>
      )}
      <div className="flex justify-center gap-3">
        <Button href="/dashboard">Ir al dashboard</Button>
        <Link to="/catalog" className="text-sm text-primary-600 hover:underline self-center">Ver cursos</Link>
      </div>
    </div>
  );
}
