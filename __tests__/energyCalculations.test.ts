import {
  applianceMonthlyKwh,
  totalMonthlyKwhFromAppliances,
  monthlyKwhFromBill,
  buildEnergyAuditData,
  energyUsageCategory,
  topEnergyConsumers,
} from '../src/utils/energyCalculations';
import { Appliance } from '../src/types';

const mockAppliance: Appliance = {
  id: 'test-ac',
  name: 'Air Conditioner',
  icon: 'thermometer',
  wattage: 3500,
  hoursPerDay: 6,
  quantity: 1,
};

describe('energyCalculations', () => {
  describe('applianceMonthlyKwh', () => {
    it('calculates monthly kWh correctly', () => {
      // 3500W * 6h/day * 30 days * 1 qty / 1000 = 630 kWh
      expect(applianceMonthlyKwh(mockAppliance)).toBeCloseTo(630);
    });

    it('returns 0 when quantity is 0', () => {
      const appliance = { ...mockAppliance, quantity: 0 };
      expect(applianceMonthlyKwh(appliance)).toBe(0);
    });

    it('scales linearly with quantity', () => {
      const single = applianceMonthlyKwh(mockAppliance);
      const double = applianceMonthlyKwh({ ...mockAppliance, quantity: 2 });
      expect(double).toBeCloseTo(single * 2);
    });
  });

  describe('totalMonthlyKwhFromAppliances', () => {
    it('sums multiple appliances', () => {
      const appliances: Appliance[] = [
        { ...mockAppliance, wattage: 1000, hoursPerDay: 2, quantity: 1 }, // 60 kWh
        { ...mockAppliance, id: 'fridge', wattage: 150, hoursPerDay: 24, quantity: 1 }, // 108 kWh
      ];
      const total = totalMonthlyKwhFromAppliances(appliances);
      expect(total).toBeCloseTo(168);
    });

    it('returns 0 for empty list', () => {
      expect(totalMonthlyKwhFromAppliances([])).toBe(0);
    });
  });

  describe('monthlyKwhFromBill', () => {
    it('divides bill by rate correctly', () => {
      expect(monthlyKwhFromBill(150, 0.16)).toBeCloseTo(937.5);
    });

    it('returns 0 for zero rate', () => {
      expect(monthlyKwhFromBill(150, 0)).toBe(0);
    });

    it('handles negative rate gracefully', () => {
      expect(monthlyKwhFromBill(150, -0.1)).toBe(0);
    });
  });

  describe('buildEnergyAuditData', () => {
    it('builds audit from bill correctly', () => {
      const audit = buildEnergyAuditData(true, 160, 0.16, []);
      expect(audit.monthlyConsumption).toBeCloseTo(1000);
      expect(audit.annualConsumption).toBeCloseTo(12000);
      expect(audit.useManualBill).toBe(true);
    });

    it('builds audit from appliances correctly', () => {
      const appliances: Appliance[] = [
        { ...mockAppliance, wattage: 1000, hoursPerDay: 5, quantity: 2 }, // 300 kWh
      ];
      const audit = buildEnergyAuditData(false, 0, 0.15, appliances);
      expect(audit.monthlyConsumption).toBeCloseTo(300);
      expect(audit.annualConsumption).toBeCloseTo(3600);
    });
  });

  describe('energyUsageCategory', () => {
    it('labels low usage correctly', () => {
      expect(energyUsageCategory(4000).label).toBe('Low');
    });

    it('labels average usage correctly', () => {
      expect(energyUsageCategory(8000).label).toBe('Average');
    });

    it('labels above-average usage correctly', () => {
      expect(energyUsageCategory(12000).label).toBe('Above Average');
    });

    it('labels high usage correctly', () => {
      expect(energyUsageCategory(20000).label).toBe('High');
    });
  });

  describe('topEnergyConsumers', () => {
    it('returns top 3 consumers sorted by usage', () => {
      const appliances: Appliance[] = [
        { ...mockAppliance, id: 'a1', wattage: 500, hoursPerDay: 2, quantity: 1 },
        { ...mockAppliance, id: 'a2', wattage: 3500, hoursPerDay: 6, quantity: 1 },
        { ...mockAppliance, id: 'a3', wattage: 150, hoursPerDay: 24, quantity: 1 },
        { ...mockAppliance, id: 'a4', wattage: 1000, hoursPerDay: 8, quantity: 1 },
      ];
      const top = topEnergyConsumers(appliances);
      expect(top).toHaveLength(3);
      expect(top[0].id).toBe('a2'); // highest consumer first
    });

    it('excludes appliances with quantity 0', () => {
      const appliances: Appliance[] = [
        { ...mockAppliance, id: 'active', quantity: 1 },
        { ...mockAppliance, id: 'inactive', quantity: 0 },
      ];
      const top = topEnergyConsumers(appliances);
      expect(top.find((a) => a.id === 'inactive')).toBeUndefined();
    });
  });
});
