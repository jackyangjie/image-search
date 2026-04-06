/**
 * Environment detection utilities
 */

import Constants from 'expo-constants';

/**
 * Check if running in Expo Go
 */
export function isExpoGo(): boolean {
  // Expo Go has specific manifest properties
  const manifest = Constants.expoConfig;
  return !manifest?.android?.package || Constants.appOwnership === 'expo';
}

/**
 * Check if running in development mode
 */
export function isDevelopment(): boolean {
  return __DEV__;
}

/**
 * Check if AI models are available (not in Expo Go)
 */
export function areModelsAvailable(): boolean {
  return !isExpoGo();
}
