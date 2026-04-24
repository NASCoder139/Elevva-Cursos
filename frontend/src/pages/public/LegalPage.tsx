import { useParams } from 'react-router-dom';
import { FileText, Shield, Cookie, RefreshCw, Truck } from 'lucide-react';

interface Section {
  heading?: string;
  paragraphs?: string[];
  list?: string[];
}

interface LegalDoc {
  title: string;
  intro?: string;
  sections: Section[];
}

const content: Record<string, LegalDoc> = {
  terms: {
    title: 'Términos y condiciones',
    intro:
      'Es requisito necesario para la adquisición de los productos y servicios que se ofrecen en este sitio que leas y aceptes los siguientes Términos y Condiciones. El uso de nuestros servicios, así como la compra de cualquiera de nuestros planes o cursos, implica que has leído y aceptado este documento en su totalidad.',
    sections: [
      {
        heading: '1. Registro y cuenta de usuario',
        paragraphs: [
          'Para acceder a determinados productos y suscripciones es necesario crear una cuenta en Elevva, ingresando datos personales fidedignos y definiendo una contraseña personal e intransferible.',
          'Podés cambiar tu contraseña en cualquier momento desde el panel de tu cuenta. Elevva no asume responsabilidad alguna en caso de que compartas tus credenciales con terceros o de un uso indebido derivado de la pérdida o filtración de las mismas.',
        ],
      },
      {
        heading: '2. Compras y proceso de verificación',
        paragraphs: [
          'Todas las compras y transacciones realizadas a través de este sitio están sujetas a un proceso de confirmación y verificación, que puede incluir la validación del medio de pago, la verificación de la identidad del titular y el cumplimiento de las condiciones requeridas por el procesador de pagos seleccionado (MercadoPago o PayPal).',
          'En algunos casos podemos requerir verificación adicional por correo electrónico antes de habilitar el acceso al contenido.',
          'Los precios publicados en Elevva son válidos exclusivamente para las compras realizadas a través de este sitio web.',
        ],
      },
      {
        heading: '3. Licencia de uso',
        paragraphs: [
          'Elevva concede a sus usuarios una licencia personal, no exclusiva e intransferible para acceder y consumir los cursos y materiales adquiridos, conforme a los Términos y Condiciones aquí descritos.',
          'El acceso a los cursos individuales es permanente para esa cuenta, mientras que el acceso a los planes Mensual y Anual está sujeto a la vigencia de la suscripción contratada.',
        ],
      },
      {
        heading: '4. Uso no autorizado',
        paragraphs: [
          'Queda estrictamente prohibido descargar, redistribuir, revender, copiar, retransmitir, compartir credenciales, o publicar en cualquier medio físico o digital los cursos, videos, materiales descargables o cualquier otro contenido de la plataforma, sea modificado o sin modificar.',
          'El incumplimiento de esta cláusula faculta a Elevva a suspender o cancelar la cuenta sin previo aviso, sin obligación de reembolso y a iniciar las acciones legales que correspondan.',
        ],
      },
      {
        heading: '5. Propiedad intelectual',
        paragraphs: [
          'Todos los cursos, videos, textos, gráficos, marcas y demás materiales presentes en Elevva son propiedad de Elevva o de los autores y proveedores de contenido correspondientes, y se encuentran protegidos por las leyes de propiedad intelectual aplicables.',
          'El usuario no podrá declarar propiedad ni titularidad sobre ninguno de estos contenidos. Salvo que se especifique lo contrario, los productos se proporcionan sin garantías expresas o implícitas. En ningún caso Elevva será responsable por daños directos, indirectos, especiales, incidentales o consecuentes derivados del uso o de la imposibilidad de uso de los contenidos.',
        ],
      },
      {
        heading: '6. Reclamos por derechos de autor',
        paragraphs: [
          'Si sos titular de derechos de autor o representante autorizado y considerás que algún contenido publicado en Elevva infringe tus derechos, podés notificarlo para que sea revisado y, si corresponde, retirado de la plataforma.',
          'Para que el reclamo pueda ser procesado, deberá enviarse por escrito a soporte@elevva.com incluyendo la siguiente información:',
        ],
        list: [
          'Datos completos del titular del derecho o del representante autorizado (nombre, domicilio, correo electrónico y teléfono de contacto).',
          'Identificación precisa de la obra o material protegido que se considera infringido.',
          'Ubicación exacta del contenido dentro de Elevva (URL, título del curso, lección o recurso).',
          'Declaración de buena fe de que el uso del material no está autorizado por el titular, su agente o la ley.',
          'Declaración, bajo responsabilidad del reclamante, de que la información suministrada es exacta y de que actúa con legitimación suficiente.',
          'Firma física o digital del titular del derecho o de su representante.',
        ],
      },
      {
        heading: '7. Política de reembolsos y garantía',
        paragraphs: [
          'Dado que los cursos son productos digitales de entrega inmediata, la política general es no realizar reembolsos una vez habilitado el acceso al contenido. Se recomienda revisar cuidadosamente la descripción, el temario y la demo antes de comprar.',
          'Hacemos excepciones cuando la descripción del producto no se ajusta de manera evidente al contenido entregado. En esos casos, las solicitudes serán evaluadas individualmente por nuestro equipo de soporte.',
        ],
        list: [
          'Compras individuales de cursos: podés solicitar reembolso dentro de los 7 días corridos, siempre que no hayas completado más del 20 % del contenido.',
          'Suscripción Mensual o Anual: la cancelación detiene la renovación para el siguiente período. No se reembolsan períodos ya iniciados.',
          'Para iniciar un reembolso, escribinos a soporte@elevva.com indicando el ID de pago.',
        ],
      },
      {
        heading: '8. Comprobación antifraude',
        paragraphs: [
          'Toda compra puede ser aplazada para realizar una comprobación antifraude. En casos puntuales podemos suspender temporalmente la operación para una investigación más rigurosa, con el fin de evitar transacciones fraudulentas y proteger tanto a los usuarios como a la plataforma.',
        ],
      },
      {
        heading: '9. Privacidad',
        paragraphs: [
          'Elevva garantiza que la información personal que envías cuenta con las medidas de seguridad necesarias. Los datos ingresados al registrarte o al validar pedidos no serán entregados a terceros, salvo que sean requeridos en cumplimiento de una orden judicial o requerimiento legal vigente.',
          'La suscripción a boletines y comunicaciones promocionales por correo electrónico es voluntaria y puede ser activada o desactivada en cualquier momento desde tu cuenta.',
        ],
      },
      {
        heading: '10. Modificaciones',
        paragraphs: [
          'Elevva se reserva el derecho de modificar estos Términos y Condiciones en cualquier momento sin previo aviso. La versión vigente será siempre la publicada en esta página, con la fecha de última actualización indicada al inicio del documento.',
        ],
      },
      {
        heading: '11. Contacto',
        paragraphs: [
          'Para cualquier consulta, reclamo o solicitud relacionada con estos Términos y Condiciones, escribinos a soporte@elevva.com.',
        ],
      },
    ],
  },
  privacy: {
    title: 'Política de privacidad',
    intro:
      'La presente Política de Privacidad establece los términos en que Elevva recopila, utiliza y protege la información que sus usuarios proporcionan al utilizar este sitio web. Estamos firmemente comprometidos con la seguridad de tus datos: cualquier información que solicitemos será tratada exclusivamente conforme a este documento. Esta política puede actualizarse con el tiempo, por lo que te recomendamos revisarla periódicamente para asegurarte de estar de acuerdo con los cambios.',
    sections: [
      {
        heading: '1. Información que recopilamos',
        paragraphs: [
          'Elevva puede recopilar información personal que permita identificarte, como nombre, dirección de correo electrónico, país y, cuando corresponda, datos de facturación.',
          'Cuando realizás una compra o contratás una suscripción, los datos de pago son procesados directamente por nuestros proveedores autorizados (MercadoPago y PayPal). Elevva no almacena los datos completos de tu tarjeta.',
        ],
      },
      {
        heading: '2. Uso de la información',
        paragraphs: [
          'Utilizamos la información recopilada con el fin de prestar el mejor servicio posible: mantener tu cuenta, gestionar suscripciones y compras, habilitar el acceso a los cursos, brindar soporte y mejorar continuamente nuestros productos.',
          'Ocasionalmente podemos enviarte correos electrónicos con novedades, ofertas, lanzamientos de cursos o información que consideremos relevante. Estos envíos se realizan a la dirección que nos proporcionaste y podés cancelarlos en cualquier momento desde el enlace de baja incluido en cada correo o desde tu cuenta.',
          'Elevva está comprometida con mantener tu información segura. Empleamos sistemas y prácticas actualizadas constantemente para evitar accesos no autorizados, pérdida o alteración de tus datos.',
        ],
      },
      {
        heading: '3. Cookies',
        paragraphs: [
          'Una cookie es un pequeño archivo que se descarga en tu dispositivo cuando accedés a determinadas páginas. Las cookies permiten al sitio reconocerte, recordar tus preferencias y mejorar tu experiencia de navegación.',
          'Elevva utiliza cookies para identificar las páginas visitadas, mantener tu sesión iniciada y obtener métricas agregadas de uso. Esta información se emplea únicamente para análisis estadístico y mejora del servicio.',
          'Podés aceptar o rechazar el uso de cookies desde la configuración de tu navegador. Tené en cuenta que, si las desactivás, algunas funciones del sitio podrían dejar de operar correctamente.',
        ],
      },
      {
        heading: '4. Enlaces a terceros',
        paragraphs: [
          'Este sitio puede contener enlaces a páginas externas que podrían resultarte de interés. Una vez que hagas clic en alguno de esos enlaces y abandones Elevva, ya no tenemos control sobre el sitio al que sos redirigido.',
          'Por ello, no somos responsables de los términos, políticas de privacidad ni del tratamiento de datos en esos sitios. Te recomendamos revisar las políticas de cada uno antes de proporcionar información personal.',
        ],
      },
      {
        heading: '5. Control de tu información personal',
        paragraphs: [
          'En cualquier momento podés restringir la recopilación o el uso de la información personal que proporcionás a Elevva. Al completar formularios podés marcar o desmarcar la opción de recibir comunicaciones por correo electrónico, y podés cancelar la suscripción a boletines cuando quieras.',
          'Elevva no vende, cede ni distribuye tu información personal a terceros sin tu consentimiento, salvo que sea requerido por una orden judicial o requerimiento legal vigente.',
        ],
        list: [
          'Podés acceder, corregir o actualizar tus datos desde el panel de tu cuenta.',
          'Podés solicitar la eliminación definitiva de tu cuenta y datos personales escribiendo a soporte@elevva.com.',
          'Podés cancelar la recepción de correos promocionales en cualquier momento desde el enlace de baja o desde tu cuenta.',
        ],
      },
      {
        heading: '6. Modificaciones',
        paragraphs: [
          'Elevva se reserva el derecho de modificar esta Política de Privacidad en cualquier momento. La versión vigente será siempre la publicada en esta página, con la fecha de última actualización indicada al inicio del documento.',
        ],
      },
      {
        heading: '7. Contacto',
        paragraphs: [
          'Si tenés consultas, reclamos o solicitudes relacionadas con el tratamiento de tus datos personales, podés escribirnos a soporte@elevva.com.',
        ],
      },
    ],
  },
  cookies: {
    title: 'Política de cookies',
    sections: [
      {
        paragraphs: [
          'Usamos cookies técnicas indispensables para la autenticación y el funcionamiento del sitio.',
          'También empleamos cookies analíticas para entender el uso agregado de la plataforma y mejorarla.',
          'Podés configurar tu navegador para bloquear cookies, aunque algunas funciones podrían dejar de operar correctamente.',
        ],
      },
    ],
  },
  refunds: {
    title: 'Política de reembolsos',
    intro:
      'En Elevva todos los productos comercializados son contenidos digitales de entrega inmediata. Por la naturaleza del servicio, todas las compras realizadas en la plataforma son finales y no admiten reembolso bajo ninguna circunstancia. Te recomendamos revisar cuidadosamente la descripción, el temario y, cuando esté disponible, la demostración gratuita antes de confirmar tu compra.',
    sections: [
      {
        heading: '1. Compras no reembolsables',
        paragraphs: [
          'Una vez confirmado el pago y habilitado el acceso al contenido, no se realizan devoluciones totales ni parciales del importe abonado, ya sea por compras individuales de cursos, paquetes o suscripciones Mensuales y Anuales.',
          'Esta política aplica independientemente del avance que hayas realizado dentro del curso o suscripción.',
        ],
      },
      {
        heading: '2. Suscripciones',
        paragraphs: [
          'Podés cancelar tu suscripción Mensual o Anual en cualquier momento desde el panel de tu cuenta. La cancelación detiene la renovación automática para el siguiente período.',
          'Los períodos ya iniciados o pagados no son reembolsables y conservás el acceso a todo el contenido hasta la fecha de finalización del período en curso.',
        ],
      },
      {
        heading: '3. Antes de comprar',
        paragraphs: [
          'Para tomar una decisión informada, te recomendamos:',
        ],
        list: [
          'Leer atentamente la descripción y el temario completo del curso.',
          'Revisar las clases y materiales de muestra cuando estén disponibles.',
          'Verificar los requisitos técnicos y de conocimientos previos indicados.',
          'Consultar cualquier duda escribiéndonos a soporte@elevva.com antes de finalizar la compra.',
        ],
      },
      {
        heading: '4. Casos excepcionales',
        paragraphs: [
          'Únicamente evaluaremos solicitudes de reembolso en casos en los que se demuestre fehacientemente un error técnico atribuible a Elevva que impida de forma definitiva el acceso al contenido contratado y que no haya podido ser resuelto por nuestro equipo de soporte.',
          'Estas solicitudes serán analizadas individualmente por nuestro equipo y la resolución será comunicada al usuario por correo electrónico.',
        ],
      },
      {
        heading: '5. Contacto',
        paragraphs: [
          'Para cualquier consulta relacionada con esta política, escribinos a soporte@elevva.com indicando el ID de pago y el detalle de tu solicitud.',
        ],
      },
    ],
  },
  shipping: {
    title: 'Política de envíos',
    intro:
      'Elevva es una plataforma 100 % digital de cursos online. No se realizan envíos físicos de ningún tipo: todo el contenido contratado se entrega electrónicamente y queda disponible de forma inmediata en tu cuenta.',
    sections: [
      {
        heading: '1. Producto digital, sin envíos físicos',
        paragraphs: [
          'Todos los productos disponibles en Elevva (cursos individuales, paquetes y suscripciones Mensuales y Anuales) son productos digitales. No se envían DVDs, pendrives, libros impresos ni ningún otro material físico.',
          'Esto significa que no hay costos de envío, ni demoras logísticas, ni dependés de un servicio de mensajería para acceder a tu contenido.',
        ],
      },
      {
        heading: '2. Acceso al contenido',
        paragraphs: [
          'Una vez confirmado el pago, el acceso al contenido se habilita automáticamente en tu cuenta. Podés ingresar a tus cursos desde cualquier dispositivo con conexión a internet entrando a elevva.com con tu email y contraseña.',
        ],
        list: [
          'Compras individuales de cursos: acceso permanente al curso adquirido desde tu panel.',
          'Suscripción Mensual: acceso a todo el catálogo mientras la suscripción se mantenga activa.',
          'Suscripción Anual: acceso a todo el catálogo durante 12 meses desde la fecha de contratación.',
        ],
      },
      {
        heading: '3. Confirmación por correo electrónico',
        paragraphs: [
          'Al completar una compra recibirás un correo electrónico de confirmación con el detalle de la operación y la indicación de que tu acceso ya está habilitado. Si por algún motivo no recibís ese correo dentro de los primeros minutos, revisá tu carpeta de Spam o contactá a soporte@elevva.com con tu ID de pago.',
        ],
      },
      {
        heading: '4. Requisitos técnicos',
        paragraphs: [
          'Para disfrutar del contenido sin inconvenientes, recomendamos contar con:',
        ],
        list: [
          'Una conexión a internet estable (banda ancha o 4G/5G).',
          'Un navegador moderno actualizado (Chrome, Firefox, Edge o Safari en sus versiones recientes).',
          'Un dispositivo (PC, notebook, tablet o smartphone) con audio y video funcionales.',
        ],
      },
      {
        heading: '5. Disponibilidad',
        paragraphs: [
          'Los cursos están disponibles 24/7 desde cualquier parte del mundo. Salvo tareas puntuales de mantenimiento previamente informadas, no existen restricciones horarias ni geográficas para acceder a tu contenido.',
        ],
      },
      {
        heading: '6. Contacto',
        paragraphs: [
          'Si tenés problemas para acceder a tu contenido o cualquier otra consulta sobre la entrega digital, escribinos a soporte@elevva.com.',
        ],
      },
    ],
  },
};

const slugMeta: Record<string, { icon: typeof FileText; tone: string }> = {
  terms: { icon: FileText, tone: 'from-violet-500 to-primary-500' },
  privacy: { icon: Shield, tone: 'from-emerald-500 to-teal-500' },
  cookies: { icon: Cookie, tone: 'from-amber-500 to-orange-500' },
  refunds: { icon: RefreshCw, tone: 'from-sky-500 to-cyan-500' },
  shipping: { icon: Truck, tone: 'from-fuchsia-500 to-pink-500' },
};

export default function LegalPage({ slug: propSlug }: { slug?: string }) {
  const params = useParams();
  const slug = propSlug || params.slug || 'terms';
  const doc = content[slug] || content.terms;
  const meta = slugMeta[slug] || slugMeta.terms;
  const Icon = meta.icon;

  return (
    <div className="bg-white dark:bg-surface-950">
      {/* Hero */}
      <div className="relative overflow-hidden border-b border-surface-200 dark:border-surface-800">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-primary-500/5" />
        <div className="relative mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
          <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${meta.tone} text-white shadow-lg`}>
            <Icon className="h-5 w-5" />
          </div>
          <h1 className="text-3xl font-bold text-surface-900 dark:text-white md:text-4xl">{doc.title}</h1>
          <p className="mt-3 text-sm text-surface-500">
            Última actualización: {new Date().toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
          {doc.intro && (
            <p className="mt-6 text-base leading-relaxed text-surface-700 dark:text-surface-300">
              {doc.intro}
            </p>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="space-y-10">
          {doc.sections.map((s, i) => (
            <section key={i} className="scroll-mt-24">
              {s.heading && (
                <div className="mb-4 flex items-center gap-3">
                  <span className="h-6 w-1 rounded-full bg-gradient-to-b from-violet-500 to-primary-500" />
                  <h2 className="text-xl font-bold text-surface-900 dark:text-white">{s.heading}</h2>
                </div>
              )}
              {s.paragraphs && (
                <div className="space-y-3 leading-relaxed text-surface-700 dark:text-surface-300">
                  {s.paragraphs.map((p, j) => (
                    <p key={j}>{p}</p>
                  ))}
                </div>
              )}
              {s.list && (
                <ul className="mt-4 space-y-2.5">
                  {s.list.map((item, k) => (
                    <li
                      key={k}
                      className="flex items-start gap-3 rounded-lg border border-surface-200 bg-surface-50/60 px-4 py-3 text-sm text-surface-700 dark:border-surface-800 dark:bg-surface-900/40 dark:text-surface-300"
                    >
                      <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gradient-to-r from-violet-500 to-primary-500" />
                      <span className="leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        {/* Footer note */}
        <div className="mt-16 rounded-2xl border border-surface-200 bg-gradient-to-br from-violet-500/5 to-primary-500/5 p-6 text-center dark:border-surface-800">
          <p className="text-sm text-surface-600 dark:text-surface-400">
            ¿Tenés dudas sobre este documento?{' '}
            <a href="mailto:soporte@elevva.com" className="font-semibold text-primary-600 hover:underline dark:text-primary-400">
              Escribinos a soporte@elevva.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
