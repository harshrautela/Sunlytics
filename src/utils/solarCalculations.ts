import { SolarPanel, SolarConfiguration, RooftopData, RegionData } from '../types';
import {
  SOLAR_PANELS,
  INVERTER_COST_PER_KW,
  INSTALLATION_COST_PER_KW,
  PERMIT_COST,
  FEDERAL_TAX_CREDIT,
  ELECTRICITY_ESCALATION_RATE,
  SYSTEM_DEGRADATION_RATE,
} from '../constants/solarPanels';

// Orientation efficiency multipliers relative to optimal (true south at ~30°)
const ORIENTATION_EFFICIENCY: Record<string, number> = {
  south: 1.0,
  west: 0.88,
  east: 0.88,
  north: 0.65,
  flat: 0.9,
};

/**
 * Calculate system derate factor considering shading, wiring losses,
 * inverter efficiency, soiling, and mismatch.
 */
function calculateDerate(shadingPercentage: number): number {
  const shadingFactor = 1 - shadingPercentage / 100;
  const wiringLoss = 0.98;
  const inverterEfficiency = 0.96;
  const soilingFactor = 0.95;
  const mismatchFactor = 0.98;
  return shadingFactor * wiringLoss * inverterEfficiency * soilingFactor * mismatchFactor;
}

/**
 * Calculate annual energy production (kWh) for a given system size.
 */
export function calculateAnnualProduction(
  systemSizeKw: number,
  region: RegionData,
  rooftop: RooftopData,
): number {
  const orientationFactor = ORIENTATION_EFFICIENCY[rooftop.orientation] || 0.88;
  const derateFactor = calculateDerate(rooftop.shadingPercentage);
  const annualSunHours = region.peakSunHoursPerDay * 365;
  return systemSizeKw * annualSunHours * orientationFactor * derateFactor;
}

/**
 * Calculate required system size (kW) to meet a given annual kWh demand.
 */
export function calculateRequiredSystemSize(
  annualKwhDemand: number,
  region: RegionData,
  rooftop: RooftopData,
): number {
  const orientationFactor = ORIENTATION_EFFICIENCY[rooftop.orientation] || 0.88;
  const derateFactor = calculateDerate(rooftop.shadingPercentage);
  const annualSunHours = region.peakSunHoursPerDay * 365;
  const effectiveSunHours = annualSunHours * orientationFactor * derateFactor;
  if (effectiveSunHours <= 0) return 0;
  return annualKwhDemand / effectiveSunHours;
}

/**
 * Maximum number of panels that fit on the usable roof area.
 */
export function maxPanelsByArea(rooftop: RooftopData, panel: SolarPanel): number {
  return Math.floor(rooftop.usableArea / panel.areaSquareFeet);
}

/**
 * Calculate 25-year ROI considering electricity rate escalation and system degradation.
 */
export function calculate25YearROI(
  netCost: number,
  firstYearSavings: number,
  electricityRate: number,
  degradationRate: number = SYSTEM_DEGRADATION_RATE,
  escalationRate: number = ELECTRICITY_ESCALATION_RATE,
): number {
  let totalSavings = 0;
  let systemOutput = 1.0; // multiplier starting at 100%
  let currentRate = electricityRate;

  for (let year = 1; year <= 25; year++) {
    totalSavings += firstYearSavings * systemOutput * (currentRate / electricityRate);
    systemOutput *= 1 - degradationRate;
    currentRate *= 1 + escalationRate;
  }
  return totalSavings - netCost;
}

/**
 * Build a SolarConfiguration for a given panel and energy need.
 * Returns null if the panel cannot meet the minimum feasibility threshold.
 */
export function buildConfiguration(
  panel: SolarPanel,
  annualKwhDemand: number,
  rooftop: RooftopData,
  region: RegionData,
  coverageTarget: number = 1.0, // 1.0 = 100% coverage
): SolarConfiguration | null {
  const requiredKw = calculateRequiredSystemSize(
    annualKwhDemand * coverageTarget,
    region,
    rooftop,
  );

  // Calculate number of panels needed (rounded up)
  const panelsNeeded = Math.ceil((requiredKw * 1000) / panel.wattage);

  // Check area feasibility
  const maxPanels = maxPanelsByArea(rooftop, panel);
  if (maxPanels < 4) return null; // Not enough roof space

  // Cap panels at roof maximum
  const numberOfPanels = Math.min(panelsNeeded, maxPanels);
  const systemSizeKw = (numberOfPanels * panel.wattage) / 1000;

  const annualProductionKwh = calculateAnnualProduction(systemSizeKw, region, rooftop);
  const coveragePercentage = Math.min(
    Math.round((annualProductionKwh / annualKwhDemand) * 100),
    100,
  );
  const roofAreaUsed = numberOfPanels * panel.areaSquareFeet;

  // Cost calculation
  const hardwareCost = numberOfPanels * panel.pricePerPanel;
  const inverterCost = systemSizeKw * INVERTER_COST_PER_KW;
  const installationCost = systemSizeKw * INSTALLATION_COST_PER_KW;
  const grossCost = hardwareCost + inverterCost + installationCost + PERMIT_COST;

  const federalTaxCredit = grossCost * FEDERAL_TAX_CREDIT;
  const stateCreditEstimate = grossCost * (region.stateIncentivePercent / 100);
  const netCost = grossCost - federalTaxCredit - stateCreditEstimate;

  // Annual savings
  const annualSavings = annualProductionKwh * region.averageElectricityRate;

  // Payback period (simple)
  const paybackPeriodYears =
    annualSavings > 0 ? Math.round((netCost / annualSavings) * 10) / 10 : 99;

  // 25-year ROI
  const roi25Year = calculate25YearROI(
    netCost,
    annualSavings,
    region.averageElectricityRate,
    panel.degradationRate / 100,
  );

  // CO₂ offset: avg 0.386 kg CO₂ per kWh (US grid average)
  const co2OffsetTons = (annualProductionKwh * 0.386) / 1000;

  // AI scoring
  const score = scoreConfiguration(panel, paybackPeriodYears, coveragePercentage, roi25Year);

  const aiReasoning = generateReasoning(
    panel,
    systemSizeKw,
    coveragePercentage,
    paybackPeriodYears,
    roi25Year,
    region,
  );

  return {
    panel,
    numberOfPanels,
    systemSizeKw,
    annualProductionKwh,
    coveragePercentage,
    roofAreaUsed,
    grossCost,
    federalTaxCredit,
    stateCreditEstimate,
    netCost,
    annualSavings,
    paybackPeriodYears,
    roi25Year,
    co2OffsetTons,
    score,
    aiReasoning,
  };
}

/**
 * Score a configuration on a 0-100 scale for AI ranking.
 * Weights: ROI 40%, coverage 30%, payback 20%, efficiency 10%
 */
function scoreConfiguration(
  panel: SolarPanel,
  paybackYears: number,
  coverage: number,
  roi25Year: number,
): number {
  // Payback score: 5 years → 100, 15 years → 0
  const paybackScore = Math.max(0, Math.min(100, ((15 - paybackYears) / 10) * 100));

  // Coverage score: 100% coverage = 100 points
  const coverageScore = Math.min(coverage, 100);

  // ROI score: $30k+ ROI = 100
  const roiScore = Math.max(0, Math.min(100, (roi25Year / 30000) * 100));

  // Efficiency score
  const efficiencyScore = Math.min(100, (panel.efficiency / 23) * 100);

  return Math.round(
    paybackScore * 0.2 + coverageScore * 0.3 + roiScore * 0.4 + efficiencyScore * 0.1,
  );
}

/**
 * Generate a short AI reasoning string for a configuration.
 */
function generateReasoning(
  panel: SolarPanel,
  systemSizeKw: number,
  coverage: number,
  paybackYears: number,
  roi25Year: number,
  region: RegionData,
): string {
  const tierWords: Record<string, string> = {
    premium: 'industry-leading efficiency',
    standard: 'excellent balance of performance and cost',
    budget: 'cost-effective performance',
  };
  const tierWord = tierWords[panel.tier] || 'solid performance';
  const roiK = (roi25Year / 1000).toFixed(0);

  return (
    `The ${panel.brand} ${panel.model} offers ${tierWord} at ${panel.efficiency}% efficiency. ` +
    `This ${systemSizeKw.toFixed(1)} kW system covers ${coverage}% of your energy needs in ${region.city}, ` +
    `with an estimated ${paybackYears}-year payback and $${roiK}K net profit over 25 years.`
  );
}

/**
 * Generate multiple solar configurations ranked by AI score.
 */
export function generateRecommendations(
  annualKwhDemand: number,
  rooftop: RooftopData,
  region: RegionData,
): SolarConfiguration[] {
  const configs: SolarConfiguration[] = [];

  for (const panel of SOLAR_PANELS) {
    // Try 100% coverage
    const full = buildConfiguration(panel, annualKwhDemand, rooftop, region, 1.0);
    if (full) configs.push(full);

    // Also try 80% coverage if different from full (for smaller budget option)
    const partial = buildConfiguration(panel, annualKwhDemand, rooftop, region, 0.8);
    if (
      partial &&
      (!full || Math.abs(partial.numberOfPanels - full.numberOfPanels) >= 2)
    ) {
      // Slightly lower score to rank full coverage higher
      configs.push({ ...partial, score: Math.max(0, partial.score - 5) });
    }
  }

  // Sort by score descending, deduplicate similar configs
  return configs
    .sort((a, b) => b.score - a.score)
    .slice(0, 6); // Top 6 recommendations
}

/**
 * Determine the most cost-effective single recommendation.
 */
export function getBestRecommendation(
  configs: SolarConfiguration[],
): SolarConfiguration | null {
  if (configs.length === 0) return null;
  return configs[0];
}
