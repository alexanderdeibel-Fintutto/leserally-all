import { Link } from 'react-router-dom';
import { Building2, ChevronRight, Plus, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
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
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <Card className="overflow-hidden card-elevated border-0 rounded-2xl">
        <CardHeader className="pb-3 bg-gradient-to-r from-accent/30 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div 
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center shadow-soft"
              >
                <Building2 className="w-6 h-6 text-primary" />
              </motion.div>
              <div>
                <CardTitle className="text-lg font-bold">{displayName}</CardTitle>
                {displayAddress && (
                  <p className="text-sm text-muted-foreground">{displayAddress}</p>
                )}
              </div>
            </div>
            <Link to={`/units/${unit.id}`}>
              <motion.div whileHover={{ x: 3 }} whileTap={{ scale: 0.95 }}>
                <Button variant="ghost" size="icon" className="rounded-xl hover:bg-accent/50">
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </Button>
              </motion.div>
            </Link>
          </div>
        </CardHeader>

        <CardContent className="pt-3 pb-4">
          {unit.meters.length === 0 ? (
            <div className="flex flex-col items-center py-6 text-center">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <Sparkles className="w-5 h-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                Noch keine Zähler angelegt
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {unit.meters.map((meter, index) => (
                <motion.div
                  key={meter.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.01 }}
                  className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-muted/60 to-muted/30 hover:from-muted/80 hover:to-muted/50 transition-all duration-300"
                >
                  <div className="flex items-center gap-3">
                    <MeterIcon type={meter.meter_type} size="sm" />
                    <div>
                      <p className="font-semibold text-sm">
                        {METER_TYPE_LABELS[meter.meter_type]}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {meter.meter_number}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {meter.lastReading ? (
                      <div className="text-right">
                        <p className="font-bold text-sm text-foreground">
                          {meter.lastReading.reading_value.toLocaleString('de-DE')} 
                          <span className="text-muted-foreground font-normal ml-1">
                            {METER_TYPE_UNITS[meter.meter_type]}
                          </span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(meter.lastReading.reading_date), 'dd.MM.yyyy', { locale: de })}
                        </p>
                        {meter.consumption !== undefined && meter.consumption > 0 && (
                          <p className="text-xs font-medium text-secondary">
                            +{meter.consumption.toLocaleString('de-DE')} {METER_TYPE_UNITS[meter.meter_type]}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">Keine Ablesung</p>
                    )}
                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary"
                        onClick={() => onAddReading(meter.id)}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </motion.div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
