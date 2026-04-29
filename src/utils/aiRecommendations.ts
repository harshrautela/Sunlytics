import { AIInsights, SolarConfiguration, EnergyAuditData, RooftopData, RegionData } from '../types';

// ─── Rule-based AI Insights Engine ───────────────────────────────────────────

/**
 * Calculate a feasibility score (0-100) based on multiple factors.
 */
function calculateFeasibilityScore(
  rooftop: RooftopData,
  region: RegionData,
  bestConfig: SolarConfiguration,
): number {
  let score = 0;

  // Roof area (max 25 pts)
  if (rooftop.usableArea >= 600) score += 25;
  else if (rooftop.usableArea >= 400) score += 20;
  else if (rooftop.usableArea >= 200) score += 12;
  else score += 5;

  // Sun hours (max 25 pts)
  if (region.peakSunHoursPerDay >= 6) score += 25;
  else if (region.peakSunHoursPerDay >= 5) score += 20;
  else if (region.peakSunHoursPerDay >= 4) score += 13;
  else score += 6;

  // Shading (max 20 pts)
  const shadingPenalty = (rooftop.shadingPercentage / 100) * 20;
  score += Math.round(20 - shadingPenalty);

  // Coverage (max 15 pts)
  score += Math.round((bestConfig.coveragePercentage / 100) * 15);

  // Payback period (max 15 pts)
  if (bestConfig.paybackPeriodYears <= 6) score += 15;
  else if (bestConfig.paybackPeriodYears <= 8) score += 12;
  else if (bestConfig.paybackPeriodYears <= 10) score += 8;
  else if (bestConfig.paybackPeriodYears <= 13) score += 4;
  else score += 1;

  return Math.min(100, score);
}

function getFeasibilityLabel(
  score: number,
): 'Excellent' | 'Good' | 'Fair' | 'Poor' {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  return 'Poor';
}

/**
 * Generate a narrative summary paragraph.
 */
function generateSummary(
  energy: EnergyAuditData,
  rooftop: RooftopData,
  region: RegionData,
  bestConfig: SolarConfiguration,
  feasibilityScore: number,
): string {
  const savingsK = (bestConfig.roi25Year / 1000).toFixed(0);
  const feasibility = getFeasibilityLabel(feasibilityScore);
  const orientationWord =
    rooftop.orientation === 'south'
      ? 'south-facing (ideal)'
      : `${rooftop.orientation}-facing`;

  return (
    `Based on your ${energy.annualConsumption.toFixed(0)} kWh annual energy usage and ` +
    `${rooftop.usableArea} sq ft of ${orientationWord} roof space in ${region.city}, ${region.state}, ` +
    `solar installation is a ${feasibility.toLowerCase()} fit for your home. ` +
    `The AI recommends a ${bestConfig.systemSizeKw.toFixed(1)} kW ${bestConfig.panel.brand} system ` +
    `that covers ${bestConfig.coveragePercentage}% of your electricity needs, saves you ` +
    `$${Math.round(bestConfig.annualSavings).toLocaleString()} per year, and delivers an estimated ` +
    `$${savingsK}K net benefit over 25 years after all incentives and costs.`
  );
}

/**
 * Generate key benefits specific to the user's situation.
 */
function generateKeyBenefits(
  energy: EnergyAuditData,
  region: RegionData,
  bestConfig: SolarConfiguration,
): string[] {
  const benefits: string[] = [];

  benefits.push(
    `💰 Save ~$${Math.round(bestConfig.annualSavings).toLocaleString()} per year on your electricity bill`,
  );

  benefits.push(
    `🌱 Offset ${bestConfig.co2OffsetTons.toFixed(1)} tons of CO₂ per year (equivalent to planting ${Math.round(bestConfig.co2OffsetTons * 45)} trees)`,
  );

  benefits.push(
    `💵 Qualify for the 30% Federal Solar Tax Credit – saving $${Math.round(bestConfig.federalTaxCredit).toLocaleString()}`,
  );

  if (region.stateIncentivePercent > 0) {
    benefits.push(
      `🏛️ Additional ${region.stateIncentivePercent}% state incentive worth ~$${Math.round(bestConfig.stateCreditEstimate).toLocaleString()} in ${region.state}`,
    );
  }

  if (region.averageElectricityRate > 0.2) {
    benefits.push(
      `⚡ ${region.city} has above-average electricity rates ($${region.averageElectricityRate}/kWh), making solar especially cost-effective`,
    );
  }

  benefits.push(
    `🏠 Increases home resale value by an estimated $${Math.round(bestConfig.systemSizeKw * 4000).toLocaleString()} (avg. $4,000/kW)`,
  );

  return benefits;
}

/**
 * Generate considerations / potential challenges.
 */
function generateConsiderations(
  rooftop: RooftopData,
  region: RegionData,
  bestConfig: SolarConfiguration,
): string[] {
  const considerations: string[] = [];

  if (rooftop.shadingPercentage > 20) {
    considerations.push(
      `⚠️ ${rooftop.shadingPercentage}% shading reduces system output – consider micro-inverters or power optimizers`,
    );
  }

  if (rooftop.orientation !== 'south') {
    considerations.push(
      `📐 ${rooftop.orientation.charAt(0).toUpperCase() + rooftop.orientation.slice(1)}-facing roof reduces yield by ~${Math.round((1 - 0.88) * 100)}% vs. south-facing – may need additional panels`,
    );
  }

  if (bestConfig.paybackPeriodYears > 10) {
    considerations.push(
      `⏱️ Longer-than-average payback period of ${bestConfig.paybackPeriodYears} years – consider lower-cost panel options`,
    );
  }

  if (rooftop.roofType === 'tile') {
    considerations.push(
      `🏗️ Tile roofs increase installation complexity and cost by 15-30% – factor this into final quotes`,
    );
  }

  if (rooftop.usableArea < 300) {
    considerations.push(
      `📏 Limited roof space (${rooftop.usableArea} sq ft) – high-efficiency panels are strongly recommended to maximize output`,
    );
  }

  considerations.push(
    `📋 Verify HOA and local permit requirements before installation – some jurisdictions have specific regulations`,
  );

  if (considerations.length === 0) {
    considerations.push(
      `✅ No significant concerns identified – your setup is well-suited for solar installation`,
    );
  }

  return considerations;
}

/**
 * Generate maintenance tips.
 */
function generateMaintenanceTips(
  rooftop: RooftopData,
  region: RegionData,
): string[] {
  const tips: string[] = [
    '🧹 Clean panels 2–4 times per year to remove dust, pollen, and bird droppings',
    '📊 Monitor monthly production via your inverter app to spot early performance drops',
    '🌳 Trim any growing trees or vegetation that may cast shade on your panels annually',
    '🔌 Schedule a professional inspection every 3–5 years for wiring and mounting integrity',
  ];

  if (rooftop.shadingPercentage > 10) {
    tips.push('🌤️ Consider a micro-inverter system to minimize shading losses per panel');
  }

  if (region.peakSunHoursPerDay < 4.5) {
    tips.push(
      '❄️ Inspect for snow or ice accumulation in winter – panels are self-cleaning once snow melts',
    );
  }

  return tips;
}

/**
 * Generate environmental impact statement.
 */
function generateEnvironmentalImpact(bestConfig: SolarConfiguration): string {
  const annualCo2 = bestConfig.co2OffsetTons;
  const yearsCo2 = (annualCo2 * 25).toFixed(0);
  const carsEquivalent = Math.round((annualCo2 * 1000) / 4600); // avg car emits 4.6 tons/yr

  return (
    `Your ${bestConfig.systemSizeKw.toFixed(1)} kW solar system will offset approximately ` +
    `${annualCo2.toFixed(1)} tons of CO₂ per year – equivalent to removing ${carsEquivalent} cars from the road. ` +
    `Over 25 years, this amounts to ${yearsCo2} tons of CO₂ avoided, contributing meaningfully ` +
    `to a cleaner electricity grid and helping reduce dependence on fossil fuels.`
  );
}

/**
 * Generate short-term prediction (1-5 years).
 */
function generateShortTermPrediction(
  bestConfig: SolarConfiguration,
  region: RegionData,
): string {
  const year1Savings = Math.round(bestConfig.annualSavings);
  const year5Savings = Math.round(cumulativeSavings(bestConfig.annualSavings, 5));

  return (
    `In the first year, you'll save approximately $${year1Savings.toLocaleString()} after your ` +
    `system begins production. Over the first 5 years, cumulative savings reach ~$${year5Savings.toLocaleString()}. ` +
    `${region.stateIncentivePercent > 0 ? `With ${region.state}'s ${region.stateIncentivePercent}% state incentive and ` : 'With '}` +
    `the 30% Federal ITC applied to your tax return, your effective investment is reduced to $${Math.round(bestConfig.netCost).toLocaleString()}.`
  );
}

const SYSTEM_DEGRADATION_RATE = 0.005;
const ELECTRICITY_ESCALATION_RATE = 0.025;

/**
 * Calculate cumulative savings over N years accounting for both system
 * degradation and electricity rate escalation.
 */
function cumulativeSavings(firstYearSavings: number, years: number): number {
  let total = 0;
  let output = 1.0;
  let rateMultiplier = 1.0;
  for (let y = 1; y <= years; y++) {
    total += firstYearSavings * output * rateMultiplier;
    output *= 1 - SYSTEM_DEGRADATION_RATE;
    rateMultiplier *= 1 + ELECTRICITY_ESCALATION_RATE;
  }
  return total;
}

/**
 * Generate long-term prediction (10-25 years).
 */
function generateLongTermPrediction(bestConfig: SolarConfiguration): string {
  const roiK = (bestConfig.roi25Year / 1000).toFixed(0);
  const breakEvenYr = bestConfig.paybackPeriodYears;

  return (
    `After your ${breakEvenYr}-year payback period, your system continues generating free electricity. ` +
    `By year 25, you'll have netted an estimated $${roiK}K profit after all costs and incentives. ` +
    `Most modern solar panels carry a 25-year performance warranty and continue operating well beyond that, ` +
    `often at 80–85% of original capacity. Battery storage upgrades can be added later to maximize ` +
    `self-consumption and provide backup power resilience.`
  );
}

/**
 * Main function: Generate comprehensive AI insights.
 * Uses a deterministic, expert-system approach with rich rule-based logic.
 */
export function generateAIInsights(
  energy: EnergyAuditData,
  rooftop: RooftopData,
  region: RegionData,
  bestConfig: SolarConfiguration,
): AIInsights {
  const feasibilityScore = calculateFeasibilityScore(rooftop, region, bestConfig);
  const feasibilityLabel = getFeasibilityLabel(feasibilityScore);

  return {
    feasibilityScore,
    feasibilityLabel,
    summary: generateSummary(energy, rooftop, region, bestConfig, feasibilityScore),
    keyBenefits: generateKeyBenefits(energy, region, bestConfig),
    considerations: generateConsiderations(rooftop, region, bestConfig),
    shortTermPrediction: generateShortTermPrediction(bestConfig, region),
    longTermPrediction: generateLongTermPrediction(bestConfig),
    maintenanceTips: generateMaintenanceTips(rooftop, region),
    environmentalImpact: generateEnvironmentalImpact(bestConfig),
  };
}
