import { Outlet, Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { TrendingUp, Camera, Video, MessageCircle, Share2, AtSign, Menu, X, Sun, Moon } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { PromoRibbon } from './PromoRibbon';

const navLinks = [
  { label: 'Cursos', to: '/store' },
  { label: 'Planes', to: '/#pricing', hash: 'pricing' },
  { label: 'Sobre nosotros', to: '/about' },
];

export function PublicLayout() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    link: { label: string; to: string; hash?: string }
  ) => {
    if (!link.hash) return;

    // Si ya estás en la landing, hace scroll suave sin recargar
    if (location.pathname === '/') {
      e.preventDefault();
      const target = document.getElementById(link.hash);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        window.history.replaceState(null, '', `/#${link.hash}`);
      }
    }
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-surface-950">
      {/* ─── Navbar ─── */}
      <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${scrolled || location.pathname.startsWith('/store')
        ? 'bg-white/85 dark:bg-surface-950/85 backdrop-blur-xl border-b border-surface-200 dark:border-surface-800/60 shadow-lg shadow-black/5 dark:shadow-black/20'
        : 'bg-transparent'
        }`}>
        <PromoRibbon />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 lg:h-[72px] flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="group flex items-center gap-2.5 flex-shrink-0">
            <div className="relative">
              <TrendingUp className="h-8 w-8 text-primary-500 group-hover:text-primary-400 transition-colors duration-300" strokeWidth={2.5} />
              <div className="absolute inset-0 bg-primary-500/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
            <span className="text-xl font-bold text-surface-900 dark:text-white tracking-tight">
              Elev<span className="text-primary-500 dark:text-primary-400">va</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                onClick={(e) => handleNavClick(e, link)}
                className="nav-link-fancy px-4 py-2 text-[13px] font-medium text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white transition-colors duration-300"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-surface-500 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white hover:bg-surface-100 dark:hover:bg-surface-800/50 transition-all duration-300"
              aria-label="Cambiar tema"
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5 text-yellow-400" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>
            <Link
              to="/login"
              className="hidden sm:inline-flex px-4 py-2 text-[13px] font-medium text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white transition-colors duration-300"
            >
              Iniciar sesión
            </Link>
            <Link
              to="/register"
              className="group relative inline-flex items-center px-5 py-2.5 rounded-xl bg-primary-600 text-white text-[13px] font-semibold hover:bg-primary-500 transition-all duration-300 hover:shadow-lg hover:shadow-primary-500/25"
            >
              Ver demo 30 min
              <div className="absolute inset-0 rounded-xl bg-primary-400/20 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500" />
            </Link>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 text-surface-500 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white transition-colors"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-surface-200 dark:border-surface-800/50 bg-white/95 dark:bg-surface-950/95 backdrop-blur-xl">
            <div className="px-4 py-4 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  to={link.to}
                  onClick={(e) => handleNavClick(e, link)}
                  className="block px-4 py-3 rounded-lg text-sm font-medium text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white hover:bg-surface-100 dark:hover:bg-surface-800/50 transition-all"
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-3 border-t border-surface-200 dark:border-surface-800/50 flex flex-col gap-2">
                <Link to="/login" className="px-4 py-3 rounded-lg text-sm font-medium text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white hover:bg-surface-100 dark:hover:bg-surface-800/50 transition-all">
                  Iniciar sesión
                </Link>
                <Link to="/register" className="px-4 py-3 rounded-xl bg-primary-600 text-white text-sm font-semibold text-center hover:bg-primary-500 transition-all">
                  Comenzar gratis
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ─── Content ─── */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* ─── Footer ─── */}
      <footer className="border-t border-surface-200 dark:border-surface-800/50 bg-surface-50 dark:bg-surface-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
            <div className="col-span-2 md:col-span-1">
              <Link to="/" className="group flex items-center gap-2 mb-4">
                <TrendingUp className="h-7 w-7 text-primary-500 group-hover:text-primary-400 transition-colors" strokeWidth={2.5} />
                <span className="text-lg font-bold text-surface-900 dark:text-white">
                  Elev<span className="text-primary-500 dark:text-primary-400">va</span>
                </span>
              </Link>
              <p className="text-sm text-surface-600 dark:text-surface-500 leading-relaxed">
                Plataforma premium de cursos online para potenciar tu carrera profesional.
              </p>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-4">Plataforma</h3>
              <ul className="space-y-3 text-sm text-surface-600 dark:text-surface-500">
                <li><Link to="/store" className="hover:text-primary-500 dark:hover:text-primary-400 transition-colors duration-300">Catálogo</Link></li>
                <li><Link to="/store" className="hover:text-primary-500 dark:hover:text-primary-400 transition-colors duration-300">Cursos</Link></li>
                <li><Link to="/register" className="hover:text-primary-500 dark:hover:text-primary-400 transition-colors duration-300">Registrarse</Link></li>
                <li><Link to="/login" className="hover:text-primary-500 dark:hover:text-primary-400 transition-colors duration-300">Iniciar sesión</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-4">Legal</h3>
              <ul className="space-y-3 text-sm text-surface-600 dark:text-surface-500">
                <li><Link to="/terms" className="hover:text-primary-500 dark:hover:text-primary-400 transition-colors duration-300">Términos</Link></li>
                <li><Link to="/privacy" className="hover:text-primary-500 dark:hover:text-primary-400 transition-colors duration-300">Privacidad</Link></li>
                <li><Link to="/cookies" className="hover:text-primary-500 dark:hover:text-primary-400 transition-colors duration-300">Cookies</Link></li>
                <li><Link to="/refunds" className="hover:text-primary-500 dark:hover:text-primary-400 transition-colors duration-300">Reembolsos</Link></li>
                <li><Link to="/shipping" className="hover:text-primary-500 dark:hover:text-primary-400 transition-colors duration-300">Envíos</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-4">Conecta</h3>
              <div className="flex flex-wrap gap-2">
                {[
                  { href: 'https://instagram.com', icon: Camera, label: 'Instagram' },
                  { href: 'https://youtube.com', icon: Video, label: 'YouTube' },
                  { href: 'https://facebook.com', icon: Share2, label: 'Facebook' },
                  { href: 'https://twitter.com', icon: AtSign, label: 'X' },
                  { href: 'https://wa.me/', icon: MessageCircle, label: 'WhatsApp' },
                ].map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    className="h-9 w-9 rounded-lg flex items-center justify-center border border-surface-300 dark:border-surface-800 text-surface-500 hover:text-primary-500 dark:hover:text-primary-400 hover:border-primary-500/50 hover:bg-primary-500/5 transition-all duration-300"
                  >
                    <s.icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
              <p className="mt-4 text-xs text-surface-500 dark:text-surface-600">
                <a href="mailto:soporte@elevva.com" className="text-primary-500 hover:text-primary-400 transition-colors">soporte@elevva.com</a>
              </p>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-surface-200 dark:border-surface-800/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-surface-500 dark:text-surface-600">
            <p>&copy; {new Date().getFullYear()} Elevva. Todos los derechos reservados.</p>
            <p>Hecho con pasión en Latinoamérica</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
