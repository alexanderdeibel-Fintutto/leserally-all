import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Camera, Loader2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { UnitCard } from '@/components/dashboard/UnitCard';
import { Button } from '@/components/ui/button';
import { useUnits } from '@/hooks/useUnits';

export default function Dashboard() {
  const navigate = useNavigate();
  const { units, isLoading } = useUnits();

  const handleAddReading = (meterId: string) => {
    navigate(`/read?meter=${meterId}`);
  };

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
          onClick={() => navigate('/units/new')}
        >
          <Plus className="w-5 h-5" />
        </Button>
      </div>

      {/* Units */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : units.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-2xl bg-accent mx-auto mb-4 flex items-center justify-center">
            <Plus className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold mb-2">Keine Einheiten</h2>
          <p className="text-muted-foreground mb-4">
            Legen Sie Ihre erste Einheit an, um Zähler zu verwalten.
          </p>
          <Button onClick={() => navigate('/units/new')}>
            <Plus className="w-4 h-4 mr-2" />
            Einheit anlegen
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {units.map((unit) => (
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
