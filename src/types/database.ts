export type MeterType = 'electricity' | 'gas' | 'cold_water' | 'warm_water' | 'heating';

export interface Unit {
  id: string;
  user_id: string;
  name: string;
  address: string | null;
  created_at: string;
  updated_at: string;
}

export interface Meter {
  id: string;
  unit_id: string;
  meter_number: string;
  meter_type: MeterType;
  created_at: string;
  updated_at: string;
}

export interface MeterReading {
  id: string;
  meter_id: string;
  reading_date: string;
  value: number;
  image_url: string | null;
  source: 'manual' | 'ocr';
  confidence: number | null;
  created_at: string;
}

export interface MeterWithReadings extends Meter {
  readings: MeterReading[];
  lastReading?: MeterReading;
  consumption?: number;
}

export interface UnitWithMeters extends Unit {
  meters: MeterWithReadings[];
}

export const METER_TYPE_LABELS: Record<MeterType, string> = {
  electricity: 'Strom',
  gas: 'Gas',
  cold_water: 'Kaltwasser',
  warm_water: 'Warmwasser',
  heating: 'Heizung',
};

export const METER_TYPE_UNITS: Record<MeterType, string> = {
  electricity: 'kWh',
  gas: 'm³',
  cold_water: 'm³',
  warm_water: 'm³',
  heating: 'kWh',
};
