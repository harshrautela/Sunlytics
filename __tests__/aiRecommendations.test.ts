import { generateAIInsights } from '../src/utils/aiRecommendations';
import { EnergyAuditData, RooftopData, RegionData, SolarConfiguration, SolarPanel } from '../src/types';

const mockPanel: SolarPanel = {
  id: 'test-panel',
  brand: 'TestBrand',
  model: 'Test 400W',
  wattage: 400,
  efficiency: 20.5,
  dimensions: { lengthInches: 70, widthInches: 40 },
  areaSquareFeet: 19.4,
  pricePerPanel: 280,
  warranty: 25,
  degradationRate: 0.5,
  type: 'monocrystalline',
  tier: 'standard',
};

const mockConfig: SolarConfiguration = {
  panel: mockPanel,
  numberOfPanels: 20,
  systemSizeKw: 8.0,
  annualProductionKwh: 11000,
  coveragePercentage: 92,
  roofAreaUsed: 388,
  grossCost: 24000,
  federalTaxCredit: 7200,
  stateCreditEstimate: 0,
  netCost: 16800,
  annualSavings: 2970,
  paybackPeriodYears: 5.7,
  roi25Year: 28500,
  co2OffsetTons: 4.25,
  score: 82,
  aiReasoning: 'Excellent value for Los Angeles.',
};

const mockEnergy: EnergyAuditData = {
  useManualBill: true,
  monthlyBill: 200,
  electricityRate: 0.27,
  appliances: [],
  monthlyConsumption: 741,
  annualConsumption: 11900,
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

describe('aiRecommendations', () => {
  describe('generateAIInsights', () => {
    let insights: ReturnType<typeof generateAIInsights>;

    beforeAll(() => {
      insights = generateAIInsights(mockEnergy, mockRooftop, mockRegion, mockConfig);
    });

    it('returns a feasibility score between 0 and 100', () => {
      expect(insights.feasibilityScore).toBeGreaterThanOrEqual(0);
      expect(insights.feasibilityScore).toBeLessThanOrEqual(100);
    });

    it('returns one of the four feasibility labels', () => {
      expect(['Excellent', 'Good', 'Fair', 'Poor']).toContain(insights.feasibilityLabel);
    });

    it('returns a non-empty summary', () => {
      expect(insights.summary).toBeTruthy();
      expect(insights.summary.length).toBeGreaterThan(50);
    });

    it('returns key benefits with at least 3 items', () => {
      expect(insights.keyBenefits.length).toBeGreaterThanOrEqual(3);
    });

    it('returns at least one consideration', () => {
      expect(insights.considerations.length).toBeGreaterThanOrEqual(1);
    });

    it('returns short-term prediction', () => {
      expect(insights.shortTermPrediction).toBeTruthy();
    });

    it('returns long-term prediction', () => {
      expect(insights.longTermPrediction).toBeTruthy();
    });

    it('returns maintenance tips', () => {
      expect(insights.maintenanceTips.length).toBeGreaterThan(0);
    });

    it('returns environmental impact', () => {
      expect(insights.environmentalImpact).toBeTruthy();
    });

    it('excellent label for good inputs', () => {
      // South-facing, low shading, good sun hours, short payback
      const goodConfig = { ...mockConfig, paybackPeriodYears: 5, coveragePercentage: 100 };
      const ins = generateAIInsights(mockEnergy, mockRooftop, mockRegion, goodConfig);
      expect(['Excellent', 'Good']).toContain(ins.feasibilityLabel);
    });

    it('includes shading warning when shading is high', () => {
      const shadedRooftop = { ...mockRooftop, shadingPercentage: 35 };
      const ins = generateAIInsights(mockEnergy, shadedRooftop, mockRegion, mockConfig);
      const allConsiderations = ins.considerations.join(' ');
      expect(allConsiderations).toMatch(/shading/i);
    });
  });
});
