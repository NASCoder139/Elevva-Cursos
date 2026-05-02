import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { PublicLayout } from '../components/layout/PublicLayout';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { GuestRoute } from './GuestRoute';
import { AdminRoute } from './AdminRoute';
import { LandingPage } from '../pages/public/LandingPage';
import { LoginPage } from '../pages/public/LoginPage';
import { RegisterPage } from '../pages/public/RegisterPage';
import { ForgotPasswordPage } from '../pages/public/ForgotPasswordPage';
import { ResetPasswordPage } from '../pages/public/ResetPasswordPage';
import CommunityPage from '../pages/app/CommunityPage';
import SupportPage from '../pages/app/SupportPage';
import PublicStorePage from '../pages/public/PublicStorePage';
import LegalPage from '../pages/public/LegalPage';
import AboutPage from '../pages/public/AboutPage';
import { DashboardPage } from '../pages/app/DashboardPage';
import { NotFoundPage } from '../pages/public/NotFoundPage';
import InterestsPage from '../pages/app/InterestsPage';
import MyCoursesPage from '../pages/app/MyCoursesPage';
import CourseDetailPage from '../pages/app/CourseDetailPage';
import ProfilePage from '../pages/app/ProfilePage';
import FavoritesPage from '../pages/app/FavoritesPage';
import PricingPage from '../pages/app/PricingPage';
import PaymentResultPage from '../pages/app/PaymentResultPage';
import { AdminLayout } from '../components/layout/AdminLayout';
import AdminDashboardPage from '../pages/admin/AdminDashboardPage';
import AdminCoursesPage from '../pages/admin/AdminCoursesPage';
import AdminCourseEditPage from '../pages/admin/AdminCourseEditPage';
import AdminCategoriesPage from '../pages/admin/AdminCategoriesPage';
import AdminUsersPage from '../pages/admin/AdminUsersPage';
import AdminPaymentsPage from '../pages/admin/AdminPaymentsPage';
import AdminSettingsPage from '../pages/admin/AdminSettingsPage';
import AdminPlansPage from '../pages/admin/AdminPlansPage';
import AdminDiscountsPage from '../pages/admin/AdminDiscountsPage';
import AdminTaxesPage from '../pages/admin/AdminTaxesPage';

const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { path: '/store', element: <PublicStorePage /> },
      { path: '/about', element: <AboutPage /> },
      { path: '/store/courses', element: <PublicStorePage /> },
      { path: '/terms', element: <LegalPage slug="terms" /> },
      { path: '/privacy', element: <LegalPage slug="privacy" /> },
      { path: '/cookies', element: <LegalPage slug="cookies" /> },
      { path: '/refunds', element: <LegalPage slug="refunds" /> },
      { path: '/shipping', element: <LegalPage slug="shipping" /> },
    ],
  },
  {
    element: <GuestRoute />,
    children: [
      {
        element: <PublicLayout />,
        children: [
          { path: '/', element: <LandingPage /> },
          { path: '/login', element: <LoginPage /> },
          { path: '/register', element: <RegisterPage /> },
          { path: '/forgot-password', element: <ForgotPasswordPage /> },
          { path: '/reset-password/:token', element: <ResetPasswordPage /> },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/my-courses', element: <MyCoursesPage /> },
          { path: '/shop', element: <PublicStorePage /> },
          { path: '/course/:courseSlug', element: <CourseDetailPage /> },
          { path: '/favorites', element: <FavoritesPage /> },
          { path: '/profile', element: <ProfilePage /> },
          { path: '/community', element: <CommunityPage /> },
          { path: '/support', element: <SupportPage /> },
          { path: '/pricing', element: <PricingPage /> },
          { path: '/interests', element: <InterestsPage /> },
        ],
      },
    ],
  },
  // Ruta pública (sin layout) — los proveedores de pago redirigen acá tras
  // completar la compra. La sesión puede haber expirado durante el roundtrip,
  // por eso no la protegemos: el componente decide qué mostrar según haya
  // o no usuario logueado.
  { path: '/payment/result', element: <PaymentResultPage /> },
  {
    element: <AdminRoute />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { path: '/admin', element: <AdminDashboardPage /> },
          { path: '/admin/courses', element: <AdminCoursesPage /> },
          { path: '/admin/courses/:id/edit', element: <AdminCourseEditPage /> },
          { path: '/admin/categories', element: <AdminCategoriesPage /> },
          { path: '/admin/plans', element: <AdminPlansPage /> },
          { path: '/admin/discounts', element: <AdminDiscountsPage /> },
          { path: '/admin/users', element: <AdminUsersPage /> },
          { path: '/admin/payments', element: <AdminPaymentsPage /> },
          { path: '/admin/taxes', element: <AdminTaxesPage /> },
          { path: '/admin/settings', element: <AdminSettingsPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
