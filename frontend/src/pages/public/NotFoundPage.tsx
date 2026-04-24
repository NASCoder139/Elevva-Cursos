import { ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-white dark:bg-surface-950">
      <div className="text-center">
        <p className="text-8xl font-bold text-primary-600">404</p>
        <h1 className="mt-4 text-3xl font-bold text-surface-900 dark:text-white">
          Pagina no encontrada
        </h1>
        <p className="mt-3 text-surface-600 dark:text-surface-400 max-w-md mx-auto">
          Lo sentimos, la pagina que buscas no existe o fue movida.
        </p>
        <div className="mt-8">
          <Button href="/" variant="primary" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Volver al Inicio
          </Button>
        </div>
      </div>
    </div>
  );
}
