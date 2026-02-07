import { useState, useRef } from 'react';
import { Camera, FileText, Loader2, CheckCircle2, AlertCircle, X, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export interface DetectedReading {
  date: string;
  value: number;
}

interface ScanResult {
  meterNumber: string | null;
  confidence: number;
  readings: DetectedReading[];
  meterName: string | null;
}

interface MeterNumberScannerProps {
  onNumberDetected: (meterNumber: string) => void;
  onReadingsDetected?: (readings: DetectedReading[], meterName: string | null) => void;
  disabled?: boolean;
}

export function MeterNumberScanner({ onNumberDetected, onReadingsDetected, disabled }: MeterNumberScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    setScanning(true);
    setError(null);
    setResult(null);

    try {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        throw new Error('Nur JPEG, PNG, WebP und PDF werden unterstützt');
      }

      if (file.size > 10 * 1024 * 1024) {
        throw new Error('Datei zu groß. Maximum 10MB.');
      }

      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      if (file.type.startsWith('image/')) {
        setPreview(base64);
      } else {
        setPreview(null);
      }

      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        throw new Error('Nicht angemeldet');
      }

      const response = await supabase.functions.invoke('ocr-meter-number', {
        body: { file: base64, fileType: file.type },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Verarbeitung fehlgeschlagen');
      }

      const data = response.data as ScanResult;

      setResult(data);

      if (data.meterNumber) {
        onNumberDetected(data.meterNumber);
        toast({
          title: 'Zählernummer erkannt',
          description: `Erkannte Nummer: ${data.meterNumber} (${data.confidence}% Konfidenz)`,
        });
      }

      // Notify about detected readings regardless of meter number
      if (data.readings?.length > 0 && onReadingsDetected) {
        onReadingsDetected(data.readings, data.meterName);
      }

      if (!data.meterNumber && (!data.readings || data.readings.length === 0)) {
        setError('Keine Zählernummer und keine Zählerstände gefunden.');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Verarbeitung fehlgeschlagen';
      setError(message);
      toast({
        variant: 'destructive',
        title: 'Fehler',
        description: message,
      });
    } finally {
      setScanning(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    e.target.value = '';
  };

  const openCamera = () => cameraInputRef.current?.click();
  const openFilePicker = () => fileInputRef.current?.click();

  const clearPreview = () => {
    setPreview(null);
    setResult(null);
    setError(null);
  };

  const hasReadingsOnly = result && !result.meterNumber && result.readings?.length > 0;
  const hasNumberAndReadings = result && result.meterNumber && result.readings?.length > 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          disabled={disabled || scanning}
          onClick={openCamera}
        >
          {scanning ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Camera className="w-4 h-4 mr-2" />
          )}
          Foto
        </Button>
        
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          disabled={disabled || scanning}
          onClick={openFilePicker}
        >
          {scanning ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <FileText className="w-4 h-4 mr-2" />
          )}
          Dokument
        </Button>
      </div>

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        style={{ display: 'none' }}
        disabled={disabled || scanning}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        onChange={handleFileChange}
        style={{ display: 'none' }}
        disabled={disabled || scanning}
      />

      <AnimatePresence>
        {(preview || result || error || scanning) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className={cn(
              "relative rounded-lg border p-3 space-y-2",
              result?.meterNumber && "border-success/50 bg-success/5",
              hasReadingsOnly && "border-primary/50 bg-primary/5",
              error && !hasReadingsOnly && "border-destructive/50 bg-destructive/5",
              scanning && "border-primary/50 bg-primary/5"
            )}>
              {preview && (
                <div className="relative mb-2">
                  <img
                    src={preview}
                    alt="Vorschau"
                    className="w-full h-32 object-cover rounded"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 bg-background/80 hover:bg-background"
                    onClick={clearPreview}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              )}

              {scanning && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Analysiere Dokument...</span>
                </div>
              )}

              {result?.meterNumber && (
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                  <div>
                    <span className="font-medium text-success">Zählernummer erkannt: </span>
                    <span className="font-mono">{result.meterNumber}</span>
                    <span className="text-muted-foreground ml-2">
                      ({result.confidence}% sicher)
                    </span>
                  </div>
                </div>
              )}

              {/* Readings detected message */}
              {hasReadingsOnly && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    <FileSpreadsheet className="w-4 h-4 text-primary shrink-0" />
                    <div>
                      <span className="font-medium text-primary">
                        {result.readings.length} Zählerstände erkannt
                      </span>
                      {result.meterName && (
                        <span className="text-muted-foreground ml-1">
                          ({result.meterName})
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground pl-6">
                    Keine Zählernummer gefunden. Bitte geben Sie die Zählernummer manuell ein – 
                    die erkannten Zählerstände werden nach dem Anlegen automatisch importiert.
                  </p>
                </div>
              )}

              {hasNumberAndReadings && (
                <div className="flex items-center gap-2 text-sm">
                  <FileSpreadsheet className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-primary font-medium">
                    + {result.readings.length} Zählerstände erkannt (werden importiert)
                  </span>
                </div>
              )}

              {error && !scanning && !hasReadingsOnly && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <p className="text-xs text-muted-foreground">
        Fotografieren Sie den Zähler oder laden Sie ein Dokument hoch – Zählernummer und Zählerstände werden automatisch erkannt.
      </p>
    </div>
  );
}
