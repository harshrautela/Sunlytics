import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AppState, EnergyAuditData, RooftopData, SolarConfiguration, AIInsights, RegionData } from '../types';
import { DEFAULT_APPLIANCES } from '../constants/appliances';
import { REGIONS } from '../constants/regions';

const defaultState: AppState = {
  userProfile: null,
  energyAudit: null,
  rooftopData: null,
  recommendations: null,
  selectedConfiguration: null,
  insights: null,
  region: REGIONS[1], // Default: Los Angeles
  openAiApiKey: '',
};

interface AppContextValue {
  state: AppState;
  setEnergyAudit: (data: EnergyAuditData) => void;
  setRooftopData: (data: RooftopData) => void;
  setRecommendations: (configs: SolarConfiguration[]) => void;
  setSelectedConfiguration: (config: SolarConfiguration) => void;
  setInsights: (insights: AIInsights) => void;
  setRegion: (region: RegionData) => void;
  resetAll: () => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(defaultState);

  const setEnergyAudit = (data: EnergyAuditData) =>
    setState((s) => ({ ...s, energyAudit: data }));

  const setRooftopData = (data: RooftopData) =>
    setState((s) => ({ ...s, rooftopData: data }));

  const setRecommendations = (configs: SolarConfiguration[]) =>
    setState((s) => ({ ...s, recommendations: configs }));

  const setSelectedConfiguration = (config: SolarConfiguration) =>
    setState((s) => ({ ...s, selectedConfiguration: config }));

  const setInsights = (insights: AIInsights) =>
    setState((s) => ({ ...s, insights }));

  const setRegion = (region: RegionData) =>
    setState((s) => ({ ...s, region }));

  const resetAll = () => setState(defaultState);

  return (
    <AppContext.Provider
      value={{
        state,
        setEnergyAudit,
        setRooftopData,
        setRecommendations,
        setSelectedConfiguration,
        setInsights,
        setRegion,
        resetAll,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used inside <AppProvider>');
  return ctx;
}
