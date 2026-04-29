// ─── User Profile ────────────────────────────────────────────────────────────

export interface UserProfile {
  name: string;
  location: string;
  monthlyBill: number; // USD
  electricityRate: number; // USD per kWh
}

// ─── Energy Audit ─────────────────────────────────────────────────────────────

export interface Appliance {
  id: string;
  name: string;
  icon: string;
  wattage: number; // Watts
  hoursPerDay: number;
  quantity: number;
}

export interface EnergyAuditData {
  useManualBill: boolean;
  monthlyBill: number; // USD
  electricityRate: number; // USD per kWh
  appliances: Appliance[];
  monthlyConsumption: number; // kWh
  annualConsumption: number; // kWh
}

// ─── Rooftop Analysis ────────────────────────────────────────────────────────

export type RoofOrientation = 'north' | 'south' | 'east' | 'west' | 'flat';

export interface RooftopData {
  totalArea: number; // square feet
  usableArea: number; // square feet (after setbacks, vents, etc.)
  orientation: RoofOrientation;
  tiltAngle: number; // degrees
  shadingPercentage: number; // 0-100
  roofType: 'asphalt' | 'tile' | 'metal' | 'flat';
}

// ─── Solar Panel ──────────────────────────────────────────────────────────────

export interface SolarPanel {
  id: string;
  brand: string;
  model: string;
  wattage: number; // Watts (Wp)
  efficiency: number; // percentage, e.g. 21.4
  dimensions: {
    lengthInches: number;
    widthInches: number;
  };
  areaSquareFeet: number;
  pricePerPanel: number; // USD
  warranty: number; // years
  degradationRate: number; // % per year
  type: 'monocrystalline' | 'polycrystalline' | 'thin-film';
  tier: 'premium' | 'standard' | 'budget';
}

// ─── Recommendation ───────────────────────────────────────────────────────────

export interface SolarConfiguration {
  panel: SolarPanel;
  numberOfPanels: number;
  systemSizeKw: number;
  annualProductionKwh: number;
  coveragePercentage: number; // % of energy needs covered
  roofAreaUsed: number; // sq ft
  grossCost: number; // USD
  federalTaxCredit: number; // USD (30%)
  stateCreditEstimate: number; // USD
  netCost: number; // USD
  annualSavings: number; // USD
  paybackPeriodYears: number;
  roi25Year: number; // USD
  co2OffsetTons: number; // per year
  score: number; // AI ranking score 0-100
  aiReasoning: string; // Why this config was recommended
}

// ─── AI Insights ──────────────────────────────────────────────────────────────

export interface AIInsights {
  feasibilityScore: number; // 0-100
  feasibilityLabel: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  summary: string;
  keyBenefits: string[];
  considerations: string[];
  shortTermPrediction: string;
  longTermPrediction: string;
  maintenanceTips: string[];
  environmentalImpact: string;
}

// ─── Regional Data ────────────────────────────────────────────────────────────

export interface RegionData {
  city: string;
  state: string;
  country: string;
  peakSunHoursPerDay: number; // annual average
  averageElectricityRate: number; // USD/kWh
  stateIncentivePercent: number; // additional state rebate %
  incentiveNotes: string;
  timezone: string;
  lat: number;
  lng: number;
}

// ─── App State ────────────────────────────────────────────────────────────────

export interface AppState {
  userProfile: UserProfile | null;
  energyAudit: EnergyAuditData | null;
  rooftopData: RooftopData | null;
  recommendations: SolarConfiguration[] | null;
  selectedConfiguration: SolarConfiguration | null;
  insights: AIInsights | null;
  region: RegionData | null;
  openAiApiKey: string;
}

// ─── Navigation ───────────────────────────────────────────────────────────────

export type RootStackParamList = {
  Welcome: undefined;
  EnergyAudit: undefined;
  RooftopAnalysis: undefined;
  Analyzing: undefined;
  Recommendations: undefined;
  CostAnalysis: { configuration: SolarConfiguration };
  Insights: undefined;
  Settings: undefined;
};
