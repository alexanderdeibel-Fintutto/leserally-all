import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Building2, ChevronRight, Loader2, Trash2, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useBuildings } from '@/hooks/useBuildings';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1 },
};

export default function Units() {
  const navigate = useNavigate();
  const { buildings, isLoading, deleteUnit } = useBuildings();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { toast } = useToast();

  // Flatten all units across buildings
  const allUnits = buildings.flatMap(b => 
    b.units.map(u => ({ ...u, building: b }))
  );

  const handleDelete = async () => {
    if (!deleteId) return;
    
    try {
      await deleteUnit.mutateAsync(deleteId);
      toast({
        title: 'Einheit gelöscht',
        description: 'Die Einheit wurde erfolgreich gelöscht.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Fehler',
        description: 'Die Einheit konnte nicht gelöscht werden.',
      });
    }
    setDeleteId(null);
  };

  return (
    <AppLayout title="Einheiten">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button 
            className="w-full mb-6 gradient-primary text-primary-foreground font-semibold py-6 rounded-2xl shadow-glow text-base"
            onClick={() => navigate('/buildings/new')}
          >
            <Plus className="w-5 h-5 mr-2" />
            Neues Gebäude anlegen
          </Button>
        </motion.div>
      </motion.div>

      {isLoading ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-16"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <Loader2 className="w-10 h-10 text-primary" />
          </motion.div>
          <p className="mt-4 text-muted-foreground">Laden...</p>
        </motion.div>
      ) : allUnits.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-12"
        >
          <motion.div 
            whileHover={{ scale: 1.05, rotate: 5 }}
            className="w-20 h-20 rounded-3xl bg-gradient-to-br from-accent to-accent/50 mx-auto mb-5 flex items-center justify-center shadow-soft"
          >
            <Home className="w-10 h-10 text-muted-foreground" />
          </motion.div>
          <h2 className="text-xl font-bold mb-2">Keine Einheiten</h2>
          <p className="text-muted-foreground max-w-xs mx-auto">
            Legen Sie zuerst ein Gebäude an, um Einheiten zu verwalten.
          </p>
        </motion.div>
      ) : (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-3"
        >
          <AnimatePresence mode="popLayout">
            {allUnits.map((unit, index) => (
              <motion.div
                key={unit.id}
                variants={itemVariants}
                layout
                exit={{ opacity: 0, scale: 0.9, x: -100 }}
                transition={{ delay: index * 0.03 }}
              >
                <Card className="overflow-hidden glass-card border-0 card-elevated">
                  <CardContent className="p-0">
                    <div className="flex items-center">
                      <Link 
                        to={`/units/${unit.id}`}
                        className="flex items-center gap-4 flex-1 p-4 group"
                      >
                        <motion.div 
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center"
                        >
                          <Building2 className="w-6 h-6 text-primary" />
                        </motion.div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                            {unit.unit_number}
                          </p>
                          {unit.building && (
                            <p className="text-sm text-muted-foreground truncate">
                              {unit.building.name}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-accent text-accent-foreground">
                              {unit.meters.length} Zähler
                            </span>
                          </div>
                        </div>
                        <motion.div
                          whileHover={{ x: 5 }}
                          className="text-muted-foreground group-hover:text-primary transition-colors"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </motion.div>
                      </Link>
                      <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 mr-2 rounded-xl"
                          onClick={() => setDeleteId(unit.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </motion.div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="glass-card border-0 rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl">Einheit löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Diese Aktion kann nicht rückgängig gemacht werden. Alle Zähler und 
              Ablesungen dieser Einheit werden ebenfalls gelöscht.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-xl">Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
