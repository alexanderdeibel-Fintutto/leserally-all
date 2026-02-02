import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Plus } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useBuildings } from '@/hooks/useBuildings';
import { useToast } from '@/hooks/use-toast';

export default function BuildingNew() {
  const navigate = useNavigate();
  const { createBuilding, createUnit } = useBuildings();
  const { toast } = useToast();
  
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [unitNumber, setUnitNumber] = useState('');
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
      // Create building
      const newBuilding = await createBuilding.mutateAsync({ 
        name: name.trim(), 
        address: address.trim() || null,
        city: city.trim() || null,
        postal_code: postalCode.trim() || null,
        country: 'DE',
        total_units: 0,
        total_area: null,
        year_built: null,
      });
      
      // Create first unit if specified
      if (unitNumber.trim()) {
        await createUnit.mutateAsync({
          building_id: newBuilding.id,
          unit_number: unitNumber.trim(),
        });
      }
      
      toast({
        title: 'Gebäude erstellt',
        description: 'Das Gebäude wurde erfolgreich angelegt.',
      });
      
      navigate('/');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Fehler',
        description: 'Das Gebäude konnte nicht erstellt werden.',
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
          <CardTitle>Neues Gebäude anlegen</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Gebäudename *</Label>
              <Input
                id="name"
                placeholder="z.B. Hauptstraße 1"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Straße & Hausnummer</Label>
              <Input
                id="address"
                placeholder="z.B. Hauptstraße 1"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="postalCode">PLZ</Label>
                <Input
                  id="postalCode"
                  placeholder="z.B. 12345"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">Stadt</Label>
                <Input
                  id="city"
                  placeholder="z.B. Berlin"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>
            </div>

            <div className="border-t pt-4 mt-4">
              <Label htmlFor="unitNumber">Erste Einheit (optional)</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Legen Sie direkt die erste Wohneinheit an
              </p>
              <Input
                id="unitNumber"
                placeholder="z.B. Wohnung 1 oder EG links"
                value={unitNumber}
                onChange={(e) => setUnitNumber(e.target.value)}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Erstellen...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Gebäude erstellen
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
