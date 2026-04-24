import { Link } from 'react-router-dom';
import { Clock } from 'lucide-react';
import { useDemo } from '../../contexts/DemoContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

export function DemoExpiredModal() {
  const { expiredModalOpen, closeExpiredModal } = useDemo();

  return (
    <Modal isOpen={expiredModalOpen} onClose={closeExpiredModal} title="Tu demo expiró">
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-primary-100 p-3 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
            <Clock className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <p className="text-surface-700 dark:text-surface-300">
              Se terminaron tus 30 minutos de acceso gratuito. Suscribite o comprá el curso para
              seguir aprendiendo.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={closeExpiredModal}>
            Cerrar
          </Button>
          <Link to="/pricing" onClick={closeExpiredModal}>
            <Button fullWidth>Ver planes</Button>
          </Link>
        </div>
      </div>
    </Modal>
  );
}
