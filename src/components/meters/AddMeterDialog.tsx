import { useState } from 'react';
import { Loader2, CheckCircle2 } from 'lucide-react';
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
import { MeterNumberScanner, DetectedReading } from './MeterNumberScanner';

interface AddMeterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  buildingId: string;
}

export function AddMeterDialog({ open, onOpenChange, buildingId }: AddMeterDialogProps) {
  const { createMeter, createReading } = useBuildings();
  const { toast } = useToast();
  
  const [meterNumber, setMeterNumber] = useState('');
  const [meterType, setMeterType] = useState<MeterType>('electricity');
  const [loading, setLoading] = useState(false);
  const [detectedReadings, setDetectedReadings] = useState<DetectedReading[]>([]);
  const [importingReadings, setImportingReadings] = useState(false);
  const [importDone, setImportDone] = useState(false);

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
      const newMeter = await createMeter.mutateAsync({
        building_id: buildingId,
        meter_number: meterNumber.trim(),
        meter_type: meterType,
      });

      // If readings were detected, import them automatically
      if (detectedReadings.length > 0 && newMeter?.id) {
        setImportingReadings(true);
        let imported = 0;
        let skipped = 0;

        for (const reading of detectedReadings) {
          try {
            await createReading.mutateAsync({
              meter_id: newMeter.id,
              reading_value: reading.value,
              reading_date: reading.date,
              source: 'ocr',
            });
            imported++;
          } catch (err) {
            console.warn('Skipped reading:', reading, err);
            skipped++;
          }
        }

        setImportingReadings(false);
        setImportDone(true);

        toast({
          title: 'Zähler angelegt & Daten importiert',
          description: `Zähler "${meterNumber}" erstellt. ${imported} Zählerständ${imported === 1 ? '' : 'e'} importiert${skipped > 0 ? `, ${skipped} übersprungen` : ''}.`,
        });
      } else {
        toast({
          title: 'Zähler angelegt',
          description: `Zähler "${meterNumber}" wurde erfolgreich erstellt.`,
        });
      }
      
      resetAndClose();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Fehler',
        description: 'Der Zähler konnte nicht angelegt werden.',
      });
    }
    setLoading(false);
  };

  const resetAndClose = () => {
    setMeterNumber('');
    setMeterType('electricity');
    setDetectedReadings([]);
    setImportDone(false);
    setImportingReadings(false);
    onOpenChange(false);
  };

  const handleScanComplete = (scannedNumber: string) => {
    setMeterNumber(scannedNumber);
  };

  const handleReadingsDetected = (readings: DetectedReading[], meterName: string | null) => {
    setDetectedReadings(readings);
    // Try to auto-detect meter type from name
    if (meterName) {
      const nameLower = meterName.toLowerCase();
      if (/wasser|water/.test(nameLower)) {
        if (/warm|hot/.test(nameLower)) {
          setMeterType('water_hot');
        } else {
          setMeterType('water_cold');
        }
      } else if (/strom|electri|kwh/.test(nameLower)) {
        setMeterType('electricity');
      } else if (/gas/.test(nameLower)) {
        setMeterType('gas');
      } else if (/heiz|heat/.test(nameLower)) {
        setMeterType('heating');
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetAndClose(); else onOpenChange(v); }}>
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
            <Input
              id="meterNumber"
              placeholder="z.B. 12345678"
              value={meterNumber}
              onChange={(e) => setMeterNumber(e.target.value)}
            />
          </div>

          {/* Scanner section */}
          <div className="space-y-2">
            <Label className="text-muted-foreground">Oder per Dokument/Foto erkennen</Label>
            <MeterNumberScanner
              onNumberDetected={handleScanComplete}
              onReadingsDetected={handleReadingsDetected}
            />
          </div>

          {/* Show detected readings summary */}
          {detectedReadings.length > 0 && (
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
              <div className="flex items-center gap-2 text-sm font-medium text-primary">
                <CheckCircle2 className="w-4 h-4" />
                {detectedReadings.length} Zählerstände erkannt
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Diese werden nach dem Anlegen des Zählers automatisch importiert.
              </p>
              <div className="mt-2 max-h-24 overflow-y-auto space-y-1">
                {detectedReadings.slice(0, 5).map((r, i) => (
                  <div key={i} className="text-xs text-muted-foreground flex justify-between font-mono">
                    <span>{r.date}</span>
                    <span>{r.value.toLocaleString('de-DE')}</span>
                  </div>
                ))}
                {detectedReadings.length > 5 && (
                  <p className="text-xs text-muted-foreground italic">
                    ... und {detectedReadings.length - 5} weitere
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={resetAndClose}
              className="flex-1"
            >
              Abbrechen
            </Button>
            <Button
              type="submit"
              disabled={loading || importingReadings}
              className="flex-1 gradient-primary text-primary-foreground"
            >
              {importingReadings ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Importiere...
                </>
              ) : loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Speichern...
                </>
              ) : detectedReadings.length > 0 ? (
                'Anlegen & Importieren'
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
