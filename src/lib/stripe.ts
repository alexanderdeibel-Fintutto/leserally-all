// Stripe Pricing Configuration
// Product and price IDs from Stripe dashboard

export type PlanId = 'free' | 'basic' | 'pro' | 'business';

export interface PricingPlan {
  id: PlanId;
  name: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  priceIdMonthly: string | null;
  priceIdYearly: string | null;
  productId: string | null;
  features: string[];
  highlighted?: boolean;
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'free',
    name: 'Starter',
    description: 'Für den Einstieg',
    priceMonthly: 0,
    priceYearly: 0,
    priceIdMonthly: null,
    priceIdYearly: null,
    productId: null,
    features: [
      'Bis zu 3 Einheiten',
      'Manuelle Zählererfassung',
      'Grundlegende Berichte',
    ],
  },
  {
    id: 'basic',
    name: 'Basic',
    description: 'Für kleine Vermieter',
    priceMonthly: 9.99,
    priceYearly: 99.90,
    priceIdMonthly: 'price_1Stgdi52lqSgjCzewNmCKWqy',
    priceIdYearly: 'price_1Stgdi52lqSgjCzewNmCKWqy',
    productId: null,
    features: [
      'Bis zu 10 Einheiten',
      'OCR-Zählererfassung',
      'E-Mail Support',
      'Erweiterte Berichte',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Für professionelle Vermieter',
    priceMonthly: 24.99,
    priceYearly: 249.90,
    priceIdMonthly: 'price_1StgdM52lqSgjCzelgTZIRGu',
    priceIdYearly: 'price_1StgdM52lqSgjCzelgTZIRGu',
    productId: null,
    features: [
      'Bis zu 50 Einheiten',
      'OCR-Zählererfassung',
      'Prioritäts-Support',
      'Automatische Nebenkostenabrechnung',
      'Dokumentenverwaltung',
    ],
    highlighted: true,
  },
];

export const getPlanById = (planId: PlanId): PricingPlan | undefined => {
  return PRICING_PLANS.find(plan => plan.id === planId);
};

export const getPlanByProductId = (productId: string): PricingPlan | undefined => {
  return PRICING_PLANS.find(plan => plan.productId === productId);
};

export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(price);
};
