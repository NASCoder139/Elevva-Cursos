import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  MessageCircle, Users, Camera, Video, ArrowUpRight,
  Star, Quote, Trash2, Lock, Send,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {
  testimonialsApi,
  type Testimonial,
  type TestimonialEligibility,
} from '../../api/testimonials.api';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';

const links = [
  {
    title: 'Grupo de WhatsApp',
    description: 'Unite a nuestra comunidad exclusiva de alumnos. Compartí dudas, proyectos y networking.',
    href: 'https://chat.whatsapp.com/elevva',
    icon: MessageCircle,
    color: 'from-green-500 to-emerald-600',
  },
  {
    title: 'Canal de Anuncios',
    description: 'Enterate primero sobre nuevos cursos, eventos y actualizaciones del contenido.',
    href: 'https://whatsapp.com/channel/elevva',
    icon: Users,
    color: 'from-primary-500 to-primary-600',
  },
  {
    title: 'Instagram',
    description: 'Tips diarios, behind the scenes y contenido exclusivo para nuestra comunidad.',
    href: 'https://instagram.com/elevva',
    icon: Camera,
    color: 'from-pink-500 to-rose-600',
  },
  {
    title: 'YouTube',
    description: 'Previews gratuitas, entrevistas y material complementario de los cursos.',
    href: 'https://youtube.com/@elevva',
    icon: Video,
    color: 'from-red-500 to-red-600',
  },
];

export default function CommunityPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-12">
      <div className="text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-surface-900 dark:text-white mb-3">
          Comunidad Elevva
        </h1>
        <p className="text-surface-600 dark:text-surface-400 max-w-2xl mx-auto">
          Aprender es mejor en compañía. Conectá con otros alumnos, resolvé dudas y mantenete al día.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <a
              key={link.title}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative rounded-2xl p-6 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 hover:border-primary-400 dark:hover:border-primary-500 hover:shadow-lg transition-all"
            >
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${link.color} text-white mb-4`}>
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-2 flex items-center gap-2">
                {link.title}
                <ArrowUpRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h3>
              <p className="text-sm text-surface-600 dark:text-surface-400 leading-relaxed">
                {link.description}
              </p>
            </a>
          );
        })}
      </div>

      <TestimonialsSection />
    </div>
  );
}

function TestimonialsSection() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [eligibility, setEligibility] = useState<TestimonialEligibility | null>(null);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);

  const reload = async () => {
    setLoading(true);
    try {
      const [listRes, eligRes] = await Promise.all([
        testimonialsApi.list(),
        testimonialsApi.eligibility(),
      ]);
      setTestimonials(listRes.data.data);
      setEligibility(eligRes.data.data);
    } catch {
      toast.error('Error cargando testimonios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
  }, []);

  const submit = async () => {
    if (content.trim().length < 20) {
      toast.error('Escribe al menos 20 caracteres');
      return;
    }
    setSubmitting(true);
    try {
      await testimonialsApi.create({ content: content.trim(), rating });
      toast.success('¡Gracias por tu testimonio!');
      setContent('');
      setRating(5);
      reload();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'No se pudo publicar');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este testimonio?')) return;
    try {
      await testimonialsApi.remove(id);
      toast.success('Testimonio eliminado');
      reload();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al eliminar');
    }
  };

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-surface-900 dark:text-white">Testimonios de la comunidad</h2>
        <p className="mt-1 text-sm text-surface-500">
          {testimonials.length > 0
            ? `${testimonials.length} alumno${testimonials.length !== 1 ? 's han' : ' ha'} compartido su experiencia`
            : 'Sé el primero en compartir tu experiencia'}
        </p>
      </div>

      {/* Form (solo para usuarios elegibles que no tienen testimonio aún) */}
      {!eligibility ? null : !eligibility.eligible ? (
        <div className="rounded-xl border border-dashed border-surface-300 dark:border-surface-700 p-5 text-center">
          <Lock className="mx-auto mb-2 h-7 w-7 text-surface-400" />
          <p className="text-sm text-surface-600 dark:text-surface-400">
            Solo los alumnos con un curso comprado o suscripción activa pueden dejar un testimonio.
          </p>
        </div>
      ) : eligibility.hasTestimonial ? (
        <div className="rounded-xl border border-emerald-200 dark:border-emerald-800/40 bg-emerald-50 dark:bg-emerald-900/10 p-4 text-sm text-emerald-700 dark:text-emerald-300">
          ✓ Ya publicaste tu testimonio. ¡Gracias por compartir tu experiencia!
        </div>
      ) : (
        <div className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 p-5 space-y-4">
          <h3 className="font-semibold text-surface-900 dark:text-white">Comparte tu experiencia</h3>

          <div>
            <label className="mb-2 block text-xs font-medium text-surface-600 dark:text-surface-400">
              Tu calificación
            </label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  className="transition hover:scale-110"
                >
                  <Star
                    className={`h-7 w-7 ${
                      n <= rating ? 'fill-amber-400 text-amber-400' : 'text-surface-300 dark:text-surface-600'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium text-surface-600 dark:text-surface-400">
              Tu testimonio ({content.length}/500)
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, 500))}
              rows={4}
              placeholder="Cuéntanos qué te ha aportado Elevva, qué cursos te gustaron, cómo te ayudó..."
              className="w-full rounded-lg border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-800 px-4 py-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>

          <Button onClick={submit} isLoading={submitting} disabled={content.trim().length < 20}>
            <Send className="mr-2 h-4 w-4" /> Publicar testimonio
          </Button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : testimonials.length === 0 ? (
        <div className="rounded-xl border border-dashed border-surface-300 dark:border-surface-700 py-10 text-center text-sm text-surface-500">
          Aún no hay testimonios publicados.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {testimonials.map((t) => (
            <article
              key={t.id}
              className="relative rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 p-5"
            >
              {(isAdmin || user?.id === (t as any).userId) && (
                <button
                  onClick={() => handleDelete(t.id)}
                  className="absolute top-3 right-3 rounded-lg p-1.5 text-surface-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                  title={isAdmin ? 'Eliminar (admin)' : 'Eliminar mi testimonio'}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
              <Quote className="h-5 w-5 text-surface-300 dark:text-surface-700 mb-3" />
              <div className="flex gap-0.5 mb-3">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`h-3.5 w-3.5 ${
                      s <= t.rating ? 'fill-amber-400 text-amber-400' : 'text-surface-300 dark:text-surface-700'
                    }`}
                  />
                ))}
              </div>
              <p className="text-sm leading-relaxed text-surface-700 dark:text-surface-300 mb-4">
                "{t.content}"
              </p>
              <div className="flex items-center gap-3 pt-3 border-t border-surface-200 dark:border-surface-800">
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold">
                  {t.author.firstName[0]}{t.author.lastName[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-surface-900 dark:text-white truncate">
                    {t.author.firstName} {t.author.lastName}
                  </div>
                  {t.author.country && (
                    <div className="text-[11px] text-surface-500">{t.author.country}</div>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
