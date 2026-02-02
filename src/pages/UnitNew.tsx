import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUnits } from '@/hooks/useUnits';
import { useToast } from '@/hooks/use-toast';

export default function UnitNew() {
  const navigate = useNavigate();
  const { createUnit } = useUnits();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        variant: 'destructive',
        title: 'Fehler',
        description: 'Bitte geben Sie einen Namen ein.',
      });
      return;
    }

    setLoading(true);
    
    try {
      const newUnit = await createUnit.mutateAsync({ 
        name: name.trim(), 
        address: address.trim() || undefined 
      });
      
      toast({
        title: 'Einheit erstellt',
        description: 'Die Einheit wurde erfolgreich angelegt.',
      });
      
      navigate(`/units/${newUnit.id}`);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Fehler',
        description: 'Die Einheit konnte nicht erstellt werden.',
      });
    }
    
    setLoading(false);
  };

  return (
    <AppLayout>
      <Button
        variant="ghost"
        className="mb-4 -ml-2"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Zurück
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Neue Einheit anlegen</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                placeholder="z.B. Meine Wohnung"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Adresse (optional)</Label>
              <Input
                id="address"
                placeholder="z.B. Musterstraße 1, 12345 Berlin"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Erstellen...
                </>
              ) : (
                'Einheit erstellen'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
