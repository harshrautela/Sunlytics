export function calculateSystemSize(dailyKwh, sunHours = 4) {
  return dailyKwh / sunHours;
}

export function calculatePanels(systemKw, panelWatt) {
  return Math.ceil((systemKw * 1000) / panelWatt);
}
