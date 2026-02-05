import { useState } from 'react';
import { Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerClose,
} from '@/components/ui/drawer';
import { useIsMobile } from '@/hooks/use-mobile';
import { useBuildings } from '@/hooks/useBuildings';
import { useToast } from '@/hooks/use-toast';
import { METER_TYPE_UNITS, MeterType } from '@/types/database';

interface AddReadingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meterId: string;
  meterType: MeterType;
  existingDates?: string[];
}

export function AddReadingDialog({
  open,
  onOpenChange,
  meterId,
  meterType,
  existingDates = [],
}: AddReadingDialogProps) {
  const isMobile = useIsMobile();
  const { createReading } = useBuildings();
  const { toast } = useToast();

  const [readingValue, setReadingValue] = useState('');
  const [readingDate, setReadingDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isDuplicate = existingDates.includes(readingDate);

  const handleSubmit = async () => {
    if (!readingValue.trim()) return;

    const value = parseFloat(readingValue.replace(',', '.'));
    if (isNaN(value)) {
      toast({
        variant: 'destructive',
        title: 'Ungültiger Wert',
        description: 'Bitte geben Sie eine gültige Zahl ein.',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await createReading.mutateAsync({
        meter_id: meterId,
        reading_value: value,
        reading_date: readingDate,
        source: 'manual',
      });

      toast({
        title: 'Ablesung hinzugefügt',
        description: 'Der Zählerstand wurde erfolgreich gespeichert.',
      });

      onOpenChange(false);
      setReadingValue('');
      setReadingDate(new Date().toISOString().split('T')[0]);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Fehler',
        description: 'Der Zählerstand konnte nicht gespeichert werden.',
      });
    }

    setIsSubmitting(false);
  };

  const FormContent = (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="readingDate">Datum</Label>
        <Input
          id="readingDate"
          type="date"
          value={readingDate}
          onChange={(e) => setReadingDate(e.target.value)}
        />
        {isDuplicate && (
          <p className="text-sm text-amber-600">
            ⚠️ Es existiert bereits eine Ablesung für dieses Datum. Diese wird überschrieben.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="readingValue">
          Zählerstand ({METER_TYPE_UNITS[meterType]})
        </Label>
        <Input
          id="readingValue"
          type="text"
          inputMode="decimal"
          placeholder="z.B. 12345,67"
          value={readingValue}
          onChange={(e) => setReadingValue(e.target.value)}
        />
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Ablesung hinzufügen</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-4">{FormContent}</div>
          <DrawerFooter>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !readingValue.trim()}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Speichern...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Hinzufügen
                </>
              )}
            </Button>
            <DrawerClose asChild>
              <Button variant="outline">Abbrechen</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ablesung hinzufügen</DialogTitle>
        </DialogHeader>
        <div className="py-4">{FormContent}</div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !readingValue.trim()}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Speichern...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Hinzufügen
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
