import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, User, Clock, Lock as LockIcon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { getPasswordErrors } from '../../lib/validators';
import toast from 'react-hot-toast';

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const passwordErrors = password ? getPasswordErrors(password) : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (passwordErrors.length > 0) {
      setError('La contrasena no cumple con los requisitos');
      return;
    }

    setIsLoading(true);
    try {
      await register(email, password, firstName, lastName);
      toast.success('Cuenta creada exitosamente!');
      navigate('/interests');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error al crear la cuenta';
      setError(typeof msg === 'string' ? msg : msg[0]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-surface-900 dark:text-white">Crear Cuenta</h1>
          <p className="mt-2 text-surface-600 dark:text-surface-400">
            Registrate y comienza a aprender hoy
          </p>
        </div>

        <div className="mb-6 rounded-xl border border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/20 p-4">
          <div className="flex items-start gap-3">
            <LockIcon className="h-5 w-5 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-surface-900 dark:text-white">
                Para acceder a los cursos debes estar registrado
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-surface-600 dark:text-surface-400">
                <Clock className="h-3.5 w-3.5" />
                Ver demostración gratuita de 30 minutos
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Nombre"
              icon={User}
              placeholder="Tu nombre"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
            <Input
              label="Apellido"
              placeholder="Tu apellido"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>

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
              placeholder="Minimo 8 caracteres"
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

          {password && (
            <div className="space-y-1">
              {['Minimo 8 caracteres', 'Al menos una mayuscula', 'Al menos una minuscula', 'Al menos un numero'].map(
                (req, i) => {
                  const checks = [
                    password.length >= 8,
                    /[A-Z]/.test(password),
                    /[a-z]/.test(password),
                    /[0-9]/.test(password),
                  ];
                  return (
                    <div key={req} className="flex items-center gap-2 text-sm">
                      <div
                        className={`h-1.5 w-1.5 rounded-full ${checks[i] ? 'bg-green-500' : 'bg-surface-300 dark:bg-surface-600'}`}
                      />
                      <span className={checks[i] ? 'text-green-600 dark:text-green-400' : 'text-surface-500'}>
                        {req}
                      </span>
                    </div>
                  );
                },
              )}
            </div>
          )}

          <Button type="submit" fullWidth isLoading={isLoading} size="lg">
            Crear Cuenta
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-surface-600 dark:text-surface-400">
          Ya tienes cuenta?{' '}
          <Link to="/login" className="text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium">
            Inicia Sesion
          </Link>
        </p>
      </div>
    </div>
  );
}
