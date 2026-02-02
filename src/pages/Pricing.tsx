import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PricingCard } from '@/components/subscription/PricingCard';
import { PricingToggle } from '@/components/subscription/PricingToggle';
import { useSubscription } from '@/hooks/useSubscription';
import { PRICING_PLANS } from '@/lib/stripe';
import { useAuth } from '@/hooks/useAuth';

export default function Pricing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { plan, isActive, isLoading, openCheckout, openPortal, checkSubscription } = useSubscription();
  const [isYearly, setIsYearly] = useState(true);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const handleSelectPlan = async (priceId: string) => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    setIsCheckingOut(true);
    await openCheckout(priceId);
    setIsCheckingOut(false);
  };

  const handleManageSubscription = async () => {
    await openPortal();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück
          </Button>
          
          {isActive && plan !== 'free' && (
            <Button variant="outline" size="sm" onClick={handleManageSubscription}>
              <Settings className="w-4 h-4 mr-2" />
              Abo verwalten
            </Button>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="container max-w-6xl mx-auto px-4 py-12">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Wählen Sie Ihren Plan</h1>
          <p className="text-muted-foreground">
            Alle Funktionen, die Sie für eine effiziente Immobilienverwaltung brauchen
          </p>
        </div>

        {/* Toggle */}
        <div className="mb-10">
          <PricingToggle isYearly={isYearly} onToggle={setIsYearly} />
        </div>

        {/* Loading state */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Pricing Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {PRICING_PLANS.map((pricingPlan) => (
                <PricingCard
                  key={pricingPlan.id}
                  plan={pricingPlan}
                  isYearly={isYearly}
                  currentPlan={plan}
                  isLoading={isCheckingOut}
                  onSelect={handleSelectPlan}
                />
              ))}
            </div>

            {/* Refresh button */}
            <div className="text-center">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={checkSubscription}
              >
                Status aktualisieren
              </Button>
            </div>
          </>
        )}

        {/* FAQ or additional info could go here */}
        <div className="mt-16 text-center text-sm text-muted-foreground">
          <p>Alle Preise verstehen sich inkl. MwSt. Sie können jederzeit kündigen.</p>
        </div>
      </main>
    </div>
  );
}
