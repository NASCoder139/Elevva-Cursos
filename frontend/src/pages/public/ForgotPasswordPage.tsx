import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { authApi } from '../../api/auth.api';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await authApi.forgotPassword({ email });
    } catch {
      // Always show success to not leak email existence
    } finally {
      setIsLoading(false);
      setSent(true);
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {sent ? (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 mb-6">
              <CheckCircle className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-bold text-surface-900 dark:text-white mb-3">
              Revisa tu email
            </h1>
            <p className="text-surface-600 dark:text-surface-400 mb-8">
              Si el email existe en nuestra plataforma, recibiras instrucciones para restablecer tu contrasena.
            </p>
            <Button href="/login" variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Volver al Login
            </Button>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-surface-900 dark:text-white">
                Recuperar Contrasena
              </h1>
              <p className="mt-2 text-surface-600 dark:text-surface-400">
                Ingresa tu email y te enviaremos instrucciones
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="Email"
                type="email"
                icon={Mail}
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <Button type="submit" fullWidth isLoading={isLoading} size="lg">
                Enviar Instrucciones
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
