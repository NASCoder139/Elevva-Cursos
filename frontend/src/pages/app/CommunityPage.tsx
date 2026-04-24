import { MessageCircle, Users, Camera, Video, ArrowUpRight } from 'lucide-react';

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
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="mb-10 text-center">
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
    </div>
  );
}
