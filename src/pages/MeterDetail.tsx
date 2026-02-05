import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Camera, Plus, Upload } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MeterIcon } from '@/components/meters/MeterIcon';
import { AddReadingDialog } from '@/components/meters/AddReadingDialog';
import { ImportReadingsWizard } from '@/components/meters/ImportReadingsWizard';
import { useBuildings } from '@/hooks/useBuildings';
import { METER_TYPE_LABELS, METER_TYPE_UNITS } from '@/types/database';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function MeterDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { buildings, isLoading } = useBuildings();
  
  const [showAddReading, setShowAddReading] = useState(false);
  const [showImportWizard, setShowImportWizard] = useState(false);

  // Find meter across all buildings/units
  const allUnits = buildings.flatMap(b => b.units);
  const meter = allUnits.flatMap(u => u.meters).find(m => m.id === id);
  const unit = allUnits.find(u => u.meters.some(m => m.id === id));
  
  // Get existing reading dates for duplicate detection
  const existingDates = meter?.readings.map(r => r.reading_date) || [];

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!meter || !unit) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Zähler nicht gefunden.</p>
          <Button variant="link" onClick={() => navigate('/')}>
            Zurück zur Übersicht
          </Button>
        </div>
      </AppLayout>
    );
  }

  // Prepare chart data (reverse to show oldest first)
  const chartData = [...meter.readings]
    .reverse()
    .map((reading) => ({
      date: format(new Date(reading.reading_date), 'dd.MM', { locale: de }),
      value: reading.reading_value,
    }));

  // Calculate consumption for each reading
  const consumptionData = meter.readings.slice(0, -1).map((reading, index) => {
    const prev = meter.readings[index + 1];
    return {
      date: format(new Date(reading.reading_date), 'dd.MM', { locale: de }),
      consumption: reading.reading_value - prev.reading_value,
    };
  }).reverse();

  return (
    <AppLayout>
      <Button
        variant="ghost"
        className="mb-4 -ml-2"
        onClick={() => navigate(`/units/${unit.id}`)}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Zurück
      </Button>

      {/* Meter Info */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <MeterIcon type={meter.meter_type} size="lg" />
            <div className="flex-1">
              <h1 className="text-xl font-bold">
                {METER_TYPE_LABELS[meter.meter_type]}
              </h1>
              <p className="text-muted-foreground">
                Nr. {meter.meter_number}
              </p>
              <p className="text-sm text-muted-foreground">
                {unit.unit_number}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowAddReading(true)}>
                <Plus className="w-4 h-4 mr-1" />
                Manuell
              </Button>
              <Button size="sm" onClick={() => navigate(`/read?meter=${meter.id}`)}>
                <Camera className="w-4 h-4 mr-1" />
                Foto
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Value */}
      {meter.lastReading && (
        <Card className="mb-4">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">Aktueller Stand</p>
            <p className="text-3xl font-bold text-primary">
              {meter.lastReading.reading_value.toLocaleString('de-DE')}
              <span className="text-lg font-normal text-muted-foreground ml-2">
                {METER_TYPE_UNITS[meter.meter_type]}
              </span>
            </p>
            <p className="text-sm text-muted-foreground">
              {format(new Date(meter.lastReading.reading_date), 'dd. MMMM yyyy', { locale: de })}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Chart */}
      {chartData.length > 1 && (
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Verbrauchsverlauf</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [
                      `${value.toLocaleString('de-DE')} ${METER_TYPE_UNITS[meter.meter_type]}`,
                      'Stand',
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Readings History */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Ablesungen</CardTitle>
            <Button variant="outline" size="sm" onClick={() => setShowImportWizard(true)}>
              <Upload className="w-4 h-4 mr-1" />
              Import
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {meter.readings.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              Noch keine Ablesungen vorhanden.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {meter.readings.map((reading, index) => {
                const prev = meter.readings[index + 1];
                const consumption = prev ? reading.reading_value - prev.reading_value : null;
                
                return (
                  <div key={reading.id} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        {reading.reading_value.toLocaleString('de-DE')} {METER_TYPE_UNITS[meter.meter_type]}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(reading.reading_date), 'dd. MMMM yyyy', { locale: de })}
                      </p>
                      {reading.source === 'ocr' && reading.confidence && (
                        <p className="text-xs text-muted-foreground">
                          OCR ({Math.round(reading.confidence)}% Konfidenz)
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      {consumption !== null && consumption > 0 && (
                        <p className="text-sm text-secondary font-medium">
                          +{consumption.toLocaleString('de-DE')} {METER_TYPE_UNITS[meter.meter_type]}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Reading Dialog */}
      <AddReadingDialog
        open={showAddReading}
        onOpenChange={setShowAddReading}
        meterId={meter.id}
        meterType={meter.meter_type}
        existingDates={existingDates}
      />

      {/* Import Wizard */}
      <ImportReadingsWizard
        open={showImportWizard}
        onOpenChange={setShowImportWizard}
        meterId={meter.id}
        meterType={meter.meter_type}
        existingDates={existingDates}
      />
    </AppLayout>
  );
}
