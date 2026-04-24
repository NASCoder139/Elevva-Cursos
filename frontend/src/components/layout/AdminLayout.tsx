import { Outlet, Link, NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  Shield, LayoutDashboard, BookOpen, Folder, Users, CreditCard, Settings,
  LogOut, Menu, ArrowLeft, Tag, Ticket,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ThemeToggle } from '../ui/ThemeToggle';
import clsx from 'clsx';

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/courses', icon: BookOpen, label: 'Cursos' },
  { to: '/admin/categories', icon: Folder, label: 'Categorías' },
  { to: '/admin/plans', icon: Tag, label: 'Planes y precios' },
  { to: '/admin/discounts', icon: Ticket, label: 'Descuentos' },
  { to: '/admin/users', icon: Users, label: 'Usuarios' },
  { to: '/admin/payments', icon: CreditCard, label: 'Pagos' },
  { to: '/admin/settings', icon: Settings, label: 'Ajustes' },
];

export function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const sidebar = (
    <>
      <div className="p-4 border-b border-surface-200 dark:border-surface-800">
        <Link to="/admin" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          <Shield className="h-7 w-7 text-primary-600" />
          <div>
            <div className="text-lg font-bold text-surface-900 dark:text-white">Elevva</div>
            <div className="text-xs text-surface-500">Admin Panel</div>
          </div>
        </Link>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            end={it.end}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive ? 'bg-primary-600 text-white' : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800',
              )
            }
          >
            <it.icon className="h-5 w-5" />
            {it.label}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-surface-200 dark:border-surface-800 space-y-1">
        <Link
          to="/dashboard"
          onClick={() => setOpen(false)}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800"
        >
          <ArrowLeft className="h-4 w-4" /> Volver a la app
        </Link>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-surface-100 dark:hover:bg-surface-800"
        >
          <LogOut className="h-4 w-4" /> Cerrar Sesión
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex bg-surface-50 dark:bg-surface-950">
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white dark:bg-surface-900 border-r border-surface-200 dark:border-surface-800">
        {sidebar}
      </aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-surface-900 border-r flex flex-col">
            {sidebar}
          </aside>
        </div>
      )}
      <div className="flex-1 lg:pl-64">
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-surface-950/80 backdrop-blur-md border-b border-surface-200 dark:border-surface-800">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6">
            <button onClick={() => setOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800">
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex-1" />
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <div className="text-sm text-surface-600 dark:text-surface-400 hidden sm:block">
                {user?.firstName} {user?.lastName}
              </div>
            </div>
          </div>
        </header>
        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
