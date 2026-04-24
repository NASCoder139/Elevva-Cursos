import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Lock, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { authApi } from '../../api/auth.api';

export function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden');
      return;
    }
    if (!token) {
      setError('Token inválido');
      return;
    }
    setIsLoading(true);
    try {
      await authApi.resetPassword({ token, newPassword: password });
      setDone(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Token inválido o expirado');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {done ? (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 mb-6">
              <CheckCircle className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-bold text-surface-900 dark:text-white mb-3">
              Contraseña restablecida
            </h1>
            <p className="text-surface-600 dark:text-surface-400 mb-8">
              Redirigiendo al login...
            </p>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-surface-900 dark:text-white">
                Nueva Contraseña
              </h1>
              <p className="mt-2 text-surface-600 dark:text-surface-400">
                Elegí una contraseña segura para tu cuenta
              </p>
            </div>

            {error && (
              <div className="mb-4 flex items-start gap-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-3 text-sm">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="Nueva contraseña"
                type="password"
                icon={Lock}
                placeholder="Mínimo 8 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Input
                label="Confirmar contraseña"
                type="password"
                icon={Lock}
                placeholder="Repetí la contraseña"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
              <Button type="submit" fullWidth isLoading={isLoading} size="lg">
                Restablecer Contraseña
              </Button>
            </form>

            <p className="mt-6 text-center">
              <Link
                to="/login"
                className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 inline-flex items-center gap-1"
              >
                <ArrowLeft className="h-4 w-4" /> Volver al Login
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
