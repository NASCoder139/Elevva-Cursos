import { useState } from 'react';
import { Mail, MessageCircle, HelpCircle, CheckCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

const faqs = [
  {
    q: '¿Cómo activo mi demo de 30 minutos?',
    a: 'Ingresá al dashboard y hacé click en "Activar demo". Tenés 30 minutos continuos para explorar todo el contenido. La demo solo puede activarse una vez.',
  },
  {
    q: '¿Puedo cancelar mi suscripción cuando quiera?',
    a: 'Sí. Desde la página de Pricing podés cancelar tu suscripción en cualquier momento. Conservás acceso hasta el final del período pago.',
  },
  {
    q: '¿Los cursos tienen certificado?',
    a: 'No, por el momento los cursos no incluyen certificado.',
  },
  {
    q: '¿Qué formas de pago aceptan?',
    a: 'Trabajamos con MercadoPago, lo que te permite pagar con tarjeta de crédito, débito, transferencia o efectivo en puntos de pago.',
  },
];

export default function SupportPage() {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const body = `Asunto: ${subject}\n\n${message}`;
    window.location.href = `mailto:soporte@elevva.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setSent(true);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-10">
      <div className="text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-surface-900 dark:text-white mb-3">
          Centro de Soporte
        </h1>
        <p className="text-surface-600 dark:text-surface-400">
          Estamos para ayudarte. Consultá las preguntas frecuentes o escribinos directamente.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <a
          href="mailto:soporte@elevva.com"
          className="rounded-2xl p-5 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 hover:border-primary-400 transition"
        >
          <Mail className="h-6 w-6 text-primary-600 dark:text-primary-400 mb-3" />
          <h3 className="font-semibold text-surface-900 dark:text-white">Email</h3>
          <p className="text-sm text-surface-600 dark:text-surface-400">soporte@elevva.com</p>
        </a>
        <a
          href="https://wa.me/5491100000000"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-2xl p-5 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 hover:border-primary-400 transition"
        >
          <MessageCircle className="h-6 w-6 text-green-600 dark:text-green-400 mb-3" />
          <h3 className="font-semibold text-surface-900 dark:text-white">WhatsApp</h3>
          <p className="text-sm text-surface-600 dark:text-surface-400">Lun a Vie · 9 a 18hs</p>
        </a>
        <div className="rounded-2xl p-5 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700">
          <HelpCircle className="h-6 w-6 text-primary-600 dark:text-primary-400 mb-3" />
          <h3 className="font-semibold text-surface-900 dark:text-white">Tiempo de respuesta</h3>
          <p className="text-sm text-surface-600 dark:text-surface-400">Menos de 24hs hábiles</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-2xl font-bold text-surface-900 dark:text-white mb-5">
            Preguntas frecuentes
          </h2>
          <div className="space-y-3">
            {faqs.map((f) => (
              <details
                key={f.q}
                className="group rounded-xl bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 p-4"
              >
                <summary className="cursor-pointer font-medium text-surface-900 dark:text-white">
                  {f.q}
                </summary>
                <p className="mt-2 text-sm text-surface-600 dark:text-surface-400 leading-relaxed">
                  {f.a}
                </p>
              </details>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-surface-900 dark:text-white mb-5">
            Enviar consulta
          </h2>
          {sent ? (
            <div className="rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-6 text-center">
              <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400 mx-auto mb-3" />
              <p className="font-medium text-surface-900 dark:text-white">
                Abrimos tu cliente de correo. Si no pasó nada, escribinos a soporte@elevva.com
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Asunto"
                placeholder="¿En qué te ayudamos?"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                  Mensaje
                </label>
                <textarea
                  className="w-full rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 px-3 py-2 text-sm text-surface-900 dark:text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none min-h-[140px]"
                  placeholder="Contanos qué necesitás..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" fullWidth>
                Enviar consulta
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
