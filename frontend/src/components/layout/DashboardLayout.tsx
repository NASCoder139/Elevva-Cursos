import { Outlet, Link, NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  TrendingUp, LayoutDashboard, BookOpen, Heart, Users, HelpCircle,
  CreditCard, User, LogOut, Menu, ChevronDown, ShoppingCart, Crown, FileText,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useAccess } from '../../hooks/useAccess';
import { useSubscription } from '../../hooks/useSubscription';
import { ThemeToggle } from '../ui/ThemeToggle';
import { DemoTimer } from '../demo/DemoTimer';
import { CartDrawer } from '../cart/CartDrawer';
import clsx from 'clsx';

const mainNav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/catalog', icon: BookOpen, label: 'Catálogo' },
  { to: '/my-courses', icon: FileText, label: 'Mis cursos' },
  { to: '/favorites', icon: Heart, label: 'Favoritos' },
  { to: '/community', icon: Users, label: 'Comunidad' },
  { to: '/support', icon: HelpCircle, label: 'Soporte' },
];

function SidebarLink({ to, icon: Icon, label, onClick }: { to: string; icon: React.ElementType; label: string; onClick?: () => void }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        clsx(
          'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
          isActive
            ? 'bg-primary-600 text-white shadow-md shadow-primary-600/20'
            : 'text-surface-400 hover:text-white hover:bg-surface-800',
        )
      }
    >
      <Icon className="h-[18px] w-[18px]" />
      {label}
    </NavLink>
  );
}

function PlanBadge({ subscription }: { subscription: any }) {
  if (!subscription?.isActive) return null;

  const planLabel = subscription.plan === 'SUBSCRIPTION_ANNUAL' ? 'Acceso Anual' : 'Acceso Mensual';
  const renewDate = subscription.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd).toLocaleDateString('es-CL')
    : null;
  const isCancelled = subscription.isCancelled;

  return (
    <div className="mt-3 px-1">
      <div className="flex items-center justify-between">
        <span className={clsx('text-xs font-bold', isCancelled ? 'text-yellow-400' : 'text-green-400')}>
          {isCancelled ? 'Plan Cancelado' : 'Plan Activo'}
        </span>
        <Crown className="h-4 w-4 text-yellow-400" />
      </div>
      <p className="text-[11px] text-surface-400 mt-0.5">{planLabel}</p>
      {renewDate && (
        <p className="text-[11px] text-surface-500">
          {isCancelled ? 'Acceso hasta' : 'Renueva'} el {renewDate}
        </p>
      )}
    </div>
  );
}

export function DashboardLayout() {
  const { user, logout } = useAuth();
  const { count, openDrawer } = useCart();
  const { hasSubscription } = useAccess();
  const { subscription } = useSubscription();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const closeMobile = () => setSidebarOpen(false);

  const sidebarContent = (
    <div className="flex flex-col h-full bg-surface-950">
      {/* Logo */}
      <div className="px-5 py-5">
        <Link to="/dashboard" className="flex items-center gap-2.5" onClick={closeMobile}>
          <TrendingUp className="h-7 w-7 text-primary-500" strokeWidth={2.5} />
          <span className="text-lg font-bold tracking-tight text-white">Elevva</span>
        </Link>
      </div>

      {/* Main nav */}
      <nav className="flex-1 overflow-y-auto px-3 space-y-0.5">
        {mainNav.map((item) => (
          <SidebarLink key={item.to} to={item.to} icon={item.icon} label={item.label} onClick={closeMobile} />
        ))}

        {/* Tienda section */}
        <div className="pt-4 pb-1">
          <span className="px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-surface-500">
            Tienda
          </span>
        </div>
        <SidebarLink to="/shop" icon={ShoppingCart} label="Cursos" onClick={closeMobile} />

        {/* Cuenta section */}
        <div className="pt-4 pb-1">
          <span className="px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-surface-500">
            Cuenta
          </span>
        </div>
        <SidebarLink to="/pricing" icon={CreditCard} label="Suscripción" onClick={closeMobile} />
      </nav>

      {/* User profile at bottom */}
      <div className="border-t border-surface-800 px-4 py-4">
        <Link to="/profile" onClick={closeMobile} className="flex items-center gap-3 group">
          <div className="h-9 w-9 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate group-hover:text-primary-400 transition-colors">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-[11px] text-surface-500 truncate">{user?.email}</p>
          </div>
        </Link>
        <PlanBadge subscription={subscription} />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-60 lg:fixed lg:inset-y-0">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={closeMobile} />
          <aside className="fixed inset-y-0 left-0 w-60 flex flex-col shadow-2xl">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main area */}
      <div className="flex-1 lg:pl-60">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-surface-950/80 backdrop-blur-md border-b border-surface-200 dark:border-surface-800">
          <div className="flex items-center justify-between h-14 px-4 sm:px-6 lg:px-8">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800"
            >
              <Menu className="h-5 w-5 text-surface-600 dark:text-surface-400" />
            </button>
            <div className="flex-1" />
            <div className="flex items-center gap-2">
              {!hasSubscription && <DemoTimer />}
              <button
                onClick={openDrawer}
                className="relative p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                title="Carrito"
              >
                <ShoppingCart className="h-5 w-5 text-surface-600 dark:text-surface-400" />
                {count > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-4.5 w-4.5 rounded-full bg-primary-600 text-[10px] font-bold text-white flex items-center justify-center">
                    {count}
                  </span>
                )}
              </button>
              <ThemeToggle />
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-1.5 p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                >
                  <div className="h-7 w-7 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-bold">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-surface-500" />
                </button>
                {dropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-700 shadow-xl py-1 z-20">
                      <Link
                        to="/profile"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800"
                      >
                        <User className="h-4 w-4" /> Mi Perfil
                      </Link>
                      {user?.role === 'ADMIN' && (
                        <Link
                          to="/admin"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800"
                        >
                          <LayoutDashboard className="h-4 w-4" /> Admin Panel
                        </Link>
                      )}
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-surface-100 dark:hover:bg-surface-800 w-full"
                      >
                        <LogOut className="h-4 w-4" /> Cerrar Sesión
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="p-3 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
      <CartDrawer />
    </div>
  );
}
