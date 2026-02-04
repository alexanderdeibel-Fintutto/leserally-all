import { useNavigate } from 'react-router-dom';
import { Plus, Camera, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppLayout } from '@/components/layout/AppLayout';
import { UnitCard } from '@/components/dashboard/UnitCard';
import { Button } from '@/components/ui/button';
import { useBuildings } from '@/hooks/useBuildings';
import { useProfile } from '@/hooks/useProfile';
import { CrossMarketingBanner } from '@/components/dashboard/CrossMarketingBanner';
import { useProducts } from '@/hooks/useProducts';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { buildings, isLoading } = useBuildings();
  const { profile, isLoading: profileLoading } = useProfile();
  
  // Preload products on app start for pricing page and cross-marketing
  useProducts('zaehler');

  // Flatten all units across buildings
  const allUnits = buildings.flatMap(b => b.units);

  const handleAddReading = (meterId: string) => {
    navigate(`/read?meter=${meterId}`);
  };

  // Loading state
  if (isLoading || profileLoading) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-16">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <Loader2 className="w-10 h-10 text-primary" />
          </motion.div>
          <p className="mt-4 text-muted-foreground">Laden...</p>
        </div>
      </AppLayout>
    );
  }

  // No organization yet - show empty state with prompt to create first building
  // Organization will be auto-created when user creates first building
  if (!profile?.organization_id) {
    return (
      <AppLayout>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-12"
        >
          <motion.div 
            whileHover={{ scale: 1.05, rotate: 5 }}
            className="w-20 h-20 rounded-3xl bg-gradient-to-br from-accent to-accent/50 mx-auto mb-5 flex items-center justify-center shadow-soft"
          >
            <Plus className="w-10 h-10 text-muted-foreground" />
          </motion.div>
          <h2 className="text-xl font-bold mb-2">Willkommen! 👋</h2>
          <p className="text-muted-foreground mb-6 max-w-xs mx-auto">
            Starten Sie mit der Einrichtung Ihres ersten Gebäudes.
          </p>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button 
              onClick={() => navigate('/buildings/new')}
              className="gradient-primary text-primary-foreground font-semibold px-6 py-3 rounded-xl shadow-glow"
            >
              <Plus className="w-4 h-4 mr-2" />
              Erstes Gebäude anlegen
            </Button>
          </motion.div>
        </motion.div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {/* Cross-Marketing Banner */}
      <CrossMarketingBanner className="mb-4" />

      {/* Quick Actions */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex gap-3 mb-6"
      >
        <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button 
            className="w-full gradient-primary text-primary-foreground font-semibold py-6 rounded-2xl shadow-glow text-base"
            onClick={() => navigate('/read')}
          >
            <Camera className="w-5 h-5 mr-2" />
            Zähler ablesen
          </Button>
        </motion.div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button 
            variant="outline"
            onClick={() => navigate('/buildings/new')}
            className="h-full aspect-square rounded-2xl border-2 border-dashed border-primary/30 hover:border-primary/60 hover:bg-accent/50"
          >
            <Plus className="w-6 h-6 text-primary" />
          </Button>
        </motion.div>
      </motion.div>

      {/* Units from all buildings */}
      <AnimatePresence mode="wait">
        {allUnits.length === 0 ? (
          <motion.div 
            key="empty"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="text-center py-12"
          >
            <motion.div 
              whileHover={{ scale: 1.05, rotate: 5 }}
              className="w-20 h-20 rounded-3xl bg-gradient-to-br from-accent to-accent/50 mx-auto mb-5 flex items-center justify-center shadow-soft"
            >
              <Plus className="w-10 h-10 text-muted-foreground" />
            </motion.div>
            <h2 className="text-xl font-bold mb-2">Keine Einheiten</h2>
            <p className="text-muted-foreground mb-6 max-w-xs mx-auto">
              Legen Sie zuerst ein Gebäude an, um Einheiten zu verwalten.
            </p>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button 
                onClick={() => navigate('/buildings/new')}
                className="gradient-primary text-primary-foreground font-semibold px-6 rounded-xl shadow-glow"
              >
                <Plus className="w-4 h-4 mr-2" />
                Gebäude anlegen
              </Button>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div 
            key="list"
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-4"
          >
            {allUnits.map((unit, index) => (
              <motion.div
                key={unit.id}
                variants={itemVariants}
                transition={{ delay: index * 0.05 }}
              >
                <UnitCard 
                  unit={unit} 
                  onAddReading={handleAddReading}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </AppLayout>
  );
}
