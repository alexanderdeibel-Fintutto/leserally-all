import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Loader2, ChevronRight } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MeterIcon } from '@/components/meters/MeterIcon';
import { useBuildings } from '@/hooks/useBuildings';
import { useToast } from '@/hooks/use-toast';
import { METER_TYPE_LABELS, METER_TYPE_UNITS, MeterType } from '@/types/database';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export default function UnitDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { buildings, isLoading, createMeter, deleteMeter } = useBuildings();
  const { toast } = useToast();
  
  const [showAddMeter, setShowAddMeter] = useState(false);
  const [meterNumber, setMeterNumber] = useState('');
  const [meterType, setMeterType] = useState<MeterType>('electricity');
  const [addingMeter, setAddingMeter] = useState(false);
  const [deleteMeterId, setDeleteMeterId] = useState<string | null>(null);

  // Find unit across all buildings
  const allUnits = buildings.flatMap(b => b.units);
  const unit = allUnits.find(u => u.id === id);

  const handleAddMeter = async () => {
    if (!meterNumber.trim() || !id) return;
    
    setAddingMeter(true);
    
    try {
      await createMeter.mutateAsync({
        unit_id: id,
        meter_number: meterNumber.trim(),
        meter_type: meterType,
      });
      
      toast({
        title: 'Zähler hinzugefügt',
        description: 'Der Zähler wurde erfolgreich angelegt.',
      });
      
      setShowAddMeter(false);
      setMeterNumber('');
      setMeterType('electricity');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Fehler',
        description: 'Der Zähler konnte nicht erstellt werden.',
      });
    }
    
    setAddingMeter(false);
  };

  const handleDeleteMeter = async () => {
    if (!deleteMeterId) return;
    
    try {
      await deleteMeter.mutateAsync(deleteMeterId);
      toast({
        title: 'Zähler gelöscht',
        description: 'Der Zähler wurde erfolgreich gelöscht.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Fehler',
        description: 'Der Zähler konnte nicht gelöscht werden.',
      });
    }
    setDeleteMeterId(null);
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!unit) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Einheit nicht gefunden.</p>
          <Button variant="link" onClick={() => navigate('/units')}>
            Zurück zur Übersicht
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Button
        variant="ghost"
        className="mb-4 -ml-2"
        onClick={() => navigate('/units')}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Zurück
      </Button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold">{unit.unit_number}</h1>
        {unit.building && (
          <p className="text-muted-foreground">{unit.building.name} - {unit.building.address}</p>
        )}
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Zähler</h2>
        <Button size="sm" onClick={() => setShowAddMeter(true)}>
          <Plus className="w-4 h-4 mr-1" />
          Hinzufügen
        </Button>
      </div>

      {unit.meters.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground mb-4">
              Noch keine Zähler angelegt.
            </p>
            <Button onClick={() => setShowAddMeter(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Ersten Zähler hinzufügen
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {unit.meters.map((meter) => (
            <Card key={meter.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <Link 
                    to={`/meters/${meter.id}`}
                    className="flex items-center gap-3 flex-1"
                  >
                    <MeterIcon type={meter.meter_type} />
                    <div className="flex-1">
                      <p className="font-medium">
                        {METER_TYPE_LABELS[meter.meter_type]}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Nr. {meter.meter_number}
                      </p>
                      {meter.lastReading && (
                        <p className="text-sm">
                          Letzter Stand: {meter.lastReading.reading_value.toLocaleString('de-DE')} {METER_TYPE_UNITS[meter.meter_type]}
                          <span className="text-muted-foreground ml-1">
                            ({format(new Date(meter.lastReading.reading_date), 'dd.MM.yyyy', { locale: de })})
                          </span>
                        </p>
                      )}
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive ml-2"
                    onClick={() => setDeleteMeterId(meter.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Meter Dialog */}
      <Dialog open={showAddMeter} onOpenChange={setShowAddMeter}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Zähler hinzufügen</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="meterType">Zählertyp</Label>
              <Select value={meterType} onValueChange={(v) => setMeterType(v as MeterType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(METER_TYPE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="meterNumber">Zählernummer</Label>
              <Input
                id="meterNumber"
                placeholder="z.B. 1234567890"
                value={meterNumber}
                onChange={(e) => setMeterNumber(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddMeter(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleAddMeter} disabled={addingMeter || !meterNumber.trim()}>
              {addingMeter ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Hinzufügen...
                </>
              ) : (
                'Hinzufügen'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Meter Confirmation */}
      <AlertDialog open={!!deleteMeterId} onOpenChange={() => setDeleteMeterId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Zähler löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Diese Aktion kann nicht rückgängig gemacht werden. Alle Ablesungen 
              dieses Zählers werden ebenfalls gelöscht.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteMeter}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
