import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Building2, ChevronRight, Loader2, Trash2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUnits } from '@/hooks/useUnits';
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

export default function Units() {
  const navigate = useNavigate();
  const { units, isLoading, deleteUnit } = useUnits();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { toast } = useToast();

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
      <Button 
        className="w-full mb-4"
        onClick={() => navigate('/units/new')}
      >
        <Plus className="w-4 h-4 mr-2" />
        Neue Einheit anlegen
      </Button>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : units.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Noch keine Einheiten angelegt.
        </div>
      ) : (
        <div className="space-y-3">
          {units.map((unit) => (
            <Card key={unit.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <Link 
                    to={`/units/${unit.id}`}
                    className="flex items-center gap-3 flex-1"
                  >
                    <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-accent-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{unit.name}</p>
                      {unit.address && (
                        <p className="text-sm text-muted-foreground">{unit.address}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {unit.meters.length} Zähler
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive ml-2"
                    onClick={() => setDeleteId(unit.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Einheit löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Diese Aktion kann nicht rückgängig gemacht werden. Alle Zähler und 
              Ablesungen dieser Einheit werden ebenfalls gelöscht.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
