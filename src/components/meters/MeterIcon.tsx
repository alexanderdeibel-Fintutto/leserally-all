import { Zap, Flame, Droplets, Thermometer } from 'lucide-react';
import { MeterType } from '@/types/database';
import { cn } from '@/lib/utils';

interface MeterIconProps {
  type: MeterType;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const iconMap = {
  electricity: Zap,
  gas: Flame,
  cold_water: Droplets,
  warm_water: Droplets,
  heating: Thermometer,
};

const colorMap: Record<MeterType, string> = {
  electricity: 'bg-meter-electricity text-primary-foreground',
  gas: 'bg-meter-gas text-secondary-foreground',
  cold_water: 'bg-meter-cold-water text-white',
  warm_water: 'bg-meter-warm-water text-white',
  heating: 'bg-meter-heating text-white',
};

const sizeMap = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
};

const iconSizeMap = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
};

export function MeterIcon({ type, size = 'md', className }: MeterIconProps) {
  const Icon = iconMap[type];
  
  return (
    <div className={cn(
      'rounded-xl flex items-center justify-center',
      sizeMap[size],
      colorMap[type],
      className
    )}>
      <Icon className={iconSizeMap[size]} />
    </div>
  );
}
