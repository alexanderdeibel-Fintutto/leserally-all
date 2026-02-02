import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Camera, Loader2, Building } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { UnitCard } from '@/components/dashboard/UnitCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useBuildings } from '@/hooks/useBuildings';
import { useProfile } from '@/hooks/useProfile';
import { useOrganization } from '@/hooks/useOrganization';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

export default function Dashboard() {
  const navigate = useNavigate();
  const { buildings, isLoading } = useBuildings();
  const { profile, isLoading: profileLoading } = useProfile();
  const { createOrganization } = useOrganization();
  
  const [showSetupDialog, setShowSetupDialog] = useState(false);
  const [orgName, setOrgName] = useState('');
  const [creatingOrg, setCreatingOrg] = useState(false);

  // Flatten all units across buildings
  const allUnits = buildings.flatMap(b => b.units);

  const handleAddReading = (meterId: string) => {
    navigate(`/read?meter=${meterId}`);
  };

  const handleCreateOrg = async () => {
    if (!orgName.trim()) return;
    
    setCreatingOrg(true);
    try {
      await createOrganization.mutateAsync({ name: orgName.trim() });
      setShowSetupDialog(false);
      setOrgName('');
    } catch (error) {
      console.error('Error creating org:', error);
    }
    setCreatingOrg(false);
  };

  // Loading state
  if (isLoading || profileLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  // No organization yet - prompt setup
  if (!profile?.organization_id) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-2xl bg-accent mx-auto mb-4 flex items-center justify-center">
            <Building className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold mb-2">Willkommen!</h2>
          <p className="text-muted-foreground mb-4">
            Erstellen Sie zuerst Ihre Organisation, um Immobilien zu verwalten.
          </p>
          <Button onClick={() => setShowSetupDialog(true)}>
            Organisation erstellen
          </Button>
        </div>

        <Dialog open={showSetupDialog} onOpenChange={setShowSetupDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Organisation erstellen</DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="orgName">Name der Organisation</Label>
                <Input
                  id="orgName"
                  placeholder="z.B. Meine Hausverwaltung"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSetupDialog(false)}>
                Abbrechen
              </Button>
              <Button onClick={handleCreateOrg} disabled={creatingOrg || !orgName.trim()}>
                {creatingOrg ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Erstellen...
                  </>
                ) : (
                  'Erstellen'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {/* Quick Actions */}
      <div className="flex gap-3 mb-6">
        <Button 
          className="flex-1 gradient-primary text-primary-foreground"
          onClick={() => navigate('/read')}
        >
          <Camera className="w-5 h-5 mr-2" />
          Zähler ablesen
        </Button>
        <Button 
          variant="outline"
          onClick={() => navigate('/buildings/new')}
        >
          <Plus className="w-5 h-5" />
        </Button>
      </div>

      {/* Units from all buildings */}
      {allUnits.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-2xl bg-accent mx-auto mb-4 flex items-center justify-center">
            <Plus className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold mb-2">Keine Einheiten</h2>
          <p className="text-muted-foreground mb-4">
            Legen Sie zuerst ein Gebäude an, um Einheiten zu verwalten.
          </p>
          <Button onClick={() => navigate('/buildings/new')}>
            <Plus className="w-4 h-4 mr-2" />
            Gebäude anlegen
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {allUnits.map((unit) => (
            <UnitCard 
              key={unit.id} 
              unit={unit} 
              onAddReading={handleAddReading}
            />
          ))}
        </div>
      )}
    </AppLayout>
  );
}
