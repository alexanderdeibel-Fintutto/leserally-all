import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Camera, Settings, LogOut, Zap, Building2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  showBack?: boolean;
}

const navItems = [
  { href: '/', icon: Home, label: 'Dashboard' },
  { href: '/read', icon: Camera, label: 'Ablesen' },
  { href: '/units', icon: Building2, label: 'Einheiten' },
];

export function AppLayout({ children, title, showBack }: AppLayoutProps) {
  const location = useLocation();
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-foreground">Fintutto</span>
          </Link>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => signOut()}
            className="text-muted-foreground hover:text-foreground"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pb-20">
        <div className="max-w-lg mx-auto px-4 py-4">
          {title && (
            <h1 className="text-2xl font-bold text-foreground mb-4">{title}</h1>
          )}
          {children}
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border safe-area-pb">
        <div className="max-w-lg mx-auto flex justify-around py-2">
          {navItems.map(({ href, icon: Icon, label }) => {
            const isActive = location.pathname === href;
            return (
              <Link
                key={href}
                to={href}
                className={cn(
                  'flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors',
                  isActive 
                    ? 'text-primary' 
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="w-6 h-6" />
                <span className="text-xs font-medium">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
