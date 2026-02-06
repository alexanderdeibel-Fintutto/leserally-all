import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useBuildings } from '@/hooks/useBuildings';
import { useToast } from '@/hooks/use-toast';
import { MeterType, METER_TYPE_LABELS } from '@/types/database';
import { MeterNumberScanner } from './MeterNumberScanner';

interface AddMeterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  buildingId: string;
}

export function AddMeterDialog({ open, onOpenChange, buildingId }: AddMeterDialogProps) {
  const { createMeter } = useBuildings();
  const { toast } = useToast();
  
  const [meterNumber, setMeterNumber] = useState('');
  const [meterType, setMeterType] = useState<MeterType>('electricity');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!meterNumber.trim()) {
      toast({
        variant: 'destructive',
        title: 'Fehler',
        description: 'Bitte geben Sie eine Zählernummer ein.',
      });
      return;
    }

    setLoading(true);
    try {
      await createMeter.mutateAsync({
        building_id: buildingId,
        meter_number: meterNumber.trim(),
        meter_type: meterType,
      });
      
      toast({
        title: 'Zähler angelegt',
        description: `Zähler "${meterNumber}" wurde erfolgreich erstellt.`,
      });
      
      setMeterNumber('');
      setMeterType('electricity');
      onOpenChange(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Fehler',
        description: 'Der Zähler konnte nicht angelegt werden.',
      });
    }
    setLoading(false);
  };

  const handleScanComplete = (scannedNumber: string) => {
    setMeterNumber(scannedNumber);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Neuen Zähler anlegen</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="meterType">Zählertyp</Label>
            <Select value={meterType} onValueChange={(v) => setMeterType(v as MeterType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(METER_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="meterNumber">Zählernummer</Label>
            <div className="flex gap-2">
              <Input
                id="meterNumber"
                placeholder="z.B. 12345678"
                value={meterNumber}
                onChange={(e) => setMeterNumber(e.target.value)}
                className="flex-1"
              />
              <MeterNumberScanner onNumberDetected={handleScanComplete} />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Abbrechen
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 gradient-primary text-primary-foreground"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Speichern...
                </>
              ) : (
                'Zähler anlegen'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
