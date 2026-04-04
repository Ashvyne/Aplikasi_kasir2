export const SETTINGS_KEY = 'cafepos_settings';

export const defaultSettings = {
  // Store Info
  storeName: 'CaféPOS',
  storeDescription: 'Premium Coffee & Eatery',
  storeAddress: 'Jl. Kemenangan No. 88, Jakarta Selatan',
  storePhone: '0812-9988-7766',
  storeEmail: 'support@cafepod.io',
  storeFooter: 'Terima kasih atas kunjungannya!',
  // Tax & Fees
  taxRate: 10,
  serviceChargeRate: 5,
  taxEnabled: true,
  serviceChargeEnabled: true,
  // Appearance
  theme: 'dark',
  primaryColor: 'gold',
  // Notifications
  kitchenSound: true,
  orderAlerts: true,
};

export function getSettings() {
  const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || 'null');
  return { ...defaultSettings, ...saved };
}

export function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function useSettings() {
  // Note: This is a simple hook wrapper. 
  // For reactive updates, you might want to use a state management library 
  // or a custom event listener for localStorage changes.
  return getSettings();
}
