import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, Lock, CheckCircle } from 'lucide-react';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { signUp } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Fehler',
        description: 'Die Passwörter stimmen nicht überein.',
      });
      return;
    }

    if (password.length < 6) {
      toast({
        variant: 'destructive',
        title: 'Fehler',
        description: 'Das Passwort muss mindestens 6 Zeichen lang sein.',
      });
      return;
    }

    setLoading(true);

    const { error } = await signUp(email, password);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Registrierung fehlgeschlagen',
        description: error.message,
      });
    } else {
      setSuccess(true);
    }

    setLoading(false);
  };

  if (success) {
    return (
      <AuthLayout title="E-Mail bestätigen" subtitle="">
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-accent flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-primary" />
          </div>
          <p className="text-muted-foreground">
            Wir haben Ihnen eine E-Mail an <strong>{email}</strong> gesendet.
            Bitte klicken Sie auf den Link in der E-Mail, um Ihr Konto zu aktivieren.
          </p>
          <Link to="/login">
            <Button variant="outline" className="w-full mt-4">
              Zurück zur Anmeldung
            </Button>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Konto erstellen" subtitle="Registrieren Sie sich kostenlos">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">E-Mail</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="ihre@email.de"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Passwort</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="password"
              type="password"
              placeholder="Mindestens 6 Zeichen"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Passwort bestätigen</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Passwort wiederholen"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="pl-10"
              required
            />
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Registrieren...
            </>
          ) : (
            'Registrieren'
          )}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Bereits ein Konto?{' '}
          <Link to="/login" className="text-primary hover:underline font-medium">
            Jetzt anmelden
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
