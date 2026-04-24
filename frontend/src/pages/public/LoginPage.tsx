import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import toast from 'react-hot-toast';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      toast.success('Bienvenido de vuelta!');
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Credenciales invalidas';
      setError(typeof msg === 'string' ? msg : msg[0]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-surface-900 dark:text-white">Iniciar Sesion</h1>
          <p className="mt-2 text-surface-600 dark:text-surface-400">
            Ingresa a tu cuenta para continuar aprendiendo
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <Input
            label="Email"
            type="email"
            icon={Mail}
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <div className="relative">
            <Input
              label="Contrasena"
              type={showPassword ? 'text' : 'password'}
              icon={Lock}
              placeholder="Tu contrasena"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-[38px] text-surface-400 hover:text-surface-600 dark:hover:text-surface-300"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>

          <div className="flex justify-end">
            <Link
              to="/forgot-password"
              className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
            >
              Olvidaste tu contrasena?
            </Link>
          </div>

          <Button type="submit" fullWidth isLoading={isLoading} size="lg">
            Iniciar Sesion
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-surface-600 dark:text-surface-400">
          No tienes cuenta?{' '}
          <Link to="/register" className="text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium">
            Registrate
          </Link>
        </p>
      </div>
    </div>
  );
}
