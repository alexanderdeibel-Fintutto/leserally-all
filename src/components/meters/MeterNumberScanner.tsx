import { useState } from 'react';
import { Camera, FileText, Loader2, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface MeterNumberScannerProps {
  onNumberDetected: (meterNumber: string) => void;
  disabled?: boolean;
}

export function MeterNumberScanner({ onNumberDetected, disabled }: MeterNumberScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<{ meterNumber: string; confidence: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const processFile = async (file: File) => {
    setScanning(true);
    setError(null);
    setResult(null);

    try {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        throw new Error('Nur JPEG, PNG, WebP und PDF werden unterstützt');
      }

      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('Datei zu groß. Maximum 10MB.');
      }

      // Convert to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Show preview for images
      if (file.type.startsWith('image/')) {
        setPreview(base64);
      } else {
        setPreview(null);
      }

      // Call edge function
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

      const data = response.data;

      if (data.meterNumber) {
        setResult({ meterNumber: data.meterNumber, confidence: data.confidence });
        onNumberDetected(data.meterNumber);
        toast({
          title: 'Zählernummer erkannt',
          description: `Erkannte Nummer: ${data.meterNumber} (${data.confidence}% Konfidenz)`,
        });
      } else {
        setError(data.error || 'Keine Zählernummer gefunden');
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
    // Reset input
    e.target.value = '';
  };

  const clearPreview = () => {
    setPreview(null);
    setResult(null);
    setError(null);
  };

  const cameraInputId = `camera-input-${Math.random().toString(36).substr(2, 9)}`;
  const fileInputId = `file-input-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {/* Camera button using label for better mobile support */}
        <label
          htmlFor={cameraInputId}
          className={cn(
            "flex-1 inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors",
            "border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3",
            "cursor-pointer select-none",
            (disabled || scanning) && "pointer-events-none opacity-50"
          )}
        >
          {scanning ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Camera className="w-4 h-4" />
          )}
          Foto
        </label>
        
        {/* Document button using label */}
        <label
          htmlFor={fileInputId}
          className={cn(
            "flex-1 inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors",
            "border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3",
            "cursor-pointer select-none",
            (disabled || scanning) && "pointer-events-none opacity-50"
          )}
        >
          {scanning ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <FileText className="w-4 h-4" />
          )}
          Dokument
        </label>
      </div>

      {/* File inputs - using label association for better mobile compatibility */}
      <input
        id={cameraInputId}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="sr-only"
        disabled={disabled || scanning}
      />
      <input
        id={fileInputId}
        type="file"
        accept="image/*,application/pdf"
        onChange={handleFileChange}
        className="sr-only"
        disabled={disabled || scanning}
      />

      {/* Preview and results */}
      <AnimatePresence>
        {(preview || result || error || scanning) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className={cn(
              "relative rounded-lg border p-3",
              result && "border-success/50 bg-success/5",
              error && "border-destructive/50 bg-destructive/5",
              scanning && "border-primary/50 bg-primary/5"
            )}>
              {preview && (
                <div className="relative mb-3">
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

              {result && (
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                  <div>
                    <span className="font-medium text-success">Erkannt: </span>
                    <span className="font-mono">{result.meterNumber}</span>
                    <span className="text-muted-foreground ml-2">
                      ({result.confidence}% sicher)
                    </span>
                  </div>
                </div>
              )}

              {error && !scanning && (
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
        Fotografieren Sie den Zähler oder laden Sie ein Dokument mit der Zählernummer hoch.
      </p>
    </div>
  );
}
