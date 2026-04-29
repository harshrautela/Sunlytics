import { Appliance, EnergyAuditData } from '../types';

/**
 * Calculate monthly kWh consumption for a single appliance.
 * Formula: (wattage × hours/day × 30 days × quantity) / 1000
 */
export function applianceMonthlyKwh(appliance: Appliance): number {
  return (appliance.wattage * appliance.hoursPerDay * 30 * appliance.quantity) / 1000;
}

/**
 * Calculate total monthly kWh from a list of appliances.
 */
export function totalMonthlyKwhFromAppliances(appliances: Appliance[]): number {
  return appliances.reduce((sum, a) => sum + applianceMonthlyKwh(a), 0);
}

/**
 * Derive monthly kWh from electricity bill and rate.
 * Formula: bill / rate
 */
export function monthlyKwhFromBill(monthlyBill: number, ratePerKwh: number): number {
  if (ratePerKwh <= 0) return 0;
  return monthlyBill / ratePerKwh;
}

/**
 * Build a complete EnergyAuditData object from user inputs.
 */
export function buildEnergyAuditData(
  useManualBill: boolean,
  monthlyBill: number,
  electricityRate: number,
  appliances: Appliance[],
): EnergyAuditData {
  let monthlyConsumption: number;

  if (useManualBill) {
    monthlyConsumption = monthlyKwhFromBill(monthlyBill, electricityRate);
  } else {
    monthlyConsumption = totalMonthlyKwhFromAppliances(appliances);
    // Derive equivalent bill for display
    monthlyBill = monthlyConsumption * electricityRate;
  }

  return {
    useManualBill,
    monthlyBill,
    electricityRate,
    appliances,
    monthlyConsumption,
    annualConsumption: monthlyConsumption * 12,
  };
}

/**
 * Categorize energy usage level.
 */
export function energyUsageCategory(
  annualKwh: number,
): { label: string; color: string; description: string } {
  if (annualKwh < 5000) {
    return {
      label: 'Low',
      color: '#27AE60',
      description: 'Your home is very energy-efficient.',
    };
  } else if (annualKwh < 10000) {
    return {
      label: 'Average',
      color: '#F5A623',
      description: 'Typical for a mid-size American household.',
    };
  } else if (annualKwh < 18000) {
    return {
      label: 'Above Average',
      color: '#E67E22',
      description: 'Higher than average – solar can make a big impact.',
    };
  } else {
    return {
      label: 'High',
      color: '#E74C3C',
      description: 'Significant usage – solar is strongly recommended.',
    };
  }
}

/**
 * Estimate the top 3 energy consuming appliances.
 */
export function topEnergyConsumers(appliances: Appliance[]): Appliance[] {
  return [...appliances]
    .filter((a) => a.quantity > 0)
    .sort((a, b) => applianceMonthlyKwh(b) - applianceMonthlyKwh(a))
    .slice(0, 3);
}
