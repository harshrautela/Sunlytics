import {
  calculateAnnualProduction,
  calculateRequiredSystemSize,
  maxPanelsByArea,
  buildConfiguration,
  generateRecommendations,
  calculate25YearROI,
  getBestRecommendation,
} from '../src/utils/solarCalculations';
import { SolarPanel, RooftopData, RegionData } from '../src/types';

const mockPanel: SolarPanel = {
  id: 'test-panel',
  brand: 'TestBrand',
  model: 'TestModel 400',
  wattage: 400,
  efficiency: 20.0,
  dimensions: { lengthInches: 70, widthInches: 40 },
  areaSquareFeet: 19.4,
  pricePerPanel: 280,
  warranty: 25,
  degradationRate: 0.5,
  type: 'monocrystalline',
  tier: 'standard',
};

const mockRooftop: RooftopData = {
  totalArea: 1500,
  usableArea: 800,
  orientation: 'south',
  tiltAngle: 30,
  shadingPercentage: 5,
  roofType: 'asphalt',
};

const mockRegion: RegionData = {
  city: 'Los Angeles',
  state: 'CA',
  country: 'USA',
  peakSunHoursPerDay: 5.62,
  averageElectricityRate: 0.27,
  stateIncentivePercent: 0,
  incentiveNotes: 'CA SGIP available.',
  timezone: 'America/Los_Angeles',
  lat: 34.0522,
  lng: -118.2437,
};

describe('solarCalculations', () => {
  describe('calculateAnnualProduction', () => {
    it('calculates production for south-facing roof', () => {
      const production = calculateAnnualProduction(5, mockRegion, mockRooftop);
      // Approximate: 5 kW * 5.62 hrs/day * 365 * 1.0 (south) * ~0.87 derate
      expect(production).toBeGreaterThan(8000);
      expect(production).toBeLessThan(12000);
    });

    it('north-facing produces less than south-facing', () => {
      const southProduction = calculateAnnualProduction(5, mockRegion, mockRooftop);
      const northRooftop = { ...mockRooftop, orientation: 'north' as const };
      const northProduction = calculateAnnualProduction(5, mockRegion, northRooftop);
      expect(northProduction).toBeLessThan(southProduction);
    });

    it('more shading reduces production', () => {
      const lowShade = calculateAnnualProduction(5, mockRegion, { ...mockRooftop, shadingPercentage: 0 });
      const highShade = calculateAnnualProduction(5, mockRegion, { ...mockRooftop, shadingPercentage: 50 });
      expect(highShade).toBeLessThan(lowShade);
    });
  });

  describe('calculateRequiredSystemSize', () => {
    it('returns a positive system size for positive demand', () => {
      const size = calculateRequiredSystemSize(12000, mockRegion, mockRooftop);
      expect(size).toBeGreaterThan(0);
    });

    it('higher demand requires larger system', () => {
      const small = calculateRequiredSystemSize(5000, mockRegion, mockRooftop);
      const large = calculateRequiredSystemSize(20000, mockRegion, mockRooftop);
      expect(large).toBeGreaterThan(small);
    });
  });

  describe('maxPanelsByArea', () => {
    it('calculates maximum panels that fit', () => {
      const max = maxPanelsByArea(mockRooftop, mockPanel); // 800 / 19.4 ≈ 41
      expect(max).toBe(41);
    });

    it('returns 0 for zero usable area', () => {
      const zeroRooftop = { ...mockRooftop, usableArea: 0 };
      expect(maxPanelsByArea(zeroRooftop, mockPanel)).toBe(0);
    });
  });

  describe('buildConfiguration', () => {
    it('builds a valid configuration', () => {
      const config = buildConfiguration(mockPanel, 12000, mockRooftop, mockRegion);
      expect(config).not.toBeNull();
      if (config) {
        expect(config.numberOfPanels).toBeGreaterThan(0);
        expect(config.systemSizeKw).toBeGreaterThan(0);
        expect(config.grossCost).toBeGreaterThan(0);
        expect(config.federalTaxCredit).toBeCloseTo(config.grossCost * 0.3, 0);
        expect(config.netCost).toBeCloseTo(config.grossCost - config.federalTaxCredit, 0);
        expect(config.annualSavings).toBeGreaterThan(0);
        expect(config.paybackPeriodYears).toBeGreaterThan(0);
        expect(config.score).toBeGreaterThanOrEqual(0);
        expect(config.score).toBeLessThanOrEqual(100);
      }
    });

    it('returns null when roof is too small', () => {
      const tinyRoof: RooftopData = { ...mockRooftop, usableArea: 30 };
      const config = buildConfiguration(mockPanel, 12000, tinyRoof, mockRegion);
      expect(config).toBeNull();
    });

    it('coverage is capped at 100%', () => {
      const config = buildConfiguration(mockPanel, 1000, mockRooftop, mockRegion);
      if (config) {
        expect(config.coveragePercentage).toBeLessThanOrEqual(100);
      }
    });
  });

  describe('calculate25YearROI', () => {
    it('returns positive ROI for reasonable inputs', () => {
      const roi = calculate25YearROI(15000, 2000, 0.27);
      expect(roi).toBeGreaterThan(0);
    });

    it('higher annual savings increases ROI', () => {
      const roiLow = calculate25YearROI(15000, 1500, 0.16);
      const roiHigh = calculate25YearROI(15000, 3000, 0.16);
      expect(roiHigh).toBeGreaterThan(roiLow);
    });
  });

  describe('generateRecommendations', () => {
    it('returns multiple configurations', () => {
      const configs = generateRecommendations(12000, mockRooftop, mockRegion);
      expect(configs.length).toBeGreaterThan(0);
      expect(configs.length).toBeLessThanOrEqual(6);
    });

    it('configs are sorted by score descending', () => {
      const configs = generateRecommendations(12000, mockRooftop, mockRegion);
      for (let i = 1; i < configs.length; i++) {
        expect(configs[i - 1].score).toBeGreaterThanOrEqual(configs[i].score);
      }
    });

    it('all configurations have valid data', () => {
      const configs = generateRecommendations(12000, mockRooftop, mockRegion);
      for (const config of configs) {
        expect(config.numberOfPanels).toBeGreaterThan(0);
        expect(config.netCost).toBeGreaterThan(0);
        expect(config.annualSavings).toBeGreaterThan(0);
        expect(config.co2OffsetTons).toBeGreaterThan(0);
      }
    });
  });

  describe('getBestRecommendation', () => {
    it('returns the first configuration', () => {
      const configs = generateRecommendations(12000, mockRooftop, mockRegion);
      const best = getBestRecommendation(configs);
      expect(best).not.toBeNull();
      if (best) expect(best).toBe(configs[0]);
    });

    it('returns null for empty list', () => {
      expect(getBestRecommendation([])).toBeNull();
    });
  });
});
