import React, { createContext, useState } from 'react';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [appliances, setAppliances] = useState([]);
  const [roofAreaSqFt, setRoofAreaSqFt] = useState(0);
  const [location, setLocation] = useState('');
  const [monthlyBill, setMonthlyBill] = useState(0);

  const dailyEnergyKwh = appliances.reduce(
    (sum, a) => sum + (a.watts * a.qty * a.hours) / 1000,
    0
  );

  return (
    <AppContext.Provider
      value={{
        appliances,
        setAppliances,
        roofAreaSqFt,
        setRoofAreaSqFt,
        location,
        setLocation,
        monthlyBill,
        setMonthlyBill,
        dailyEnergyKwh
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
