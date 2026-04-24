import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { DemoProvider } from './contexts/DemoContext';
import { CartProvider } from './contexts/CartContext';
import { AppRouter } from './router';
import { DemoExpiredModal } from './components/demo/DemoExpiredModal';
import { CustomCursor } from './components/ui/CustomCursor';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DemoProvider>
          <CartProvider>
            <AppRouter />
            <DemoExpiredModal />
            <CustomCursor />
          </CartProvider>
        </DemoProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            className:
              'bg-white dark:bg-surface-900 text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-800',
          }}
        />
      </AuthProvider>
    </ThemeProvider>
  );
}
