import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Plus, Building2, Hash } from 'lucide-react';
import { motion } from 'framer-motion';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useBuildings } from '@/hooks/useBuildings';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import { AddressAutocomplete, AddressData } from '@/components/address/AddressAutocomplete';

export default function BuildingNew() {
  const navigate = useNavigate();
  const { createBuilding, createUnit } = useBuildings();
  const { profile, isLoading: profileLoading, isVermieter } = useProfile();
  const { toast } = useToast();
  
  const [name, setName] = useState('');
  const [addressData, setAddressData] = useState<AddressData | null>(null);
  const [unitNumber, setUnitNumber] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if no organization or no permission
  useEffect(() => {
    if (!profileLoading && profile) {
      if (!profile.organization_id) {
        toast({
          variant: 'destructive',
          title: 'Organisation erforderlich',
          description: 'Bitte erstellen Sie zuerst eine Organisation.',
        });
        navigate('/');
      } else if (!isVermieter) {
        toast({
          variant: 'destructive',
          title: 'Keine Berechtigung',
          description: 'Sie haben keine Berechtigung, Gebäude zu erstellen.',
        });
        navigate('/');
      }
    }
  }, [profile, profileLoading, isVermieter, navigate, toast]);

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

    if (!addressData) {
      toast({
        variant: 'destructive',
        title: 'Adresse erforderlich',
        description: 'Bitte wählen Sie eine gültige Adresse aus der Vorschlagsliste.',
      });
      return;
    }

    setLoading(true);
    
    try {
      // Create building with validated Google address
      const fullAddress = addressData.streetNumber 
        ? `${addressData.street} ${addressData.streetNumber}`
        : addressData.street;

      const newBuilding = await createBuilding.mutateAsync({ 
        name: name.trim(), 
        address: fullAddress,
        city: addressData.city,
        postal_code: addressData.postalCode,
        country: addressData.country || 'DE',
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
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <Button
          variant="ghost"
          className="mb-4 -ml-2 rounded-xl hover:bg-accent/80"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Zurück
        </Button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="glass-card border-0 overflow-hidden">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shadow-glow"
              >
                <Building2 className="w-6 h-6 text-primary-foreground" />
              </motion.div>
              <CardTitle className="text-xl">Neues Gebäude anlegen</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="space-y-2"
              >
                <Label htmlFor="name" className="text-sm font-medium">
                  Gebäudename *
                </Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="name"
                    placeholder="z.B. Hauptstraße 1"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-11 h-12 rounded-xl border-border/50 bg-background/50 focus:bg-background transition-all"
                    required
                  />
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <AddressAutocomplete
                  onAddressSelect={setAddressData}
                  required
                />
                {addressData && (
                  <div className="mt-3 p-3 rounded-xl bg-muted/50 text-sm space-y-1">
                    <p className="font-medium text-foreground">{addressData.formattedAddress}</p>
                    <p className="text-muted-foreground text-xs">
                      {addressData.postalCode} {addressData.city}, {addressData.country}
                    </p>
                  </div>
                )}
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="border-t border-border/50 pt-5 mt-5"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Hash className="w-4 h-4 text-primary" />
                  <Label htmlFor="unitNumber" className="text-sm font-medium">
                    Erste Einheit (optional)
                  </Label>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Legen Sie direkt die erste Wohneinheit an
                </p>
                <Input
                  id="unitNumber"
                  placeholder="z.B. Wohnung 1 oder EG links"
                  value={unitNumber}
                  onChange={(e) => setUnitNumber(e.target.value)}
                  className="h-12 rounded-xl border-border/50 bg-background/50 focus:bg-background transition-all"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button 
                  type="submit" 
                  className="w-full h-12 gradient-primary text-primary-foreground font-semibold rounded-xl shadow-glow text-base" 
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Erstellen...
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5 mr-2" />
                      Gebäude erstellen
                    </>
                  )}
                </Button>
              </motion.div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </AppLayout>
  );
}
