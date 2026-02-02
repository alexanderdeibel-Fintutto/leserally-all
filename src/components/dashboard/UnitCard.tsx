import { Link } from 'react-router-dom';
import { Building2, ChevronRight, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MeterIcon } from '@/components/meters/MeterIcon';
import { UnitWithMeters, METER_TYPE_LABELS, METER_TYPE_UNITS } from '@/types/database';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface UnitCardProps {
  unit: UnitWithMeters;
  onAddReading: (meterId: string) => void;
}

export function UnitCard({ unit, onAddReading }: UnitCardProps) {
  const displayName = unit.unit_number || `Einheit ${unit.id.slice(0, 8)}`;
  const displayAddress = unit.building?.address || null;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
              <Building2 className="w-5 h-5 text-accent-foreground" />
            </div>
            <div>
              <CardTitle className="text-lg">{displayName}</CardTitle>
              {displayAddress && (
                <p className="text-sm text-muted-foreground">{displayAddress}</p>
              )}
            </div>
          </div>
          <Link to={`/units/${unit.id}`}>
            <Button variant="ghost" size="icon">
              <ChevronRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {unit.meters.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Noch keine Zähler angelegt
          </p>
        ) : (
          <div className="space-y-3">
            {unit.meters.map((meter) => (
              <div
                key={meter.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <MeterIcon type={meter.meter_type} size="sm" />
                  <div>
                    <p className="font-medium text-sm">
                      {METER_TYPE_LABELS[meter.meter_type]}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {meter.meter_number}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {meter.lastReading ? (
                    <div className="text-right">
                      <p className="font-semibold text-sm">
                        {meter.lastReading.reading_value.toLocaleString('de-DE')} {METER_TYPE_UNITS[meter.meter_type]}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(meter.lastReading.reading_date), 'dd.MM.yyyy', { locale: de })}
                      </p>
                      {meter.consumption !== undefined && meter.consumption > 0 && (
                        <p className="text-xs text-secondary">
                          +{meter.consumption.toLocaleString('de-DE')} {METER_TYPE_UNITS[meter.meter_type]}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">Keine Ablesung</p>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onAddReading(meter.id)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
