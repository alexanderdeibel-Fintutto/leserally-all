import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Camera, Upload, ArrowLeft, Loader2, Check, Edit, X } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { MeterIcon } from '@/components/meters/MeterIcon';
import { useUnits } from '@/hooks/useUnits';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { METER_TYPE_LABELS, METER_TYPE_UNITS, MeterType, MeterWithReadings, UnitWithMeters } from '@/types/database';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type Step = 'select' | 'capture' | 'processing' | 'confirm' | 'success';

export default function ReadMeter() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { units, isLoading, createReading } = useUnits();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [step, setStep] = useState<Step>('select');
  const [selectedUnitId, setSelectedUnitId] = useState<string>('');
  const [selectedMeterId, setSelectedMeterId] = useState<string>(searchParams.get('meter') || '');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [ocrResult, setOcrResult] = useState<{ value: number; confidence: number } | null>(null);
  const [editedValue, setEditedValue] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [saving, setSaving] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Set selected unit based on meter
  useEffect(() => {
    if (selectedMeterId && units.length > 0) {
      const unit = units.find(u => u.meters.some(m => m.id === selectedMeterId));
      if (unit) {
        setSelectedUnitId(unit.id);
      }
    }
  }, [selectedMeterId, units]);

  // Cleanup camera stream
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const selectedUnit = units.find(u => u.id === selectedUnitId);
  const selectedMeter = selectedUnit?.meters.find(m => m.id === selectedMeterId);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setShowCamera(true);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Kamera-Fehler',
        description: 'Die Kamera konnte nicht gestartet werden.',
      });
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'meter-photo.jpg', { type: 'image/jpeg' });
          setImageFile(file);
          setImagePreview(URL.createObjectURL(blob));
          stopCamera();
          processImage(file);
        }
      }, 'image/jpeg', 0.9);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      processImage(file);
    }
  };

  const processImage = async (file: File) => {
    setStep('processing');
    setProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress(p => Math.min(p + 10, 90));
    }, 200);

    try {
      // Convert file to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Call OCR edge function
      const { data, error } = await supabase.functions.invoke('ocr-meter', {
        body: { 
          image: base64,
          meterType: selectedMeter?.meter_type 
        },
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (error) throw error;

      if (data?.value !== undefined) {
        setOcrResult({
          value: data.value,
          confidence: data.confidence || 85,
        });
        setEditedValue(data.value.toString());
        setStep('confirm');
      } else {
        throw new Error('Kein Wert erkannt');
      }
    } catch (error) {
      clearInterval(progressInterval);
      toast({
        variant: 'destructive',
        title: 'OCR-Fehler',
        description: 'Der Zählerstand konnte nicht erkannt werden. Bitte manuell eingeben.',
      });
      setOcrResult(null);
      setEditedValue('');
      setIsEditing(true);
      setStep('confirm');
    }
  };

  const handleSave = async () => {
    if (!selectedMeterId || !editedValue || !user) return;
    
    const value = parseFloat(editedValue.replace(',', '.'));
    if (isNaN(value)) {
      toast({
        variant: 'destructive',
        title: 'Fehler',
        description: 'Bitte geben Sie einen gültigen Wert ein.',
      });
      return;
    }

    setSaving(true);

    try {
      let imageUrl: string | undefined;

      // Upload image if available
      if (imageFile) {
        const fileName = `${user.id}/${selectedMeterId}/${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from('meter-photos')
          .upload(fileName, imageFile);

        if (!uploadError) {
          const { data } = supabase.storage
            .from('meter-photos')
            .getPublicUrl(fileName);
          imageUrl = data.publicUrl;
        }
      }

      // Create reading
      await createReading.mutateAsync({
        meter_id: selectedMeterId,
        value,
        image_url: imageUrl,
        source: ocrResult ? 'ocr' : 'manual',
        confidence: ocrResult?.confidence,
      });

      setStep('success');
      
      setTimeout(() => {
        navigate(`/meters/${selectedMeterId}`);
      }, 2000);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Fehler',
        description: 'Die Ablesung konnte nicht gespeichert werden.',
      });
    }

    setSaving(false);
  };

  const canProceed = selectedUnitId && selectedMeterId;

  // Loading state
  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  // No units
  if (units.length === 0) {
    return (
      <AppLayout title="Zähler ablesen">
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            Bitte legen Sie zuerst eine Einheit und einen Zähler an.
          </p>
          <Button onClick={() => navigate('/units/new')}>
            Einheit anlegen
          </Button>
        </div>
      </AppLayout>
    );
  }

  // Camera view
  if (showCamera) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        <div className="p-4 flex justify-between items-center">
          <Button variant="ghost" size="icon" onClick={stopCamera} className="text-white">
            <X className="w-6 h-6" />
          </Button>
          <span className="text-white font-medium">
            Zähler fotografieren
          </span>
          <div className="w-10" />
        </div>

        <div className="flex-1 relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />
          
          {/* Viewfinder overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-64 h-24 border-2 border-primary rounded-lg animate-pulse-ring" />
          </div>
          
          <p className="absolute bottom-24 left-0 right-0 text-center text-white text-sm">
            Positionieren Sie die Zähleranzeige im Rahmen
          </p>
        </div>

        <div className="p-6 bg-black/50">
          <Button 
            size="lg" 
            className="w-full gradient-primary"
            onClick={capturePhoto}
          >
            <Camera className="w-5 h-5 mr-2" />
            Foto aufnehmen
          </Button>
        </div>

        <canvas ref={canvasRef} className="hidden" />
      </div>
    );
  }

  return (
    <AppLayout>
      <Button
        variant="ghost"
        className="mb-4 -ml-2"
        onClick={() => step === 'select' ? navigate(-1) : setStep('select')}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Zurück
      </Button>

      {/* Step: Select meter */}
      {step === 'select' && (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold mb-2">Zähler ablesen</h1>
            <p className="text-muted-foreground">
              Wählen Sie den Zähler aus, den Sie ablesen möchten.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Einheit</Label>
              <Select value={selectedUnitId} onValueChange={(v) => {
                setSelectedUnitId(v);
                setSelectedMeterId('');
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Einheit auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {units.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedUnit && (
              <div className="space-y-2">
                <Label>Zähler</Label>
                {selectedUnit.meters.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Diese Einheit hat noch keine Zähler.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {selectedUnit.meters.map((meter) => (
                      <Card 
                        key={meter.id}
                        className={`cursor-pointer transition-colors ${
                          selectedMeterId === meter.id 
                            ? 'ring-2 ring-primary' 
                            : 'hover:bg-accent/50'
                        }`}
                        onClick={() => setSelectedMeterId(meter.id)}
                      >
                        <CardContent className="p-3 flex items-center gap-3">
                          <MeterIcon type={meter.meter_type} size="sm" />
                          <div className="flex-1">
                            <p className="font-medium text-sm">
                              {METER_TYPE_LABELS[meter.meter_type]}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Nr. {meter.meter_number}
                            </p>
                          </div>
                          {selectedMeterId === meter.id && (
                            <Check className="w-5 h-5 text-primary" />
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {canProceed && (
            <div className="space-y-3">
              <Button 
                className="w-full gradient-primary"
                onClick={startCamera}
              >
                <Camera className="w-5 h-5 mr-2" />
                Foto aufnehmen
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-5 h-5 mr-2" />
                Aus Galerie wählen
              </Button>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>
          )}
        </div>
      )}

      {/* Step: Processing */}
      {step === 'processing' && (
        <div className="py-12 text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-2xl gradient-primary flex items-center justify-center">
            <Loader2 className="w-10 h-10 text-primary-foreground animate-spin" />
          </div>
          
          <div>
            <h2 className="text-xl font-bold mb-2">Analysiere Bild...</h2>
            <p className="text-muted-foreground">
              Die KI erkennt den Zählerstand automatisch.
            </p>
          </div>

          <Progress value={progress} className="max-w-xs mx-auto" />
        </div>
      )}

      {/* Step: Confirm */}
      {step === 'confirm' && selectedMeter && (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-bold mb-2">Ergebnis bestätigen</h2>
            <p className="text-muted-foreground">
              Prüfen Sie den erkannten Wert und korrigieren Sie ihn bei Bedarf.
            </p>
          </div>

          {imagePreview && (
            <div className="rounded-xl overflow-hidden">
              <img 
                src={imagePreview} 
                alt="Zählerfoto" 
                className="w-full h-48 object-cover"
              />
            </div>
          )}

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <MeterIcon type={selectedMeter.meter_type} />
                <div>
                  <p className="font-medium">
                    {METER_TYPE_LABELS[selectedMeter.meter_type]}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Nr. {selectedMeter.meter_number}
                  </p>
                </div>
              </div>

              {ocrResult && !isEditing && (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground mb-1">
                    Erkannter Wert ({Math.round(ocrResult.confidence)}% Konfidenz)
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <p className="text-4xl font-bold text-primary">
                      {ocrResult.value.toLocaleString('de-DE')}
                    </p>
                    <span className="text-lg text-muted-foreground">
                      {METER_TYPE_UNITS[selectedMeter.meter_type]}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsEditing(true)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              {(isEditing || !ocrResult) && (
                <div className="space-y-2">
                  <Label>Zählerstand eingeben</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Wert eingeben"
                      value={editedValue}
                      onChange={(e) => setEditedValue(e.target.value)}
                      className="text-lg"
                      autoFocus
                    />
                    <span className="text-muted-foreground">
                      {METER_TYPE_UNITS[selectedMeter.meter_type]}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setImageFile(null);
                setImagePreview('');
                setOcrResult(null);
                setEditedValue('');
                setIsEditing(false);
                setStep('select');
              }}
            >
              Erneut aufnehmen
            </Button>
            <Button
              className="flex-1"
              onClick={handleSave}
              disabled={!editedValue || saving}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Speichern...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Speichern
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Step: Success */}
      {step === 'success' && (
        <div className="py-12 text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-accent flex items-center justify-center">
            <Check className="w-10 h-10 text-primary" />
          </div>
          
          <div>
            <h2 className="text-xl font-bold mb-2">Ablesung gespeichert!</h2>
            <p className="text-muted-foreground">
              Der Zählerstand wurde erfolgreich erfasst.
            </p>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
