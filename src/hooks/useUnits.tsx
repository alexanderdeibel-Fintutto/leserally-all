import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Unit, Meter, MeterReading, MeterType, UnitWithMeters, MeterWithReadings } from '@/types/database';

export function useUnits() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all units with meters and their latest readings
  const { data: units, isLoading, error, refetch } = useQuery({
    queryKey: ['units', user?.id],
    queryFn: async (): Promise<UnitWithMeters[]> => {
      if (!user) return [];

      // Fetch units
      const { data: unitsData, error: unitsError } = await supabase
        .from('units')
        .select('*')
        .order('created_at', { ascending: false });

      if (unitsError) throw unitsError;

      // Fetch meters
      const { data: metersData, error: metersError } = await supabase
        .from('meters')
        .select('*')
        .in('unit_id', unitsData.map(u => u.id));

      if (metersError) throw metersError;

      // Fetch readings
      const { data: readingsData, error: readingsError } = await supabase
        .from('meter_readings')
        .select('*')
        .in('meter_id', metersData.map(m => m.id))
        .order('reading_date', { ascending: false });

      if (readingsError) throw readingsError;

      // Combine data
      const unitsWithMeters: UnitWithMeters[] = (unitsData as Unit[]).map(unit => {
        const unitMeters = (metersData as Meter[]).filter(m => m.unit_id === unit.id);
        const metersWithReadings: MeterWithReadings[] = unitMeters.map(meter => {
          const meterReadings = (readingsData as MeterReading[]).filter(r => r.meter_id === meter.id);
          const lastReading = meterReadings[0];
          const previousReading = meterReadings[1];
          const consumption = lastReading && previousReading 
            ? lastReading.value - previousReading.value 
            : undefined;

          return {
            ...meter,
            readings: meterReadings,
            lastReading,
            consumption,
          };
        });

        return {
          ...unit,
          meters: metersWithReadings,
        };
      });

      return unitsWithMeters;
    },
    enabled: !!user,
  });

  // Create unit
  const createUnit = useMutation({
    mutationFn: async (data: { name: string; address?: string }) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data: newUnit, error } = await supabase
        .from('units')
        .insert({ ...data, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return newUnit;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
    },
  });

  // Update unit
  const updateUnit = useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name?: string; address?: string }) => {
      const { data: updatedUnit, error } = await supabase
        .from('units')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return updatedUnit;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
    },
  });

  // Delete unit
  const deleteUnit = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('units')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
    },
  });

  // Create meter
  const createMeter = useMutation({
    mutationFn: async (data: { unit_id: string; meter_number: string; meter_type: MeterType }) => {
      const { data: newMeter, error } = await supabase
        .from('meters')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return newMeter;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
    },
  });

  // Delete meter
  const deleteMeter = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('meters')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
    },
  });

  // Create reading
  const createReading = useMutation({
    mutationFn: async (data: {
      meter_id: string;
      value: number;
      reading_date?: string;
      image_url?: string;
      source?: 'manual' | 'ocr';
      confidence?: number;
    }) => {
      const { data: newReading, error } = await supabase
        .from('meter_readings')
        .insert({
          ...data,
          reading_date: data.reading_date || new Date().toISOString().split('T')[0],
          source: data.source || 'manual',
        })
        .select()
        .single();

      if (error) throw error;
      return newReading;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
    },
  });

  return {
    units: units || [],
    isLoading,
    error,
    refetch,
    createUnit,
    updateUnit,
    deleteUnit,
    createMeter,
    deleteMeter,
    createReading,
  };
}
