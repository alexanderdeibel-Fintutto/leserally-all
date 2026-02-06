// ═══════════════════════════════════════════════════════════════════
// ENUMS
// ═══════════════════════════════════════════════════════════════════
export type AppRole = 'admin' | 'vermieter' | 'mieter' | 'hausmeister';
export type OrgType = 'vermieter' | 'hausverwaltung' | 'makler';
export type UnitType = 'apartment' | 'commercial' | 'parking';
export type UnitStatus = 'rented' | 'available' | 'maintenance';
export type LeaseStatus = 'active' | 'terminated' | 'pending';
export type MeterType = 'electricity' | 'gas' | 'water_cold' | 'water_hot' | 'heating';
export type ReadingSource = 'manual' | 'ocr' | 'api';
export type CostStatus = 'draft' | 'calculated' | 'sent';
export type AllocationKey = 'area' | 'units' | 'persons' | 'consumption';
export type TaskCategory = 'repair' | 'maintenance' | 'inspection';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'open' | 'in_progress' | 'completed';

// ═══════════════════════════════════════════════════════════════════
// CORE ENTITIES
// ═══════════════════════════════════════════════════════════════════
export interface Organization {
  id: string;
  name: string;
  type: OrgType | null;
  stripe_customer_id: string | null;
  subscription_plan: string;
  created_at: string;
}

export interface Profile {
  id: string;
  organization_id: string | null;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

// ═══════════════════════════════════════════════════════════════════
// IMMOBILIEN
// ═══════════════════════════════════════════════════════════════════
export interface Building {
  id: string;
  organization_id: string;
  name: string;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  country: string;
  total_units: number;
  total_area: number | null;
  year_built: number | null;
  created_at: string;
  updated_at: string;
}

export interface Unit {
  id: string;
  building_id: string;
  unit_number: string;
  floor: number | null;
  area: number | null;
  rooms: number | null;
  type: UnitType;
  status: UnitStatus;
  created_at: string;
  updated_at: string;
}

// ═══════════════════════════════════════════════════════════════════
// MIETVERTRAEGE
// ═══════════════════════════════════════════════════════════════════
export interface Lease {
  id: string;
  unit_id: string;
  tenant_id: string | null;
  start_date: string;
  end_date: string | null;
  rent_amount: number;
  utilities_advance: number;
  deposit_amount: number | null;
  payment_day: number;
  status: LeaseStatus;
  created_at: string;
  updated_at: string;
}

// ═══════════════════════════════════════════════════════════════════
// ZAEHLER & ABLESUNGEN
// ═══════════════════════════════════════════════════════════════════
export interface Meter {
  id: string;
  unit_id: string | null;
  building_id: string | null;
  meter_number: string;
  meter_type: MeterType;
  installation_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface MeterReading {
  id: string;
  meter_id: string;
  reading_date: string;
  reading_value: number;
  submitted_by: string | null;
  source: ReadingSource;
  confidence: number | null;
  image_url: string | null;
  is_verified: boolean;
  created_at: string;
}

// ═══════════════════════════════════════════════════════════════════
// BETRIEBSKOSTEN
// ═══════════════════════════════════════════════════════════════════
export interface OperatingCost {
  id: string;
  building_id: string;
  period_start: string;
  period_end: string;
  status: CostStatus;
  created_at: string;
  updated_at: string;
}

export interface OperatingCostItem {
  id: string;
  operating_cost_id: string;
  cost_type: string;
  amount: number;
  allocation_key: AllocationKey;
  created_at: string;
}

// ═══════════════════════════════════════════════════════════════════
// AUFGABEN & REPARATUREN
// ═══════════════════════════════════════════════════════════════════
export interface Task {
  id: string;
  unit_id: string | null;
  building_id: string | null;
  created_by: string | null;
  assigned_to: string | null;
  title: string;
  description: string | null;
  category: TaskCategory | null;
  priority: TaskPriority;
  status: TaskStatus;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

// ═══════════════════════════════════════════════════════════════════
// DOKUMENTE & NACHRICHTEN
// ═══════════════════════════════════════════════════════════════════
export interface Document {
  id: string;
  organization_id: string | null;
  user_id: string | null;
  building_id: string | null;
  unit_id: string | null;
  title: string;
  document_type: string | null;
  file_url: string | null;
  file_size: number | null;
  content_json: Record<string, unknown> | null;
  created_at: string;
}

export interface Message {
  id: string;
  sender_id: string | null;
  recipient_id: string | null;
  subject: string | null;
  content: string;
  is_read: boolean;
  created_at: string;
}

// ═══════════════════════════════════════════════════════════════════
// EXTENDED TYPES (with relations)
// ═══════════════════════════════════════════════════════════════════
export interface MeterWithReadings extends Meter {
  readings: MeterReading[];
  lastReading?: MeterReading;
  consumption?: number;
}

export interface UnitWithMeters extends Unit {
  meters: MeterWithReadings[];
  building?: Building;
  activeLeases?: Lease[];
}

export interface BuildingWithUnits extends Building {
  units: UnitWithMeters[];
  meters?: MeterWithReadings[]; // Direct meters attached to building
}

export interface ProfileWithRoles extends Profile {
  roles: AppRole[];
  organization?: Organization;
}

// ═══════════════════════════════════════════════════════════════════
// LABELS & UNITS
// ═══════════════════════════════════════════════════════════════════
export const METER_TYPE_LABELS: Record<MeterType, string> = {
  electricity: 'Strom',
  gas: 'Gas',
  water_cold: 'Kaltwasser',
  water_hot: 'Warmwasser',
  heating: 'Heizung',
};

export const METER_TYPE_UNITS: Record<MeterType, string> = {
  electricity: 'kWh',
  gas: 'm³',
  water_cold: 'm³',
  water_hot: 'm³',
  heating: 'kWh',
};

export const UNIT_TYPE_LABELS: Record<UnitType, string> = {
  apartment: 'Wohnung',
  commercial: 'Gewerbe',
  parking: 'Stellplatz',
};

export const UNIT_STATUS_LABELS: Record<UnitStatus, string> = {
  rented: 'Vermietet',
  available: 'Verfügbar',
  maintenance: 'Wartung',
};

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Niedrig',
  medium: 'Mittel',
  high: 'Hoch',
  urgent: 'Dringend',
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  open: 'Offen',
  in_progress: 'In Bearbeitung',
  completed: 'Abgeschlossen',
};

export const ROLE_LABELS: Record<AppRole, string> = {
  admin: 'Administrator',
  vermieter: 'Vermieter',
  mieter: 'Mieter',
  hausmeister: 'Hausmeister',
};
